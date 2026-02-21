"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./VideoHeaderCompact.module.css";
import { formatRelativeDate, formatDuration } from "./helpers";
import { formatCompactRounded as formatCompact } from "@/lib/shared/format";

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

type EngagementStats = {
  likes: number;
  comments: number;
};

type VideoHeaderCompactProps = {
  videoId: string;
  video: VideoData;
  kpis: KPIs;
  engagement: EngagementStats;
  channelName?: string;
  backHref: string;
  backLabel: string;
};

// CTR rating based on benchmarks
function getCtrRating(ctr: number): { label: string; color: string } {
  if (ctr >= 10) {return { label: "Exceptional", color: "#22c55e" };}
  if (ctr >= 7) {return { label: "Strong", color: "#22c55e" };}
  if (ctr >= 5) {return { label: "Good", color: "#3b82f6" };}
  if (ctr >= 3) {return { label: "Average", color: "#f59e0b" };}
  return { label: "Needs work", color: "#ef4444" };
}

// Subscriber conversion rate rating
function getSubRateRating(rate: number): { label: string; color: string } {
  if (rate >= 3) {return { label: "Excellent", color: "#22c55e" };}
  if (rate >= 2) {return { label: "Strong", color: "#22c55e" };}
  if (rate >= 1) {return { label: "Average", color: "#3b82f6" };}
  if (rate >= 0.5) {return { label: "Below avg", color: "#f59e0b" };}
  return { label: "Low", color: "#ef4444" };
}

/**
 * VideoHeaderCompact - Condensed header with video info, KPIs, and actions
 * Clean, professional layout without emojis or clutter
 */
export function VideoHeaderCompact({
  videoId,
  video,
  kpis,
  engagement,
  backHref,
  backLabel,
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </a>

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
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className={styles.duration}>
              {formatDuration(video.durationSec)}
            </div>
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
            {/* Views first with eye icon */}
            <span className={styles.engagementStatLarge}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {formatCompact(kpis.views)} views
            </span>
            <span className={styles.engagementStatLarge}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              {formatCompact(engagement.likes)}
            </span>
            <span className={styles.engagementStatLarge}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {formatCompact(engagement.comments)}
            </span>
            {video.publishedAt && (
              <>
                <span className={styles.metaDot}>·</span>
                <span>{formatRelativeDate(video.publishedAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        {kpis.watchTimeMin != null && (
          <div className={styles.kpi}>
            <span className={styles.kpiValue}>
              {formatCompact(kpis.watchTimeMin)}
            </span>
            <span className={styles.kpiLabel}>Watch time (min)</span>
          </div>
        )}
        {kpis.avgViewedPct != null && (
          <div className={styles.kpi}>
            <span className={styles.kpiValue}>
              {kpis.avgViewedPct.toFixed(1)}%
            </span>
            <span className={styles.kpiLabel}>Avg viewed</span>
          </div>
        )}
        {kpis.ctr != null && <CtrKpi ctr={kpis.ctr} />}
        {kpis.subsGained != null && kpis.subsGained !== 0 && (
          <div className={styles.kpi}>
            <span className={styles.kpiValue}>
              {kpis.subsGained > 0 ? "+" : ""}
              {formatCompact(kpis.subsGained)}
            </span>
            <span className={styles.kpiLabel}>Subscribers</span>
          </div>
        )}
        {/* Subscriber Rate (conversion) */}
        {kpis.subsGained != null && kpis.views > 0 && (
          <SubRateKpi subsGained={kpis.subsGained} views={kpis.views} />
        )}
      </div>
    </header>
  );
}

type Benchmark = { label: string; color: string; text: string };

function InfoIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ marginLeft: 3, opacity: 0.5, verticalAlign: "middle" }}
    >
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="8" r="1" />
      <rect x="11" y="11" width="2" height="6" rx="1" />
    </svg>
  );
}

function KpiWithTooltip({
  value,
  label,
  rating,
  tooltipTitle,
  tooltipDesc,
  benchmarks,
  tooltipNote,
}: {
  value: string;
  label: string;
  rating: { label: string; color: string };
  tooltipTitle: string;
  tooltipDesc: string;
  benchmarks: Benchmark[];
  tooltipNote: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div
      className={styles.kpi}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ position: "relative", cursor: "help" }}
    >
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiLabel}>
        {label}
        <InfoIcon />
      </span>
      <span className={styles.kpiRating} style={{ color: rating.color }}>
        {rating.label}
      </span>
      {showTooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>{tooltipTitle}</div>
          <p className={styles.tooltipDesc}>{tooltipDesc}</p>
          <div className={styles.tooltipBenchmarks}>
            {benchmarks.map((b) => (
              <div key={b.label} className={styles.tooltipBenchmark}>
                <span style={{ color: b.color }}>{b.label}</span> {b.text}
              </div>
            ))}
          </div>
          <p className={styles.tooltipNote}>{tooltipNote}</p>
        </div>
      )}
    </div>
  );
}

const CTR_BENCHMARKS: Benchmark[] = [
  { label: "10%+", color: "#22c55e", text: "Exceptional (esp. day 1)" },
  { label: "7%+", color: "#22c55e", text: "Strong" },
  { label: "5%+", color: "#3b82f6", text: "Good baseline" },
];

const SUB_RATE_BENCHMARKS: Benchmark[] = [
  { label: "2-3%+", color: "#22c55e", text: "Strong conversion" },
  { label: "1%", color: "#3b82f6", text: "Average" },
];

function CtrKpi({ ctr }: { ctr: number }) {
  return (
    <KpiWithTooltip
      value={`${ctr.toFixed(1)}%`}
      label="CTR"
      rating={getCtrRating(ctr)}
      tooltipTitle="Click-Through Rate (CTR)"
      tooltipDesc="How many people click your video after seeing the thumbnail/title."
      benchmarks={CTR_BENCHMARKS}
      tooltipNote="CTR often drops as a video spreads wider - colder audiences click less. High CTR with low impressions can signal narrow audience match."
    />
  );
}

function SubRateKpi({ subsGained, views }: { subsGained: number; views: number }) {
  const rate = views > 0 ? (subsGained / views) * 100 : 0;
  if (rate < 0.01) {return null;}
  return (
    <KpiWithTooltip
      value={`${rate.toFixed(2)}%`}
      label="Sub Rate"
      rating={getSubRateRating(rate)}
      tooltipTitle="Subscriber Conversion Rate"
      tooltipDesc="How many viewers subscribe after watching this video."
      benchmarks={SUB_RATE_BENCHMARKS}
      tooltipNote="Low conversion often signals content-audience mismatch or unclear channel value proposition."
    />
  );
}