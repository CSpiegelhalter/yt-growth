import type { ScoreStripData } from "@/lib/features/full-report";
import { describeBaselineConfidence } from "@/lib/owned-video-baseline";

import s from "./score-strip.module.css";
import { ScoreTile } from "./ScoreTile";

type ScoreStripProps = {
  data: ScoreStripData;
};

export function ScoreStrip({ data }: ScoreStripProps) {
  const fallbackNote = describeBaselineConfidence(data);
  return (
    <section className={s.strip} aria-label="Score strip">
      <div className={s.tileGrid}>
        {data.tiles.map((tile) => (
          <ScoreTile key={tile.id} tile={tile} />
        ))}
      </div>
      {fallbackNote && <p className={s.fallbackNote}>{fallbackNote}</p>}
    </section>
  );
}
