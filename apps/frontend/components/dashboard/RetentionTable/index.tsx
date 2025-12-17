"use client";

import s from "./style.module.css";
import type { VideoWithRetention } from "@/types/api";

type Props = {
  videos: VideoWithRetention[];
  loading?: boolean;
  isDemo?: boolean;
};

/**
 * RetentionTable - Displays retention cliff data for videos
 * Mobile-first design with card view on small screens
 */
export default function RetentionTable({ videos, loading = false, isDemo = false }: Props) {
  if (loading) {
    return (
      <div className={s.card}>
        <div className={s.header}>
          <h3 className={s.title}>📉 Retention Cliffs</h3>
        </div>
        <div className={s.skeletonList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={s.skeletonItem}>
              <div className={s.skeleton} style={{ height: 16, width: "60%" }} />
              <div className={s.skeleton} style={{ height: 14, width: "30%", marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={s.card}>
        <div className={s.header}>
          <h3 className={s.title}>📉 Retention Cliffs</h3>
        </div>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📊</div>
          <p className={s.emptyTitle}>No retention data yet</p>
          <p className={s.emptyDesc}>Sync your channel to analyze where viewers drop off in your videos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.card}>
      <div className={s.header}>
        <div className={s.headerTop}>
          <h3 className={s.title}>📉 Retention Cliffs</h3>
          {isDemo && <span className={s.demoBadge}>Demo Data</span>}
        </div>
        <p className={s.subtitle}>Fix these drop-off points to boost watch time</p>
      </div>

      {/* Mobile: Card view */}
      <div className={s.mobileList}>
        {videos.map((video) => (
          <div key={video.youtubeVideoId} className={s.videoCard}>
            <div className={s.videoTitle} title={video.title ?? undefined}>
              {video.title ?? "Untitled"}
            </div>
            <div className={s.videoMeta}>
              {video.retention.hasData && video.retention.cliffTimestamp ? (
                <>
                  <span className={s.timestamp}>
                    ⏱ {video.retention.cliffTimestamp}
                  </span>
                  <span className={`${s.badge} ${getBadgeClass(video.retention.cliffReason, s)}`}>
                    {formatReason(video.retention.cliffReason)}
                  </span>
                </>
              ) : (
                <span className={s.noData}>No data available</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table view */}
      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Video</th>
              <th>Cliff Time</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.youtubeVideoId}>
                <td>
                  <span className={s.tableTitle} title={video.title ?? undefined}>
                    {video.title ?? "Untitled"}
                  </span>
                </td>
                <td>
                  {video.retention.hasData && video.retention.cliffTimestamp ? (
                    <span className={s.timestamp}>{video.retention.cliffTimestamp}</span>
                  ) : (
                    <span className={s.noData}>N/A</span>
                  )}
                </td>
                <td>
                  {video.retention.hasData && video.retention.cliffReason ? (
                    <span className={`${s.badge} ${getBadgeClass(video.retention.cliffReason, s)}`}>
                      {formatReason(video.retention.cliffReason)}
                    </span>
                  ) : (
                    <span className={s.noData}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatReason(reason: string | null | undefined): string {
  if (!reason) return "Unknown";
  switch (reason) {
    case "crossed_50":
      return "Below 50%";
    case "steepest_drop":
      return "Steep drop";
    default:
      return reason;
  }
}

function getBadgeClass(reason: string | null | undefined, s: Record<string, string>): string {
  if (!reason) return "";
  switch (reason) {
    case "crossed_50":
      return s.badgeWarning;
    case "steepest_drop":
      return s.badgeDanger;
    default:
      return "";
  }
}
