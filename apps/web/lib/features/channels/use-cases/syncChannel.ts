import "server-only";

import type { ChannelVideo, VideoMetrics } from "@/lib/ports/YouTubePort";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitKey,
} from "@/lib/shared/rate-limit";
import { prisma } from "@/prisma";

import { ChannelError } from "../errors";

const SYNC_VIDEO_COUNT = 96;
const METRICS_CACHE_HOURS = 12;
const MIN_SYNC_INTERVAL_MINS = 5;
const LIFETIME_START_DATE = "2015-01-01";

// ── Input / Output types ────────────────────────────────────

type SyncChannelInput = {
  userId: number;
  channelId: string;
};

type SyncChannelResult =
  | {
      status: "synced";
      videosCount: number;
      metricsCount: number;
      lastSyncedAt: Date;
    }
  | {
      status: "skipped";
      lastSyncedAt: Date;
      nextSyncAvailableAt: Date;
    };

// ── Dependency ports (injected by route handler) ────────────
// Generic A represents the opaque authenticated-account token returned by
// getGoogleAccount and forwarded to YouTube API calls. The feature layer
// never inspects it — the route handler supplies a concrete type.

export type SyncChannelDeps<A = unknown> = {
  getGoogleAccount: (
    userId: number,
    channelId: string,
  ) => Promise<A | null>;
  fetchChannelVideos: (
    ga: A,
    channelId: string,
    maxResults?: number,
  ) => Promise<ChannelVideo[]>;
  fetchVideoMetrics: (
    ga: A,
    channelId: string,
    videoIds: string[],
    startDate: string,
    endDate: string,
  ) => Promise<VideoMetrics[]>;
  resolveUsageLimit: (
    userId: number,
  ) => Promise<{ plan: string; limit: number }>;
  checkAndIncrement: (opts: {
    userId: number;
    featureKey: string;
    limit: number;
  }) => Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
  }>;
};

// ── Internal helpers ─────────────────────────────────────────

function checkRecentSync(
  lastSyncedAt: Date | null,
): SyncChannelResult | null {
  if (!lastSyncedAt) { return null; }
  const minsSinceSync = (Date.now() - lastSyncedAt.getTime()) / 60_000;
  if (minsSinceSync >= MIN_SYNC_INTERVAL_MINS) { return null; }
  return {
    status: "skipped",
    lastSyncedAt,
    nextSyncAvailableAt: new Date(
      lastSyncedAt.getTime() + MIN_SYNC_INTERVAL_MINS * 60_000,
    ),
  };
}

async function enforceUsageAndRateLimits<A>(
  userId: number,
  dbChannelId: number,
  deps: SyncChannelDeps<A>,
): Promise<void> {
  const { limit } = await deps.resolveUsageLimit(userId);
  const usageResult = await deps.checkAndIncrement({
    userId,
    featureKey: "channel_sync",
    limit,
  });
  if (!usageResult.allowed) {
    throw new ChannelError(
      "LIMIT_REACHED",
      `Channel sync limit reached (${usageResult.used}/${usageResult.limit})`,
    );
  }

  const rateKey = rateLimitKey("videoSync", dbChannelId);
  const rateResult = await checkRateLimit(rateKey, RATE_LIMITS.videoSync);
  if (!rateResult.success) {
    throw new ChannelError("RATE_LIMITED", "Rate limit exceeded");
  }
}

async function upsertVideos(
  dbChannelId: number,
  videos: ChannelVideo[],
): Promise<void> {
  for (const v of videos) {
    await prisma.video.upsert({
      where: {
        channelId_youtubeVideoId: {
          channelId: dbChannelId,
          youtubeVideoId: v.videoId,
        },
      },
      update: {
        title: v.title,
        description: v.description,
        publishedAt: new Date(v.publishedAt),
        durationSec: v.durationSec,
        tags: v.tags,
        thumbnailUrl: v.thumbnailUrl,
      },
      create: {
        channelId: dbChannelId,
        youtubeVideoId: v.videoId,
        title: v.title,
        description: v.description,
        publishedAt: new Date(v.publishedAt),
        durationSec: v.durationSec,
        tags: v.tags,
        thumbnailUrl: v.thumbnailUrl,
      },
    });
  }
}

