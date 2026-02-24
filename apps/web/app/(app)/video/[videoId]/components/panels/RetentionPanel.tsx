"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { InsightCard, NextSteps, TwoColumnInsight } from "../ui";
import styles from "./panels.module.css";

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

type RetentionInsights = {
  hookStrength: string;
  hookRetention: number;
  midpointRetention?: number;
  completionRate: number;
  biggestDrop: { ratio: number; timeRatio: number };
  working: string[];
  improve: string[];
};

const RETENTION_BENCHMARKS = {
  shorts: { target: 80, good: 70, label: "Shorts (< 60s)" },
  short: { target: 55, good: 50, label: "4-6 min videos" },
  medium: { target: 47, good: 45, label: "8-12 min videos" },
  long: { target: 42, good: 38, label: "12+ min videos" },
};

function getBenchmarkForDuration(durationSec: number) {
  if (durationSec <= 60) {return RETENTION_BENCHMARKS.shorts;}
  if (durationSec <= 360) {return RETENTION_BENCHMARKS.short;}
  if (durationSec <= 720) {return RETENTION_BENCHMARKS.medium;}
  return RETENTION_BENCHMARKS.long;
}

/**
 * RetentionPanel - Retention analysis with Recharts
 */
export function RetentionPanel({
  points,
  durationSec,
  cliffTimeSec,
  avgViewedPct,
  baseline,
  videoId,
}: RetentionPanelProps) {
  const benchmark = getBenchmarkForDuration(durationSec);

  const chartData = useMemo(
    () => buildChartData(points, durationSec),
    [points, durationSec],
  );

  const insights = useMemo(
    () => computeRetentionInsights(points, cliffTimeSec),
    [points, cliffTimeSec],
  );

  const timestampDiagnosis = useMemo(
    () => computeTimestampDiagnosis(points, durationSec),
    [points, durationSec],
  );

  if (points.length === 0) {
    return <RetentionEmpty />;
  }

  return (
    <div className={styles.panelStack}>
      <RetentionChartCard
        chartData={chartData}
        benchmark={benchmark}
        cliffTimeSec={cliffTimeSec}
        durationSec={durationSec}
        avgViewedPct={avgViewedPct}
        baseline={baseline}
        timestampDiagnosis={timestampDiagnosis}
        insights={insights}
        videoId={videoId}
      />
      <RetentionInsightsCard insights={insights} />
    </div>
  );
}

