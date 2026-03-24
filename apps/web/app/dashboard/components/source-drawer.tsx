"use client";

import { useCallback, useEffect, useRef } from "react";

import type { SourceProvenance, SourceVideoSnapshot, VideoSuggestion } from "@/lib/features/suggestions/types";

import s from "./source-drawer.module.css";

type SourceDrawerProps = {
  suggestion: VideoSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onMakeMyVersion: (suggestionId: string) => void;
  onAnalyzeSource: (videoId: string) => void;
};

type SourceContext = {
  provenance?: SourceProvenance | null;
  generationMode?: string;
  nicheAvgViewsPerDay?: number | null;
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatsBar({ video, nicheAvg }: { video: SourceVideoSnapshot; nicheAvg: number | null }) {
  const stats = [
    { label: "Views", value: video.stats.viewCount > 0 ? formatNumber(video.stats.viewCount) : "\u2014" },
    { label: "Views/Day", value: video.stats.viewsPerDay > 0 ? formatNumber(video.stats.viewsPerDay) : "\u2014" },
    { label: "Published", value: video.publishedAt ? formatDate(video.publishedAt) : "\u2014" },
    { label: "vs Niche", value: nicheAvg && video.stats.viewsPerDay > 0 ? `${(video.stats.viewsPerDay / nicheAvg).toFixed(1)}x` : "\u2014" },
  ];

  return (
    <div className={s.statsBar}>
      {stats.map((stat) => (
        <div key={stat.label} className={s.statCell}>
          <span className={s.statValue}>{stat.value}</span>
          <span className={s.statLabel}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className={s.drawerBody}>
      <div className={s.skeletonThumb} />
      <div className={s.skeletonTitle} />
      <div className={s.skeletonLine} />
      <div className={s.skeletonStats}>
        <div className={s.skeletonStat} />
        <div className={s.skeletonStat} />
        <div className={s.skeletonStat} />
        <div className={s.skeletonStat} />
      </div>
      <div className={s.skeletonBullet} />
      <div className={s.skeletonBullet} />
      <div className={s.skeletonBullet} />
    </div>
  );
}

export function SourceDrawer({
  suggestion,
  isOpen,
  onClose,
  onMakeMyVersion,
  onAnalyzeSource,
}: SourceDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const ctx = suggestion?.sourceContext as unknown as SourceContext | undefined;
  const provenance = ctx?.provenance ?? null;
  const sourceVideo = provenance?.sourceVideos?.[0] ?? null;
  const nicheAvg = ctx?.nicheAvgViewsPerDay ?? null;
  const hasContent = suggestion && provenance && sourceVideo;

  const rationaleBullets = provenance?.rationale
    ? provenance.rationale.split(/\n+/).filter(Boolean).slice(0, 3)
    : [];

  return (
    <>
      <div className={s.backdrop} onClick={onClose} />
      <div className={s.drawer} ref={drawerRef} role="dialog" aria-label="Source details">
        <div className={s.drawerHeader}>
          <h3 className={s.drawerTitle}>Source Video</h3>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {!hasContent ? (
          <DrawerSkeleton />
        ) : (
          <>
            <div className={s.drawerBody}>
              {sourceVideo.thumbnailUrl ? (
                <img
                  src={sourceVideo.thumbnailUrl}
                  alt={sourceVideo.title}
                  className={s.thumbnail}
                  loading="lazy"
                />
              ) : (
                <div className={s.thumbnailPlaceholder}>No thumbnail</div>
              )}

              <div>
                <h4 className={s.videoTitle}>{sourceVideo.title}</h4>
                <p className={s.videoChannel}>{sourceVideo.channelTitle}</p>
              </div>

              <StatsBar video={sourceVideo} nicheAvg={nicheAvg} />

              {rationaleBullets.length > 0 && (
                <div>
                  <p className={s.sectionTitle}>Why this worked</p>
                  <ul className={s.bulletList}>
                    {rationaleBullets.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              )}

              {provenance.pattern && (
                <div>
                  <p className={s.sectionTitle}>Pattern</p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }}>
                    {provenance.pattern}
                  </p>
                </div>
              )}

              {provenance.adaptationAngle && (
                <div>
                  <p className={s.sectionTitle}>Your edge</p>
                  <div className={s.edgeBox}>{provenance.adaptationAngle}</div>
                </div>
              )}
            </div>

            <div className={s.drawerActions}>
              <button
                type="button"
                className={s.primaryAction}
                onClick={() => onMakeMyVersion(suggestion.id)}
              >
                Make my version
              </button>
              <button
                type="button"
                className={s.secondaryAction}
                onClick={() => onAnalyzeSource(sourceVideo.videoId)}
              >
                Analyze source
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
