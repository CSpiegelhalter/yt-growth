"use client";

import s from "./PublicScorecard.module.css";
import type { CompetitorPublicSignals } from "@/types/api";

type Props = {
  signals: CompetitorPublicSignals;
  viewCount: number;
};

/**
 * PublicScorecard - Compact grid of measured public metrics
 *
 * All values shown here are directly measured from public YouTube data.
 */
export default function PublicScorecard({ signals, viewCount }: Props) {
  const tiles = [
    {
      label: "Views",
      value: formatCompact(viewCount),
    },
    {
      label: "Views/Day",
      value: formatCompact(signals.viewsPerDay),
      highlight: true,
    },
    {
      label: "Like Rate",
      value: signals.likeRate != null ? `${signals.likeRate.toFixed(1)}%` : "—",
      tooltip: "Likes per 100 views",
    },
    {
      label: "Comments/1K",
      value: signals.commentsPer1k != null ? signals.commentsPer1k.toFixed(1) : "—",
      tooltip: "Comments per 1,000 views",
    },
    {
      label: "Age",
      value: `${signals.videoAgeDays}d`,
    },
    {
      label: "Length",
      value: signals.durationFormatted,
      sublabel: signals.durationBucket,
    },
    {
      label: "Description",
      value: `${signals.descriptionWordCount}`,
      sublabel: "words",
    },
    {
      label: "Hashtags",
      value: `${signals.hashtagCount}`,
    },
  ];

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h3 className={s.title}>Public Scorecard</h3>
        <span className={s.subtitle}>All metrics directly measured from YouTube</span>
      </div>
      <div className={s.grid}>
        {tiles.map((tile, i) => (
          <div
            key={i}
            className={`${s.tile} ${tile.highlight ? s.highlight : ""}`}
            title={tile.tooltip}
          >
            <div className={s.value}>
              {tile.value}
              {tile.sublabel && <span className={s.sublabel}>{tile.sublabel}</span>}
            </div>
            <div className={s.label}>{tile.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(Math.round(num));
}
