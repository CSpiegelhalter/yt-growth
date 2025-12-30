"use client";

import s from "../style.module.css";

export type CreativeDirections = {
  titleAngles: string[];
  hookSetups: string[];
  visualMoments: string[];
};

type AiRemix = {
  title: string;
  hook: string;
  angle: string;
};

type CreativeDirectionsSectionProps = {
  directions: CreativeDirections | null;
  remixes: AiRemix[];
};

/**
 * Creative directions section (collapsible) within the idea detail sheet
 */
export function CreativeDirectionsSection({
  directions,
  remixes,
}: CreativeDirectionsSectionProps) {
  if (!directions && remixes.length === 0) {
    return null;
  }

  return (
    <section className={s.sheetSection}>
      <details className={s.sectionDetails}>
        <summary className={s.sectionSummary}>
          <span className={s.sectionSummaryTitle}>Creative directions</span>
          <span className={s.sectionSummaryHint}>
            Title angles, openers, and visuals
          </span>
        </summary>

        {directions && (
          <div className={s.directionsGrid}>
            {directions.titleAngles.length > 0 && (
              <div className={s.directionsCard}>
                <div className={s.directionsLabel}>Title angles</div>
                <ul className={s.directionsList}>
                  {directions.titleAngles.slice(0, 6).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {directions.hookSetups.length > 0 && (
              <div className={s.directionsCard}>
                <div className={s.directionsLabel}>Openers</div>
                <ul className={s.directionsList}>
                  {directions.hookSetups.slice(0, 6).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {directions.visualMoments.length > 0 && (
              <div className={s.directionsCard}>
                <div className={s.directionsLabel}>Visual moments</div>
                <ul className={s.directionsList}>
                  {directions.visualMoments.slice(0, 6).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {remixes.length > 0 && (
          <div className={s.remixList}>
            {remixes.slice(0, 4).map((r, i) => (
              <div key={i} className={s.remixPrompt}>
                {r.title && <div className={s.remixPromptTitle}>{r.title}</div>}
                {r.angle && <div className={s.remixPromptAngle}>{r.angle}</div>}
                {r.hook && (
                  <div className={s.remixPromptHook}>&ldquo;{r.hook}&rdquo;</div>
                )}
              </div>
            ))}
          </div>
        )}
      </details>
    </section>
  );
}

