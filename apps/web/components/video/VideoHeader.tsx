import Image from "next/image";

import {
  EngagementBadge,
} from "@/app/(app)/competitors/video/[videoId]/_components/InteractiveHeaderClient";
import { formatDurationBadge } from "@/lib/competitor-utils";
import { formatCompact, formatDateMedium } from "@/lib/shared/format";
import type { CompetitorVideoAnalysis } from "@/types/api";

import s from "./video-header.module.css";

type Props = {
  video: CompetitorVideoAnalysis["video"];
  ageDays: number;
  thumbnailWidth?: number;
  showPlayOverlay?: boolean;
};

export function VideoHeader({
  video,
  ageDays,
  thumbnailWidth = 280,
  showPlayOverlay = false,
}: Props) {
  return (
    <header className={s.videoHeader}>
      <a
        href={video.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={s.thumbnailLink}
      >
        <div className={s.thumbnailWrap} style={{ width: undefined }} data-width={thumbnailWidth}>
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={`${video.title} thumbnail`}
              fill
              className={s.thumbnail}
              sizes={`(max-width: 768px) 100vw, ${thumbnailWidth}px`}
              priority
            />
          ) : (
            <div className={s.thumbnailPlaceholder}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {video.durationSec && (
            <span className={s.durationBadge}>
              {formatDurationBadge(video.durationSec)}
            </span>
          )}
          {showPlayOverlay && (
            <div className={s.playOverlay}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
      </a>

      <div className={s.videoInfo}>
        <h2 className={s.videoTitle}>{video.title}</h2>
        <div className={s.channelMeta}>
          <a href={video.channelUrl} target="_blank" rel="noopener noreferrer" className={s.channelLink}>
            {video.channelTitle}
          </a>
          <span className={s.metaSep}>&middot;</span>
          <span className={s.publishDate}>{formatDateMedium(video.publishedAt)}</span>
        </div>
        <div className={s.metricsRow}>
          <span className={s.metric}>{formatCompact(video.stats.viewCount)} views</span>
          <span className={s.metricSep}>&middot;</span>
          <span className={s.metric}>{formatCompact(video.derived.viewsPerDay)}/day</span>
          <span className={s.metricSep}>&middot;</span>
          <span className={s.metric}>
            <svg className={s.metricIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            {formatCompact(video.stats.likeCount ?? 0)}
          </span>
          <span className={s.metricSep}>&middot;</span>
          <span className={s.metric}>
            <svg className={s.metricIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {formatCompact(video.stats.commentCount ?? 0)}
            <EngagementBadge views={video.stats.viewCount} comments={video.stats.commentCount ?? 0} />
          </span>
          <span className={s.metricSep}>&middot;</span>
          <span className={s.metric}>{ageDays}d old</span>
        </div>
      </div>
    </header>
  );
}
