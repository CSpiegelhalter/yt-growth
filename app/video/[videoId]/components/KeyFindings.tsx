"use client";

import s from "../style.module.css";

type Finding = {
  dataPoint: string;
  finding: string;
  significance: "positive" | "negative" | "neutral";
  recommendation: string;
};

type KeyFindingsProps = {
  findings: Finding[];
};

/**
 * KeyFindings - List of key insights from the video analysis
 */
export function KeyFindings({ findings }: KeyFindingsProps) {
  if (!findings || findings.length === 0) {
    return null;
  }

  return (
    <section className={s.findings}>
      <h2 className={s.sectionTitle}>Key Findings</h2>
      <div className={s.findingsList}>
        {findings.map((finding, i) => (
          <div
            key={i}
            className={`${s.findingItem} ${
              finding.significance === "positive"
                ? s.findingPos
                : finding.significance === "negative"
                ? s.findingNeg
                : s.findingNeutral
            }`}
          >
            <div className={s.findingIndicator}>
              {finding.significance === "positive"
                ? "↑"
                : finding.significance === "negative"
                ? "↓"
                : "→"}
            </div>
            <div className={s.findingContent}>
              <div className={s.findingMeta}>{finding.dataPoint}</div>
              <p className={s.findingText}>{finding.finding}</p>
              <p className={s.findingAction}>→ {finding.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

