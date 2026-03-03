"use client";

/**
 * GenerateButtonBody
 *
 * Inner content of the generate button, showing either a spinner
 * with status text (during generation) or the generate icon + label.
 */

import s from "../style.module.css";

type GenerateButtonBodyProps = {
  generating: boolean;
  generationPhase: "training" | "generating" | null;
  includeIdentity: boolean;
  identityReady: boolean;
  compact?: boolean;
};

export function GenerateButtonBody({
  generating,
  generationPhase,
  includeIdentity,
  identityReady,
  compact,
}: GenerateButtonBodyProps) {
  if (generating) {
    const label =
      generationPhase === "training"
        ? compact
          ? "Training\u2026"
          : "Training identity\u2026"
        : "Generating\u2026";
    return (
      <>
        <span className={s.spinner} />
        {label}
      </>
    );
  }

  const label =
    includeIdentity && !identityReady
      ? "Train & Generate"
      : compact
        ? "Generate"
        : "Generate 3 Variants";

  return (
    <>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      {label}
    </>
  );
}
