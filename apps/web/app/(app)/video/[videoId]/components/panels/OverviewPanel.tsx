"use client";

import type { InsightItem } from "@/lib/features/video-insights/types";
import type { BottleneckResult } from "@/types/api";

import { InsightCard } from "../ui";
import { DiscoveryChart } from "./DiscoveryChart";
import styles from "./panels.module.css";

type DailySeries = { date: string; views: number; [key: string]: unknown };

type DiscoveryStats = {
  impressions?: number | null;
  ctr?: number | null;
  dailySeries: DailySeries[];
};

type OverviewPanelProps = {
  summary: InsightItem[] | null;
  summaryLoading?: boolean;
  bottleneck?: BottleneckResult | null;
  metrics: Array<{ label: string; value: string | number; detail?: string }>;
  discoveryStats?: DiscoveryStats;
  publishedAt?: string | null;
};

/**
 * OverviewPanel - Main analysis summary tab
 */
export function OverviewPanel({
  summary,
  summaryLoading,
  bottleneck,
  metrics,
  discoveryStats,
  publishedAt,
}: OverviewPanelProps) {
  return (
    <div className={styles.panelStack}>
      {summaryLoading && <LoadingCard />}
      <SummaryInsights
        items={summary}
        summaryLoading={summaryLoading}
      />
      <BottleneckCard
        bottleneck={bottleneck}
        summaryLoading={summaryLoading}
      />
      {(discoveryStats || metrics.length > 0) && (
        <DiscoveryChart
          dailySeries={discoveryStats?.dailySeries ?? []}
          impressions={discoveryStats?.impressions}
          ctr={discoveryStats?.ctr}
          metrics={metrics}
          publishedAt={publishedAt}
        />
      )}
    </div>
  );
}

function LoadingCard() {
  return (
    <InsightCard title="Analyzing video...">
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p>Generating insights</p>
      </div>
    </InsightCard>
  );
}

function SummaryInsights({
  items,
  summaryLoading,
}: {
  items: InsightItem[] | null;
  summaryLoading?: boolean;
}) {
  if (!items || items.length === 0 || summaryLoading) {return null;}

  return (
    <InsightCard title="Performance summary">
      <div className={styles.insightItems}>
        {items.map((item, idx) => (
          <div key={idx} className={styles.insightItem}>
            <h4 className={styles.insightItemTitle}>{item.title}</h4>
            <p className={styles.insightItemExplanation}>{item.explanation}</p>
            <p className={styles.insightItemFix}>{item.fix}</p>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

function BottleneckCard({
  bottleneck,
  summaryLoading,
}: {
  bottleneck?: BottleneckResult | null;
  summaryLoading?: boolean;
}) {
  if (!bottleneck || bottleneck.bottleneck === "NOT_ENOUGH_DATA" || summaryLoading) {
    return null;
  }

  const description = getBottleneckDescription(bottleneck);
  const status =
    bottleneck.bottleneck === "RETENTION" ||
    bottleneck.bottleneck === "DISCOVERY_IMPRESSIONS"
      ? ("needs-work" as const)
      : ("mixed" as const);

  return (
    <InsightCard title="Primary bottleneck" subtitle={description} status={status}>
      <div className={styles.bottleneckContent}>
        <p className={styles.bottleneckMessage}>{bottleneck.evidence}</p>
        <BottleneckMetrics metrics={bottleneck.metrics} />
      </div>
    </InsightCard>
  );
}

function BottleneckMetrics({
  metrics,
}: {
  metrics?: Array<{ label: string; value: string; comparison?: string }>;
}) {
  if (!metrics || metrics.length === 0) {return null;}
  return (
    <div className={styles.bottleneckMetrics}>
      {metrics.map((m, i) => (
        <div key={i} className={styles.bottleneckMetric}>
          <span className={styles.metricLabel}>{m.label}</span>
          <span className={styles.metricValue}>{m.value}</span>
          {m.comparison && (
            <span className={styles.metricComparison}>{m.comparison}</span>
          )}
        </div>
      ))}
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
