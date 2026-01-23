"use client";

import s from "../style.module.css";
import type { Idea } from "@/types/api";

type ScriptOutlineSectionProps = {
  scriptOutline: Idea["scriptOutline"];
};

/**
 * Script outline section (collapsible) within the idea detail sheet
 */
export function ScriptOutlineSection({
  scriptOutline,
}: ScriptOutlineSectionProps) {
  if (!scriptOutline) {
    return null;
  }

  return (
    <section className={s.sheetSection}>
      <details className={s.scriptDetails}>
        <summary className={s.scriptSummary}>
          <span className={s.scriptSummaryTitle}>Script outline</span>
          <span className={s.scriptSummaryHint}>
            Optional structure — keep it punchy
          </span>
        </summary>
        <div className={s.scriptGrid}>
          {scriptOutline.hook && (
            <div className={s.scriptCard}>
              <div className={s.scriptCardTitle}>
                Hook <span className={s.scriptTiming}>0–10s</span>
              </div>
              <p className={s.scriptCardBody}>{scriptOutline.hook}</p>
            </div>
          )}
          {scriptOutline.setup && (
            <div className={s.scriptCard}>
              <div className={s.scriptCardTitle}>
                Setup <span className={s.scriptTiming}>10–40s</span>
              </div>
              <p className={s.scriptCardBody}>{scriptOutline.setup}</p>
            </div>
          )}
          {scriptOutline.mainPoints && scriptOutline.mainPoints.length > 0 && (
            <div className={s.scriptCard}>
              <div className={s.scriptCardTitle}>Main points</div>
              <ol className={s.scriptPoints}>
                {scriptOutline.mainPoints.slice(0, 6).map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ol>
            </div>
          )}
          {scriptOutline.payoff && (
            <div className={s.scriptCard}>
              <div className={s.scriptCardTitle}>Payoff</div>
              <p className={s.scriptCardBody}>{scriptOutline.payoff}</p>
            </div>
          )}
          {scriptOutline.cta && (
            <div className={s.scriptCard}>
              <div className={s.scriptCardTitle}>Call to action</div>
              <p className={s.scriptCardBody}>{scriptOutline.cta}</p>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

