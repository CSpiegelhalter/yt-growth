"use client";

import Image from "next/image";
import { useState } from "react";

import { formatCompactSafe, formatDateShort } from "@/lib/shared/format";

import s from "./video-header-simple.module.css";

export type VideoHeaderSimpleProps = {
  thumbnailUrl?: string | null;
  title: string;
  publishedAt?: Date | string | null;
  views: number;
  likes: number;
  comments: number;
};

export function VideoHeaderSimple({
  thumbnailUrl,
  title,
  publishedAt,
  views,
  likes,
  comments,
}: VideoHeaderSimpleProps) {
  const [imgError, setImgError] = useState(false);
  const showThumb = thumbnailUrl && !imgError;

  return (
    <div className={s.header}>
      <div className={s.thumbWrap}>
        {showThumb ? (
          <Image
            src={thumbnailUrl}
            alt={title}
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
        <h2 className={s.videoTitle}>{title}</h2>
        <ul className={s.statStack}>
          {publishedAt && (
            <li className={s.statLine}>
              Posted {formatDateShort(publishedAt instanceof Date ? publishedAt.toISOString() : publishedAt)}
            </li>
          )}
          <li className={s.statLine}>
            {formatCompactSafe(views)} views
          </li>
          <li className={s.statLine}>
            {formatCompactSafe(likes)} likes
          </li>
          <li className={s.statLine}>
            {formatCompactSafe(comments)} comments
          </li>
        </ul>
      </div>
    </div>
  );
}
