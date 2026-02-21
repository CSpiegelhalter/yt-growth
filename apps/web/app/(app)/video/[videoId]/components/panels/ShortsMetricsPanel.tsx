"use client";

import styles from "./panels.module.css";
import { InsightCard } from "../ui";

type ShortsMetricsPanelProps = {
  durationSec: number;
  avgViewPercentage: number | null;
  avgViewDuration?: number | null;
  stayedToWatch?: number | null;
};

// Shorts benchmarks
const SHORTS_BENCHMARKS = {
  stayedToWatch: { target: 80, good: 70, label: "Stayed to Watch" },
  avgViewDurationShort: { target: 100, good: 80, label: "AVD (< 30s shorts)" },
  avgViewDurationLong: { target: 80, good: 70, label: "AVD (31s+ shorts)" },
};

/**
 * ShortsMetricsPanel - Specialized metrics for YouTube Shorts
 * Shows benchmarks specific to short-form content
 */
export function ShortsMetricsPanel({
  durationSec,
  avgViewPercentage,
  avgViewDuration,
  stayedToWatch,
}: ShortsMetricsPanelProps) {
  // Determine which benchmark to use
  const isVeryShort = durationSec <= 30;
  const benchmark = isVeryShort
    ? SHORTS_BENCHMARKS.avgViewDurationShort
    : SHORTS_BENCHMARKS.avgViewDurationLong;

  // Calculate performance status
  const getPerformanceStatus = (
    value: number | null,
    target: number,
    good: number,
  ) => {
    if (value == null) {return "neutral";}
    if (value >= target) {return "strong";}
    if (value >= good) {return "mixed";}
    return "needs-work";
  };

  const avgViewStatus = getPerformanceStatus(
    avgViewPercentage,
    benchmark.target,
    benchmark.good,
  );

  return (
    <InsightCard
      title="Shorts Performance"
      subtitle={`${durationSec}s video - ${isVeryShort ? "Very short format" : "Standard Short format"}`}
      status={avgViewStatus}
    >
      <div className={styles.shortsMetricsGrid}>
        {/* Stayed to Watch (if available) */}
        {stayedToWatch != null && (
          <div className={styles.shortsMetric}>
            <span className={styles.shortsMetricValue}>
              {stayedToWatch.toFixed(0)}%
            </span>
            <span className={styles.shortsMetricLabel}>Stayed to Watch</span>
            <span className={styles.shortsMetricTarget}>Target: 80%+</span>
            <MetricIndicator value={stayedToWatch} target={80} good={70} />
          </div>
        )}

        {/* Average View Duration / Percentage */}
        {avgViewPercentage != null && (
          <div className={styles.shortsMetric}>
            <span className={styles.shortsMetricValue}>
              {avgViewPercentage.toFixed(0)}%
            </span>
            <span className={styles.shortsMetricLabel}>Avg View Duration</span>
            <span className={styles.shortsMetricTarget}>
              Target: {isVeryShort ? "~100%" : "~80%"}
            </span>
            <MetricIndicator
              value={avgViewPercentage}
              target={benchmark.target}
              good={benchmark.good}
            />
          </div>
        )}

        {/* Actual AVD in seconds (if available) */}
        {avgViewDuration != null && (
          <div className={styles.shortsMetric}>
            <span className={styles.shortsMetricValue}>
              {avgViewDuration.toFixed(1)}s
            </span>
            <span className={styles.shortsMetricLabel}>Avg Watch Time</span>
            <span className={styles.shortsMetricTarget}>
              of {durationSec}s total
            </span>
          </div>
        )}
      </div>

      {/* Shorts-specific benchmarks table */}
      <div className={styles.shortsBenchmarks}>
        <h4 className={styles.shortsBenchmarksTitle}>
          Shorts Retention Benchmarks
        </h4>
        <table className={styles.shortsBenchmarksTable}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Stayed to Watch</td>
              <td>80%+</td>
            </tr>
            <tr className={isVeryShort ? styles.activeRow : ""}>
              <td>AVD (shorts &lt; 30s)</td>
              <td>~100%</td>
            </tr>
            <tr className={!isVeryShort ? styles.activeRow : ""}>
              <td>AVD (shorts 31s+)</td>
              <td>~80%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shorts-specific tips */}
      <div className={styles.shortsTips}>
        <h4 className={styles.shortsTipsTitle}>Shorts Optimization Tips</h4>
        <ul className={styles.shortsTipsList}>
          <li>Hook within the first 1-2 seconds - viewers swipe quickly</li>
          <li>Keep text on screen for easy muted viewing</li>
          <li>End with a strong CTA or loop point</li>
          <li>Use trending sounds when relevant</li>
        </ul>
      </div>
    </InsightCard>
  );
}

function MetricIndicator({
  value,
  target,
  good,
}: {
  value: number;
  target: number;
  good: number;
}) {
  let status: "strong" | "mixed" | "needs-work" = "needs-work";
  if (value >= target) {status = "strong";}
  else if (value >= good) {status = "mixed";}

  return (
    <span className={`${styles.metricIndicator} ${styles[status]}`}>
      {status === "strong"
        ? "On target"
        : status === "mixed"
          ? "Close"
          : "Below target"}
    </span>
  );
}