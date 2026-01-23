"use client";

import { useState } from "react";
import s from "./style.module.css";
import type { IdeaBoardData } from "@/types/api";

type NicheInsightsBarProps = {
  insights: IdeaBoardData["nicheInsights"];
};

/**
 * NicheInsightsBar - Expandable bar showing niche intelligence
 */
export function NicheInsightsBar({ insights }: NicheInsightsBarProps) {
  const [expanded, setExpanded] = useState(false);

  // Combine old and new field names for backwards compatibility
  const patterns = insights.winningPatterns ?? insights.patternsToCopy ?? [];
  const gaps = insights.contentGaps ?? insights.gapsToExploit ?? [];
  const avoid = insights.avoidThese ?? [];

  if (
    !insights.momentumNow.length &&
    !patterns.length &&
    !gaps.length &&
    !avoid.length
  ) {
    return null;
  }

  return (
    <div className={s.insightsBar}>
      <button
        className={s.insightsToggle}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={s.insightsIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </span>
        <span className={s.insightsLabel}>Niche Insights</span>
        <span className={s.insightsChevron}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className={s.insightsContent}>
          {insights.momentumNow.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Momentum now</h4>
              <ul className={s.insightList}>
                {insights.momentumNow.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {patterns.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Winning patterns</h4>
              <ul className={s.insightList}>
                {patterns.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {gaps.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Content gaps</h4>
              <ul className={s.insightList}>
                {gaps.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {avoid.length > 0 && (
            <div className={s.insightBlock}>
              <h4 className={s.insightTitle}>Avoid these</h4>
              <ul className={s.insightList}>
                {avoid.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

