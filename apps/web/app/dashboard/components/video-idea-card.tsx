"use client";

import { useState } from "react";

import type { SourceProvenance, SuggestionAction, VideoSuggestion } from "@/lib/features/suggestions/types";

import s from "./video-idea-card.module.css";

type VideoIdeaCardProps = {
  suggestion: VideoSuggestion;
  onAction: (suggestionId: string, action: SuggestionAction) => Promise<void>;
  isPro?: boolean;
  onViewSource?: (suggestionId: string) => void;
};

type SourceContext = {
  provenance?: SourceProvenance | null;
  generationMode?: string;
  confidence?: number;
  similarIdeaId?: string | null;
  targetKeywords?: string[];
  keywordVolume?: number;
  keywordDifficulty?: number | null;
  keywordTrend?: string | null;
  keywordYouTubeValidated?: boolean;
  publishTimingHint?: string | null;
};

type OpportunityTier = "amazing" | "great" | "good" | "worth_trying";

type Opportunity = {
  label: string;
  tier: OpportunityTier;
  reason: string;
};

/**
 * Multi-factor opportunity scoring.
 *
 * Amazing  = high demand + low difficulty + competitor-validated + rising/YT-validated
 * Great    = strong demand + manageable difficulty + good evidence
 * Good     = decent demand or low difficulty, some evidence
 * Worth trying = emerging signal, speculative
 *
 * Each factor earns points. The total determines the tier.
 */
function computeOpportunity(ctx: {
  volume: number;
  difficulty: number | null;
  confidence: number;
  hasProvenance: boolean;
  trend: string | null;
  ytValidated: boolean;
}): Opportunity {
  const { volume, difficulty, confidence, hasProvenance, trend, ytValidated } = ctx;
  const diff = difficulty ?? 50;
  let points = 0;
  const reasons: string[] = [];

  // Demand signal (0-4 points)
  if (volume >= 10_000) { points += 4; reasons.push("high search demand"); }
  else if (volume >= 1_000) { points += 3; reasons.push("solid search demand"); }
  else if (volume >= 100) { points += 2; reasons.push("niche demand"); }
  else { points += 1; }

  // Competition (0-3 points)
  if (diff <= 20) { points += 3; reasons.push("very low competition"); }
  else if (diff <= 40) { points += 2; reasons.push("low competition"); }
  else if (diff <= 60) { points += 1; }

  // Evidence quality (0-3 points)
  if (hasProvenance && confidence >= 3) { points += 3; reasons.push("strong competitor evidence"); }
  else if (hasProvenance && confidence >= 2) { points += 2; reasons.push("competitor-backed"); }
  else if (hasProvenance) { points += 1; }

  // Trend momentum (0-2 points)
  if (trend === "rising") { points += 2; reasons.push("trending up"); }
  else if (trend === "stable") { points += 1; }

  // YouTube validation (0-1 point)
  if (ytValidated) { points += 1; reasons.push("YouTube search validated"); }

  // Total: 0-13 points
  if (points >= 10) return { label: "Amazing opportunity", tier: "amazing", reason: reasons.slice(0, 2).join(" + ") };
  if (points >= 7) return { label: "Great opportunity", tier: "great", reason: reasons.slice(0, 2).join(" + ") };
  if (points >= 4) return { label: "Good opportunity", tier: "good", reason: reasons[0] ?? "" };
  return { label: "Worth trying", tier: "worth_trying", reason: reasons[0] ?? "emerging topic" };
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getDifficultyText(d: number): string {
  if (d <= 30) return "Easy";
  if (d <= 60) return "Medium";
  return "Hard";
}

function ConfidenceDotsInline({ score }: { score: number }) {
  return (
    <span className={s.tooltipConfDots}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`${s.tooltipConfDot} ${i <= score ? s.tooltipConfDotFilled : ""}`}
        />
      ))}
    </span>
  );
}

