"use client";

import type { SuggestionAction, VideoSuggestion  } from "@/lib/features/suggestions/types";

import { SuggestionEngineCard } from "./suggestion-engine-card";
import s from "./suggestion-panel.module.css";
import { VideoIdeaCard } from "./video-idea-card";

type SuggestionPanelProps = {
  suggestions: VideoSuggestion[];
  loading: boolean;
  error: string | null;
  onAction: (suggestionId: string, action: SuggestionAction) => Promise<void>;
  onRetry: () => void;
};

export function SuggestionPanel({
  suggestions,
  loading,
  error,
  onAction,
  onRetry,
}: SuggestionPanelProps) {
  if (loading) {
    return (
      <div className={s.panel}>
        <h2 className={s.panelTitle}>Video Suggestions</h2>
        <div className={s.loadingStack}>
          <div className={s.skeleton} />
          <div className={s.skeleton} />
          <div className={s.skeleton} />
          <div className={s.skeleton} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.panel}>
        <h2 className={s.panelTitle}>Video Suggestions</h2>
        <div className={s.errorState}>
          <p>{error}</p>
          <button type="button" className={s.retryBtn} onClick={onRetry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.panel}>
      <h2 className={s.panelTitle}>Video Suggestions</h2>
      <SuggestionEngineCard />
      {suggestions.map((suggestion) => (
        <VideoIdeaCard
          key={suggestion.id}
          suggestion={suggestion}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
