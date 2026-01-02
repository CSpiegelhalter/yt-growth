"use client";

import { useState } from "react";
import s from "./DataLimitations.module.css";

type Props = {
  whatWeCanKnow: string[];
  whatWeCantKnow: string[];
};

/**
 * DataLimitations - Honest disclosure about what data is available
 * for competitor videos vs owned videos.
 *
 * This builds trust by being transparent about our limitations.
 */
export default function DataLimitations({ whatWeCanKnow, whatWeCantKnow }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={s.container}>
      <button
        className={s.toggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={s.icon}>ℹ️</span>
        <span className={s.label}>What we can &amp; can&apos;t know about competitor videos</span>
        <span className={s.chevron} data-expanded={isExpanded}>
          ›
        </span>
      </button>

      {isExpanded && (
        <div className={s.content}>
          <div className={s.column}>
            <h4 className={s.columnTitle}>
              <span className={s.checkIcon}>✓</span>
              What we can measure
            </h4>
            <ul className={s.list}>
              {whatWeCanKnow.map((item, i) => (
                <li key={i} className={s.canItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className={s.column}>
            <h4 className={s.columnTitle}>
              <span className={s.xIcon}>✕</span>
              What we can&apos;t know
            </h4>
            <ul className={s.list}>
              {whatWeCantKnow.map((item, i) => (
                <li key={i} className={s.cantItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
