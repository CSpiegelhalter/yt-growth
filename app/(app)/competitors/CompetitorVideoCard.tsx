"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCompact, formatCompactFloored } from "@/lib/format";
import type { CompetitorVideo } from "@/types/api";
import { formatDate } from "./utils";
import s from "./style.module.css";

type Props = {
  video: CompetitorVideo;
  channelId: string;
  /** Called when the card is clicked, before navigation */
  onClick?: () => void;
};

export default function CompetitorVideoCard({ video, channelId, onClick }: Props) {
  const hasVelocity = video.derived.velocity24h !== undefined;
  const [thumbOk, setThumbOk] = useState(true);
  const [avatarOk, setAvatarOk] = useState(true);

  return (
    <Link
      href={`/competitors/video/${video.videoId}?channelId=${channelId}`}
      className={s.videoCard}
      onClick={onClick}
    >
      <div className={s.videoThumbWrap}>
        {video.thumbnailUrl && thumbOk ? (
          <Image
            src={video.thumbnailUrl}
            alt={`${video.title} thumbnail`}
            fill
            className={s.videoThumb}
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setThumbOk(false)}
          />
        ) : (
          <div className={s.videoThumbPlaceholder}>
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

        {/* Views/day badge */}
        <span className={s.vpdBadge}>
          {formatCompactFloored(video.derived.viewsPerDay)}/day
        </span>

        {/* Velocity badge if available */}
        {hasVelocity && (
          <span className={s.velocityBadge}>
            +{formatCompact(video.derived.velocity24h!)} 24h
          </span>
        )}
      </div>

      <div className={s.videoCardContent}>
        <h3 className={s.videoCardTitle}>{video.title}</h3>

        <div className={s.channelRow}>
          {video.channelThumbnailUrl && avatarOk ? (
            <Image
              src={video.channelThumbnailUrl}
              alt={`${video.channelTitle} channel avatar`}
              width={24}
              height={24}
              className={s.channelAvatar}
              sizes="24px"
              onError={() => setAvatarOk(false)}
            />
          ) : null}
          <span className={s.channelName}>{video.channelTitle}</span>
        </div>

        <div className={s.videoCardMeta}>
          <span>{formatCompact(video.stats.viewCount)} views</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
