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

function isPositiveVerdict(verdict: VerdictString): boolean {
  return verdict === "Exceptional" || verdict === "Above Average";
}

function velocityInsight(ageDays: number): string {
  if (ageDays < 30) {return "This topic is trending now — act quickly if you want to ride the wave.";}
  if (ageDays < 90) {return "Still relevant — you have time to create a well-produced version.";}
  return "Evergreen content — focus on quality and SEO over speed.";
}

function DifficultyCard({ difficulty }: { difficulty: NonNullable<CompetitorVideoAnalysis["strategicInsights"]>["competitionDifficulty"] }) {
  const isAccessible = difficulty.score === "Easy" || difficulty.score === "Medium";
  return (
    <div className={s.enrichmentCard}>
      <p className={s.enrichmentLabel}>Competition Difficulty</p>
      <p className={s.enrichmentValue}>
        <span className={s.difficultyBadge} data-level={difficulty.score.toLowerCase()}>
          {difficulty.score}
        </span>
      </p>
      {difficulty.reasons.length > 0 && (
        <p className={s.enrichmentDetail}>{difficulty.reasons[0]}</p>
      )}
      <p className={s.enrichmentDetail}>
        <strong>What this means for you:</strong>{" "}
        {isAccessible
          ? "Good opportunity — there's room for your take on this topic."
          : "High competition — you'll need a strong unique angle to stand out."}
      </p>
    </div>
  );
}

function BenchmarkCard({ label, rate, verdict, positiveMsg, negativeMsg }: {
  label: string;
  rate: number;
  verdict: VerdictString;
  positiveMsg: string;
  negativeMsg: string;
}) {
  return (
    <div className={s.enrichmentCard}>
      <p className={s.enrichmentLabel}>{label}</p>
      <p className={s.enrichmentValue}>
        {(rate * 100).toFixed(label === "Like Rate" ? 1 : 2)}%
        <span className={s.verdictBadge} data-verdict={verdictLevel(verdict)}>
          {verdict}
        </span>
      </p>
      <p className={s.enrichmentDetail}>
        <strong>What this means for you:</strong>{" "}
        {isPositiveVerdict(verdict) ? positiveMsg : negativeMsg}
      </p>
    </div>
  );
}

function TimingCard({ timing }: { timing: NonNullable<CompetitorVideoAnalysis["strategicInsights"]>["postingTiming"] }) {
  const timeStr = timing.localTimeFormatted ? ` at ${timing.localTimeFormatted}` : "";
  return (
    <div className={s.enrichmentCard}>
      <p className={s.enrichmentLabel}>Posting Timing</p>
      <p className={s.enrichmentValue}>{timing.dayOfWeek}{timeStr}</p>
      <p className={s.enrichmentDetail}>{timing.timingInsight}</p>
    </div>
  );
}

function VelocityCard({ ageDays }: { ageDays: number }) {
  return (
    <div className={s.enrichmentCard}>
      <p className={s.enrichmentLabel}>Content Velocity</p>
      <p className={s.enrichmentValue}>{ageDays} days old</p>
      <p className={s.enrichmentDetail}>
        <strong>What this means for you:</strong> {velocityInsight(ageDays)}
      </p>
    </div>
  );
}

function BenchmarkCards({ benchmarks }: { benchmarks: NonNullable<CompetitorVideoAnalysis["strategicInsights"]>["engagementBenchmarks"] }) {
  return (
    <>
      {benchmarks.likeRate !== null && (
        <BenchmarkCard
          label="Like Rate"
          rate={benchmarks.likeRate}
          verdict={benchmarks.likeRateVerdict}
          positiveMsg="Viewers clearly enjoyed this — study what made it satisfying."
          negativeMsg="Room to improve viewer satisfaction with your version."
        />
      )}
      {benchmarks.commentRate !== null && (
        <BenchmarkCard
          label="Comment Rate"
          rate={benchmarks.commentRate}
          verdict={benchmarks.commentRateVerdict}
          positiveMsg="Strong discussion driver — add a call-to-action to capture this engagement."
          negativeMsg="Consider adding prompts or questions to drive more discussion."
        />
      )}
    </>
  );
}

export function EnrichmentSection({ strategicInsights, publicSignals }: Props) {
  if (!strategicInsights) {return null;}

  const { competitionDifficulty: difficulty, postingTiming: timing, engagementBenchmarks: benchmarks } = strategicInsights;

  if (!difficulty && !timing && !benchmarks) {return null;}

  return (
    <div className={s.enrichmentGrid}>
      {difficulty && <DifficultyCard difficulty={difficulty} />}
      {timing && <TimingCard timing={timing} />}
      {benchmarks && <BenchmarkCards benchmarks={benchmarks} />}
      {publicSignals?.videoAgeDays && <VelocityCard ageDays={publicSignals.videoAgeDays} />}
    </div>
  );
}
