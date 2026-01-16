"use client";

import { useState } from "react";
import s from "./NumberBadge.module.css";
import type { CompetitorNumberAnalysis } from "@/types/api";

type Props = {
  analysis: CompetitorNumberAnalysis;
};

/**
 * NumberBadge - Shows number analysis with tooltip explaining the classification
 *
 * Distinguishes between:
 * - Performance drivers (rankings, lists, time constraints)
 * - Proper nouns (product names like "iPhone 15" or "Black Ops 7")
 */
export default function NumberBadge({ analysis }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!analysis.hasNumber) {
    return null;
  }

  const typeLabels: Record<string, string> = {
    ranking: "Ranking",
    list_count: "List Count",
    episode: "Episode/Part",
    time_constraint: "Time Constraint",
    quantity: "Quantity",
    version: "Version",
    proper_noun: "Product Name",
    year: "Year",
    none: "Number",
  };

  const label = typeLabels[analysis.type] ?? "Number";
  const isDriver = analysis.isPerformanceDriver;

  return (
    <span
      className={s.badge}
      data-driver={isDriver}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {isDriver ? "✓" : "○"} {label}
      {analysis.value && <span className={s.value}>({analysis.value})</span>}

      {showTooltip && (
        <span className={s.tooltip}>
          <span className={s.tooltipTitle}>{analysis.explanation}</span>
          {!isDriver && analysis.type === "proper_noun" && (
            <span className={s.tooltipNote}>
              CTR not available for competitor videos; this is just a product name, not a packaging pattern.
            </span>
          )}
          {isDriver && (
            <span className={s.tooltipNote}>
              CTR not available for competitor videos; this is a packaging pattern observed in high-performing titles.
            </span>
          )}
        </span>
      )}
    </span>
  );
}
