"use client";

import { useState } from "react";
import s from "../style.module.css";

type Win = {
  label: string;
  metric: string;
  why: string;
};

type Improvement = {
  label: string;
  metric: string;
  fix: string;
};

type TopAction = {
  what: string;
  why: string;
  effort: "low" | "medium" | "high";
};

export type CoreAnalysis = {
  headline?: string;
  wins?: Win[];
  improvements?: Improvement[];
  topAction?: TopAction;
};

type Props = {
  summary: CoreAnalysis;
};

export function AiSummaryCard({ summary }: Props) {
  const [expanded, setExpanded] = useState(false);

  const effortLabel: Record<string, string> = {
    low: "⚡ Quick win",
    medium: "🔧 Some effort",
    high: "🏗️ Major change",
  };

  const wins = summary.wins ?? [];
  const improvements = summary.improvements ?? [];
  const topAction = summary.topAction;

  return (
    <section className={s.aiSummaryCard}>
      {/* Header with headline */}
      <div className={s.aiSummaryHeader}>
        <div className={s.aiIconBadge}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 2a10 10 0 0 1 10 10" />
            <circle cx="12" cy="12" r="6" />
          </svg>
        </div>
        <h2 className={s.aiSummaryHeadline}>
          {summary.headline || "Video Analysis"}
        </h2>
      </div>

      {/* Top Action - Only show if available */}
      {topAction && (
        <div className={s.topActionCard}>
          <div className={s.topActionBadge}>#1 Priority</div>
          <p className={s.topActionWhat}>{topAction.what}</p>
          <p className={s.topActionWhy}>{topAction.why}</p>
          <span className={s.topActionEffort}>
            {effortLabel[topAction.effort] ?? ""}
          </span>
        </div>
      )}

      {/* Wins & Improvements Grid */}
      {(wins.length > 0 || improvements.length > 0) && (
        <div className={s.aiSummaryGrid}>
          {/* Wins Column */}
          {wins.length > 0 && (
            <div className={s.winsCol}>
              <h3 className={s.colTitle}>
                <span className={s.winDot} />
                What&apos;s Working
              </h3>
              <div className={s.colCards}>
                {wins.slice(0, expanded ? undefined : 2).map((win, i) => (
                  <div key={i} className={s.winCard}>
                    <strong>{win.label}</strong>
                    <span className={s.cardMetric}>{win.metric}</span>
                    {expanded && <span className={s.cardWhy}>{win.why}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements Column */}
          {improvements.length > 0 && (
            <div className={s.leaksCol}>
              <h3 className={s.colTitle}>
                <span className={s.leakDot} />
                To Improve
              </h3>
              <div className={s.colCards}>
                {improvements.slice(0, expanded ? undefined : 2).map((item, i) => (
                  <div key={i} className={s.leakCard}>
                    <strong>{item.label}</strong>
                    <span className={s.cardMetric}>{item.metric}</span>
                    {expanded && <span className={s.cardFix}>{item.fix}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expand/Collapse */}
      {(wins.length > 2 || improvements.length > 2) && (
        <button
          className={s.expandBtn}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more details"}
        </button>
      )}
    </section>
  );
}

/**
 * Loading skeleton for the AI Summary
 */
export function AiSummaryLoading() {
  return (
    <section className={s.aiSummaryCard}>
      <div className={s.aiSummaryHeader}>
        <div className={s.aiIconBadge}>
          <div className={s.spinnerSmall} />
        </div>
        <div className={s.aiLoadingBar} style={{ width: "70%" }} />
      </div>
      <div className={s.topActionCard}>
        <div className={s.aiLoadingBar} style={{ width: "30%", marginBottom: "8px" }} />
        <div className={s.aiLoadingBar} style={{ width: "90%", marginBottom: "8px" }} />
        <div className={s.aiLoadingBar} style={{ width: "60%" }} />
      </div>
      <p className={s.aiLoadingText}>Analyzing your video...</p>
    </section>
  );
}

export default AiSummaryCard;
