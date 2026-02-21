import "server-only";
import { prisma } from "@/prisma";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/shared/rate-limit";

type InsightContext = {
  channel: { id: number; youtubeChannelId: string };
  cached: {
    derivedJson: unknown;
    llmJson: unknown;
    cachedUntil: Date;
    contentHash: string | null;
  };
  derivedData: any;
};

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

  const cached = await prisma.ownedVideoInsightsCache.findFirst({
    where: { userId, channelId: channel.id, videoId, range },
  });
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

  return {
    channel: { id: channel.id, youtubeChannelId: channel.youtubeChannelId! },
    cached: {
      derivedJson: cached.derivedJson,
      llmJson: cached.llmJson,
      cachedUntil: cached.cachedUntil,
      contentHash: cached.contentHash,
    },
    derivedData: cached.derivedJson as any,
  };
}
