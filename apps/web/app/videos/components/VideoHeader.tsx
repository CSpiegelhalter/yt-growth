"use client";

import Image from "next/image";
import { useState } from "react";

import { formatCompactSafe, formatDateShort } from "@/lib/shared/format";
import type { VideoWithMetrics } from "@/lib/video-tools";

import s from "./video-detail-panel.module.css";

type VideoHeaderProps = {
  video: VideoWithMetrics;
};

export function VideoHeader({ video }: VideoHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const showThumb = video.thumbnailUrl && !imgError;

  return (
    <div className={s.header}>
      <div className={s.thumbWrap}>
        {showThumb ? (
          <Image
            src={video.thumbnailUrl!}
            alt={video.title ?? "Video thumbnail"}
            fill
            className={s.thumbImg}
            sizes="(min-width: 768px) 40vw, 100vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={s.thumbPlaceholder}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className={s.info}>
        <h2 className={s.videoTitle}>{video.title ?? "Untitled"}</h2>
        <ul className={s.statStack}>
          {video.publishedAt && (
            <li className={s.statLine}>
              Posted {formatDateShort(video.publishedAt)}
            </li>
          )}
          <li className={s.statLine}>
            {formatCompactSafe(video.views)} views
          </li>
          <li className={s.statLine}>
            {formatCompactSafe(video.likes)} likes
          </li>
          <li className={s.statLine}>
            {formatCompactSafe(video.comments)} comments
          </li>
        </ul>
      </div>
    </div>
  );
}
