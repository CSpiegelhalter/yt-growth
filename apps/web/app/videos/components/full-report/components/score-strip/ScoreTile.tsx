import type { ScoreTile as ScoreTileData, ScoreTileTone } from "@/lib/features/full-report";

import s from "./score-strip.module.css";

type ScoreTileProps = {
  tile: ScoreTileData;
};

const TONE_CLASS: Record<ScoreTileTone, string> = {
  above: "toneAbove",
  on_par: "toneOnPar",
  below: "toneBelow",
  well_below: "toneWellBelow",
  unknown: "toneUnknown",
};

function formatDelta(deltaPct: number | null): string | null {
  if (deltaPct == null) {return null;}
  const rounded = Math.round(deltaPct);
  if (rounded === 0) {return "≈ 0%";}
  return `${rounded > 0 ? "↑ +" : "↓ "}${rounded}%`;
}

export function ScoreTile({ tile }: ScoreTileProps) {
  const toneClass = s[TONE_CLASS[tile.tone]] ?? "";
  const delta = formatDelta(tile.deltaPct);

  return (
    <article className={`${s.tile} ${toneClass}`} aria-label={`${tile.label}: ${tile.displayValue}`}>
      <header className={s.tileHead}>
        <span className={s.tileLabel}>{tile.label}</span>
      </header>
      <p className={s.tileValue}>{tile.displayValue}</p>
      <p className={s.tileDelta}>
        {delta && <span className={s.tileDeltaValue}>{delta}</span>}
        <span className={s.tileComparison}>{tile.comparisonLabel}</span>
      </p>
      {tile.sparkline.length > 1 && (
        <Sparkline values={tile.sparkline} />
      )}
    </article>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = 100 / (values.length - 1);
  const points = values
    .map((v, i) => `${i * stepX},${100 - ((v - min) / range) * 100}`)
    .join(" ");
  return (
    <svg
      className={s.sparkline}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
