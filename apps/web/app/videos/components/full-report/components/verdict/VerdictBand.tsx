import type { Verdict, VerdictSeverity } from "@/lib/features/full-report";

import s from "./verdict.module.css";

type VerdictBandProps = {
  verdict: Verdict;
};

const SEVERITY_LABEL: Record<VerdictSeverity, string> = {
  critical: "Critical",
  underperforming: "Underperforming",
  on_track: "On track",
  outperforming: "Strong",
};

const SEVERITY_DOT_CLASS: Record<VerdictSeverity, string> = {
  critical: "dotCritical",
  underperforming: "dotUnder",
  on_track: "dotOnTrack",
  outperforming: "dotOver",
};

export function VerdictBand({ verdict }: VerdictBandProps) {
  return (
    <section className={s.band} aria-labelledby="verdict-headline">
      <span
        className={`${s.dot} ${s[SEVERITY_DOT_CLASS[verdict.severity]] ?? ""}`}
        aria-label={SEVERITY_LABEL[verdict.severity]}
        role="img"
      />
      <h2 id="verdict-headline" className={s.headline}>
        {verdict.oneLine}
      </h2>
    </section>
  );
}
