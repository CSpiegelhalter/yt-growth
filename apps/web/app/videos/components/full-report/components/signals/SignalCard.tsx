import type { Signal, SignalCategory, SignalConfidence, SignalSeverity } from "@/lib/features/full-report";

import s from "./signals.module.css";

type SignalCardProps = {
  signal: Signal;
};

const SEVERITY_CLASS: Record<SignalSeverity, string> = {
  critical: "sevCritical",
  improvement: "sevImprovement",
  neutral: "sevNeutral",
  good: "sevGood",
};

const CATEGORY_LABEL: Record<SignalCategory, string> = {
  timing: "Timing",
  discovery: "Discovery",
  engagement: "Engagement",
  structure: "Structure",
  packaging: "Packaging",
  audience: "Audience",
};

const CONFIDENCE_LABEL: Record<SignalConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function SignalCard({ signal }: SignalCardProps) {
  const sevClass = s[SEVERITY_CLASS[signal.severity]] ?? "";
  const hasEvidence = signal.evidence != null && signal.evidence.length > 0;

  return (
    <article className={`${s.card} ${sevClass}`}>
      <p className={s.overline}>
        <span>{CATEGORY_LABEL[signal.category]}</span>
        <span aria-hidden="true" className={s.overlineDot}>·</span>
        <span>{CONFIDENCE_LABEL[signal.confidence]}</span>
      </p>

      <h3 className={s.headline}>{signal.headline}</h3>

      <p className={s.body}>{signal.body}</p>

      {hasEvidence && (
        <ul className={s.evidence} aria-label="Evidence">
          {signal.evidence!.map((e) => (
            <li key={e.label} className={s.evidenceChip}>
              <span className={s.evidenceChipLabel}>{e.label}</span>
              <span className={s.evidenceChipValue}>{e.value}</span>
            </li>
          ))}
        </ul>
      )}

      {signal.recommendation && (
        <p className={s.action}>
          <span aria-hidden="true" className={s.actionArrow}>→</span>
          {signal.recommendation}
        </p>
      )}
    </article>
  );
}
