"use client";

/**
 * StyleSelector
 *
 * Step 1 of the thumbnail workflow: choose a thumbnail style
 * (compare, subject, object, hold).
 */

import s from "../style.module.css";
import type { StyleV2 } from "../thumbnail-types";
import { STYLE_CARDS } from "./style-cards";

type StyleSelectorProps = {
  style: StyleV2;
  onStyleChange: (style: StyleV2) => void;
  disabled: boolean;
};

export function StyleSelector({
  style,
  onStyleChange,
  disabled,
}: StyleSelectorProps) {
  return (
    <div className={`${s.formGroup} ${s.fullWidth}`}>
      <span className={s.label}>1) Choose a Style</span>
      <div className={s.styleGrid}>
        {STYLE_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`${s.styleCard} ${style === card.id ? s.styleCardActive : ""}`}
            onClick={() => onStyleChange(card.id)}
            disabled={disabled}
          >
            <div className={s.styleCardTitle}>{card.title}</div>
            <div className={s.styleCardDesc}>{card.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
