"use client";

import s from "../style.module.css";
import type { BottleneckResult, ConfidenceLevel } from "@/types/api";

type BottleneckBannerProps = {
  bottleneck: BottleneckResult;
  confidence?: ConfidenceLevel;
};

const BOTTLENECK_LABELS: Record<string, string> = {
  NOT_ENOUGH_DATA: "Low Data Mode",
  DISCOVERY_IMPRESSIONS: "Discovery (Impressions)",
  DISCOVERY_CTR: "Discovery (CTR)",
  RETENTION: "Retention",
  CONVERSION: "Conversion",
};

const BOTTLENECK_ICONS: Record<string, string> = {
  NOT_ENOUGH_DATA: "📊",
  DISCOVERY_IMPRESSIONS: "👁️",
  DISCOVERY_CTR: "👆",
  RETENTION: "⏱️",
  CONVERSION: "🔔",
};

const BOTTLENECK_COLORS: Record<string, string> = {
  NOT_ENOUGH_DATA: s.bottleneckNeutral,
  DISCOVERY_IMPRESSIONS: s.bottleneckWarning,
  DISCOVERY_CTR: s.bottleneckWarning,
  RETENTION: s.bottleneckDanger,
  CONVERSION: s.bottleneckInfo,
};

/**
 * BottleneckBanner - Prominent diagnosis of what's limiting video performance
 * Evidence-based, no generic advice - just diagnosis + metrics
 */
export function BottleneckBanner({ bottleneck, confidence }: BottleneckBannerProps) {
  const label = BOTTLENECK_LABELS[bottleneck.bottleneck] ?? "Analysis";
  const icon = BOTTLENECK_ICONS[bottleneck.bottleneck] ?? "📈";
  const colorClass = BOTTLENECK_COLORS[bottleneck.bottleneck] ?? s.bottleneckNeutral;

  // Don't show as an error for NOT_ENOUGH_DATA
  const isLowData = bottleneck.bottleneck === "NOT_ENOUGH_DATA";

  return (
    <section className={`${s.bottleneckBanner} ${colorClass}`}>
      <div className={s.bottleneckHeader}>
        <span className={s.bottleneckIcon}>{icon}</span>
        <div className={s.bottleneckTitleGroup}>
          <h3 className={s.bottleneckTitle}>
            {isLowData ? "Low-data mode" : `Primary limiter: ${label}`}
          </h3>
          {confidence && (
            <span className={s.bottleneckConfidence}>
              {confidence} confidence
            </span>
          )}
        </div>
      </div>

      <p className={s.bottleneckEvidence}>{bottleneck.evidence}</p>

      {bottleneck.metrics.length > 0 && (
        <div className={s.bottleneckMetrics}>
          {bottleneck.metrics.map((m, i) => (
            <div key={i} className={s.bottleneckMetricItem}>
              <span className={s.bottleneckMetricLabel}>{m.label}</span>
              <span className={s.bottleneckMetricValue}>{m.value}</span>
              {m.comparison && (
                <span className={s.bottleneckMetricComparison}>
                  {m.comparison}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
