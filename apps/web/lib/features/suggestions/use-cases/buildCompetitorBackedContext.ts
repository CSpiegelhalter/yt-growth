import "server-only";

import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import type {
  CompetitorBackedSuggestionContext,
  CompetitorVideoForContext,
  NicheKeywordForContext,
} from "../types";
import { buildContext } from "./buildContext";
import { fetchNicheKeywords } from "./fetchNicheKeywords";

const log = createLogger({ module: "buildCompetitorBackedContext" });

type BuildCompetitorBackedContextInput = {
  userId: number;
  channelId: number;
};

/**
 * Wraps buildContext() and enriches with cached competitor video data.
 *
 * Pipeline:
 *   1. Query SavedCompetitor for user's active competitors
 *   2. Filter YouTubeSearchCache results by those competitor channels
 *   3. Fallback: if no SavedCompetitors, use ChannelNiche queries (scoped)
 *   4. Pre-compute nicheAvgViewsPerDay for drawer stats
 */
export async function buildCompetitorBackedContext(
  input: BuildCompetitorBackedContextInput,
): Promise<CompetitorBackedSuggestionContext> {
  // Run all three data fetches in parallel
  const [baseContext, competitorVideos, nicheKeywordsRaw] = await Promise.all([
    buildContext(input),
    fetchCompetitorVideos(input.userId, input.channelId),
    fetchNicheKeywords({ userId: input.userId, channelId: input.channelId }).catch((err) => {
      log.warn("fetchNicheKeywords failed, continuing without keywords", {
        error: err instanceof Error ? err.message : String(err),
      });
      return [] as NicheKeywordForContext[];
    }),
  ]);

  const generationMode =
    competitorVideos.length > 0 ? "competitor_backed" : "profile_only";

  const nicheAvgViewsPerDay =
    competitorVideos.length > 0
      ? competitorVideos.reduce((sum, v) => sum + v.viewsPerDay, 0) /
        competitorVideos.length
      : null;

  return {
    ...baseContext,
    provenance: null,
    generationMode,
    competitorVideos,
    nicheAvgViewsPerDay,
    nicheKeywords: nicheKeywordsRaw,
  };
}

// Shape of a single video result in YouTubeSearchCache.responseJson
type CachedVideoResult = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl?: string | null;
  publishedAt: string;
  durationSec?: number;
  stats: { viewCount: number };
  derived: { viewsPerDay: number };
};

type CachedShape = {
  results?: CachedVideoResult[];
};

/**
 * Fetches competitor videos, scoped to the user's saved competitors.
 * Falls back to ChannelNiche queries if no saved competitors exist.
 */
async function fetchCompetitorVideos(
  userId: number,
  channelId: number,
): Promise<CompetitorVideoForContext[]> {
  try {
    // Step 1: Check for saved competitors
    const savedCompetitors = await prisma.savedCompetitor.findMany({
      where: { userId, channelId, isActive: true },
      select: { ytChannelId: true },
    });

    const savedYtChannelIds = new Set(
      savedCompetitors.map((sc) => sc.ytChannelId),
    );

    // Step 2: Get cache rows
    const now = new Date();
    let cacheRows;

    if (savedYtChannelIds.size > 0) {
      // Scoped: get all comp_search cache, then filter by saved competitor channels
      cacheRows = await prisma.youTubeSearchCache.findMany({
        where: {
          kind: "comp_search",
          cachedUntil: { gt: now },
        },
      });
    } else {
      // Fallback: use ChannelNiche queries, scoped to this channel's niche
      const channelNiche = await prisma.channelNiche.findUnique({
        where: { channelId },
        select: { queriesJson: true },
      });

      if (!channelNiche?.queriesJson) return [];

      const queries = channelNiche.queriesJson as string[];
      if (!Array.isArray(queries) || queries.length === 0) return [];

      // Only fetch cache rows matching this channel's niche queries
      cacheRows = await prisma.youTubeSearchCache.findMany({
        where: {
          kind: "comp_search",
          query: { in: queries },
          cachedUntil: { gt: now },
        },
      });
    }

    if (!cacheRows || cacheRows.length === 0) return [];

    // Step 3: Extract videos, filtering by saved competitor channels if available
    const allVideos: CompetitorVideoForContext[] = [];
    const seenIds = new Set<string>();

    for (const row of cacheRows) {
      const data = row.responseJson as unknown as CachedShape;
      if (!data?.results || !Array.isArray(data.results)) continue;

      for (const video of data.results) {
        if (seenIds.has(video.videoId)) continue;

        // If we have saved competitors, only include videos from those channels
        if (
          savedYtChannelIds.size > 0 &&
          !savedYtChannelIds.has(video.channelId)
        ) {
          continue;
        }

        seenIds.add(video.videoId);

        allVideos.push({
          videoId: video.videoId,
          title: video.title,
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          thumbnailUrl: video.thumbnailUrl ?? null,
          viewCount: video.stats.viewCount,
          viewsPerDay: video.derived.viewsPerDay,
          publishedAt: video.publishedAt,
          durationSec: video.durationSec ?? null,
          tags: [],
        });
      }
    }

    // Step 4: If thumbnails are missing, try CompetitorVideo table as fallback
    const missingThumbs = allVideos.filter((v) => !v.thumbnailUrl);
    if (missingThumbs.length > 0) {
      const fallbackVideos = await prisma.competitorVideo.findMany({
        where: {
          videoId: { in: missingThumbs.map((v) => v.videoId) },
        },
        select: { videoId: true, thumbnailUrl: true },
      });

      const thumbMap = new Map(
        fallbackVideos
          .filter((v) => v.thumbnailUrl)
          .map((v) => [v.videoId, v.thumbnailUrl]),
      );

      for (const video of missingThumbs) {
        video.thumbnailUrl = thumbMap.get(video.videoId) ?? null;
      }
    }

    // Sort by viewsPerDay descending and take top 10
    allVideos.sort((a, b) => b.viewsPerDay - a.viewsPerDay);
    return allVideos.slice(0, 10);
  } catch (err) {
    log.warn("Failed to fetch competitor videos, falling back to profile-only", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
