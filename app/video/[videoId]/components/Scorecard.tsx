"use client";

import s from "../style.module.css";
import { formatCompactRounded as formatCompact } from "@/lib/format";
import type {
  DerivedMetrics,
  BaselineComparison,
  SectionConfidence,
  ConfidenceLevel,
  TrafficSourceBreakdown,
} from "@/types/api";

type ScorecardProps = {
  derived: DerivedMetrics;
  comparison: BaselineComparison;
  confidence?: SectionConfidence;
  analyticsAvailability?: {
    hasImpressions: boolean;
    hasCtr: boolean;
    hasTrafficSources: boolean;
    hasEndScreenCtr: boolean;
    hasCardCtr: boolean;
    reason?: string;
  };
};

/**
 * Scorecard - Premium header with grouped metric tiles
 * Shows Discovery, Retention, and Conversion metrics with baseline comparisons
 * Shows "—" for metrics that require views when views = 0
 */
export function Scorecard({
  derived,
  comparison,
  confidence,
  analyticsAvailability,
}: ScorecardProps) {
  const hasViews = derived.totalViews > 0;

  return (
    <section className={s.scorecard}>
      {/* Discovery Section */}
      <div className={s.scorecardGroup}>
        <div className={s.scorecardHeader}>
          <span className={s.scorecardGroupTitle}>Discovery</span>
          <ConfidenceBadge level={confidence?.discovery ?? "Low"} />
        </div>
        
        {analyticsAvailability?.hasImpressions ? (
          <div className={s.scorecardTiles}>
            <MetricTile
              label="Impressions"
              value={derived.impressions != null ? formatCompact(derived.impressions) : "—"}
              subtext={derived.impressionsCtr != null ? `${derived.impressionsCtr.toFixed(1)}% CTR` : undefined}
            />
            <TrafficSourcesTile sources={derived.trafficSources} />
          </div>
        ) : (
          <div className={s.connectAnalyticsPrompt}>
            <span className={s.connectIcon}>🔗</span>
            <div className={s.connectText}>
              <span>Connect analytics to unlock impressions, CTR & traffic sources</span>
              <span className={s.connectSubtext}>
                We can still generate packaging and promotion assets from your title/description.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Retention Section */}
      <div className={s.scorecardGroup}>
        <div className={s.scorecardHeader}>
          <span className={s.scorecardGroupTitle}>Retention</span>
          <ConfidenceBadge level={confidence?.retention ?? "Low"} />
        </div>
        <div className={s.scorecardTiles}>
          <MetricTile
            label="Avg View Duration"
            value={hasViews && derived.avgViewDuration != null ? formatDuration(derived.avgViewDuration) : "—"}
            delta={hasViews ? comparison.watchTimePerViewSec.delta : null}
            vsBaseline={hasViews ? comparison.watchTimePerViewSec.vsBaseline : "unknown"}
            tooltip={!hasViews ? "No views yet" : undefined}
          />
          <MetricTile
            label="Avg % Watched"
            value={hasViews 
              ? (derived.avgViewPercentage != null 
                  ? `${derived.avgViewPercentage.toFixed(0)}%` 
                  : (derived.avdRatio != null ? `${(derived.avdRatio * 100).toFixed(0)}%` : "—"))
              : "—"}
            delta={hasViews ? comparison.avgViewPercentage.delta : null}
            vsBaseline={hasViews ? comparison.avgViewPercentage.vsBaseline : "unknown"}
            tooltip={!hasViews ? "No views yet" : undefined}
          />
          <MetricTile
            label="Total Watch Time"
            value={hasViews && derived.avgWatchTimeMin != null 
              ? formatWatchTime(derived.avgWatchTimeMin * derived.totalViews) 
              : "—"}
            tooltip={!hasViews ? "No views yet" : undefined}
          />
        </div>
      </div>

      {/* Conversion Section */}
      <div className={s.scorecardGroup}>
        <div className={s.scorecardHeader}>
          <span className={s.scorecardGroupTitle}>Conversion</span>
          <ConfidenceBadge level={confidence?.conversion ?? "Low"} />
        </div>
        <div className={s.scorecardTiles}>
          <MetricTile
            label="Net Subs"
            value={derived.netSubsPer1k != null && hasViews
              ? `${(derived.netSubsPer1k * (derived.totalViews / 1000)).toFixed(0)}`
              : "—"}
            subtext={hasViews && derived.subsPer1k != null && derived.subsPer1k > 0
              ? `${derived.subsPer1k.toFixed(1)}/1K`
              : undefined}
            delta={hasViews ? comparison.subsPer1k.delta : null}
            vsBaseline={hasViews ? comparison.subsPer1k.vsBaseline : "unknown"}
            tooltip={!hasViews ? "No views yet" : undefined}
          />
          {derived.endScreenClickRate != null && (
            <MetricTile
              label="End Screen CTR"
              value={`${derived.endScreenClickRate.toFixed(1)}%`}
            />
          )}
          {derived.cardClickRate != null && (
            <MetricTile
              label="Card CTR"
              value={`${derived.cardClickRate.toFixed(1)}%`}
            />
          )}
        </div>
      </div>
    </section>
  );
}

type MetricTileProps = {
  label: string;
  value: string;
  subtext?: string;
  delta?: number | null;
  vsBaseline?: "above" | "at" | "below" | "unknown";
  tooltip?: string;
};

function MetricTile({ label, value, subtext, delta, vsBaseline, tooltip }: MetricTileProps) {
  const getDeltaClass = () => {
    if (delta == null || vsBaseline === "unknown") return "";
    if (vsBaseline === "above") return s.deltaPositive;
    if (vsBaseline === "below") return s.deltaNegative;
    return s.deltaNeutral;
  };

  return (
    <div className={s.metricTile} title={tooltip}>
      <span className={s.metricTileValue}>{value}</span>
      <span className={s.metricTileLabel}>{label}</span>
      {delta != null && vsBaseline !== "unknown" && (
        <span className={`${s.metricTileDelta} ${getDeltaClass()}`}>
          {delta > 0 ? "+" : ""}{delta.toFixed(0)}% vs median
        </span>
      )}
      {subtext && <span className={s.metricTileSubtext}>{subtext}</span>}
    </div>
  );
}

function TrafficSourcesTile({ sources }: { sources: TrafficSourceBreakdown | null }) {
  if (!sources || sources.total === 0) {
    return (
      <div className={s.metricTile}>
        <span className={s.metricTileValue}>—</span>
        <span className={s.metricTileLabel}>Traffic Sources</span>
      </div>
    );
  }

  // Find top 2 sources
  const sourceList = [
    { name: "Browse", value: sources.browse ?? 0 },
    { name: "Suggested", value: sources.suggested ?? 0 },
    { name: "Search", value: sources.search ?? 0 },
    { name: "External", value: sources.external ?? 0 },
    { name: "Notifications", value: sources.notifications ?? 0 },
  ]
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const total = sources.total ?? 1;

  return (
    <div className={s.metricTile}>
      <div className={s.trafficSourcesList}>
        {sourceList.map((src) => (
          <div key={src.name} className={s.trafficSourceItem}>
            <span className={s.trafficSourceName}>{src.name}</span>
            <span className={s.trafficSourcePct}>
              {((src.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      <span className={s.metricTileLabel}>Top Traffic Sources</span>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const getClass = () => {
    switch (level) {
      case "High":
        return s.confidenceHigh;
      case "Medium":
        return s.confidenceMedium;
      case "Low":
        return s.confidenceLow;
    }
  };

  return (
    <span className={`${s.confidenceBadge} ${getClass()}`}>
      {level} confidence
    </span>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return `${secs}s`;
}

function formatWatchTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours.toLocaleString()}h`;
  }
  return `${Math.round(minutes)}m`;
}
