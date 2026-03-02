import type { HookAnalysis } from "@/lib/features/full-report";

import { formatTimestamp } from "./format-timestamp";
import s from "./hook-analysis.module.css";
import { parseNarrativeHook } from "./parse-narrative-hook";

type HookAnalysisSectionProps = {
  hookAnalysis: HookAnalysis;
};

export function HookAnalysisSection({ hookAnalysis }: HookAnalysisSectionProps) {
  const windowSec = hookAnalysis.hookWindowSeconds ?? 25;
  const narrativeSteps = parseNarrativeHook(hookAnalysis.scriptFix);

  return (
    <div className={s.hookComparison}>
      <div className={`${s.hookPanel} ${s.hookPanelIssue}`}>
        <div className={s.hookPanelTop}>
          <span className={s.hookPanelLabel}>Current Hook</span>
          <span className={s.hookTimestamp}>{formatTimestamp(windowSec)}</span>
        </div>
        {hookAnalysis.currentScript ? (
          <>
            <blockquote className={s.hookCurrentScript}>{hookAnalysis.currentScript}</blockquote>
            <p className={s.hookPanelText}>Weakness: {hookAnalysis.issue}</p>
          </>
        ) : (
          <p className={s.hookPanelText}>{hookAnalysis.issue}</p>
        )}
      </div>

      {hookAnalysis.scriptFix && (
        <div className={`${s.hookPanel} ${s.hookPanelFix}`}>
          <div className={s.hookPanelTop}>
            <span className={s.hookPanelLabel}>
              {narrativeSteps ? "3-Point Narrative Hook" : "Recommended Flow"}
            </span>
          </div>
          {narrativeSteps ? (
            <ol className={s.hookNarrativeList}>
              {narrativeSteps.map((step) => (
                <li key={step.label} className={s.hookNarrativeStep}>
                  <span className={s.hookNarrativeLabel}>{step.label}</span>
                  {step.text}
                </li>
              ))}
            </ol>
          ) : hookAnalysis.scriptFix.includes("\n") ? (
            <ol className={s.hookOutlineList}>
              {hookAnalysis.scriptFix.split("\n").filter(Boolean).map((step, i) => (
                <li key={i} className={s.hookOutlineStep}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className={s.hookPanelText}>{hookAnalysis.scriptFix}</p>
          )}
        </div>
      )}
    </div>
  );
}
