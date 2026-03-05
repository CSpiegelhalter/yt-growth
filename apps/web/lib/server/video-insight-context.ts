import "server-only";

import type { InsightContext, InsightDerivedData } from "@/lib/features/full-report/types";
import { checkRateLimit, RATE_LIMITS,rateLimitKey } from "@/lib/shared/rate-limit";
import { prisma } from "@/prisma";

/**
 * Shared pre-flight checks for video insight route handlers.
 *
 * Verifies channel ownership, loads the analytics cache row, and enforces
 * the per-user rate limit. Returns either a ready-to-use context object
 * or an error Response that the caller should return immediately.
 */
export async function resolveInsightContext(
  userId: number,
  channelId: string,
  videoId: string,
  range: string,
): Promise<InsightContext | Response> {
  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  const [cached, video] = await Promise.all([
    prisma.ownedVideoInsightsCache.findFirst({
      where: { userId, channelId: channel.id, videoId, range },
    }),
    prisma.video.findFirst({
      where: { youtubeVideoId: videoId, channelId: channel.id },
      select: { publishedAt: true },
    }),
  ]);

  if (!cached?.derivedJson) {
    return Response.json(
      { error: "Analytics not loaded. Call /analytics first." },
      { status: 400 },
    );
  }

  const rateResult = checkRateLimit(
    rateLimitKey("videoInsights", userId),
    RATE_LIMITS.videoInsights,
  );
  if (!rateResult.success) {
    return Response.json(
      { error: "Rate limit exceeded", retryAfter: rateResult.resetAt },
      { status: 429 },
    );
  }

  const derivedData = cached.derivedJson as InsightDerivedData;
  const baselineRaw = (derivedData as Record<string, unknown>).baseline;

  return {
    channel: {
      id: channel.id,
      youtubeChannelId: channel.youtubeChannelId!,
      subscriberCount: channel.subscriberCount ?? null,
    },
    cached: {
      derivedJson: cached.derivedJson,
      llmJson: cached.llmJson,
      cachedUntil: cached.cachedUntil,
      contentHash: cached.contentHash,
    },
    derivedData,
    videoPublishedAt: video?.publishedAt?.toISOString() ?? null,
    baseline: (baselineRaw as Record<string, unknown>) ?? null,
  };
}
