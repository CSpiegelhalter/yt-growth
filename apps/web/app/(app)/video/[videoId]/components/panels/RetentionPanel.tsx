"use client";

import { useMemo } from "react";
import styles from "./panels.module.css";
import { InsightCard, TwoColumnInsight, NextSteps } from "../ui";

type RetentionPoint = {
  elapsedRatio: number;
  audienceWatchRatio: number;
};

type RetentionPanelProps = {
  points: RetentionPoint[];
  durationSec: number;
  cliffTimeSec?: number | null;
  avgViewedPct?: number | null;
  baseline?: {
    avgViewPercentage?: { mean?: number; median?: number };
  } | null;
};

/**
 * RetentionPanel - Retention analysis with clean chart
 * No emojis, clean metrics, actionable insights
 */
export function RetentionPanel({
  points,
  durationSec,
  cliffTimeSec,
  avgViewedPct,
  baseline,
}: RetentionPanelProps) {
  // Calculate retention insights
  const insights = useMemo(() => {
    if (points.length < 2) return null;

    // Find steepest drop
    let maxDrop = 0;
    let dropStart = 0;
    for (let i = 1; i < points.length; i++) {
      const drop = points[i - 1].audienceWatchRatio - points[i].audienceWatchRatio;
      if (drop > maxDrop) {
        maxDrop = drop;
        dropStart = points[i - 1].elapsedRatio;
      }
    }

    // Engagement at key points
    const first30 = points.find((p) => p.elapsedRatio >= 0.05);
    const midpoint = points.find((p) => p.elapsedRatio >= 0.5);
    const last = points[points.length - 1];

    // Determine hook strength
    const hookRetention = first30?.audienceWatchRatio ?? 1;
    const hookStrength = hookRetention > 0.7 ? "strong" : hookRetention > 0.5 ? "moderate" : "weak";

    // Generate working/improve bullets
    const working: string[] = [];
    const improve: string[] = [];

    if (hookRetention > 0.7) {
      working.push("Strong hook - most viewers stay past the intro");
    } else if (hookRetention > 0.5) {
      working.push("Decent hook - majority stay through intro");
    }

    if (midpoint && midpoint.audienceWatchRatio > 0.4) {
      working.push("Good mid-video retention");
    }

    if (last.audienceWatchRatio > 0.3) {
      working.push("Solid completion rate");
    }

    if (hookRetention < 0.6) {
      improve.push(`${Math.round((1 - hookRetention) * 100)}% drop in first 30 seconds - strengthen your hook`);
    }

    if (cliffTimeSec) {
      improve.push(`Sharp drop at ${formatTime(cliffTimeSec)} - add a pattern interrupt here`);
    }

    if (midpoint && midpoint.audienceWatchRatio < 0.35) {
      improve.push("Mid-video engagement drops - re-hook viewers around the halfway mark");
    }

    return {
      hookStrength,
      hookRetention,
      midpointRetention: midpoint?.audienceWatchRatio,
      completionRate: last.audienceWatchRatio,
      biggestDrop: { ratio: maxDrop, timeRatio: dropStart },
      working,
      improve,
    };
  }, [points, cliffTimeSec]);

  if (!points.length) {
    return (
      <InsightCard title="Retention analysis">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No retention data available</p>
          <p className={styles.emptyDesc}>
            Retention data becomes available after YouTube processes your video analytics.
          </p>
        </div>
      </InsightCard>
    );
  }

  const baselineAvg = baseline?.avgViewPercentage?.median ?? baseline?.avgViewPercentage?.mean;
  const isAboveBaseline = avgViewedPct && baselineAvg && avgViewedPct > baselineAvg * 100;

  return (
    <div className={styles.panelStack}>
      {/* Retention Chart */}
      <InsightCard
        title="Audience retention"
        subtitle={
          avgViewedPct
            ? `${avgViewedPct.toFixed(0)}% average viewed${
                baselineAvg ? ` (baseline: ${(baselineAvg * 100).toFixed(0)}%)` : ""
              }`
            : undefined
        }
        status={
          !avgViewedPct
            ? "neutral"
            : isAboveBaseline
            ? "strong"
            : avgViewedPct > 40
            ? "mixed"
            : "needs-work"
        }
      >
        <div className={styles.retentionChart}>
          <svg viewBox="0 0 400 120" className={styles.retentionSvg}>
            {/* Grid lines */}
            <line x1="40" y1="10" x2="40" y2="100" className={styles.gridLine} />
            <line x1="40" y1="100" x2="390" y2="100" className={styles.gridLine} />
            <line x1="40" y1="55" x2="390" y2="55" className={styles.gridLineLight} strokeDasharray="4" />

            {/* Y-axis labels */}
            <text x="35" y="15" className={styles.axisLabel} textAnchor="end">100%</text>
            <text x="35" y="58" className={styles.axisLabel} textAnchor="end">50%</text>
            <text x="35" y="103" className={styles.axisLabel} textAnchor="end">0%</text>

            {/* Retention curve */}
            <path
              d={generatePath(points, 40, 390, 10, 100)}
              className={styles.retentionPath}
              fill="none"
            />

            {/* Cliff marker */}
            {cliffTimeSec && (
              <g>
                <line
                  x1={40 + (cliffTimeSec / durationSec) * 350}
                  y1="10"
                  x2={40 + (cliffTimeSec / durationSec) * 350}
                  y2="100"
                  className={styles.cliffLine}
                  strokeDasharray="4"
                />
                <text
                  x={40 + (cliffTimeSec / durationSec) * 350}
                  y="115"
                  className={styles.cliffLabel}
                  textAnchor="middle"
                >
                  {formatTime(cliffTimeSec)}
                </text>
              </g>
            )}

            {/* X-axis labels */}
            <text x="40" y="115" className={styles.axisLabel} textAnchor="start">0:00</text>
            <text x="390" y="115" className={styles.axisLabel} textAnchor="end">{formatTime(durationSec)}</text>
          </svg>
        </div>

        {/* Key moments */}
        {insights && (
          <div className={styles.retentionStats}>
            <div className={styles.retentionStat}>
              <span className={styles.statValue}>{Math.round((insights.hookRetention ?? 0) * 100)}%</span>
              <span className={styles.statLabel}>Hook retention</span>
            </div>
            <div className={styles.retentionStat}>
              <span className={styles.statValue}>{Math.round((insights.midpointRetention ?? 0) * 100)}%</span>
              <span className={styles.statLabel}>At midpoint</span>
            </div>
            <div className={styles.retentionStat}>
              <span className={styles.statValue}>{Math.round((insights.completionRate ?? 0) * 100)}%</span>
              <span className={styles.statLabel}>Completion</span>
            </div>
          </div>
        )}
      </InsightCard>

      {/* Insights */}
      {insights && (insights.working.length > 0 || insights.improve.length > 0) && (
        <InsightCard title="Retention insights">
          <TwoColumnInsight
            working={insights.working}
            improve={insights.improve}
          />
          {insights.improve.length > 0 && (
            <NextSteps
              actions={[
                { label: "Add pattern interrupt", variant: "secondary" },
                { label: "Strengthen hook", variant: "secondary" },
              ]}
            />
          )}
        </InsightCard>
      )}
    </div>
  );
}

function generatePath(
  points: RetentionPoint[],
  left: number,
  right: number,
  top: number,
  bottom: number
): string {
  if (points.length === 0) return "";

  const width = right - left;
  const height = bottom - top;

  const pathPoints = points.map((p) => ({
    x: left + p.elapsedRatio * width,
    y: top + (1 - p.audienceWatchRatio) * height,
  }));

  return `M ${pathPoints[0].x} ${pathPoints[0].y} ${pathPoints
    .slice(1)
    .map((p) => `L ${p.x} ${p.y}`)
    .join(" ")}`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default RetentionPanel;
