import type {
  ScoreStripData,
  VideoAudit,
} from "@/lib/features/full-report";

import s from "./wins.module.css";

type WinsBandProps = {
  audit: VideoAudit | null;
  scoreStrip: ScoreStripData | null;
};

type Win = {
  id: string;
  text: string;
};

const MIN_DELTA_TO_BRAG = 10; // percent; below this is "on par", not a win

function collectWins(audit: VideoAudit | null, scoreStrip: ScoreStripData | null): Win[] {
  const wins: Win[] = [];

  // Only score tiles with a meaningful positive delta count as wins.
  // "On par" (within ±10%) is stable, not improvement — surfacing it as a
  // win renders as "0% increase" which feels like noise.
  if (scoreStrip) {
    for (const tile of scoreStrip.tiles) {
      if (tile.tone !== "above") {continue;}
      if (tile.deltaPct == null || tile.deltaPct < MIN_DELTA_TO_BRAG) {continue;}
      const delta = `+${Math.round(tile.deltaPct)}%`;
      wins.push({
        id: `tile-${tile.id}`,
        text: `${tile.label} is ${delta} above your channel average.`,
      });
    }
  }

  // Audit passes — surface up to 3 with the most actionable detail. Skip
  // generic "criterion only" rows (they don't read as wins).
  if (audit) {
    const passing = audit.items
      .filter((item) => item.passed && Boolean(item.detail) && item.detail.length > 8)
      .slice(0, 3);
    for (const item of passing) {
      wins.push({
        id: `audit-${item.criterion}`,
        text: item.detail,
      });
    }
  }

  return wins.slice(0, 5);
}

export function WinsBand({ audit, scoreStrip }: WinsBandProps) {
  const wins = collectWins(audit, scoreStrip);
  if (wins.length === 0) {return null;}

  return (
    <section className={s.section} aria-labelledby="wins-heading">
      <header className={s.header}>
        <h3 id="wins-heading" className={s.title}>
          What&apos;s working
        </h3>
        <span className={s.checks} aria-hidden="true">✓✓✓</span>
      </header>
      <ul className={s.list}>
        {wins.map((win) => (
          <li key={win.id} className={s.item}>
            <span className={s.bullet} aria-hidden="true">·</span>
            <span>{win.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
