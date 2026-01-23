"use client";

import s from "../style.module.css";
import { MetricRow } from "./MetricRow";
import { formatCompactRounded as formatCompact } from "@/lib/format";

type AllMetricsProps = {
  totals: {
    estimatedMinutesWatched?: number | null;
    comments?: number | null;
    shares?: number | null;
    videosAddedToPlaylists?: number | null;
    videosRemovedFromPlaylists?: number | null;
    likes?: number | null;
    estimatedRevenue?: number | null;
  };
  derived: {
    commentsPer1k?: number | null;
    sharesPer1k?: number | null;
    likeRatio?: number | null;
    cardClickRate?: number | null;
    endScreenClickRate?: number | null;
    rpm?: number | null;
  };
};

/**
 * AllMetrics - Collapsible section showing all available metrics
 */
export function AllMetrics({ totals, derived }: AllMetricsProps) {
  return (
    <details className={s.moreMetrics}>
      <summary className={s.moreMetricsSummary}>View All Metrics</summary>
      <div className={s.metricsTable}>
        <MetricRow
          label="Watch Time Total"
          value={`${formatCompact(totals.estimatedMinutesWatched ?? 0)} min`}
        />
        <MetricRow
          label="Comments"
          value={String(totals.comments ?? 0)}
          sub={
            derived.commentsPer1k
              ? `${derived.commentsPer1k.toFixed(1)}/1K`
              : undefined
          }
        />
        <MetricRow
          label="Shares"
          value={String(totals.shares ?? 0)}
          sub={
            derived.sharesPer1k
              ? `${derived.sharesPer1k.toFixed(1)}/1K`
              : undefined
          }
        />
        <MetricRow
          label="Playlist Saves"
          value={`+${
            (totals.videosAddedToPlaylists ?? 0) -
            (totals.videosRemovedFromPlaylists ?? 0)
          }`}
        />
        <MetricRow
          label="Like Ratio"
          value={
            derived.likeRatio != null
              ? `${derived.likeRatio.toFixed(1)}%`
              : "-"
          }
        />
        {derived.cardClickRate != null && (
          <MetricRow
            label="Card CTR"
            value={`${derived.cardClickRate.toFixed(2)}%`}
          />
        )}
        {derived.endScreenClickRate != null && (
          <MetricRow
            label="End Screen CTR"
            value={`${derived.endScreenClickRate.toFixed(2)}%`}
          />
        )}
        {totals.estimatedRevenue != null && (
          <MetricRow
            label="Revenue"
            value={`$${totals.estimatedRevenue.toFixed(2)}`}
          />
        )}
        {derived.rpm != null && (
          <MetricRow label="RPM" value={`$${derived.rpm.toFixed(2)}`} />
        )}
      </div>
    </details>
  );
}

