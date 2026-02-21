/**
 * Main channel audit orchestration.
 *
 * Handles channel ownership verification, data retrieval from the
 * database, and delegates external metric fetching to injected deps.
 * Assembles a complete ChannelAuditResult from the domain helpers.
 */

import { prisma } from "@/prisma";
import { ChannelAuditError } from "../errors";
import type {
  AuditPatterns,
  ChannelAuditResult,
  FormatInsight,
  RunAuditDeps,
  RunAuditInput,
  VideoMetricsRecord,
  VideoRecord,
} from "../types";
import {
  computeChannelBaseline,
  computeTrafficSourcePercentages,
  computeTrends,
} from "./computeBaseline";
import { detectChannelBottleneck } from "./detectBottlenecks";
import { generateActions } from "./generateRecommendations";

export async function runChannelAudit(
  input: RunAuditInput,
  deps: RunAuditDeps,
): Promise<ChannelAuditResult> {
  const { userId, channelId, range } = input;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new ChannelAuditError("NOT_FOUND", "Channel not found");
  }

  const metrics = await deps.fetchChannelMetrics(userId, channelId, range);

  const daysAgo = range === "7d" ? 7 : range === "28d" ? 28 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const [videosRaw, videoMetricsRaw] = await Promise.all([
    prisma.video.findMany({
      where: { channelId: channel.id, publishedAt: { gte: startDate } },
      orderBy: { publishedAt: "desc" },
      take: 50,
    }),
    prisma.videoMetrics.findMany({
      where: { channelId: channel.id },
      orderBy: { fetchedAt: "desc" },
      take: 50,
      include: { Video: { select: { youtubeVideoId: true } } },
    }),
  ]);

  const videoMetrics: VideoMetricsRecord[] = videoMetricsRaw.map((m) => ({
    youtubeVideoId: m.Video.youtubeVideoId,
    viewCount: m.views,
    avgViewPercentage: m.averageViewPercentage,
    subscribersGained: m.subscribersGained,
  }));

  const videos: VideoRecord[] = videosRaw.map((v) => ({
    youtubeVideoId: v.youtubeVideoId,
    title: v.title ?? "",
    durationSec: v.durationSec,
  }));

  const baseline = computeChannelBaseline(videoMetrics);
  const bottleneck = detectChannelBottleneck(metrics, baseline);
  const actions = generateActions(bottleneck);
  const trafficSources = computeTrafficSourcePercentages(
    metrics?.trafficSources ?? null,
  );
  const trends = computeTrends(metrics);
  const patterns = detectPatterns(videos, videoMetrics);

  return {
    bottleneck,
    actions,
    trafficSources,
    trends,
    patterns,
    metrics,
    baseline,
    range,
    videoCount: videosRaw.length,
    cached: false,
  };
}

// ── Pattern Detection (internal) ────────────────────────────

function detectPatterns(
  videos: VideoRecord[],
  videoMetrics: VideoMetricsRecord[],
): AuditPatterns {
  const metricsMap = new Map(
    videoMetrics.map((m) => [m.youtubeVideoId, m]),
  );

  const videosWithMetrics = videos
    .map((v) => ({
      video: v,
      metrics: metricsMap.get(v.youtubeVideoId),
    }))
    .filter((v) => v.metrics?.viewCount && v.metrics.viewCount > 50);

  const topPerformers = [...videosWithMetrics]
    .sort((a, b) => (b.metrics?.viewCount ?? 0) - (a.metrics?.viewCount ?? 0))
    .slice(0, 3)
    .map((v) => ({
      videoId: v.video.youtubeVideoId,
      title: v.video.title,
      metric: "Views",
      value: `${(v.metrics?.viewCount ?? 0).toLocaleString()} views`,
    }));

  const avgViews =
    videosWithMetrics.reduce(
      (sum, v) => sum + (v.metrics?.viewCount ?? 0),
      0,
    ) / videosWithMetrics.length || 1;

  const underperformers = [...videosWithMetrics]
    .filter((v) => (v.metrics?.viewCount ?? 0) < avgViews * 0.5)
    .sort((a, b) => (a.metrics?.viewCount ?? 0) - (b.metrics?.viewCount ?? 0))
    .slice(0, 3)
    .map((v) => ({
      videoId: v.video.youtubeVideoId,
      title: v.video.title,
      metric: "Views",
      value: `${(v.metrics?.viewCount ?? 0).toLocaleString()} views (${Math.round(((v.metrics?.viewCount ?? 0) / avgViews) * 100)}% of average)`,
    }));

  const formatInsights = detectFormatInsights(videosWithMetrics);

  return { topPerformers, underperformers, formatInsights };
}

function detectFormatInsights(
  videosWithMetrics: Array<{
    video: VideoRecord;
    metrics: VideoMetricsRecord | undefined;
  }>,
): FormatInsight[] {
  const formatInsights: FormatInsight[] = [];

  const shortVideos = videosWithMetrics.filter(
    (v) => (v.video.durationSec ?? 0) < 300,
  );
  const longVideos = videosWithMetrics.filter(
    (v) => (v.video.durationSec ?? 0) >= 600,
  );

  if (shortVideos.length >= 3 && longVideos.length >= 3) {
    const shortAvg =
      shortVideos.reduce(
        (sum, v) => sum + (v.metrics?.viewCount ?? 0),
        0,
      ) / shortVideos.length;
    const longAvg =
      longVideos.reduce(
        (sum, v) => sum + (v.metrics?.viewCount ?? 0),
        0,
      ) / longVideos.length;

    if (shortAvg > longAvg * 1.3) {
      formatInsights.push({
        pattern: "Shorter videos perform better",
        impact: "positive",
        evidence: `Videos under 5 minutes average ${Math.round(shortAvg).toLocaleString()} views vs ${Math.round(longAvg).toLocaleString()} for longer videos.`,
      });
    } else if (longAvg > shortAvg * 1.3) {
      formatInsights.push({
        pattern: "Longer videos perform better",
        impact: "positive",
        evidence: `Videos over 10 minutes average ${Math.round(longAvg).toLocaleString()} views vs ${Math.round(shortAvg).toLocaleString()} for shorter videos.`,
      });
    }
  }

  return formatInsights;
}
