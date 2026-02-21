import { prisma } from "@/prisma";
import {
  computeAllBadgesProgress,
  computeAllGoalsProgress,
  calculatePostingStreakWeeks,
  checkMetricAvailability,
  getNextBadge,
  getBadgeSummary,
} from "./computeBadges";
import type {
  VideoForBadges,
  ChannelStatsForBadges,
  UnlockedBadge,
  BadgesApiResponse,
} from "../types";

type GetBadgesInput = {
  userId: number;
  channelId?: string;
};

export async function getBadgesProgress(
  input: GetBadgesInput,
): Promise<BadgesApiResponse> {
  const { userId, channelId: channelIdParam } = input;

  let channelDbId: number | null = null;
  if (channelIdParam) {
    const channel = await prisma.channel.findFirst({
      where: { userId, youtubeChannelId: channelIdParam },
      select: { id: true },
    });
    channelDbId = channel?.id ?? null;
  }

  let channelStats: ChannelStatsForBadges | undefined;
  if (channelDbId) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelDbId },
      select: { totalVideoCount: true, subscriberCount: true },
    });
    channelStats = {
      totalVideoCount: channel?.totalVideoCount ?? null,
      subscriberCount: channel?.subscriberCount ?? null,
    };
  }

  let videos: VideoForBadges[] = [];
  if (channelDbId) {
    const dbVideos = await prisma.video.findMany({
      where: { channelId: channelDbId },
      include: { VideoMetrics: true },
      orderBy: { publishedAt: "desc" },
    });

    videos = dbVideos.map((v) => ({
      publishedAt: v.publishedAt?.toISOString() ?? null,
      durationSec: v.durationSec,
      views: v.VideoMetrics?.views ?? null,
      likes: v.VideoMetrics?.likes ?? null,
      comments: v.VideoMetrics?.comments ?? null,
      shares: v.VideoMetrics?.shares ?? null,
      subscribersGained: v.VideoMetrics?.subscribersGained ?? null,
      subscribersLost: v.VideoMetrics?.subscribersLost ?? null,
      estimatedMinutesWatched: v.VideoMetrics?.estimatedMinutesWatched ?? null,
      averageViewDuration: v.VideoMetrics?.averageViewDuration ?? null,
      averageViewPercentage: v.VideoMetrics?.averageViewPercentage ?? null,
      impressions: null,
      ctr: null,
    }));
  }

  const dbBadges = await prisma.userBadge.findMany({
    where: { userId, channelId: channelDbId },
    orderBy: { unlockedAt: "desc" },
  });

  const unlockedBadges: UnlockedBadge[] = dbBadges.map((b) => ({
    badgeId: b.badgeId,
    unlockedAt: b.unlockedAt.toISOString(),
    seen: b.seen,
  }));

  const badgesWithProgress = computeAllBadgesProgress(
    videos,
    channelStats,
    unlockedBadges,
  );

  const newUnlocks: string[] = [];
  for (const badge of badgesWithProgress) {
    if (
      badge.progress.isUnlocked &&
      !unlockedBadges.find((b) => b.badgeId === badge.id)
    ) {
      newUnlocks.push(badge.id);
    }
  }

  if (newUnlocks.length > 0 && channelDbId) {
    await prisma.userBadge.createMany({
      data: newUnlocks.map((badgeId) => ({
        userId,
        channelId: channelDbId,
        badgeId,
        seen: false,
      })),
      skipDuplicates: true,
    });

    for (const badgeId of newUnlocks) {
      const badge = badgesWithProgress.find((b) => b.id === badgeId);
      if (badge) {
        badge.unlocked = true;
        badge.unlockedAt = new Date().toISOString();
        badge.seen = false;
      }
      unlockedBadges.push({
        badgeId,
        unlockedAt: new Date().toISOString(),
        seen: false,
      });
    }
  }

  const goalsWithProgress = computeAllGoalsProgress(videos, channelStats);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentUnlocks = unlockedBadges.filter(
    (b) => new Date(b.unlockedAt) >= sevenDaysAgo,
  );

  const summary = getBadgeSummary(badgesWithProgress);
  const metricAvailability = checkMetricAvailability(videos, channelStats);
  const weeklyStreak = calculatePostingStreakWeeks(videos);
  const nextBadge = getNextBadge(badgesWithProgress);

  return {
    badges: badgesWithProgress,
    goals: goalsWithProgress,
    unlockedBadges,
    recentUnlocks,
    metricAvailability,
    summary: {
      totalBadges: summary.total,
      unlockedCount: summary.unlocked,
      weeklyStreak,
      nextBadge,
    },
  };
}
