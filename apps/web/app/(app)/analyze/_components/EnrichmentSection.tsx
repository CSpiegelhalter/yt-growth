import type { CompetitorVideoAnalysis } from "@/types/api";

import s from "../style.module.css";

type Props = {
  strategicInsights: CompetitorVideoAnalysis["strategicInsights"];
  publicSignals: CompetitorVideoAnalysis["publicSignals"];
};

type VerdictString = "Below Average" | "Average" | "Above Average" | "Exceptional" | "Unknown";

function verdictLevel(verdict: VerdictString): string {
  if (verdict === "Exceptional" || verdict === "Above Average") {return "good";}
  if (verdict === "Average") {return "average";}
  return "low";
}

type TimingValue = NonNullable<CompetitorVideoAnalysis["strategicInsights"]>["postingTiming"];

function RateTile({ label, rate, verdict, decimals }: {
  label: string;
  rate: number;
  verdict: VerdictString;
  decimals: number;
}) {
  return (
    <div className={s.verdictTile}>
      <p className={s.verdictTileLabel}>{label}</p>
      <p className={s.verdictTileValue}>{(rate * 100).toFixed(decimals)}%</p>
      <p className={s.verdictTileMeta}>
        <span className={s.verdictBadge} data-verdict={verdictLevel(verdict)}>{verdict}</span>
      </p>
    </div>
  );
}

function TimingTile({ timing }: { timing: TimingValue }) {
  const time = timing.localTimeFormatted ?? "";
  return (
    <div className={s.verdictTile}>
      <p className={s.verdictTileLabel}>Posted</p>
      <p className={s.verdictTileValue}>{timing.dayOfWeek}</p>
      {time && <p className={s.verdictTileMeta}>{time}</p>}
    </div>
  );
}

function VelocityTile({ ageDays }: { ageDays: number }) {
  return (
    <div className={s.verdictTile}>
      <p className={s.verdictTileLabel}>Age</p>
      <p className={s.verdictTileValue}>{ageDays}d</p>
      <p className={s.verdictTileMeta}>
        {ageDays < 30 ? "Trending" : ageDays < 90 ? "Recent" : "Evergreen"}
      </p>
    </div>
  );
}

function buildVerdictTiles(
  strategicInsights: NonNullable<CompetitorVideoAnalysis["strategicInsights"]>,
  publicSignals: CompetitorVideoAnalysis["publicSignals"],
): React.ReactNode[] {
  const { postingTiming: timing, engagementBenchmarks: benchmarks } = strategicInsights;
  const likeRate = benchmarks?.likeRate ?? null;
  const commentRate = benchmarks?.commentRate ?? null;
  const ageDays = publicSignals?.videoAgeDays;

  const candidates: Array<React.ReactNode | false> = [
    likeRate !== null && benchmarks && (
      <RateTile key="like" label="Like rate" rate={likeRate} verdict={benchmarks.likeRateVerdict} decimals={1} />
    ),
    commentRate !== null && benchmarks && (
      <RateTile key="comment" label="Comment rate" rate={commentRate} verdict={benchmarks.commentRateVerdict} decimals={2} />
    ),
    timing && <TimingTile key="time" timing={timing} />,
    ageDays !== undefined && <VelocityTile key="age" ageDays={ageDays} />,
  ];
  return candidates.filter(Boolean) as React.ReactNode[];
}

export function VerdictTiles({ strategicInsights, publicSignals }: Props) {
  if (!strategicInsights) {return null;}
  const tiles = buildVerdictTiles(strategicInsights, publicSignals);
  if (tiles.length === 0) {return null;}
  return <div className={s.verdictTiles}>{tiles}</div>;
}
