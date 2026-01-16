"use client";

import styles from "./panels.module.css";
import { InsightCard, TwoColumnInsight, NextSteps } from "../ui";
import { MetricsPanel } from "../MetricsPanel";
import type { BottleneckResult } from "@/types/api";

type Win = {
  label: string;
  metric: string;
  why: string;
};

type Improvement = {
  label: string;
  metric: string;
  fix: string;
};

type TopAction = {
  what: string;
  why: string;
  effort: "low" | "medium" | "high";
};

type Summary = {
  headline?: string;
  wins?: Win[];
  improvements?: Improvement[];
  topAction?: TopAction;
};

type OverviewPanelProps = {
  summary: Summary | null;
  summaryLoading?: boolean;
  bottleneck?: BottleneckResult | null;
  metrics: Array<{ label: string; value: string | number; detail?: string }>;
  isLowDataMode?: boolean;
};

/**
 * OverviewPanel - Main analysis summary tab
 * Clean two-column layout with summary, wins/improvements, next steps
 */
export function OverviewPanel({
  summary,
  summaryLoading,
  bottleneck,
  metrics,
  isLowDataMode,
}: OverviewPanelProps) {
  const wins = summary?.wins ?? [];
  const improvements = summary?.improvements ?? [];
  const topAction = summary?.topAction;

  // Convert wins/improvements to bullet format
  const workingBullets = wins.map((w) => ({
    text: w.label,
    detail: w.metric,
  }));

  const improveBullets = improvements.map((imp) => ({
    text: imp.label,
    detail: imp.fix,
  }));

  // Determine status based on bottleneck
  const getStatus = (): "strong" | "mixed" | "needs-work" | "neutral" => {
    if (!bottleneck) return "neutral";
    // Not enough data means neutral
    if (bottleneck.bottleneck === "NOT_ENOUGH_DATA") return "neutral";
    // Major issues with discovery or retention
    if (bottleneck.bottleneck === "DISCOVERY_IMPRESSIONS" || bottleneck.bottleneck === "RETENTION") return "needs-work";
    return "mixed";
  };

  if (isLowDataMode) {
    return (
      <div className={styles.panelStack}>
        <InsightCard title="Limited data available">
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Not enough data yet</p>
            <p className={styles.emptyDesc}>
              This video needs more views before we can provide detailed analysis.
              Check back once you have at least 100 views.
            </p>
          </div>
        </InsightCard>
        <MetricsPanel metrics={metrics} />
      </div>
    );
  }

  return (
    <div className={styles.panelStack}>
      {/* Loading state */}
      {summaryLoading && (
        <InsightCard title="Analyzing video...">
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <p>Generating insights</p>
          </div>
        </InsightCard>
      )}

      {/* Summary Card */}
      {summary && !summaryLoading && (
        <InsightCard
          title="Performance summary"
          subtitle={summary.headline}
          status={getStatus()}
        >
          <TwoColumnInsight
            working={workingBullets}
            improve={improveBullets}
          />
          {topAction && (
            <NextSteps
              title="Priority action"
              description={topAction.why}
              actions={[
                {
                  label: topAction.what.length > 50 
                    ? topAction.what.substring(0, 50) + "..." 
                    : topAction.what,
                  variant: "primary",
                },
              ]}
            />
          )}
        </InsightCard>
      )}

      {/* Bottleneck diagnosis */}
      {bottleneck && bottleneck.bottleneck !== "NOT_ENOUGH_DATA" && !summaryLoading && (
        <InsightCard
          title="Primary bottleneck"
          subtitle={getBottleneckDescription(bottleneck)}
          status={bottleneck.bottleneck === "RETENTION" || bottleneck.bottleneck === "DISCOVERY_IMPRESSIONS" ? "needs-work" : "mixed"}
        >
          <div className={styles.bottleneckContent}>
            <p className={styles.bottleneckMessage}>{bottleneck.evidence}</p>
            {bottleneck.metrics && bottleneck.metrics.length > 0 && (
              <div className={styles.bottleneckMetrics}>
                {bottleneck.metrics.map((m, i) => (
                  <div key={i} className={styles.bottleneckMetric}>
                    <span className={styles.metricLabel}>{m.label}</span>
                    <span className={styles.metricValue}>{m.value}</span>
                    {m.comparison && <span className={styles.metricComparison}>{m.comparison}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </InsightCard>
      )}

      {/* Metrics Panel */}
      <MetricsPanel metrics={metrics} title="Key metrics" />
    </div>
  );
}

function getBottleneckDescription(bottleneck: BottleneckResult): string {
  const typeLabels: Record<string, string> = {
    RETENTION: "Viewers are leaving too early",
    DISCOVERY_CTR: "Low click-through rate on impressions",
    DISCOVERY_IMPRESSIONS: "Not getting enough impressions",
    CONVERSION: "Low engagement relative to views",
    NONE: "No significant issues detected",
  };
  return typeLabels[bottleneck.bottleneck] ?? "Performance issue detected";
}

export default OverviewPanel;
