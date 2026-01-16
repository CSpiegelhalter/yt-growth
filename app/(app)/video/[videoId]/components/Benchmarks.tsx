"use client";

import s from "../style.module.css";
import type { DerivedMetrics, ChannelBaseline, BaselineComparison } from "@/types/api";

type BenchmarksProps = {
  derived: DerivedMetrics;
  baseline: ChannelBaseline;
  comparison: BaselineComparison;
};

type BenchmarkRow = {
  label: string;
  thisVideo: string;
  median: string;
  range?: string;
  status: "above" | "at" | "below" | "unknown";
};

/**
 * Benchmarks - Shows "Your typical range" vs "This video"
 * Compact panel with key metrics and percentile ranges
 */
export function Benchmarks({ derived, baseline, comparison }: BenchmarksProps) {
  if (baseline.sampleSize === 0) {
    return null;
  }

  const rows: BenchmarkRow[] = [];

  // Views per day
  if (baseline.viewsPerDay.mean > 0) {
    const median = baseline.viewsPerDay.median ?? baseline.viewsPerDay.mean;
    const p25 = baseline.viewsPerDay.p25;
    const p75 = baseline.viewsPerDay.p75;
    rows.push({
      label: "Views/Day",
      thisVideo: formatNumber(derived.viewsPerDay),
      median: formatNumber(median),
      range:
        p25 != null && p75 != null
          ? `${formatNumber(p25)} – ${formatNumber(p75)}`
          : undefined,
      status: comparison.viewsPerDay.vsBaseline,
    });
  }

  // Avg % Viewed
  if (baseline.avgViewPercentage.mean > 0) {
    const currentPct =
      derived.avgViewPercentage ?? (derived.avdRatio != null ? derived.avdRatio * 100 : null);
    const median = (baseline.avgViewPercentage.median ?? baseline.avgViewPercentage.mean) * 100;
    const p25 = baseline.avgViewPercentage.p25 != null ? baseline.avgViewPercentage.p25 * 100 : null;
    const p75 = baseline.avgViewPercentage.p75 != null ? baseline.avgViewPercentage.p75 * 100 : null;

    rows.push({
      label: "Avg % Viewed",
      thisVideo: currentPct != null ? `${currentPct.toFixed(0)}%` : "—",
      median: `${median.toFixed(0)}%`,
      range:
        p25 != null && p75 != null
          ? `${p25.toFixed(0)}% – ${p75.toFixed(0)}%`
          : undefined,
      status: comparison.avgViewPercentage.vsBaseline,
    });
  }

  // Avg View Duration
  if (baseline.watchTimePerViewSec.mean > 0 && derived.avgViewDuration != null) {
    const median = baseline.watchTimePerViewSec.median ?? baseline.watchTimePerViewSec.mean;
    const p25 = baseline.watchTimePerViewSec.p25;
    const p75 = baseline.watchTimePerViewSec.p75;

    rows.push({
      label: "Avg View Duration",
      thisVideo: formatDuration(derived.avgViewDuration),
      median: formatDuration(median),
      range:
        p25 != null && p75 != null
          ? `${formatDuration(p25)} – ${formatDuration(p75)}`
          : undefined,
      status: comparison.watchTimePerViewSec.vsBaseline,
    });
  }

  // Subs per 1K
  if (baseline.subsPer1k.mean > 0 && derived.subsPer1k != null) {
    const median = baseline.subsPer1k.median ?? baseline.subsPer1k.mean;
    const p25 = baseline.subsPer1k.p25;
    const p75 = baseline.subsPer1k.p75;

    rows.push({
      label: "Subs/1K Views",
      thisVideo: derived.subsPer1k.toFixed(2),
      median: median.toFixed(2),
      range:
        p25 != null && p75 != null
          ? `${p25.toFixed(2)} – ${p75.toFixed(2)}`
          : undefined,
      status: comparison.subsPer1k.vsBaseline,
    });
  }

  // CTR (if available)
  if (
    baseline.impressionsCtr?.mean != null &&
    baseline.impressionsCtr.mean > 0 &&
    derived.impressionsCtr != null
  ) {
    const median = baseline.impressionsCtr.median ?? baseline.impressionsCtr.mean;
    const p25 = baseline.impressionsCtr.p25;
    const p75 = baseline.impressionsCtr.p75;

    rows.push({
      label: "CTR",
      thisVideo: `${derived.impressionsCtr.toFixed(1)}%`,
      median: `${median.toFixed(1)}%`,
      range:
        p25 != null && p75 != null
          ? `${p25.toFixed(1)}% – ${p75.toFixed(1)}%`
          : undefined,
      status:
        derived.impressionsCtr > median * 1.1
          ? "above"
          : derived.impressionsCtr < median * 0.9
          ? "below"
          : "at",
    });
  }

  // First 24h views (if available)
  if (
    baseline.first24hViews?.mean != null &&
    baseline.first24hViews.mean > 0 &&
    derived.first24hViews != null
  ) {
    const median = baseline.first24hViews.median ?? baseline.first24hViews.mean;
    const p25 = baseline.first24hViews.p25;
    const p75 = baseline.first24hViews.p75;

    rows.push({
      label: "First 24h Views",
      thisVideo: formatNumber(derived.first24hViews),
      median: formatNumber(median),
      range:
        p25 != null && p75 != null
          ? `${formatNumber(p25)} – ${formatNumber(p75)}`
          : undefined,
      status:
        derived.first24hViews > median * 1.1
          ? "above"
          : derived.first24hViews < median * 0.9
          ? "below"
          : "at",
    });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className={s.benchmarks}>
      <h2 className={s.sectionTitle}>Benchmarks</h2>
      <p className={s.sectionDesc}>
        This video vs your typical range (based on {baseline.sampleSize} videos)
      </p>

      <div className={s.benchmarkTable}>
        <div className={s.benchmarkHeader}>
          <span className={s.benchmarkHeaderLabel}>Metric</span>
          <span className={s.benchmarkHeaderValue}>This Video</span>
          <span className={s.benchmarkHeaderValue}>Your Median</span>
          <span className={s.benchmarkHeaderRange}>Typical Range</span>
        </div>

        {rows.map((row, i) => (
          <div key={i} className={s.benchmarkRow}>
            <span className={s.benchmarkLabel}>{row.label}</span>
            <span
              className={`${s.benchmarkValue} ${getStatusClass(row.status)}`}
            >
              {row.thisVideo}
            </span>
            <span className={s.benchmarkMedian}>{row.median}</span>
            <span className={s.benchmarkRange}>{row.range ?? "—"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getStatusClass(status: "above" | "at" | "below" | "unknown"): string {
  switch (status) {
    case "above":
      return s.benchmarkAbove;
    case "below":
      return s.benchmarkBelow;
    default:
      return "";
  }
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return `${secs}s`;
}
