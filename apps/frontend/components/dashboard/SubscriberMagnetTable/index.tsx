"use client";

import s from "./style.module.css";
import type { SubscriberMagnetVideo } from "@/types/api";

type Props = {
  videos: SubscriberMagnetVideo[];
  analysis: string | null;
  loading?: boolean;
};

export default function SubscriberMagnetTable({ videos, analysis, loading = false }: Props) {
  if (loading) {
    return (
      <div className={s.card}>
        <h3 className={s.title}>🧲 Subscriber Magnets</h3>
        <div className={s.skeleton} style={{ height: 200 }} />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={s.card}>
        <h3 className={s.title}>🧲 Subscriber Magnets</h3>
        <p className={s.empty}>No subscriber data available. Sync your channel first.</p>
      </div>
    );
  }

  return (
    <div className={s.card}>
      <h3 className={s.title}>🧲 Subscriber Magnets</h3>
      <p className={s.subtitle}>
        Videos that convert viewers to subscribers - learn from your best performers
      </p>

      <div className={s.grid}>
        {videos.map((video, index) => (
          <div key={video.videoId} className={s.videoCard}>
            <div className={s.rank}>#{index + 1}</div>
            <div className={s.videoInfo}>
              <h4 className={s.videoTitle}>{video.title}</h4>
              <div className={s.stats}>
                <span className={s.stat}>
                  <strong>{video.subsPerThousand}</strong> subs/1k views
                </span>
                <span className={s.stat}>
                  {video.views.toLocaleString()} views
                </span>
                <span className={s.stat}>
                  +{video.subscribersGained.toLocaleString()} subs
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {analysis && (
        <div className={s.analysis}>
          <h4 className={s.analysisTitle}>📊 Pattern Analysis</h4>
          <div className={s.analysisContent}>
            {analysis.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

