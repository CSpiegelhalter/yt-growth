"use client";

import { useState } from "react";
import s from "./PerformanceSnapshot.module.css";
import type { EngagementOutlierResult } from "@/lib/competitor-utils";

type Props = {
  views: number;
  viewsPerDay: number;
  likes: number;
  comments: number;
  ageDays: number;
  engagementPer1k: number | null;
  outlier: EngagementOutlierResult | null;
};

/**
 * PerformanceSnapshot - The top hero section showing key video metrics.
 * 
 * Displays:
 * - Views (prominent)
 * - Views/Day
 * - Likes (absolute)
 * - Comments (absolute)
 * - Age (days)
 * - Engagement per 1K views
 * - Outlier badge (when exceptional)
 * 
 * Mobile-first: 2-column grid on mobile, more columns on desktop.
 */
export default function PerformanceSnapshot({
  views,
  viewsPerDay,
  likes,
  comments,
  ageDays,
  engagementPer1k,
  outlier,
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={s.container}>
      {/* Big Views Number */}
      <div className={s.heroMetric}>
        <span className={s.heroValue}>{formatCompact(views)}</span>
        <span className={s.heroLabel}>Views</span>
      </div>

      {/* Metrics Grid */}
      <div className={s.grid}>
        <div className={`${s.metric} ${s.highlight}`}>
          <span className={s.value}>{formatCompact(viewsPerDay)}</span>
          <span className={s.label}>Views/Day</span>
        </div>

        <div className={s.metric}>
          <span className={s.value}>{formatCompact(likes)}</span>
          <span className={s.label}>Likes</span>
        </div>

        <div className={s.metric}>
          <span className={s.value}>{formatCompact(comments)}</span>
          <span className={s.label}>Comments</span>
          {outlier && outlier.isOutlier && (
            <span
              className={s.outlierBadge}
              data-level={outlier.label.toLowerCase().replace(" ", "-")}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {outlier.label === "Exceptional" ? "★" : "▲"} {outlier.label}
              {showTooltip && (
                <span className={s.tooltip}>{outlier.explanation}</span>
              )}
            </span>
          )}
        </div>

        <div className={s.metric}>
          <span className={s.value}>{ageDays}d</span>
          <span className={s.label}>Age</span>
        </div>

        {engagementPer1k !== null && (
          <div className={s.metric}>
            <span className={s.value}>{engagementPer1k.toFixed(1)}</span>
            <span className={s.label}>Eng./1K</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return m >= 10 ? `${Math.round(m)}M` : `${m.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    return k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(1)}K`;
  }
  return String(Math.round(num));
}
