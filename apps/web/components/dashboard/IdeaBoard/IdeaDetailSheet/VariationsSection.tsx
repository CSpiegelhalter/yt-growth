"use client";

import s from "../style.module.css";
import type { Idea } from "@/types/api";
import { formatRemixLabel, truncate } from "../helpers";

type VariationsSectionProps = {
  remixVariants: Idea["remixVariants"];
};

/**
 * Variations section showing alternative takes on the same idea
 */
export function VariationsSection({ remixVariants }: VariationsSectionProps) {
  if (!remixVariants || Object.keys(remixVariants).length === 0) {
    return null;
  }

  return (
    <section className={s.sheetSection}>
      <h3 className={s.sectionTitle}>Variations</h3>
      <p className={s.sectionIntro}>
        Same premise, different angle. Use these if you want a sharper take.
      </p>
      <div className={s.remixCards}>
        {Object.entries(remixVariants)
          .slice(0, 3)
          .map(([key, variant]) => (
            <div key={key} className={s.remixCard}>
              <h4 className={s.remixCardTitle}>
                {formatRemixLabel(key)} version
              </h4>
              {variant.titles?.[0]?.text && (
                <p className={s.remixCardTitle2}>{variant.titles[0].text}</p>
              )}
              {variant.hooks?.[0]?.text && (
                <p className={s.remixCardHook}>
                  &ldquo;{truncate(variant.hooks[0].text, 78)}&rdquo;
                </p>
              )}
            </div>
          ))}
      </div>
    </section>
  );
}

