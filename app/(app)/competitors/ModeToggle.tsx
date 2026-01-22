"use client";

import s from "./style.module.css";

export type TopLevelMode = "search" | "discover";

type Props = {
  mode: TopLevelMode;
  onModeChange: (mode: TopLevelMode) => void;
};

/**
 * ModeToggle - Segmented control for Search | Discover modes
 *
 * A clean, accessible segmented control that lets users switch
 * between manual search and niche discovery.
 */
export default function ModeToggle({ mode, onModeChange }: Props) {
  return (
    <div className={s.modeToggle} role="tablist" aria-label="Search mode">
      <button
        role="tab"
        aria-selected={mode === "search"}
        className={`${s.modeTab} ${mode === "search" ? s.modeTabActive : ""}`}
        onClick={() => onModeChange("search")}
        type="button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        Search
      </button>
      <button
        role="tab"
        aria-selected={mode === "discover"}
        className={`${s.modeTab} ${mode === "discover" ? s.modeTabActive : ""}`}
        onClick={() => onModeChange("discover")}
        type="button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
        Discover
      </button>
    </div>
  );
}
