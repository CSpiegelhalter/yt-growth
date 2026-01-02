"use client";

import s from "../style.module.css";
import { formatCompactRounded as formatCompact } from "@/lib/format";

type QuickStatsProps = {
  totalViews: number;
  viewsPerDay: number;
  avgViewed: number;
  avgWatchTimeMin: number | null;
  engagementRate: number;
  likes: number;
  netSubs: number;
  subsPer1k: number;
};

/**
 * QuickStats - Key performance metrics in a row
 * Shows "—" with tooltip for metrics that require views when views = 0
 */
export function QuickStats({
  totalViews,
  viewsPerDay,
  avgViewed,
  avgWatchTimeMin,
  engagementRate,
  likes,
  netSubs,
  subsPer1k,
}: QuickStatsProps) {
  // When there are no views, percentage-based metrics are not meaningful
  const hasViews = totalViews > 0;

  return (
    <section className={s.quickStats}>
      <div className={s.statGroup}>
        <div className={s.statMain}>
          <span className={s.statValue}>{formatCompact(totalViews)}</span>
          <span className={s.statLabel}>Total Views</span>
        </div>
        <div className={s.statSecondary}>
          <span>{hasViews ? `${formatCompact(viewsPerDay)}/day` : "—"}</span>
        </div>
      </div>

      <div className={s.statDivider} />

      <div className={s.statGroup}>
        <div className={s.statMain}>
          <span className={s.statValue} title={!hasViews ? "No views yet" : undefined}>
            {hasViews ? `${avgViewed.toFixed(0)}%` : "—"}
          </span>
          <span className={s.statLabel}>Avg Watched</span>
        </div>
        <div className={s.statSecondary}>
          <span title={!hasViews ? "No views yet" : undefined}>
            {hasViews && avgWatchTimeMin != null 
              ? `${avgWatchTimeMin.toFixed(1)} min/view` 
              : "—"}
          </span>
        </div>
      </div>

      <div className={s.statDivider} />

      <div className={s.statGroup}>
        <div className={s.statMain}>
          <span className={s.statValue} title={!hasViews ? "No views yet" : undefined}>
            {hasViews ? `${engagementRate.toFixed(1)}%` : "—"}
          </span>
          <span className={s.statLabel}>Engagement</span>
        </div>
        <div className={s.statSecondary}>
          <span>{likes > 0 ? `${likes} likes` : "—"}</span>
        </div>
      </div>

      <div className={s.statDivider} />

      <div className={s.statGroup}>
        <div className={s.statMain}>
          <span className={s.statValue}>
            {netSubs !== 0 ? `${netSubs > 0 ? "+" : ""}${netSubs}` : "—"}
          </span>
          <span className={s.statLabel}>Net Subs</span>
        </div>
        <div className={s.statSecondary}>
          <span title={!hasViews ? "No views yet" : undefined}>
            {hasViews && subsPer1k > 0 ? `${subsPer1k.toFixed(1)}/1K views` : "—"}
          </span>
        </div>
      </div>
    </section>
  );
}
