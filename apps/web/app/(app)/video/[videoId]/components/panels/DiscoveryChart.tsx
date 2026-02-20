"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import styles from "./panels.module.css";
import { InsightCard } from "../ui";
import { formatCompactRounded as formatCompact } from "@/lib/format";

type DailySeries = {
  date: string;
  views: number;
  estimatedMinutesWatched?: number | null;
  subscribersGained?: number | null;
  subscribersLost?: number | null;
  [key: string]: unknown;
};

type Metric = {
  label: string;
  value: string | number;
  detail?: string;
};

type DiscoveryChartProps = {
  dailySeries: DailySeries[];
  impressions?: number | null;
  ctr?: number | null;
  metrics?: Metric[];
  publishedAt?: string | null;
};

/**
 * DiscoveryChart - Shows views trend over time with discovery metrics
 * Uses Recharts for consistency with dashboard
 */
export function DiscoveryChart({
  dailySeries,
  impressions,
  ctr,
  metrics = [],
  publishedAt,
}: DiscoveryChartProps) {
  // Sort and prepare data, filtering to only show data from publish date
  const chartData = useMemo(() => {
    if (!dailySeries || dailySeries.length === 0) return null;

    // Filter to only include dates on or after publish date
    let filtered = dailySeries;
    if (publishedAt) {
      const publishDate = new Date(publishedAt);
      publishDate.setHours(0, 0, 0, 0); // Start of publish day
      filtered = dailySeries.filter((d) => {
        const dataDate = new Date(d.date);
        return dataDate >= publishDate;
      });
    }

    if (filtered.length === 0) return null;

    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    return sorted.map((d, i) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      // Only show label for first, middle, and last points
      showLabel:
        i === 0 ||
        i === sorted.length - 1 ||
        i === Math.floor(sorted.length / 2),
    }));
  }, [dailySeries, publishedAt]);

  // Check if we have any data to show
  const hasAnyData =
    (chartData && chartData.length >= 2) ||
    impressions != null ||
    ctr != null ||
    metrics.length > 0;

  if (!hasAnyData) {
    return null;
  }

  const hasChartData = chartData && chartData.length >= 2;

  // Calculate tick interval to show only ~3-5 labels
  const tickInterval = hasChartData
    ? Math.max(1, Math.floor(chartData!.length / 4))
    : 1;

  return (
    <InsightCard title="Discovery performance">
      {/* Stats row - Impressions, CTR, and additional metrics */}
      <div className={styles.discoveryStats}>
        {impressions != null && (
          <div className={styles.discoveryStat}>
            <span className={styles.discoveryStatValue}>
              {formatCompact(impressions)}
            </span>
            <span className={styles.discoveryStatLabel}>Impressions</span>
          </div>
        )}
        {ctr != null && (
          <div className={styles.discoveryStat}>
            <span className={styles.discoveryStatValue}>{ctr.toFixed(1)}%</span>
            <span className={styles.discoveryStatLabel}>CTR</span>
          </div>
        )}
        {/* Additional metrics */}
        {metrics.map((m, i) => (
          <div key={i} className={styles.discoveryStat}>
            <span className={styles.discoveryStatValue}>
              {typeof m.value === "number" && m.value === 0 ? "–" : m.value}
            </span>
            <span className={styles.discoveryStatLabel}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Daily Views trend chart */}
      {hasChartData && (
        <div className={styles.chartSection}>
          <h4 className={styles.chartLabel}>Daily Views</h4>
          <div className={styles.discoveryChart} style={{ userSelect: "none" }}>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="viewsGradient"
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
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  interval={tickInterval}
                />
                <YAxis hide domain={[0, "auto"]} />
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
                      ? [value.toLocaleString(), "Views"]
                      : ["–", "Views"]
                  }
                  labelFormatter={(label) => String(label)}
                  cursor={{
                    stroke: "var(--color-border)",
                    strokeDasharray: "4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
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
        </div>
      )}
    </InsightCard>
  );
}