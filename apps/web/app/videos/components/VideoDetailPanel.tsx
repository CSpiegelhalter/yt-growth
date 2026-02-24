"use client";

import { useMemo } from "react";

import type { VideoWithMetrics } from "@/lib/video-tools";

import { MetricPills } from "./MetricPills";
import type { PillMetric } from "./pill-metric-types";
import { rankVideoMetrics } from "./rank-metrics";
import { useVideoInsights } from "./useVideoInsights";
import s from "./video-detail-panel.module.css";
import { VideoHeader } from "./VideoHeader";
import { VideoInsightCards } from "./VideoInsightCards";

type VideoDetailPanelProps = {
  video: VideoWithMetrics | null;
  channelId: string;
};

export function VideoDetailPanel({ video, channelId }: VideoDetailPanelProps) {
  if (!video) {
    return (
      <div className={s.panel}>
        <div className={s.emptyState}>
          <p>Select a video to see its analysis.</p>
        </div>
      </div>
    );
  }

  return <VideoDetailContent video={video} channelId={channelId} />;
}

function VideoDetailContent({
  video,
  channelId,
}: {
  video: VideoWithMetrics;
  channelId: string;
}) {
  const { summary, loading, error, retry } = useVideoInsights(
    channelId,
    video.videoId,
  );

  const ranked = useMemo(() => rankVideoMetrics(video), [video]);

  const needsWork = useMemo(() => {
    const items = [...ranked.needsWork];
    if (summary && summary.length > 0) {
      const top = summary[0];
      items.push({
        key: "ai-insight",
        label: top.title,
        displayValue: "",
        direction: "down",
        score: 0,
        issue: top.explanation,
        fix: top.fix,
      } satisfies PillMetric);
    }
    return items;
  }, [ranked.needsWork, summary]);

  const hasContent =
    ranked.goingWell.length > 0 || needsWork.length > 0;

  return (
    <div className={s.panel}>
      <VideoHeader video={video} />

      {loading && (
        <div className={s.loadingState}>
          <div className={s.spinner} />
          <span>Analyzing this video...</span>
        </div>
      )}

      {error && !loading && (
        <div className={s.errorState}>
          <p>{error}</p>
          <button type="button" onClick={retry} className={s.retryBtn}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <MetricPills goingWell={ranked.goingWell} needsWork={needsWork} />
          {summary && summary.length > 0 && (
            <VideoInsightCards insights={summary} />
          )}
          {!hasContent && !summary?.length && (
            <div className={s.emptyState}>
              <p>
                Not enough data to generate insights yet. Check back once this
                video has more views.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