function buildMetricsData(
  dataStats: { views: number; likes: number; comments: number },
  analytics: VideoMetrics | undefined,
  cachedUntil: Date,
) {
  return {
    views: dataStats.views,
    likes: dataStats.likes,
    comments: dataStats.comments,
    shares: analytics?.shares ?? 0,
    subscribersGained: analytics?.subscribersGained ?? 0,
    subscribersLost: analytics?.subscribersLost ?? 0,
    estimatedMinutesWatched: analytics?.estimatedMinutesWatched ?? 0,
    averageViewDuration: analytics?.averageViewDuration ?? 0,
    averageViewPercentage: analytics?.averageViewPercentage ?? 0,
    cachedUntil,
  };
}

async function upsertAllMetrics<A>(
  dbChannelId: number,
  videos: ChannelVideo[],
  ga: A,
  channelId: string,
  deps: SyncChannelDeps<A>,
): Promise<number> {
  const videoIds = videos.map((v) => v.videoId);
  const endDate = new Date().toISOString().split("T")[0];

  const analyticsMetrics = await deps.fetchVideoMetrics(
    ga, channelId, videoIds, LIFETIME_START_DATE, endDate,
  );
  const analyticsMap = new Map(analyticsMetrics.map((m) => [m.videoId, m]));

  const dataApiStatsMap = new Map(
    videos.map((v) => [v.videoId, { views: v.views, likes: v.likes, comments: v.comments }]),
  );

  const dbVideos = await prisma.video.findMany({
    where: { channelId: dbChannelId, youtubeVideoId: { in: videoIds } },
    select: { id: true, youtubeVideoId: true },
  });
  const videoIdMap = new Map(dbVideos.map((v) => [v.youtubeVideoId, v.id]));

  const cachedUntil = new Date(Date.now() + METRICS_CACHE_HOURS * 60 * 60 * 1000);

  for (const videoId of videoIds) {
    const videoDbId = videoIdMap.get(videoId);
    if (!videoDbId) { continue; }

    const dataStats = dataApiStatsMap.get(videoId) ?? { views: 0, likes: 0, comments: 0 };
    const metricsData = buildMetricsData(dataStats, analyticsMap.get(videoId), cachedUntil);

    await prisma.videoMetrics.upsert({
      where: { videoId: videoDbId },
      update: { ...metricsData, fetchedAt: new Date() },
      create: { videoId: videoDbId, channelId: dbChannelId, ...metricsData },
    });
  }

  return videoIds.length;
}

// ── Use-case ────────────────────────────────────────────────

export async function syncChannel<A>(
  input: SyncChannelInput,
  deps: SyncChannelDeps<A>,
): Promise<SyncChannelResult> {
  const { userId, channelId } = input;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new ChannelError("NOT_FOUND", "Channel not found");
  }

  const skipped = checkRecentSync(channel.lastSyncedAt);
  if (skipped) { return skipped; }

  await enforceUsageAndRateLimits(userId, channel.id, deps);

  const ga = await deps.getGoogleAccount(userId, channelId);
  if (!ga) {
    throw new ChannelError("EXTERNAL_FAILURE", "Google account not connected");
  }

  await prisma.channel.update({
    where: { id: channel.id },
    data: { syncStatus: "running" },
  });

  try {
    const videos = await deps.fetchChannelVideos(ga, channelId, SYNC_VIDEO_COUNT);
    await upsertVideos(channel.id, videos);
    const metricsCount = await upsertAllMetrics(channel.id, videos, ga, channelId, deps);

    const now = new Date();
    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastSyncedAt: now, syncStatus: "idle", syncError: null },
    });

    return {
      status: "synced",
      videosCount: videos.length,
      metricsCount,
      lastSyncedAt: now,
    };
  } catch (error: unknown) {
    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        syncStatus: "error",
        syncError: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
