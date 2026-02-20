"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
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
  videoId?: string;
};

type TimestampDiagnosis = {
  timeSec: number;
  type: "drop" | "spike" | "warning";
  title: string;
  description: string;
  changePercent: number;
};

// Retention benchmarks by video length
const RETENTION_BENCHMARKS = {
  shorts: { target: 80, good: 70, label: "Shorts (< 60s)" },
  short: { target: 55, good: 50, label: "4-6 min videos" },
  medium: { target: 47, good: 45, label: "8-12 min videos" },
  long: { target: 42, good: 38, label: "12+ min videos" },
};

function getBenchmarkForDuration(durationSec: number) {
  if (durationSec <= 60) return RETENTION_BENCHMARKS.shorts;
  if (durationSec <= 360) return RETENTION_BENCHMARKS.short;
  if (durationSec <= 720) return RETENTION_BENCHMARKS.medium;
  return RETENTION_BENCHMARKS.long;
}

/**
 * RetentionPanel - Retention analysis with Recharts
 * Clean metrics, actionable insights, benchmarks by video length
 */
export function RetentionPanel({
  points,
  durationSec,
  cliffTimeSec,
  avgViewedPct,
  baseline,
  videoId,
}: RetentionPanelProps) {
  // Get benchmark for this video length
  const benchmark = getBenchmarkForDuration(durationSec);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!points.length) return [];
    return points.map((p) => ({
      time: formatTime(p.elapsedRatio * durationSec),
      timeRatio: p.elapsedRatio,
      retention: Math.round(p.audienceWatchRatio * 100),
    }));
  }, [points, durationSec]);

  // Calculate retention insights
  const insights = useMemo(() => {
    if (points.length < 2) return null;

    // Find steepest drop
    let maxDrop = 0;
    let dropStart = 0;
    for (let i = 1; i < points.length; i++) {
      const drop =
        points[i - 1].audienceWatchRatio - points[i].audienceWatchRatio;
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
    const hookStrength =
      hookRetention > 0.7
        ? "strong"
        : hookRetention > 0.5
          ? "moderate"
          : "weak";

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
      improve.push(
        `${Math.round((1 - hookRetention) * 100)}% drop in first 30 seconds - strengthen your hook`,
      );
    }

    if (cliffTimeSec) {
      improve.push(
        `Sharp drop at ${formatTime(cliffTimeSec)} - add a pattern interrupt here`,
      );
    }

    if (midpoint && midpoint.audienceWatchRatio < 0.35) {
      improve.push(
        "Mid-video engagement drops - re-hook viewers around the halfway mark",
      );
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

  // Timestamp diagnosis - identify significant drops and explain them
  const timestampDiagnosis = useMemo(() => {
    if (points.length < 5) return [];

    const diagnosis: TimestampDiagnosis[] = [];
    const SIGNIFICANT_DROP_THRESHOLD = 0.08; // 8% drop is significant
    const SIGNIFICANT_SPIKE_THRESHOLD = 0.05; // 5% spike (people rewatching)

    // Analyze each segment
    for (let i = 2; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const change = prev.audienceWatchRatio - curr.audienceWatchRatio;
      const timeSec = Math.round(curr.elapsedRatio * durationSec);
      const changePercent = Math.round(change * 100);

      // Significant drop
      if (change > SIGNIFICANT_DROP_THRESHOLD) {
        const diagnosisItem = diagnoseDropAt(
          timeSec,
          durationSec,
          curr.elapsedRatio,
          changePercent,
        );
        if (diagnosisItem) {
          diagnosis.push(diagnosisItem);
        }
      }

      // Spike (negative change = increase in audience)
      if (change < -SIGNIFICANT_SPIKE_THRESHOLD) {
        diagnosis.push({
          timeSec,
          type: "spike",
          title: "Possible clip moment",
          description:
            "Viewers are rewinding to rewatch this section - a strong signal this content resonates. Extract this as a standalone clip for Shorts, social media, or as a hook for future videos.",
          changePercent: Math.abs(changePercent),
        });
      }
    }

    // Limit to top 3 most significant moments
    return diagnosis
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 3);
  }, [points, durationSec]);

  if (!points.length) {
    return (
      <InsightCard title="Retention analysis">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No retention data available</p>
          <p className={styles.emptyDesc}>
            Retention data becomes available after YouTube processes your video
            analytics.
          </p>
        </div>
      </InsightCard>
    );
  }

  const baselineAvg =
    baseline?.avgViewPercentage?.median ?? baseline?.avgViewPercentage?.mean;
  const isAboveBaseline =
    avgViewedPct && baselineAvg && avgViewedPct > baselineAvg * 100;

  // Cliff position as ratio for reference line
  const cliffRatio = cliffTimeSec ? cliffTimeSec / durationSec : null;

  return (
    <div className={styles.panelStack}>
      {/* Retention Chart using Recharts */}
      <InsightCard
        title="Audience retention"
        subtitle={
          avgViewedPct
            ? `${avgViewedPct.toFixed(0)}% average viewed${
                baselineAvg
                  ? ` (baseline: ${(baselineAvg * 100).toFixed(0)}%)`
                  : ""
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
        <div className={styles.retentionChart} style={{ userSelect: "none" }}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id="retentionGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                interval={Math.max(1, Math.floor(chartData.length / 5))}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                tickFormatter={(value) => `${value}%`}
                width={40}
                ticks={[0, 50, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number | undefined) =>
                  value != null
                    ? [`${value}%`, "Retention"]
                    : ["–", "Retention"]
                }
                labelFormatter={(label) => `At ${label}`}
                cursor={{ stroke: "var(--color-border)", strokeDasharray: "4" }}
              />
              {/* Benchmark line */}
              <ReferenceLine
                y={benchmark.target}
                stroke="#22c55e"
                strokeDasharray="4"
                strokeOpacity={0.5}
              />
              {/* 50% reference line */}
              <ReferenceLine
                y={50}
                stroke="var(--color-border)"
                strokeDasharray="2"
              />
              {/* Cliff marker (vertical line at drop point) */}
              {cliffRatio && (
                <ReferenceLine
                  x={formatTime(cliffTimeSec!)}
                  stroke="#ef4444"
                  strokeDasharray="4"
                  label={{
                    value: "Drop",
                    position: "top",
                    fill: "#ef4444",
                    fontSize: 10,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="retention"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#retentionGradient)"
                isAnimationActive={false}
                activeDot={{
                  r: 4,
                  fill: "#3b82f6",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key moments - inline with chart */}
        {timestampDiagnosis.length > 0 && (
          <div className={styles.inlineDiagnosis}>
            {timestampDiagnosis.map((item, idx) => (
              <a
                key={idx}
                href={
                  videoId
                    ? `https://youtube.com/watch?v=${videoId}&t=${Math.floor(item.timeSec)}s`
                    : "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.inlineDiagnosisItem} ${styles[item.type]}`}
              >
                <span className={styles.inlineDiagnosisTime}>
                  {formatTime(item.timeSec)}
                </span>
                <span className={styles.inlineDiagnosisTitle}>
                  {item.title}
                </span>
                <span
                  className={`${styles.inlineDiagnosisChange} ${item.type === "spike" ? styles.positive : styles.negative}`}
                >
                  {item.type === "spike" ? "+" : "-"}
                  {item.changePercent}%
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Benchmark info */}
        <div className={styles.benchmarkInfo}>
          <span className={styles.benchmarkLabel}>
            Benchmark for {benchmark.label}:
          </span>
          <span className={styles.benchmarkValue}>
            {benchmark.good}–{benchmark.target}% average retention
          </span>
        </div>

        {/* Key moments */}
        {insights && (
          <div className={styles.retentionStats}>
            <div className={styles.retentionStat}>
              <span className={styles.statValue}>
                {Math.round((insights.hookRetention ?? 0) * 100)}%
              </span>
              <span className={styles.statLabel}>First 30s</span>
              <span className={styles.statTarget}>Target: 70%+</span>
            </div>
            <div className={styles.retentionStat}>
              <span className={styles.statValue}>
                {Math.round((insights.midpointRetention ?? 0) * 100)}%
              </span>
              <span className={styles.statLabel}>At midpoint</span>
              <span className={styles.statTarget}>Target: 35%+</span>
            </div>
            <div className={styles.retentionStat}>
              <span className={styles.statValue}>
                {Math.round((insights.completionRate ?? 0) * 100)}%
              </span>
              <span className={styles.statLabel}>Watched to end</span>
            </div>
          </div>
        )}
      </InsightCard>

      {/* Insights */}
      {insights &&
        (insights.working.length > 0 || insights.improve.length > 0) && (
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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Diagnose what likely caused a drop at a specific timestamp
 */
function diagnoseDropAt(
  timeSec: number,
  _durationSec: number,
  elapsedRatio: number,
  changePercent: number,
): TimestampDiagnosis | null {
  // Early drops (first 10%)
  if (elapsedRatio < 0.1) {
    if (timeSec < 5) {
      return {
        timeSec,
        type: "drop",
        title: "Slow start",
        description:
          "Viewers expect value immediately. Start with the most interesting thing, not a greeting or intro animation.",
        changePercent,
      };
    }
    if (timeSec < 15) {
      return {
        timeSec,
        type: "drop",
        title: "Hook not delivering",
        description:
          "Your first 15 seconds should answer: 'Why should I watch this?' Make the promise clearer and more specific.",
        changePercent,
      };
    }
    return {
      timeSec,
      type: "drop",
      title: "Early abandonment",
      description:
        "Viewers aren't convinced to stay. Consider cutting any setup that doesn't directly build anticipation.",
      changePercent,
    };
  }

  // Mid-video drops (10-70%)
  if (elapsedRatio >= 0.1 && elapsedRatio < 0.7) {
    // Check for common mid-video issues
    if (elapsedRatio > 0.3 && elapsedRatio < 0.5) {
      return {
        timeSec,
        type: "drop",
        title: "Mid-video slump",
        description:
          "Viewers are losing interest at this point. Add a re-hook, change the visual pace, or introduce a new element to regain attention.",
        changePercent,
      };
    }
    return {
      timeSec,
      type: "warning",
      title: "Pacing issue",
      description:
        "Something at this timestamp is causing viewers to leave. Review this section for long pauses, repetition, or content that doesn't match the title promise.",
      changePercent,
    };
  }

  // Late video drops (70%+)
  if (elapsedRatio >= 0.7) {
    if (elapsedRatio > 0.9) {
      return {
        timeSec,
        type: "warning",
        title: "Pre-end screen exit",
        description:
          "Viewers are leaving before your end screen. Keep energy high until the end and verbally pitch your next video before the visual end screen appears.",
        changePercent,
      };
    }
    return {
      timeSec,
      type: "warning",
      title: "Conclusion drag",
      description:
        "Viewers think you're done. Either tighten the ending or add a 'one more thing' moment to keep them engaged.",
      changePercent,
    };
  }

  return null;
}