"use client";

import s from "./style.module.css";
import type { VideoWithRetention } from "@/types/api";

type Props = {
  videos: VideoWithRetention[];
  loading?: boolean;
};

export default function RetentionTable({ videos, loading = false }: Props) {
  if (loading) {
    return (
      <div className={s.card}>
        <h3 className={s.title}>📉 Retention Cliffs</h3>
        <div className={s.skeleton} style={{ height: 200 }} />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={s.card}>
        <h3 className={s.title}>📉 Retention Cliffs</h3>
        <p className={s.empty}>No retention data available. Sync your channel first.</p>
      </div>
    );
  }

  return (
    <div className={s.card}>
      <h3 className={s.title}>📉 Retention Cliffs</h3>
      <p className={s.subtitle}>
        Points where viewers drop off - fix these to improve watch time
      </p>
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
                  <div className={s.videoCell}>
                    <span className={s.videoTitle} title={video.title ?? undefined}>
                      {video.title ?? "Untitled"}
                    </span>
                  </div>
                </td>
                <td>
                  {video.retention.hasData && video.retention.cliffTimestamp ? (
                    <span className={s.timestamp}>{video.retention.cliffTimestamp}</span>
                  ) : (
                    <span className={s.na}>N/A</span>
                  )}
                </td>
                <td>
                  {video.retention.hasData && video.retention.cliffReason ? (
                    <span className={`${s.badge} ${getBadgeClass(video.retention.cliffReason, s)}`}>
                      {formatReason(video.retention.cliffReason)}
                    </span>
                  ) : (
                    <span className={s.na}>—</span>
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

function formatReason(reason: string): string {
  switch (reason) {
    case "crossed_50":
      return "Below 50%";
    case "steepest_drop":
      return "Steep drop";
    default:
      return reason;
  }
}

function getBadgeClass(reason: string, s: Record<string, string>): string {
  switch (reason) {
    case "crossed_50":
      return s.badgeWarning;
    case "steepest_drop":
      return s.badgeDanger;
    default:
      return "";
  }
}

