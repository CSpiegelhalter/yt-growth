/**
 * GET /api/dashboard/hooks?niche=<label>
 *
 * Returns 5 real video hooks pulled from the first ~30 seconds of the
 * top rising videos in the niche's YouTube category. Lazy + 24h cached
 * via TrendingCache row "hooks:<niche>"; the first call per niche per
 * day pays the SerpAPI/LLM cost, every other call is instant.
 *
 * Rate-limited via the existing guestTrending bucket (5/day per IP)
 * because this is the most expensive endpoint on the page.
 */
import { z } from "zod";

import { getYouTubeTranscript } from "@/lib/adapters/serpapi/client";
import type { TrendingVideo } from "@/lib/adapters/youtube/data-api";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { extractHooks, type HookSample } from "@/lib/llm";
import { trendingCacheExpiresAt } from "@/lib/shared/cache-ttl";
import { logger } from "@/lib/shared/logger";
import { getYouTubeCategoryForNiche } from "@/lib/shared/niche-categories";
import { prisma } from "@/prisma";

const QuerySchema = z.object({
  niche: z.string().min(1).max(50),
});

const HOOK_COUNT = 5;

type Hook = {
  videoId: string;
  channelTitle: string;
  videoTitle: string;
  hookText: string;
};

type HooksPayload = { hooks: Hook[] };

function cacheKeyForNiche(niche: string): string {
  return `hooks:${niche}`;
}

function joinFirstThirtySeconds(
  segments: Array<{ text: string; start: number }>,
): string {
  return segments
    .filter((s) => s.start < 30)
    .map((s) => s.text)
    .join(" ")
    .trim();
}

async function buildHooksFresh(niche: string): Promise<HooksPayload> {
  const categoryId = getYouTubeCategoryForNiche(niche);
  if (!categoryId) {return { hooks: [] };}

  const risingCache = await prisma.trendingCache.findUnique({
    where: { key: "youtube-rising" },
  });
  const allRising = (risingCache?.data ?? []) as unknown as TrendingVideo[];
  const niched = allRising
    .filter((v) => v.categoryId === categoryId)
    .sort((a, b) => b.viewVelocity - a.viewVelocity)
    .slice(0, HOOK_COUNT);

  if (niched.length === 0) {return { hooks: [] };}

  // Fetch transcripts in parallel; failures degrade gracefully to empty
  // first_30s strings (the LLM will return hookText: "" for those).
  const samples: Array<HookSample & { channelName: string }> = await Promise.all(
    niched.map(async (v) => {
      try {
        const transcript = await getYouTubeTranscript({ videoId: v.videoId });
        return {
          videoId: v.videoId,
          title: v.title,
          channelName: v.channelName,
          firstThirtySeconds: joinFirstThirtySeconds(transcript.segments),
        };
      } catch (error) {
        logger.warn("dashboard.hooks_transcript_failed", {
          videoId: v.videoId,
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          videoId: v.videoId,
          title: v.title,
          channelName: v.channelName,
          firstThirtySeconds: "",
        };
      }
    }),
  );

  const extracted = await extractHooks({ niche, samples });
  const hookByVideo = new Map(extracted.map((h) => [h.videoId, h.hookText]));

  const hooks: Hook[] = samples
    .map((s) => ({
      videoId: s.videoId,
      channelTitle: s.channelName,
      videoTitle: s.title,
      hookText: (hookByVideo.get(s.videoId) ?? "").trim(),
    }))
    .filter((h) => h.hookText.length > 0);

  return { hooks };
}

export const GET = createApiRoute(
  { route: "/api/dashboard/hooks" },
  withAuth(
    { mode: "optional" },
    withRateLimit(
      {
        operation: "guestTrending",
        identifier: (api) => api.userId ?? api.ip,
      },
      withValidation(
        { query: QuerySchema },
        async (_req, _ctx, api, { query }) => {
          const niche = query!.niche;
          const cacheKey = cacheKeyForNiche(niche);

          // Cache hit?
          const cached = await prisma.trendingCache.findUnique({
            where: { key: cacheKey },
          });
          if (cached && cached.expiresAt.getTime() > Date.now()) {
            return jsonOk(cached.data as unknown as HooksPayload, {
              requestId: api.requestId,
            });
          }

          // Build fresh, then upsert into the cache.
          const payload = await buildHooksFresh(niche);
          const expiresAt = trendingCacheExpiresAt();
          try {
            await prisma.trendingCache.upsert({
              where: { key: cacheKey },
              create: {
                key: cacheKey,
                data: payload as unknown as object,
                expiresAt,
              },
              update: {
                data: payload as unknown as object,
                expiresAt,
                updatedAt: new Date(),
              },
            });
          } catch (error) {
            logger.warn("dashboard.hooks_cache_write_failed", {
              niche,
              error: error instanceof Error ? error.message : String(error),
            });
          }

          return jsonOk(payload, { requestId: api.requestId });
        },
      ),
    ),
  ),
);
