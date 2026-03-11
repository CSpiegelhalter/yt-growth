"use client";

import Image from "next/image";
import { useState } from "react";

import type { SuggestionAction, VideoSuggestion  } from "@/lib/features/suggestions/types";

import s from "./video-idea-card.module.css";

type VideoIdeaCardProps = {
  suggestion: VideoSuggestion;
  onAction: (suggestionId: string, action: SuggestionAction) => Promise<void>;
};

export function VideoIdeaCard({
  suggestion,
  onAction,
}: VideoIdeaCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction(action: SuggestionAction) {
    setLoading(true);
    try {
      await onAction(suggestion.id, action);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={`${s.card} ${loading ? s.cardLoading : ""}`}>
      <Image
        src="/dashboard/play_button.svg"
        width={34}
        height={34}
        alt=""
        aria-hidden="true"
        className={s.playButton}
      />
      <div className={s.body}>
        <h4 className={s.title}>{suggestion.title}</h4>
        <p className={s.description}>{suggestion.description}</p>
        <div className={s.actions}>
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => handleAction("use")}
            disabled={loading}
            title="Use this idea"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11.25V15C9 15 11.2725 14.5875 12 13.5C12.81 12.285 12 9.75 12 9.75" />
              <path d="M3.375 12.375C2.25 13.32 1.875 16.125 1.875 16.125C1.875 16.125 4.68 15.75 5.625 14.625C6.1575 13.995 6.15 13.0275 5.5575 12.4425C5.26598 12.1643 4.88197 12.0035 4.47917 11.991C4.07637 11.9786 3.68316 12.1153 3.375 12.375Z" />
              <path d="M6.75 9.00019C7.14911 7.96476 7.65165 6.97223 8.25 6.03769C9.12389 4.64043 10.3407 3.48997 11.7848 2.69575C13.2288 1.90154 14.852 1.48996 16.5 1.50019C16.5 3.54019 15.915 7.12519 12 9.75019C11.0525 10.349 10.0475 10.8515 9 11.2502L6.75 9.00019Z" />
              <path d="M6.75 9.00092H3C3 9.00092 3.4125 6.72842 4.5 6.00092C5.715 5.19092 8.25 6.03842 8.25 6.03842" />
            </svg>
            Use this idea
          </button>
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => handleAction("save")}
            disabled={loading}
            title="Save for later"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            Save for later
          </button>
          <button
            type="button"
            className={s.actionBtn}
            onClick={() => handleAction("dismiss")}
            disabled={loading}
            title="Not a fit"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
            </svg>
            Not a fit
          </button>
        </div>
      </div>
    </article>
  );
}
