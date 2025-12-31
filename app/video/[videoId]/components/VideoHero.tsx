"use client";

import Image from "next/image";
import s from "../style.module.css";
import { formatRelativeDate, formatDuration } from "./helpers";
import { formatCompactRounded as formatCompact } from "@/lib/format";

type VideoHeroProps = {
  videoId: string;
  video: {
    title?: string | null;
    thumbnailUrl?: string | null;
    publishedAt?: string | null;
    durationSec: number;
  };
  totalViews: number;
  performance: { level: string; label: string };
  isDemo?: boolean;
};

/**
 * VideoHero - Header section with thumbnail, title, and key metadata
 */
export function VideoHero({
  videoId,
  video,
  totalViews,
  performance,
  isDemo,
}: VideoHeroProps) {
  return (
    <>
      {/* Demo Banner */}
      {isDemo && (
        <div className={s.demoBanner}>
          <span className={s.demoBadge}>Demo</span>
          <span>Sample data - connect your channel for real insights</span>
        </div>
      )}

      {/* Hero Header */}
      <header className={s.hero}>
        <a
          href={`https://youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={s.heroMediaLink}
        >
          <div className={s.heroMedia}>
            {video.thumbnailUrl ? (
              <div className={s.heroThumbWrap}>
                <Image
                  src={video.thumbnailUrl}
                  alt={`${video.title ?? "Video"} thumbnail`}
                  fill
                  className={s.heroThumbnail}
                  sizes="(max-width: 560px) 100vw, 280px"
                  priority
                />
              </div>
            ) : (
              <div className={s.heroThumbWrap}>
                <div className={s.heroThumbnailPlaceholder}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            )}
            <div className={s.heroPlayOverlay}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </a>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>{video.title}</h1>
          <div className={s.heroMeta}>
            {video.publishedAt && (
              <span>{formatRelativeDate(video.publishedAt)}</span>
            )}
            <span>•</span>
            <span>{formatDuration(video.durationSec)}</span>
            <span>•</span>
            <span>{formatCompact(totalViews)} views</span>
          </div>
          <div className={`${s.performanceBadge} ${s[performance.level]}`}>
            {performance.label}
          </div>
        </div>
      </header>
    </>
  );
}

