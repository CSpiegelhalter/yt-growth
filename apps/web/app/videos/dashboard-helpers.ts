import type { InsightVideoInput, VideoPublishMarker } from "@/lib/features/channel-audit";
import { toLocalDateStr } from "@/lib/shared/date-range";
import type { DashboardVideo, VideoWithMetrics } from "@/lib/video-tools";

import type { Video } from "./dashboard-types";

export function connectChannel(): void {
  window.location.href = "/api/integrations/google/start";
}

export function toDashboardVideo(v: Video): DashboardVideo {
  return {
    videoId: v.videoId || v.youtubeVideoId || `video-${v.id}`,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    durationSec: v.durationSec ?? null,
    publishedAt: v.publishedAt,
    views: v.views ?? v.viewCount ?? 0,
    likes: v.likes ?? 0,
    comments: v.comments ?? 0,
    avgViewDuration: v.avgViewDuration,
    avgViewPercentage: v.avgViewPercentage,
    subscribersGained: v.subscribersGained,
    subscribersLost: v.subscribersLost,
    estimatedMinutesWatched: v.estimatedMinutesWatched,
    shares: v.shares,
  };
}

export const DASHBOARD_VIDEOS_TTL_MS = 2 * 60 * 60 * 1000;
export const DASHBOARD_VIDEOS_CACHE_VERSION = "v3";
const LOOKBACK_DAYS = 30;

export function buildPublishedAfter(): string {
  const d = new Date();
  d.setDate(d.getDate() - LOOKBACK_DAYS);
  return d.toISOString();
}

export function deriveInsightVideos(vwm: VideoWithMetrics[]): InsightVideoInput[] {
  return vwm.map((v) => ({
    videoId: v.videoId,
    title: v.title,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    durationSec: v.durationSec,
    publishedAt: v.publishedAt,
    avgViewPercentage: v.avgViewPercentage ?? null,
    subscribersGained: v.subscribersGained ?? null,
    shares: v.shares ?? null,
  }));
}

export function deriveVideoMarkers(vwm: VideoWithMetrics[]): VideoPublishMarker[] {
  return vwm
    .filter((v): v is VideoWithMetrics & { publishedAt: string } => !!v.publishedAt)
    .map((v) => ({
      videoId: v.videoId,
      title: v.title ?? "Untitled",
      thumbnailUrl: v.thumbnailUrl ?? null,
      publishedAt: v.publishedAt,
      chartDate: toLocalDateStr(new Date(v.publishedAt)),
    }));
}
