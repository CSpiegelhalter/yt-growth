/**
 * Enrich Videos With Analytics
 *
 * Fetches per-video analytics (CTR, AVD%, subs) for a batch of videos,
 * computes 30-day channel baselines, and attaches health status +
 * performance signals to each video.
 */

import type {
  BaselineVideoInput,
  ChannelNorms,
  HealthStatus,
  PerformanceSignal,
} from "@/lib/shared/channel-baselines";
import {
  buildPerformanceSignals,
  calculateChannelBaselines,
  computeVideoHealthStatus,
} from "@/lib/shared/channel-baselines";

// ── Types ────────────────────────────────────────────────────

type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

type BatchAnalyticsRow = {
  videoId: string;
  views: number;
  avgViewPercentage: number | null;
  subscribersGained: number | null;
  impressions: number | null;
  impressionsCtr: number | null;
};

type VideoStub = {
  videoId: string;
  views: number;
  publishedAt: string | null;
};

export type EnrichedVideoAnalytics = {
  videoId: string;
  avgViewPercentage: number | null;
  subscribersGained: number | null;
  impressions: number | null;
  impressionsCtr: number | null;
  healthStatus: HealthStatus;
  performanceSignals: PerformanceSignal[];
};

export type EnrichResult = {
  baselines: ChannelNorms;
  analytics: Map<string, EnrichedVideoAnalytics>;
};

export type EnrichVideosInput = {
  channelId: string;
  videos: VideoStub[];
  googleAccount: GoogleAccount;
};

export type EnrichVideosDeps = {
  fetchBatchAnalytics: (
    ga: GoogleAccount,
    channelId: string,
    videoIds: string[],
    startDate: string,
    endDate: string,
  ) => Promise<BatchAnalyticsRow[]>;
};

// ── Helpers ──────────────────────────────────────────────────

function buildDateRange(): { startStr: string; endStr: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  return {
    startStr: startDate.toISOString().split("T")[0],
    endStr: endDate.toISOString().split("T")[0],
  };
}

function toBaselineInput(
  video: VideoStub,
  row: BatchAnalyticsRow | undefined,
): BaselineVideoInput {
  return {
    views: row?.views ?? video.views,
    publishedAt: video.publishedAt,
    ctr: row?.impressionsCtr ?? null,
    avgViewPercentage: row?.avgViewPercentage ?? null,
    subscribersGained: row?.subscribersGained ?? null,
  };
}

function enrichSingleVideo(
  video: VideoStub,
  row: BatchAnalyticsRow | undefined,
  baselines: ChannelNorms,
): EnrichedVideoAnalytics {
  const baselineInput = toBaselineInput(video, row);
  return {
    videoId: video.videoId,
    avgViewPercentage: row?.avgViewPercentage ?? null,
    subscribersGained: row?.subscribersGained ?? null,
    impressions: row?.impressions ?? null,
    impressionsCtr: row?.impressionsCtr ?? null,
    healthStatus: computeVideoHealthStatus(baselineInput, baselines),
    performanceSignals: buildPerformanceSignals(baselineInput, baselines),
  };
}

// ── Use-Case ─────────────────────────────────────────────────

export async function enrichVideosWithAnalytics(
  input: EnrichVideosInput,
  deps: EnrichVideosDeps,
): Promise<EnrichResult> {
  const { channelId, videos, googleAccount } = input;

  if (videos.length === 0) {
    return { baselines: calculateChannelBaselines([]), analytics: new Map() };
  }

  const { startStr, endStr } = buildDateRange();
  const videoIds = videos.map((v) => v.videoId);

  const batchRows = await deps.fetchBatchAnalytics(
    googleAccount,
    channelId,
    videoIds,
    startStr,
    endStr,
  );

  const rowMap = new Map<string, BatchAnalyticsRow>();
  for (const row of batchRows) {
    rowMap.set(row.videoId, row);
  }

  const baselineInputs = videos.map((v) => toBaselineInput(v, rowMap.get(v.videoId)));
  const baselines = calculateChannelBaselines(baselineInputs);

  const analytics = new Map<string, EnrichedVideoAnalytics>();
  for (const video of videos) {
    analytics.set(video.videoId, enrichSingleVideo(video, rowMap.get(video.videoId), baselines));
  }

  return { baselines, analytics };
}
