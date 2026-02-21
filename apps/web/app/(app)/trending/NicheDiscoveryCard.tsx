"use client";

import { useState } from "react";
import Image from "next/image";
import { formatCompact } from "@/lib/shared/format";
import type { DiscoveredNiche } from "./types";
import s from "./style.module.css";

type Props = {
  niche: DiscoveredNiche;
  onSearchThisNiche: (niche: DiscoveredNiche) => void;
  onSave?: (niche: DiscoveredNiche) => void;
  onDismiss?: (niche: DiscoveredNiche) => void;
  isSaved?: boolean;
};

/**
 * NicheDiscoveryCard - A card displaying a discovered niche candidate
 *
 * Shows:
 * - Niche name (human readable)
 * - Why it's trending (rationale bullets)
 * - Sample videos (thumbnails)
 * - Key metrics
 * - Actions: Search, Save, Dismiss
 */
export default function NicheDiscoveryCard({
  niche,
  onSearchThisNiche,
  onSave,
  onDismiss,
  isSaved = false,
}: Props) {
  const [thumbErrors, setThumbErrors] = useState<Set<string>>(new Set());

  const handleThumbError = (videoId: string) => {
    setThumbErrors((prev) => new Set(prev).add(videoId));
  };

  return (
    <article className={s.nicheCard} aria-label={`Niche: ${niche.nicheLabel}`}>
      {/* Header */}
      <div className={s.nicheCardHeader}>
        <h3 className={s.nicheCardTitle}>{niche.nicheLabel}</h3>
        <div className={s.nicheCardMetrics}>
          <span className={s.nicheCardMetric}>
            <strong>{formatCompact(niche.metrics.medianViewsPerDay)}</strong> views/day
          </span>
          <span className={s.nicheCardMetricSep}>·</span>
          <span className={s.nicheCardMetric}>
            {niche.metrics.totalVideos} videos
          </span>
        </div>
      </div>

      {/* Rationale */}
      <ul className={s.nicheCardRationale}>
        {niche.rationaleBullets.slice(0, 2).map((bullet, i) => (
          <li key={i}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={s.rationaleIcon}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {bullet}
          </li>
        ))}
      </ul>

      {/* Sample Videos */}
      {niche.sampleVideos.length > 0 && (
        <div className={s.nicheCardSamples}>
          <p className={s.nicheCardSamplesLabel}>Sample videos</p>
          <div className={s.nicheCardThumbs}>
            {niche.sampleVideos.slice(0, 3).map((video) => (
              <div key={video.videoId} className={s.sampleThumbWrap}>
                {video.thumbnailUrl && !thumbErrors.has(video.videoId) ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className={s.sampleThumb}
                    sizes="80px"
                    onError={() => handleThumbError(video.videoId)}
                  />
                ) : (
                  <div className={s.sampleThumbPlaceholder}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                )}
                <span className={s.sampleVpd}>
                  {formatCompact(video.viewsPerDay)}/d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={s.nicheCardActions}>
        <button
          type="button"
          className={s.nicheCardPrimaryBtn}
          onClick={() => onSearchThisNiche(niche)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Search this niche
        </button>

        <div className={s.nicheCardSecondaryActions}>
          {onSave && (
            <button
              type="button"
              className={`${s.nicheCardIconBtn} ${isSaved ? s.saved : ""}`}
              onClick={() => onSave(niche)}
              aria-label={isSaved ? "Saved" : "Save niche"}
              title={isSaved ? "Saved" : "Save for later"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className={s.nicheCardIconBtn}
              onClick={() => onDismiss(niche)}
              aria-label="Not interested"
              title="Not interested"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
