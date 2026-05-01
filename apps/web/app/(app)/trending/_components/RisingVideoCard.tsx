"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import s from "../style.module.css";
import type { RisingVideo } from "../types";

type Props = {
  video: RisingVideo;
};

function formatVelocity(vphr: number): string {
  if (vphr >= 1_000_000) return `${(vphr / 1_000_000).toFixed(1)}M/hr`;
  if (vphr >= 1_000) return `${(vphr / 1_000).toFixed(1)}K/hr`;
  return `${vphr}/hr`;
}

function timeAgo(publishedAt: string): string {
  const ms = Date.now() - new Date(publishedAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RisingVideoCard({ video }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={s.risingCard}
      onClick={() => router.push(`/analyze/${video.videoId}`)}
    >
      <div className={s.risingThumb}>
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 30vw, 200px"
            className={s.risingThumbImg}
          />
        ) : (
          <div className={s.risingThumbPlaceholder} />
        )}
        <span className={s.risingDuration}>{video.duration}</span>
      </div>
      <div className={s.risingInfo}>
        <p className={s.risingTitle}>{video.title}</p>
        <div className={s.risingMeta}>
          <span>{video.channelName}</span>
          <span className={s.risingDot}>&middot;</span>
          <span>{timeAgo(video.publishedAt)}</span>
          <span className={s.risingDot}>&middot;</span>
          <span className={s.risingVelocity}>{formatVelocity(video.viewVelocity)}</span>
        </div>
      </div>
    </button>
  );
}
