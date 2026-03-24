import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import { SuggestionError } from "../errors";
import type { SuggestionContext, VideoPerformanceSummary } from "../types";

const log = createLogger({ module: "suggestions:buildContext" });

type BuildContextInput = {
  userId: number;
  channelId: number;
};

export async function buildContext(
  input: BuildContextInput,
): Promise<SuggestionContext> {
  try {
    const channel = await prisma.channel.findFirst({
      where: { id: input.channelId, userId: input.userId },
      include: {
        ChannelNiche: true,
        ChannelProfile: true,
      },
    });

    if (!channel) {
      log.warn("Channel not found", { channelId: input.channelId, userId: input.userId });
      throw new SuggestionError("NOT_FOUND", "Channel not found");
    }

    const recentVideos = await prisma.video.findMany({
      where: { channelId: input.channelId },
      orderBy: { publishedAt: "desc" },
      take: 10,
      include: { VideoMetrics: true },
    });

    const niche = channel.ChannelNiche?.niche ?? null;

    let contentPillars: string[] = [];
    let targetAudience: string | null = null;

    if (channel.ChannelProfile?.aiProfileJson) {
      try {
        const profile = JSON.parse(channel.ChannelProfile.aiProfileJson) as {
          primaryCategories?: string[];
          targetAudience?: string;
        };
        contentPillars = profile.primaryCategories ?? [];
        targetAudience = profile.targetAudience ?? null;
      } catch {
        // Malformed JSON, skip
      }
    }

    const recentVideoTitles = recentVideos
      .map((v) => v.title)
      .filter((t): t is string => t != null);

    const recentVideoPerformance: VideoPerformanceSummary[] = recentVideos
      .filter((v) => v.VideoMetrics)
      .map((v) => ({
        title: v.title ?? "Untitled",
        views: v.VideoMetrics!.views,
        likes: v.VideoMetrics!.likes,
        comments: v.VideoMetrics!.comments,
        avgViewPercentage: v.VideoMetrics!.averageViewPercentage,
      }));

    const trendingTopics: string[] = [];
    if (channel.ChannelNiche?.queriesJson) {
      const queries = channel.ChannelNiche.queriesJson as string[];
      if (Array.isArray(queries)) {
        trendingTopics.push(...queries.slice(0, 5));
      }
    }

    log.info("Context built successfully", { channelId: input.channelId, userId: input.userId });

    return {
      channelNiche: niche,
      contentPillars,
      targetAudience,
      recentVideoTitles,
      recentVideoPerformance,
      trendingTopics,
    };
  } catch (error) {
    if (error instanceof SuggestionError) {throw error;}
    log.error("Failed to build context", { channelId: input.channelId, userId: input.userId, error });
    throw new SuggestionError(
      "EXTERNAL_FAILURE",
      "Failed to build suggestion context",
      error,
    );
  }
}
