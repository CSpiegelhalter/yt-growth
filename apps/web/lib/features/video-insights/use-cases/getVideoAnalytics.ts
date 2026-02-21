import { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";
import { VideoInsightError } from "../errors";
import { analyzeRetention, type AnalyzeRetentionDeps } from "./analyzeRetention";

type GetVideoAnalyticsDeps = {
  getGoogleAccount: (userId: number, channelId: string) => Promise<any>;
  retentionDeps: AnalyzeRetentionDeps;
};

export async function getVideoAnalytics(
  input: { userId: number; channelId: string; videoId: string; range: "7d" | "28d" | "90d" },
  deps: GetVideoAnalyticsDeps,
) {
  const { userId, channelId, videoId, range } = input;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new VideoInsightError("NOT_FOUND", "Channel not found");
  }

  const cached = await prisma.ownedVideoInsightsCache.findFirst({
    where: { userId, channelId: channel.id, videoId, range },
  });
  if (cached?.derivedJson && cached.cachedUntil > new Date()) {
    const d = cached.derivedJson as any;
    return {
      video: d.video,
      analytics: d.analytics,
      derived: d.derived,
      baseline: d.baseline,
      comparison: d.comparison,
      levers: d.levers,
      retention: d.retention,
      bottleneck: d.bottleneck,
      confidence: d.confidence,
      isLowDataMode: d.isLowDataMode,
      analyticsAvailability: d.analyticsAvailability,
      cached: true,
      hasSummary: !!cached.llmJson,
    };
  }

  const ga = await deps.getGoogleAccount(userId, channelId);
  if (!ga) {
    throw new VideoInsightError("INVALID_INPUT", "Google account not connected");
  }

  const result = await analyzeRetention(
    {
      googleAccount: ga,
      dbChannelId: channel.id,
      youtubeChannelId: channelId,
      videoId,
      range,
      userId,
    },
    deps.retentionDeps,
  );

  await prisma.ownedVideoInsightsCache.upsert({
    where: {
      userId_channelId_videoId_range: { userId, channelId: channel.id, videoId, range },
    },
    create: {
      userId,
      channelId: channel.id,
      videoId,
      range,
      contentHash: "",
      derivedJson: result as unknown as Prisma.JsonObject,
      llmJson: Prisma.JsonNull,
      cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    update: {
      derivedJson: result as unknown as Prisma.JsonObject,
      cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return { ...result, cached: false, hasSummary: false };
}
