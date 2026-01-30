"use client";

import styles from "./panels.module.css";
import { InsightCard, TwoColumnInsight, NextSteps } from "../ui";
import { DiscoveryChart } from "./DiscoveryChart";
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

// Viewer Journey types (new format)
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
  // New format fields
  insight_headline?: string;
  the_viewer_journey?: ViewerJourney;
  dimensional_nuance?: string;
  strategic_pivot?: StrategicPivot;
};

type DailySeries = {
  date: string;
  views: number;
  [key: string]: unknown;
};

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
 * Clean two-column layout with summary, wins/improvements, next steps
 */
export function OverviewPanel({
  summary,
  summaryLoading,
  bottleneck,
  metrics,
  discoveryStats,
  publishedAt,
}: OverviewPanelProps) {
  const wins = summary?.wins ?? [];
  const improvements = summary?.improvements ?? [];
  const topAction = summary?.topAction;

  // Check if we have the new format
  const hasNewFormat =
    summary?.insight_headline &&
    summary?.the_viewer_journey &&
    summary?.strategic_pivot;

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
    if (
      bottleneck.bottleneck === "DISCOVERY_IMPRESSIONS" ||
      bottleneck.bottleneck === "RETENTION"
    )
      return "needs-work";
    return "mixed";
  };

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

      {/* New Format Summary Card */}
      {hasNewFormat && !summaryLoading && (
        <InsightCard
          title="Performance summary"
          subtitle={summary.insight_headline}
          status={getStatus()}
        >
          <div className={styles.viewerJourneyContainer}>
            {/* Viewer Journey Section */}
            <div className={styles.journeySection}>
              <h4 className={styles.journeySectionTitle}>The viewer journey</h4>
              <div className={styles.journeySteps}>
                <div className={styles.journeyStep}>
                  <div className={styles.journeyStepHeader}>
                    <div className={styles.journeyStepNumber}>1</div>
                    <h5 className={styles.journeyStepTitle}>Discovery</h5>
                  </div>
                  <p className={styles.journeyStepText}>
                    {summary.the_viewer_journey!.discovery_phase}
                  </p>
                </div>

                <div className={styles.journeyStep}>
                  <div className={styles.journeyStepHeader}>
                    <div className={styles.journeyStepNumber}>2</div>
                    <h5 className={styles.journeyStepTitle}>Consumption</h5>
                  </div>
                  <p className={styles.journeyStepText}>
                    {summary.the_viewer_journey!.consumption_phase}
                  </p>
                </div>

                <div className={styles.journeyStep}>
                  <div className={styles.journeyStepHeader}>
                    <div className={styles.journeyStepNumber}>3</div>
                    <h5 className={styles.journeyStepTitle}>Conversion</h5>
                  </div>
                  <p className={styles.journeyStepText}>
                    {summary.the_viewer_journey!.conversion_phase}
                  </p>
                </div>
              </div>
            </div>

            {/* Dimensional Nuance */}
            {summary.dimensional_nuance && (
              <div className={styles.nuanceSection}>
                <div className={styles.nuanceLabel}>Key context</div>
                <p className={styles.nuanceText}>
                  {summary.dimensional_nuance}
                </p>
              </div>
            )}

            {/* Strategic Pivot */}
            {summary.strategic_pivot && (
              <div className={styles.pivotSection}>
                <h4 className={styles.pivotTitle}>Recommended action</h4>
                <div className={styles.pivotContent}>
                  <div className={styles.pivotRow}>
                    <div className={styles.pivotLabel}>What to do</div>
                    <p className={styles.pivotText}>
                      {summary.strategic_pivot.what}
                    </p>
                  </div>
                  <div className={styles.pivotRow}>
                    <div className={styles.pivotLabel}>Why it matters</div>
                    <p className={styles.pivotText}>
                      {summary.strategic_pivot.why}
                    </p>
                  </div>
                  <div className={styles.pivotRow}>
                    <div className={styles.pivotLabel}>Expected impact</div>
                    <p className={styles.pivotText}>
                      {summary.strategic_pivot.impact_forecast}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </InsightCard>
      )}

      {/* Old Format Summary Card */}
      {!hasNewFormat && summary && !summaryLoading && (
        <InsightCard
          title="Performance summary"
          subtitle={summary.headline}
          status={getStatus()}
        >
          <TwoColumnInsight working={workingBullets} improve={improveBullets} />
          {topAction && (
            <NextSteps
              title="Priority action"
              description={topAction.why}
              actions={[
                {
                  label:
                    topAction.what.length > 50
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
      {bottleneck &&
        bottleneck.bottleneck !== "NOT_ENOUGH_DATA" &&
        !summaryLoading && (
          <InsightCard
            title="Primary bottleneck"
            subtitle={getBottleneckDescription(bottleneck)}
            status={
              bottleneck.bottleneck === "RETENTION" ||
              bottleneck.bottleneck === "DISCOVERY_IMPRESSIONS"
                ? "needs-work"
                : "mixed"
            }
          >
            <div className={styles.bottleneckContent}>
              <p className={styles.bottleneckMessage}>{bottleneck.evidence}</p>
              {bottleneck.metrics && bottleneck.metrics.length > 0 && (
                <div className={styles.bottleneckMetrics}>
                  {bottleneck.metrics.map((m, i) => (
                    <div key={i} className={styles.bottleneckMetric}>
                      <span className={styles.metricLabel}>{m.label}</span>
                      <span className={styles.metricValue}>{m.value}</span>
                      {m.comparison && (
                        <span className={styles.metricComparison}>
                          {m.comparison}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </InsightCard>
        )}

      {/* Discovery Chart - Views trend with all metrics */}
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
