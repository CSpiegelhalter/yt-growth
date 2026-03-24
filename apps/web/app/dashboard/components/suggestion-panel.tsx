"use client";

import type { SuggestionAction, VideoSuggestion } from "@/lib/features/suggestions/types";

import { CompetitorDiscoveryInline } from "./competitor-discovery-inline";
import s from "./suggestion-panel.module.css";
import { VideoIdeaCard } from "./video-idea-card";

type SuggestionPanelProps = {
  suggestions: VideoSuggestion[];
  loading: boolean;
  error: string | null;
  onAction: (suggestionId: string, action: SuggestionAction) => Promise<void>;
  onRetry: () => void;
  onGenerate: () => void;
  researchPhase: "idle" | "researching" | "generating";
  researchStatus: string | null;
  researchError: string | null;
  channelId?: string | null;
  youtubeChannelId?: string | null;
  isPro?: boolean;
  onViewSource?: (suggestionId: string) => void;
  needsDiscovery?: boolean;
  onDiscoveryComplete?: () => void;
};

export function SuggestionPanel({
  suggestions,
  loading,
  error,
  onAction,
  onRetry,
  onGenerate,
  researchPhase,
  researchStatus,
  researchError,
  isPro = false,
  onViewSource,
  needsDiscovery = false,
  channelId,
  youtubeChannelId,
  onDiscoveryComplete,
}: SuggestionPanelProps) {
  if (loading) {
    return (
      <div className={s.panel}>
        <h2 className={s.panelTitle}>Ideas for your channel</h2>
        <div className={s.loadingStack}>
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
        <h2 className={s.panelTitle}>Ideas for your channel</h2>
        <div className={s.errorState}>
          <p>{error}</p>
          <button type="button" className={s.retryBtn} onClick={onRetry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const busy = researchPhase !== "idle";

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <h2 className={s.panelTitle}>Ideas for your channel</h2>
        {isPro && !busy && (
          <button
            type="button"
            className={s.refreshBtn}
            onClick={onGenerate}
          >
            Refresh ideas
          </button>
        )}
      </div>

      {/* Inline competitor discovery — shown when Pro user has no saved competitors */}
      {needsDiscovery && isPro && !busy && channelId && youtubeChannelId && onDiscoveryComplete && (
        <CompetitorDiscoveryInline
          channelId={channelId}
          youtubeChannelId={youtubeChannelId}
          onComplete={onDiscoveryComplete}
        />
      )}

      {/* Regeneration progress overlay */}
      {busy && (
        <div className={s.researchProgress}>
          <span className={s.spinner} />
          <p className={s.researchStatus}>{researchStatus}</p>
        </div>
      )}

      {/* Idea cards — muted during regeneration */}
      <div className={`${s.cardsStack} ${busy ? s.cardsMuted : ""}`}>
        {suggestions.map((suggestion) => (
          <VideoIdeaCard
            key={suggestion.id}
            suggestion={suggestion}
            onAction={onAction}
            isPro={isPro}
            onViewSource={onViewSource}
          />
        ))}
      </div>

      {researchError && (
        <div className={s.researchErrorBox}>
          <p>Couldn&apos;t generate competitor-backed ideas.</p>
          <button type="button" className={s.retryBtn} onClick={onGenerate}>
            Retry
          </button>
        </div>
      )}

      {/* Free user CTA */}
      {!isPro && suggestions.length > 0 && (
        <div className={s.upgradeCta}>
          <p className={s.upgradeText}>See why these ideas are working</p>
          <button type="button" className={s.upgradeLink} onClick={onGenerate}>
            Unlock competitor-backed insights
          </button>
        </div>
      )}

    </div>
  );
}
