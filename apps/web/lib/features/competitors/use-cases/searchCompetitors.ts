import "server-only";

import { prisma } from "@/prisma";
import {
  inferNiche,
  searchCompetitorsWithCache,
  getCachedSearchResults,
  setCachedSearchResults,
  makeCacheKey,
  sanitizeNicheText,
  hashNicheForLogging,
  DEFAULT_FILTERS,
} from "@/lib/competitor-search";
import { getOrGenerateNiche } from "@/lib/channel-niche";
import { parseYouTubeVideoId } from "@/lib/shared/youtube-video-id";
import type { GoogleAccount } from "@/lib/youtube/types";
import type {
  SearchCompetitorsInput,
  SearchEvent,
  InferredNiche,
  CompetitorSearchFilters,
} from "../types";
import { CompetitorError, assertActiveSubscription } from "../errors";

// ── Google-account resolution ───────────────────────────────────

type GetGoogleAccountFn = (
  userId: number,
  channelId?: string,
) => Promise<GoogleAccount | null>;

// ── Niche resolvers ─────────────────────────────────────────────

async function resolveNicheForMyChannel(
  userId: number,
  channelId: string,
): Promise<{ niche: InferredNiche; dbChannelId: number }> {
  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new CompetitorError("NOT_FOUND", "Channel not found");
  }

  const channelNiche = await getOrGenerateNiche(channel.id);
  if (!channelNiche || channelNiche.queries.length === 0) {
    throw new CompetitorError(
      "INVALID_INPUT",
      "Could not determine niche. Please add more videos to your channel or set up your channel profile.",
    );
  }

  return {
    niche: {
      niche: channelNiche.niche,
      queryTerms: channelNiche.queries,
      source: "channel_profile",
      inferredAt: new Date().toISOString(),
    },
    dbChannelId: channel.id,
  };
}

async function resolveNicheForCompetitorSearch(
  nicheText: string | undefined,
  referenceVideoUrl: string | undefined,
  ga: GoogleAccount,
): Promise<InferredNiche> {
  if (!nicheText && !referenceVideoUrl) {
    throw new CompetitorError(
      "INVALID_INPUT",
      "Either nicheText or referenceVideoUrl is required",
    );
  }

  if (referenceVideoUrl) {
    const videoId = parseYouTubeVideoId(referenceVideoUrl);
    if (!videoId) {
      throw new CompetitorError(
        "INVALID_INPUT",
        "Please provide a valid youtube.com or youtu.be URL.",
      );
    }
  }

  return inferNiche(
    {
      nicheText: nicheText ? sanitizeNicheText(nicheText) : undefined,
      referenceVideoUrl,
    },
    ga,
  );
}

// ── Resolve Google account for a given mode ─────────────────────

async function resolveGoogleAccount(
  userId: number,
  mode: string,
  channelId: string | undefined,
  getGoogleAccount: GetGoogleAccountFn,
): Promise<GoogleAccount> {
  const ytChannelId =
    mode === "search_my_niche" && channelId
      ? channelId
      : (
          await prisma.channel.findFirst({
            where: { userId },
            select: { youtubeChannelId: true },
          })
        )?.youtubeChannelId;

  if (!ytChannelId) {
    throw new CompetitorError(
      "INVALID_INPUT",
      "Please connect a YouTube channel first",
    );
  }

  const ga = await getGoogleAccount(userId, ytChannelId);
  if (!ga) {
    throw new CompetitorError(
      "INVALID_INPUT",
      "Google account not connected",
    );
  }
  return ga;
}

/**
 * Search for competitor videos by niche.
 *
 * Supports two modes:
 * - `competitor_search`: user provides niche text and/or reference video URL
 * - `search_my_niche`: uses the user's channel niche profile
 *
 * Returns an async generator that streams search events (status updates,
 * result batches, completion, and errors).
 */
export async function* searchCompetitors(
  input: SearchCompetitorsInput,
  deps: { getGoogleAccount: GetGoogleAccountFn },
  abortSignal?: AbortSignal,
): AsyncGenerator<SearchEvent, void, unknown> {
  const { userId, mode, nicheText, referenceVideoUrl, channelId, filters, cursor } = input;

  await assertActiveSubscription(userId);

  const ga = await resolveGoogleAccount(userId, mode, channelId, deps.getGoogleAccount);

  let niche: InferredNiche;

  if (mode === "search_my_niche") {
    if (!channelId) {
      throw new CompetitorError(
        "INVALID_INPUT",
        "channelId is required for search_my_niche mode",
      );
    }
    const resolved = await resolveNicheForMyChannel(userId, channelId);
    niche = resolved.niche;
  } else {
    niche = await resolveNicheForCompetitorSearch(nicheText, referenceVideoUrl, ga);
  }

  console.log(
    `[CompetitorSearch] Mode: ${mode}, Niche: ${hashNicheForLogging(niche)}, Queries: ${niche.queryTerms.length}`,
  );

  const mergedFilters: CompetitorSearchFilters = {
    ...DEFAULT_FILTERS,
    ...filters,
  };

  const cacheKey = makeCacheKey(mode, niche.niche, niche.queryTerms, mergedFilters);

  const generator = searchCompetitorsWithCache(
    ga,
    niche,
    mergedFilters,
    cacheKey,
    async () => {
      const cached = await getCachedSearchResults(cacheKey);
      if (!cached) {return null;}
      return {
        results: cached.results,
        scannedCount: cached.scannedCount,
        exhausted: cached.exhausted,
      };
    },
    async (results, scannedCount, exhausted) => {
      await setCachedSearchResults(cacheKey, results, niche, scannedCount, exhausted);
    },
    undefined,
    abortSignal,
    cursor,
  );

  yield* generator;
}