export function VideoIdeaCard({
  suggestion,
  onAction,
  isPro = false,
  onViewSource,
}: VideoIdeaCardProps) {
  const [loading, setLoading] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const ctx = suggestion.sourceContext as unknown as SourceContext;
  const provenance = ctx?.provenance ?? null;
  const isCompetitorBacked = ctx?.generationMode === "competitor_backed" && provenance;
  const confidence = ctx?.confidence ?? 1;
  const similarIdeaId = ctx?.similarIdeaId ?? null;
  const targetKeywords = ctx?.targetKeywords ?? [];
  const keywordVolume = ctx?.keywordVolume ?? 0;
  const keywordDifficulty = ctx?.keywordDifficulty ?? null;
  const publishTimingHint = ctx?.publishTimingHint ?? null;

  const keywordTrend = ctx?.keywordTrend ?? null;
  const keywordYTValidated = ctx?.keywordYouTubeValidated ?? false;

  const hasOpportunityData = targetKeywords.length > 0 && keywordVolume > 0;
  const opportunity = hasOpportunityData
    ? computeOpportunity({
        volume: keywordVolume,
        difficulty: keywordDifficulty,
        confidence,
        hasProvenance: !!provenance,
        trend: keywordTrend,
        ytValidated: keywordYTValidated,
      })
    : null;

  async function handleAction(action: SuggestionAction) {
    setLoading(true);
    try {
      await onAction(suggestion.id, action);
    } finally {
      setLoading(false);
    }
  }

  const sourceVideo = provenance?.sourceVideos?.[0];

  return (
    <article className={`${s.card} ${loading ? s.cardLoading : ""}`}>
      <div className={s.body}>
        <div className={s.titleRow}>
          <h4 className={s.title}>{suggestion.title}</h4>
        </div>
        <p className={s.description}>{suggestion.description}</p>

        {similarIdeaId && (
          <p className={s.duplicateNote}>
            You have a similar idea already planned.
          </p>
        )}

        {/* Opportunity indicator with hover tooltip */}
        {opportunity && isPro && (
          <div className={s.opportunityWrap}>
            <div className={`${s.opportunityBar} ${s[`opp_${opportunity.tier}`]}`}>
              <span className={s.oppDot} />
              <span className={s.oppLabel}>{opportunity.label}</span>
              {opportunity.reason && (
                <span className={s.oppReason}>{opportunity.reason}</span>
              )}
            </div>
            <div className={s.tooltip}>
              <div className={s.tooltipRow}>
                <span className={s.tooltipLabel}>Keyword</span>
                <span className={s.tooltipValue}>{targetKeywords[0]}</span>
              </div>
              {keywordVolume > 0 && (
                <div className={s.tooltipRow}>
                  <span className={s.tooltipLabel}>Volume</span>
                  <span className={s.tooltipValue}>{formatVolume(keywordVolume)}/mo</span>
                </div>
              )}
              {keywordDifficulty !== null && (
                <div className={s.tooltipRow}>
                  <span className={s.tooltipLabel}>Difficulty</span>
                  <span className={s.tooltipValue}>{getDifficultyText(keywordDifficulty)} ({keywordDifficulty}/100)</span>
                </div>
              )}
              <div className={s.tooltipRow}>
                <span className={s.tooltipLabel}>Confidence</span>
                <ConfidenceDotsInline score={confidence} />
              </div>
              {publishTimingHint && (
                <div className={s.tooltipTiming}>{publishTimingHint}</div>
              )}
            </div>
          </div>
        )}

        {/* Evidence strip — collapsible, clickable to view source */}
        {isCompetitorBacked && isPro && sourceVideo ? (
          <div className={s.evidenceWrap}>
            <button
              type="button"
              className={s.evidenceToggle}
              onClick={() => setEvidenceOpen(!evidenceOpen)}
              aria-expanded={evidenceOpen}
            >
              <span className={s.evidenceLabel}>Based on</span>
              <span className={s.evidenceSource}>
                &ldquo;{sourceVideo.title}&rdquo;
              </span>
              <svg
                className={s.evidenceChevron}
                data-expanded={evidenceOpen}
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {evidenceOpen && (
              <div
                className={s.evidenceStrip}
                onClick={() => onViewSource?.(suggestion.id)}
                role={onViewSource ? "button" : undefined}
                tabIndex={onViewSource ? 0 : undefined}
                onKeyDown={(e) => { if (e.key === "Enter" && onViewSource) onViewSource(suggestion.id); }}
              >
                {sourceVideo.thumbnailUrl && (
                  <img
                    src={sourceVideo.thumbnailUrl}
                    alt=""
                    className={s.evidenceThumb}
                    loading="lazy"
                  />
                )}
                <div className={s.evidenceInfo}>
                  <span className={s.evidenceChannel}>
                    {sourceVideo.channelTitle}
                    {sourceVideo.stats.viewsPerDay > 0 &&
                      ` \u00B7 ${Math.round(sourceVideo.stats.viewsPerDay).toLocaleString()} views/day`}
                  </span>
                  {provenance.adaptationAngle && (
                    <span className={s.evidenceAngle}>
                      <strong>Your angle:</strong> {provenance.adaptationAngle}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={s.evidenceFallback}>
            <span className={s.evidenceLabel}>Based on your channel profile and niche trends</span>
          </div>
        )}

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
