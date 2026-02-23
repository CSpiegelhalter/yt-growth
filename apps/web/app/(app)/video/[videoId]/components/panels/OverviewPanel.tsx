"use client";

import type { BottleneckResult } from "@/types/api";

import { InsightCard, NextSteps, TwoColumnInsight } from "../ui";
import { DiscoveryChart } from "./DiscoveryChart";
import styles from "./panels.module.css";

type Win = { label: string; metric: string; why: string };
type Improvement = { label: string; metric: string; fix: string };
type TopAction = { what: string; why: string; effort: "low" | "medium" | "high" };

type ViewerJourney = {
  discovery_phase: string;
  consumption_phase: string;
  conversion_phase: string;
};

type StrategicPivot = {
  what: string;
  why: string;
  impact_forecast: string;
};

type Summary = {
  headline?: string;
  wins?: Win[];
  improvements?: Improvement[];
  topAction?: TopAction;
  insight_headline?: string;
  the_viewer_journey?: ViewerJourney;
  dimensional_nuance?: string;
  strategic_pivot?: StrategicPivot;
};

type DailySeries = { date: string; views: number; [key: string]: unknown };

type DiscoveryStats = {
  impressions?: number | null;
  ctr?: number | null;
  dailySeries: DailySeries[];
};

type OverviewPanelProps = {
  summary: Summary | null;
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
  const status = getBottleneckStatus(bottleneck);

  return (
    <div className={styles.panelStack}>
      {summaryLoading && <LoadingCard />}
      <SummaryCard
        summary={summary}
        summaryLoading={summaryLoading}
        status={status}
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

function getBottleneckStatus(
  bottleneck?: BottleneckResult | null,
): "strong" | "mixed" | "needs-work" | "neutral" {
  if (!bottleneck) {return "neutral";}
  if (bottleneck.bottleneck === "NOT_ENOUGH_DATA") {return "neutral";}
  if (
    bottleneck.bottleneck === "DISCOVERY_IMPRESSIONS" ||
    bottleneck.bottleneck === "RETENTION"
  ) {
    return "needs-work";
  }
  return "mixed";
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

function SummaryCard({
  summary,
  summaryLoading,
  status,
}: {
  summary: Summary | null;
  summaryLoading?: boolean;
  status: "strong" | "mixed" | "needs-work" | "neutral";
}) {
  if (!summary || summaryLoading) {return null;}

  const hasNewFormat = !!(
    summary.insight_headline &&
    summary.the_viewer_journey &&
    summary.strategic_pivot
  );

  if (hasNewFormat) {
    return <ViewerJourneyCard summary={summary} status={status} />;
  }
  return <LegacySummaryCard summary={summary} status={status} />;
}

function ViewerJourneyCard({
  summary,
  status,
}: {
  summary: Summary;
  status: "strong" | "mixed" | "needs-work" | "neutral";
}) {
  const journey = summary.the_viewer_journey!;

  return (
    <InsightCard
      title="Performance summary"
      subtitle={summary.insight_headline}
      status={status}
    >
      <div className={styles.viewerJourneyContainer}>
        <div className={styles.journeySection}>
          <h4 className={styles.journeySectionTitle}>The viewer journey</h4>
          <div className={styles.journeySteps}>
            <JourneyStep number={1} title="Discovery" text={journey.discovery_phase} />
            <JourneyStep number={2} title="Consumption" text={journey.consumption_phase} />
            <JourneyStep number={3} title="Conversion" text={journey.conversion_phase} />
          </div>
        </div>

        {summary.dimensional_nuance && (
          <div className={styles.nuanceSection}>
            <div className={styles.nuanceLabel}>Key context</div>
            <p className={styles.nuanceText}>{summary.dimensional_nuance}</p>
          </div>
        )}

        {summary.strategic_pivot && (
          <StrategicPivotSection pivot={summary.strategic_pivot} />
        )}
      </div>
    </InsightCard>
  );
}

function JourneyStep({
  number,
  title,
  text,
}: {
  number: number;
  title: string;
  text: string;
}) {
  return (
    <div className={styles.journeyStep}>
      <div className={styles.journeyStepHeader}>
        <div className={styles.journeyStepNumber}>{number}</div>
        <h5 className={styles.journeyStepTitle}>{title}</h5>
      </div>
      <p className={styles.journeyStepText}>{text}</p>
    </div>
  );
}

function StrategicPivotSection({ pivot }: { pivot: StrategicPivot }) {
  return (
    <div className={styles.pivotSection}>
      <h4 className={styles.pivotTitle}>Recommended action</h4>
      <div className={styles.pivotContent}>
        <div className={styles.pivotRow}>
          <div className={styles.pivotLabel}>What to do</div>
          <p className={styles.pivotText}>{pivot.what}</p>
        </div>
        <div className={styles.pivotRow}>
          <div className={styles.pivotLabel}>Why it matters</div>
          <p className={styles.pivotText}>{pivot.why}</p>
        </div>
        <div className={styles.pivotRow}>
          <div className={styles.pivotLabel}>Expected impact</div>
          <p className={styles.pivotText}>{pivot.impact_forecast}</p>
        </div>
      </div>
    </div>
  );
}

function LegacySummaryCard({
  summary,
  status,
}: {
  summary: Summary;
  status: "strong" | "mixed" | "needs-work" | "neutral";
}) {
  const workingBullets = (summary.wins ?? []).map((w) => ({
    text: w.label,
    detail: w.metric,
  }));

  const improveBullets = (summary.improvements ?? []).map((imp) => ({
    text: imp.label,
    detail: imp.fix,
  }));

  return (
    <InsightCard
      title="Performance summary"
      subtitle={summary.headline}
      status={status}
    >
      <TwoColumnInsight working={workingBullets} improve={improveBullets} />
      <LegacyTopAction action={summary.topAction} />
    </InsightCard>
  );
}

function LegacyTopAction({ action }: { action?: TopAction }) {
  if (!action) {return null;}
  const label =
    action.what.length > 50 ? `${action.what.slice(0, 50)}...` : action.what;
  return (
    <NextSteps
      title="Priority action"
      description={action.why}
      actions={[{ label, variant: "primary" }]}
    />
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
