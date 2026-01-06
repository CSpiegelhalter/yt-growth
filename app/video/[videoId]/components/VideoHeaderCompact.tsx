"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./VideoHeaderCompact.module.css";
import { formatRelativeDate, formatDuration } from "./helpers";
import { formatCompactRounded as formatCompact } from "@/lib/format";

type VideoData = {
  title: string;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
  durationSec: number;
};

type KPIs = {
  views: number;
  watchTimeMin?: number | null;
  avgViewedPct?: number | null;
  ctr?: number | null;
  subsGained?: number | null;
};

type VideoHeaderCompactProps = {
  videoId: string;
  video: VideoData;
  kpis: KPIs;
  channelName?: string;
  backHref: string;
  backLabel: string;
  isDemo?: boolean;
};

/**
 * VideoHeaderCompact - Condensed header with video info, KPIs, and actions
 * Clean, professional layout without emojis or clutter
 */
export function VideoHeaderCompact({
  videoId,
  video,
  kpis,
  channelName,
  backHref,
  backLabel,
  isDemo,
}: VideoHeaderCompactProps) {
  const router = useRouter();
  const youtubeUrl = `https://youtube.com/watch?v=${videoId}`;

  // Use router.back() to preserve browser history state (dashboard stays cached)
  // Fall back to direct navigation if user navigated directly to this page
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    // Check if we have history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // No history - navigate directly
      router.push(backHref);
    }
  };

  return (
    <header className={styles.header}>
      {/* Back navigation - uses history.back() to preserve dashboard state */}
      <a href={backHref} onClick={handleBack} className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </a>

      {/* Demo banner */}
      {isDemo && (
        <div className={styles.demoBanner}>
          <span className={styles.demoBadge}>Demo</span>
          Sample data — connect your channel for real insights
        </div>
      )}

      {/* Main header content */}
      <div className={styles.headerMain}>
        {/* Thumbnail */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.thumbnailLink}
        >
          <div className={styles.thumbnail}>
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt=""
                fill
                className={styles.thumbnailImg}
                sizes="120px"
              />
            ) : (
              <div className={styles.thumbnailPlaceholder}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className={styles.duration}>{formatDuration(video.durationSec)}</div>
          </div>
        </a>

        {/* Title and meta */}
        <div className={styles.titleSection}>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.titleLink}
          >
            <h1 className={styles.title}>{video.title}</h1>
          </a>
          <div className={styles.meta}>
            {channelName && <span>{channelName}</span>}
            {channelName && video.publishedAt && <span className={styles.metaDot}>·</span>}
            {video.publishedAt && <span>{formatRelativeDate(video.publishedAt)}</span>}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{formatCompact(kpis.views)}</span>
          <span className={styles.kpiLabel}>Views</span>
        </div>
        {kpis.watchTimeMin != null && (
          <div className={styles.kpi}>
            <span className={styles.kpiValue}>{formatCompact(kpis.watchTimeMin)}</span>
            <span className={styles.kpiLabel}>Watch time (min)</span>
          </div>
        )}
        {kpis.avgViewedPct != null && (
          <div className={styles.kpi}>
            <span className={styles.kpiValue}>{kpis.avgViewedPct.toFixed(1)}%</span>
            <span className={styles.kpiLabel}>Avg viewed</span>
          </div>
        )}
        {kpis.ctr != null && (
          <div className={styles.kpi}>
            <span className={styles.kpiValue}>{kpis.ctr.toFixed(1)}%</span>
            <span className={styles.kpiLabel}>CTR</span>
          </div>
        )}
        {kpis.subsGained != null && kpis.subsGained !== 0 && (
          <div className={styles.kpi}>
            <span className={styles.kpiValue}>
              {kpis.subsGained > 0 ? "+" : ""}
              {formatCompact(kpis.subsGained)}
            </span>
            <span className={styles.kpiLabel}>Subscribers</span>
          </div>
        )}
      </div>
    </header>
  );
}

export default VideoHeaderCompact;
