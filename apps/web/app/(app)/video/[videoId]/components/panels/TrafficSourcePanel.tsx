"use client";

import styles from "./panels.module.css";
import { InsightCard } from "../ui";
import { formatCompactRounded as formatCompact } from "@/lib/shared/format";

type TrafficSourceBreakdown = {
  browse: number | null;
  suggested: number | null;
  search: number | null;
  external: number | null;
  notifications: number | null;
  other: number | null;
  total: number | null;
};

type TrafficSourcePanelProps = {
  trafficSources: TrafficSourceBreakdown | null;
  totalViews: number;
};

type SourceInfo = {
  key: keyof TrafficSourceBreakdown;
  label: string;
  description: string;
  benchmark: string;
};

const SOURCES: SourceInfo[] = [
  {
    key: "browse",
    label: "Browse Features",
    description:
      "YouTube recommending on homepage - strong CTR + retention unlocks this",
    benchmark:
      "Target: 5%+ CTR (most actionable - weak here = packaging problem)",
  },
  {
    key: "suggested",
    label: "Suggested Videos",
    description:
      "Your content paired with related videos - topic adjacency matters",
    benchmark: "Often lower CTR (~0.5%+ can be fine)",
  },
  {
    key: "search",
    label: "YouTube Search",
    description:
      "SEO is working, relies on titles/descriptions matching intent",
    benchmark: "Improve retention to unlock recommendations",
  },
  {
    key: "external",
    label: "External",
    description: "Traffic from social/email - watch for pacing mismatch issues",
    benchmark: "Visitors may have different expectations",
  },
];

/**
 * TrafficSourcePanel - Shows where views come from
 */
export function TrafficSourcePanel({
  trafficSources,
  totalViews,
}: TrafficSourcePanelProps) {
  if (!trafficSources || !trafficSources.total) {
    return (
      <InsightCard title="Traffic sources">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No traffic data available</p>
          <p className={styles.emptyDesc}>
            Traffic source breakdown will appear once your video has more views.
          </p>
        </div>
      </InsightCard>
    );
  }

  const total = trafficSources.total || totalViews || 1;

  // Calculate percentages
  const sourceData = SOURCES.map((source) => {
    const views = trafficSources[source.key] ?? 0;
    const percentage = total > 0 ? (views / total) * 100 : 0;
    return { ...source, views, percentage };
  }).filter((s) => s.views > 0);

  // Add other/notifications if significant
  const otherViews =
    (trafficSources.other ?? 0) + (trafficSources.notifications ?? 0);
  if (otherViews > 0) {
    sourceData.push({
      key: "other" as keyof TrafficSourceBreakdown,
      label: "Other",
      description: "Notifications, playlists, etc.",
      benchmark: "",
      views: otherViews,
      percentage: (otherViews / total) * 100,
    });
  }

  // Sort by percentage descending
  sourceData.sort((a, b) => b.percentage - a.percentage);

  // Determine diagnosis
  const diagnosis = getDiagnosis(trafficSources, total);

  // Calculate browse + suggested percentage
  const browseAndSuggested =
    (((trafficSources.browse ?? 0) + (trafficSources.suggested ?? 0)) / total) *
    100;

  return (
    <InsightCard
      title="Traffic sources"
      subtitle={`${formatCompact(total)} views from ${sourceData.length} sources`}
    >
      {/* Source Bars */}
      <div className={styles.trafficSourceList}>
        {sourceData.map((source) => (
          <div key={source.key} className={styles.trafficSourceRow}>
            <div className={styles.trafficSourceHeader}>
              <span className={styles.trafficSourceLabel}>{source.label}</span>
              <span className={styles.trafficSourceStats}>
                {formatCompact(source.views)} ({source.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className={styles.trafficSourceBar}>
              <div
                className={styles.trafficSourceFill}
                style={{
                  width: `${Math.min(100, source.percentage)}%`,
                  background: getSourceColor(source.key),
                }}
              />
            </div>
            <span className={styles.trafficSourceDesc}>
              {source.description}
            </span>
            {source.benchmark && (
              <span className={styles.trafficSourceBenchmark}>
                {source.benchmark}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Target Distribution */}
      <div className={styles.trafficTarget}>
        <span className={styles.trafficTargetLabel}>Target mix:</span>
        <span className={styles.trafficTargetValue}>
          Browse + Suggested should be ~60%+ of traffic
        </span>
        <span
          className={`${styles.trafficTargetStatus} ${browseAndSuggested >= 60 ? styles.good : browseAndSuggested >= 40 ? styles.fair : styles.low}`}
        >
          Currently: {browseAndSuggested.toFixed(0)}%
        </span>
      </div>

      {/* Diagnosis */}
      {diagnosis && (
        <div
          className={`${styles.trafficDiagnosis} ${styles[diagnosis.status]}`}
        >
          <span className={styles.diagnosisTitle}>{diagnosis.title}</span>
          <p className={styles.diagnosisText}>{diagnosis.message}</p>
        </div>
      )}
    </InsightCard>
  );
}

function getSourceColor(key: string): string {
  const colors: Record<string, string> = {
    browse: "#3b82f6",
    suggested: "#8b5cf6",
    search: "#f59e0b",
    external: "#10b981",
    other: "#6b7280",
  };
  return colors[key] || "#6b7280";
}

function getDiagnosis(
  sources: TrafficSourceBreakdown,
  total: number,
): {
  title: string;
  message: string;
  status: "success" | "warning" | "info";
} | null {
  if (total < 100) return null;

  const browsePercent = ((sources.browse ?? 0) / total) * 100;
  const suggestedPercent = ((sources.suggested ?? 0) / total) * 100;
  const searchPercent = ((sources.search ?? 0) / total) * 100;
  const externalPercent = ((sources.external ?? 0) / total) * 100;

  // Strong algorithmic distribution
  if (browsePercent + suggestedPercent > 60) {
    return {
      title: "Strong algorithmic reach",
      message:
        "YouTube is actively recommending this video. Your packaging and retention are working well.",
      status: "success",
    };
  }

  // Heavy search dependency
  if (searchPercent > 40) {
    return {
      title: "Search-driven video",
      message:
        "Most views come from search. This video has good SEO but limited algorithmic reach. Improve first 30 seconds to unlock recommendations.",
      status: "info",
    };
  }

  // Heavy external dependency
  if (externalPercent > 40) {
    return {
      title: "External traffic dependent",
      message:
        "Views rely on external promotion. To grow organically, improve packaging for browse/suggested distribution.",
      status: "warning",
    };
  }

  // Low browse traffic
  if (browsePercent < 10 && suggestedPercent < 20) {
    return {
      title: "Limited discovery",
      message:
        "YouTube isn't showing this video widely. Focus on improving thumbnails and titles to boost CTR.",
      status: "warning",
    };
  }

  return null;
}