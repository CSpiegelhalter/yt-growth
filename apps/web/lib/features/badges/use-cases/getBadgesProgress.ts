import { prisma } from "@/prisma";

import type {
  BadgesApiResponse,
  ChannelStatsForBadges,
  UnlockedBadge,
  VideoForBadges,
} from "../types";
import {
  calculatePostingStreakWeeks,
  checkMetricAvailability,
  computeAllBadgesProgress,
  computeAllGoalsProgress,
  getBadgeSummary,
  getNextBadge,
} from "./computeBadges";

type GetBadgesInput = {
  userId: number;
  channelId?: string;
};

async function resolveChannelDbId(
  userId: number,
  channelId: string,
): Promise<number | null> {
  const channel = await prisma.channel.findFirst({
    where: { userId, youtubeChannelId: channelId },
    select: { id: true },
  });
  return channel?.id ?? null;
}

async function loadChannelStats(
  channelDbId: number,
): Promise<ChannelStatsForBadges> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelDbId },
    select: { totalVideoCount: true, subscriberCount: true },
  });
  return {
    totalVideoCount: channel?.totalVideoCount ?? null,
    subscriberCount: channel?.subscriberCount ?? null,
  };
}

type VideoMetricsInput = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  subscribersGained: number | null;
  subscribersLost: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDuration: number | null;
  averageViewPercentage: number | null;
};

function mapVideoMetrics(m: VideoMetricsInput | null | undefined) {
  if (!m) {
    return {
      views: null,
      likes: null,
      comments: null,
      shares: null,
      subscribersGained: null,
      subscribersLost: null,
      estimatedMinutesWatched: null,
      averageViewDuration: null,
      averageViewPercentage: null,
    };
  }
  return {
    views: m.views ?? null,
    likes: m.likes ?? null,
    comments: m.comments ?? null,
    shares: m.shares ?? null,
    subscribersGained: m.subscribersGained ?? null,
    subscribersLost: m.subscribersLost ?? null,
    estimatedMinutesWatched: m.estimatedMinutesWatched ?? null,
    averageViewDuration: m.averageViewDuration ?? null,
    averageViewPercentage: m.averageViewPercentage ?? null,
  };
}

export async function getBadgesProgress(
  input: GetBadgesInput,
): Promise<BadgesApiResponse> {
  const { userId, channelId: channelIdParam } = input;

  const channelDbId = channelIdParam
    ? await resolveChannelDbId(userId, channelIdParam)
    : null;

  const channelStats = channelDbId
    ? await loadChannelStats(channelDbId)
    : undefined;

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
      ...mapVideoMetrics(v.VideoMetrics),
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
      !unlockedBadges.some((b) => b.badgeId === badge.id)
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
