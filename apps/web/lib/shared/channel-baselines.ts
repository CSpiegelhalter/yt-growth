/**
 * Channel Baseline Computation
 *
 * Pure math utilities for computing 30-day channel norms and
 * comparing individual video metrics against them.
 *
 * Used by: channels, video-insights, channel-audit features.
 */

// ── Types ────────────────────────────────────────────────────

export type ChannelNorms = {
  avgCtr: number | null;
  avgAvdPct: number | null;
  avgSubsPer1kViews: number | null;
  avgViewsPerDay: number | null;
  sampleSize: number;
};

export type HealthStatusLevel = "above_avg" | "below_avg" | "average";

export type HealthStatus = {
  clickability: HealthStatusLevel;
  stickiness: HealthStatusLevel;
  conversion: HealthStatusLevel;
};

export type PerformanceSignal = {
  label: "Clickability" | "Stickiness" | "Conversion";
  status: "good" | "neutral" | "poor";
  value: string;
};

export type BaselineVideoInput = {
  views: number;
  publishedAt: string | null;
  ctr?: number | null;
  avgViewPercentage?: number | null;
  subscribersGained?: number | null;
};

// ── Constants ────────────────────────────────────────────────

const MIN_VIEWS_FOR_BASELINE = 50;
const ABOVE_THRESHOLD = 1.15;
const BELOW_THRESHOLD = 0.85;

// ── Helpers ──────────────────────────────────────────────────

function avgOfNonNull(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) {return null;}
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

function daysSincePublish(publishedAt: string | null): number {
  if (!publishedAt) {return 1;}
  const ms = Date.now() - new Date(publishedAt).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function pctDelta(value: number, baseline: number): number | null {
  if (baseline === 0) {return null;}
  return ((value - baseline) / baseline) * 100;
}

function formatDelta(delta: number | null): string {
  if (delta == null) {return "N/A";}
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${Math.round(delta)}%`;
}

// ── Core Functions ───────────────────────────────────────────

/**
 * Compute 30-day channel norms from a list of videos.
 * Filters to videos with sufficient views for statistical relevance.
 */
export function calculateChannelBaselines(
  videos: BaselineVideoInput[],
): ChannelNorms {
  const qualified = videos.filter((v) => v.views >= MIN_VIEWS_FOR_BASELINE);

  if (qualified.length === 0) {
    return {
      avgCtr: null,
      avgAvdPct: null,
      avgSubsPer1kViews: null,
      avgViewsPerDay: null,
      sampleSize: 0,
    };
  }

  const subsRates = qualified
    .filter((v) => v.subscribersGained != null && v.views > 0)
    .map((v) => ((v.subscribersGained ?? 0) / v.views) * 1000);

  const viewsPerDay = qualified.map(
    (v) => v.views / daysSincePublish(v.publishedAt),
  );

  return {
    avgCtr: avgOfNonNull(qualified.map((v) => v.ctr)),
    avgAvdPct: avgOfNonNull(qualified.map((v) => v.avgViewPercentage)),
    avgSubsPer1kViews: subsRates.length > 0 ? avgOfNonNull(subsRates) : null,
    avgViewsPerDay: avgOfNonNull(viewsPerDay),
    sampleSize: qualified.length,
  };
}

/**
 * Compare a single video's metrics against the channel baselines.
 * Returns a three-axis health status.
 */
export function computeVideoHealthStatus(
  video: BaselineVideoInput,
  baselines: ChannelNorms,
): HealthStatus {
  return {
    clickability: classifyMetric(video.ctr, baselines.avgCtr),
    stickiness: classifyMetric(video.avgViewPercentage, baselines.avgAvdPct),
    conversion: classifyMetric(
      video.subscribersGained != null && video.views > 0
        ? (video.subscribersGained / video.views) * 1000
        : null,
      baselines.avgSubsPer1kViews,
    ),
  };
}

function classifyMetric(
  value: number | null | undefined,
  baseline: number | null,
): HealthStatusLevel {
  if (value == null || baseline == null || baseline === 0) {return "average";}
  const ratio = value / baseline;
  if (ratio >= ABOVE_THRESHOLD) {return "above_avg";}
  if (ratio <= BELOW_THRESHOLD) {return "below_avg";}
  return "average";
}

/**
 * Build UI-ready performance signal cards for a video.
 */
export function buildPerformanceSignals(
  video: BaselineVideoInput,
  baselines: ChannelNorms,
): PerformanceSignal[] {
  const health = computeVideoHealthStatus(video, baselines);

  return [
    buildSignal("Clickability", health.clickability, video.ctr, baselines.avgCtr),
    buildSignal("Stickiness", health.stickiness, video.avgViewPercentage, baselines.avgAvdPct),
    buildSignal(
      "Conversion",
      health.conversion,
      video.subscribersGained != null && video.views > 0
        ? (video.subscribersGained / video.views) * 1000
        : null,
      baselines.avgSubsPer1kViews,
    ),
  ];
}

function buildSignal(
  label: PerformanceSignal["label"],
  level: HealthStatusLevel,
  value: number | null | undefined,
  baseline: number | null,
): PerformanceSignal {
  const status = toSignalStatus(level);
  if (value == null || baseline == null) {
    return { label, status, value: "N/A" };
  }
  const delta = pctDelta(value, baseline);
  return { label, status, value: formatDelta(delta) };
}

function toSignalStatus(
  level: HealthStatusLevel,
): "good" | "neutral" | "poor" {
  if (level === "above_avg") {return "good";}
  if (level === "below_avg") {return "poor";}
  return "neutral";
}