function RetentionEmpty() {
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

function getRetentionStatus(
  avgViewedPct?: number | null,
  isAboveBaseline?: boolean | null | 0,
): "strong" | "mixed" | "needs-work" | "neutral" {
  if (!avgViewedPct) {return "neutral";}
  if (isAboveBaseline) {return "strong";}
  if (avgViewedPct > 40) {return "mixed";}
  return "needs-work";
}

function getRetentionSubtitle(
  avgViewedPct?: number | null,
  baselineAvg?: number | null,
): string | undefined {
  if (!avgViewedPct) {return undefined;}
  const baselineSuffix = baselineAvg
    ? ` (baseline: ${(baselineAvg * 100).toFixed(0)}%)`
    : "";
  return `${avgViewedPct.toFixed(0)}% average viewed${baselineSuffix}`;
}

type ChartCardProps = {
  chartData: Array<{ time: string; timeRatio: number; retention: number }>;
  benchmark: { target: number; good: number; label: string };
  cliffTimeSec?: number | null;
  durationSec: number;
  avgViewedPct?: number | null;
  baseline?: { avgViewPercentage?: { mean?: number; median?: number } } | null;
  timestampDiagnosis: TimestampDiagnosis[];
  insights: RetentionInsights | null;
  videoId?: string;
};

function RetentionChartCard({
  chartData,
  benchmark,
  cliffTimeSec,
  durationSec,
  avgViewedPct,
  baseline,
  timestampDiagnosis,
  insights,
  videoId,
}: ChartCardProps) {
  const baselineAvg =
    baseline?.avgViewPercentage?.median ?? baseline?.avgViewPercentage?.mean;
  const isAboveBaseline =
    avgViewedPct && baselineAvg && avgViewedPct > baselineAvg * 100;
  const cliffRatio = cliffTimeSec ? cliffTimeSec / durationSec : null;

  return (
    <InsightCard
      title="Audience retention"
      subtitle={getRetentionSubtitle(avgViewedPct, baselineAvg)}
      status={getRetentionStatus(avgViewedPct, isAboveBaseline)}
    >
      <RetentionAreaChart
        chartData={chartData}
        benchmark={benchmark}
        cliffTimeSec={cliffTimeSec}
        cliffRatio={cliffRatio}
      />

      <DiagnosisList items={timestampDiagnosis} videoId={videoId} />

      <div className={styles.benchmarkInfo}>
        <span className={styles.benchmarkLabel}>
          Benchmark for {benchmark.label}:
        </span>
        <span className={styles.benchmarkValue}>
          {benchmark.good}&ndash;{benchmark.target}% average retention
        </span>
      </div>

      <RetentionKeyStats insights={insights} />
    </InsightCard>
  );
}

function RetentionAreaChart({
  chartData,
  benchmark,
  cliffTimeSec,
  cliffRatio,
}: {
  chartData: Array<{ time: string; timeRatio: number; retention: number }>;
  benchmark: { target: number };
  cliffTimeSec?: number | null;
  cliffRatio: number | null;
}) {
  return (
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
              <stop offset="5%" stopColor="var(--color-cool-sky)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-cool-sky)" stopOpacity={0} />
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
                : ["\u2013", "Retention"]
            }
            labelFormatter={(label) => `At ${label}`}
            cursor={{ stroke: "var(--color-border)", strokeDasharray: "4" }}
          />
          <ReferenceLine
            y={benchmark.target}
            stroke="var(--color-stormy-teal)"
            strokeDasharray="4"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={50}
            stroke="var(--color-border)"
            strokeDasharray="2"
          />
          {cliffRatio && (
            <ReferenceLine
              x={formatTime(cliffTimeSec!)}
              stroke="var(--color-hot-rose)"
              strokeDasharray="4"
              label={{
                value: "Drop",
                position: "top",
                fill: "var(--color-hot-rose)",
                fontSize: 10,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="retention"
            stroke="var(--color-cool-sky)"
            strokeWidth={2}
            fill="url(#retentionGradient)"
            isAnimationActive={false}
            activeDot={{
              r: 4,
              fill: "var(--color-cool-sky)",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DiagnosisList({
  items,
  videoId,
}: {
  items: TimestampDiagnosis[];
  videoId?: string;
}) {
  if (items.length === 0) {return null;}
  return (
    <div className={styles.inlineDiagnosis}>
      {items.map((item, idx) => (
        <DiagnosisItem key={idx} item={item} videoId={videoId} />
      ))}
    </div>
  );
}

function DiagnosisItem({
  item,
  videoId,
}: {
  item: TimestampDiagnosis;
  videoId?: string;
}) {
  const href = videoId
    ? `https://youtube.com/watch?v=${videoId}&t=${Math.floor(item.timeSec)}s`
    : "#";
  const isSpike = item.type === "spike";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.inlineDiagnosisItem} ${styles[item.type]}`}
    >
      <span className={styles.inlineDiagnosisTime}>
        {formatTime(item.timeSec)}
      </span>
      <span className={styles.inlineDiagnosisTitle}>{item.title}</span>
      <span
        className={`${styles.inlineDiagnosisChange} ${isSpike ? styles.positive : styles.negative}`}
      >
        {isSpike ? "+" : "-"}
        {item.changePercent}%
      </span>
    </a>
  );
}

function RetentionKeyStats({
  insights,
}: {
  insights: RetentionInsights | null;
}) {
  if (!insights) {return null;}
  return (
    <div className={styles.retentionStats}>
      <div className={styles.retentionStat}>
        <span className={styles.statValue}>
          {Math.round(insights.hookRetention * 100)}%
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
          {Math.round(insights.completionRate * 100)}%
        </span>
        <span className={styles.statLabel}>Watched to end</span>
      </div>
    </div>
  );
}

function RetentionInsightsCard({
  insights,
}: {
  insights: RetentionInsights | null;
}) {
  if (!insights) {return null;}
  if (insights.working.length === 0 && insights.improve.length === 0) {
    return null;
  }

  return (
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
  );
}

// --- Pure helpers ---

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function buildChartData(points: RetentionPoint[], durationSec: number) {
  if (points.length === 0) {return [];}
  return points.map((p) => ({
    time: formatTime(p.elapsedRatio * durationSec),
    timeRatio: p.elapsedRatio,
    retention: Math.round(p.audienceWatchRatio * 100),
  }));
}

function findSteepestDrop(points: RetentionPoint[]) {
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
  return { ratio: maxDrop, timeRatio: dropStart };
}

function buildRetentionBullets(
  hookRetention: number,
  midpoint: RetentionPoint | undefined,
  completionRate: number,
  cliffTimeSec?: number | null,
) {
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

  if (completionRate > 0.3) {
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

  return { working, improve };
}

function computeRetentionInsights(
  points: RetentionPoint[],
  cliffTimeSec?: number | null,
): RetentionInsights | null {
  if (points.length < 2) {return null;}

  const first30 = points.find((p) => p.elapsedRatio >= 0.05);
  const midpoint = points.find((p) => p.elapsedRatio >= 0.5);
  const last = points.at(-1);
  if (!last) {return null;}

  const hookRetention = first30?.audienceWatchRatio ?? 1;
  const hookStrength =
    hookRetention > 0.7
      ? "strong"
      : (hookRetention > 0.5 ? "moderate" : "weak");

  const { working, improve } = buildRetentionBullets(
    hookRetention,
    midpoint,
    last.audienceWatchRatio,
    cliffTimeSec,
  );

  return {
    hookStrength,
    hookRetention,
    midpointRetention: midpoint?.audienceWatchRatio,
    completionRate: last.audienceWatchRatio,
    biggestDrop: findSteepestDrop(points),
    working,
    improve,
  };
}

function computeTimestampDiagnosis(
  points: RetentionPoint[],
  durationSec: number,
): TimestampDiagnosis[] {
  if (points.length < 5) {return [];}

  const SIGNIFICANT_DROP_THRESHOLD = 0.08;
  const SIGNIFICANT_SPIKE_THRESHOLD = 0.05;
  const diagnosis: TimestampDiagnosis[] = [];

  for (let i = 2; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const change = prev.audienceWatchRatio - curr.audienceWatchRatio;
    const timeSec = Math.round(curr.elapsedRatio * durationSec);
    const changePercent = Math.round(change * 100);

    if (change > SIGNIFICANT_DROP_THRESHOLD) {
      const item = diagnoseDropAt(
        timeSec,
        durationSec,
        curr.elapsedRatio,
        changePercent,
      );
      if (item) {diagnosis.push(item);}
    }

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

  return diagnosis
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 3);
}

function diagnoseDropAt(
  timeSec: number,
  _durationSec: number,
  elapsedRatio: number,
  changePercent: number,
): TimestampDiagnosis | null {
  if (elapsedRatio < 0.1) {
    return diagnoseEarlyDrop(timeSec, changePercent);
  }
  if (elapsedRatio < 0.7) {
    return diagnoseMidDrop(timeSec, elapsedRatio, changePercent);
  }
  if (elapsedRatio >= 0.7) {
    return diagnoseLateDrop(timeSec, elapsedRatio, changePercent);
  }
  return null;
}

function diagnoseEarlyDrop(
  timeSec: number,
  changePercent: number,
): TimestampDiagnosis {
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

function diagnoseMidDrop(
  timeSec: number,
  elapsedRatio: number,
  changePercent: number,
): TimestampDiagnosis {
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

function diagnoseLateDrop(
  timeSec: number,
  elapsedRatio: number,
  changePercent: number,
): TimestampDiagnosis {
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
