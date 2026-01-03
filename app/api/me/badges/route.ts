/**
 * GET /api/me/badges
 *
 * Fetch badge collection progress for the current user/channel.
 * Returns all badges with progress, unlocked status, and recent unlocks.
 *
 * POST /api/me/badges/seen
 * Mark badges as seen (dismiss "NEW" indicator).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";
import {
  computeAllBadgesProgress,
  computeAllGoalsProgress,
  calculatePostingStreakWeeks,
  checkMetricAvailability,
  getNextBadge,
  getBadgeSummary,
  type VideoForBadges,
  type ChannelStatsForBadges,
  type UnlockedBadge,
  type BadgesApiResponse,
} from "@/lib/badges";

// ---------- GET Handler ----------

async function GETHandler(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const channelIdParam = url.searchParams.get("channelId");

  // Resolve channel
  let channelDbId: number | null = null;
  if (channelIdParam) {
    const channel = await prisma.channel.findFirst({
      where: { userId: user.id, youtubeChannelId: channelIdParam },
      select: { id: true },
    });
    channelDbId = channel?.id ?? null;
  }

  // Fetch channel stats
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

  // Fetch videos with metrics
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
      // Note: impressions and ctr not stored in VideoMetrics yet
      impressions: null,
      ctr: null,
    }));
  }

  // Fetch unlocked badges
  const dbBadges = await prisma.userBadge.findMany({
    where: { userId: user.id, channelId: channelDbId },
    orderBy: { unlockedAt: "desc" },
  });

  const unlockedBadges: UnlockedBadge[] = dbBadges.map((b) => ({
    badgeId: b.badgeId,
    unlockedAt: b.unlockedAt.toISOString(),
    seen: b.seen,
  }));

  // Compute badge progress
  const badgesWithProgress = computeAllBadgesProgress(videos, channelStats, unlockedBadges);

  // Check for newly unlocked badges and persist them
  const newUnlocks: string[] = [];
  for (const badge of badgesWithProgress) {
    if (badge.progress.isUnlocked && !unlockedBadges.find((b) => b.badgeId === badge.id)) {
      newUnlocks.push(badge.id);
    }
  }

  if (newUnlocks.length > 0 && channelDbId) {
    await prisma.userBadge.createMany({
      data: newUnlocks.map((badgeId) => ({
        userId: user.id,
        channelId: channelDbId,
        badgeId,
        seen: false,
      })),
      skipDuplicates: true,
    });

    // Update local state
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

  // Compute goals progress
  const goalsWithProgress = computeAllGoalsProgress(videos, channelStats);

  // Get recent unlocks (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentUnlocks = unlockedBadges.filter(
    (b) => new Date(b.unlockedAt) >= sevenDaysAgo
  );

  // Calculate summary
  const summary = getBadgeSummary(badgesWithProgress);
  const metricAvailability = checkMetricAvailability(videos, channelStats);
  const weeklyStreak = calculatePostingStreakWeeks(videos);
  const nextBadge = getNextBadge(badgesWithProgress);

  const response: BadgesApiResponse = {
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

  return Response.json(response);
}

export const GET = createApiRoute(
  { route: "/api/me/badges" },
  async (req) => GETHandler(req)
);

// ---------- POST Handler (mark badges as seen) ----------

async function POSTHandler(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { badgeIds, channelId } = body as { badgeIds: string[]; channelId?: string };

  if (!badgeIds || !Array.isArray(badgeIds)) {
    return Response.json({ error: "Invalid badgeIds" }, { status: 400 });
  }

  // Resolve channel
  let channelDbId: number | null = null;
  if (channelId) {
    const channel = await prisma.channel.findFirst({
      where: { userId: user.id, youtubeChannelId: channelId },
      select: { id: true },
    });
    channelDbId = channel?.id ?? null;
  }

  // Mark badges as seen
  await prisma.userBadge.updateMany({
    where: {
      userId: user.id,
      channelId: channelDbId,
      badgeId: { in: badgeIds },
    },
    data: { seen: true },
  });

  return Response.json({ success: true });
}

export const POST = createApiRoute(
  { route: "/api/me/badges" },
  async (req) => POSTHandler(req)
);
