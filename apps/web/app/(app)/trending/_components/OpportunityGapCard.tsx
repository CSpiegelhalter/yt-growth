"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";

import { AuthModal } from "@/components/auth";

import s from "../style.module.css";
import type { GeneratedIdea, OpportunityGap, TrendMomentum } from "../types";

type Props = {
  gap: OpportunityGap;
};

const MOMENTUM_LABELS: Record<TrendMomentum, { label: string; className: string }> = {
  hot: { label: "Hot", className: s.badgeHot },
  rising: { label: "Rising", className: s.badgeRising },
  steady: { label: "Steady", className: s.badgeSteady },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) {return `${(n / 1_000_000).toFixed(1)}M`;}
  if (n >= 1_000) {return `${(n / 1_000).toFixed(1)}K`;}
  return String(n);
}

function getOpportunityLabel(difficulty: number): { label: string; className: string } {
  if (difficulty <= 30) {return { label: "Easy Win", className: s.opportunityEasy };}
  if (difficulty <= 60) {return { label: "Good Opportunity", className: s.opportunityGood };}
  return { label: "Competitive", className: s.opportunityHard };
}

export function OpportunityGapCard({ gap }: Props) {
  const { data: session } = useSession();
  const isGuest = !session?.user;

  const [idea, setIdea] = useState<GeneratedIdea | null>(null);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [showTrendTooltip, setShowTrendTooltip] = useState(false);
  const [showOpportunityTooltip, setShowOpportunityTooltip] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const momentum = MOMENTUM_LABELS[gap.trendMomentum];
  const opportunity = getOpportunityLabel(gap.keywordDifficulty);

  const handleGenerateIdea = useCallback(async () => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    setIdeaLoading(true);
    try {
      const res = await fetch("/api/ideas/from-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: gap.keyword,
          gapScore: gap.gapScore,
          trendMomentum: gap.trendMomentum,
          category: gap.category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIdea(data.ideas?.[0] ?? null);
      }
    } catch {
      // User can retry
    } finally {
      setIdeaLoading(false);
    }
  }, [gap, isGuest]);

  return (
    <>
      <div className={s.gapCard}>
        {/* Header: momentum badge · keyword · opportunity badge — all on one row */}
        <div className={s.gapHeader}>
          {/* Trend badge — hidden for "steady" */}
          {gap.trendMomentum !== "steady" && (
            <div
              className={s.gapBadgeWrap}
              onMouseEnter={() => setShowTrendTooltip(true)}
              onMouseLeave={() => setShowTrendTooltip(false)}
            >
              <span className={`${s.gapBadge} ${momentum.className}`}>
                {momentum.label}
              </span>
              {showTrendTooltip && gap.articles.length > 0 && (
                <div className={s.gapTooltip}>
                  <p className={s.gapTooltipTitle}>{gap.articles[0].title}</p>
                  <span className={s.gapTooltipSource}>{gap.articles[0].source}</span>
                </div>
              )}
            </div>
          )}

          <h3 className={`${s.gapKeyword} ${s.gapHeaderTitle}`}>{gap.keyword}</h3>

          {/* Opportunity level badge with hover tooltip */}
          <div
            className={s.gapBadgeWrap}
            onMouseEnter={() => setShowOpportunityTooltip(true)}
            onMouseLeave={() => setShowOpportunityTooltip(false)}
          >
            <span className={`${s.opportunityLabel} ${opportunity.className}`}>
              {opportunity.label}
            </span>
            {showOpportunityTooltip && (
              <div className={s.gapTooltip}>
                <p className={s.gapTooltipTitle}>
                  {gap.keywordDifficulty <= 30
                    ? "Low competition — great for smaller channels"
                    : gap.keywordDifficulty <= 60
                      ? "Moderate competition — rank with quality content"
                      : "High competition — needs strong authority to rank"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metrics row */}
        <div className={s.gapMetrics}>
          <div className={s.gapMetric}>
            <span className={s.gapMetricLabel}>Monthly searches</span>
            <span className={s.gapMetricValue}>{formatNumber(gap.searchVolume)}</span>
          </div>
          <div className={s.gapMetric}>
            <span className={s.gapMetricLabel}>Difficulty</span>
            <span className={`${s.gapMetricValue} ${s.gapMetricGreen}`}>
              {gap.keywordDifficulty}/100
            </span>
          </div>
        </div>

        {/* Difficulty bar (visual, not a score) */}
        <div className={s.gapScoreBar}>
          <div
            className={s.gapScoreFill}
            style={{ width: `${Math.max(100 - gap.keywordDifficulty, 5)}%` }}
          />
        </div>

        {/* Competitor overlap badge */}
        {gap.competitorMatches.count > 0 && (
          <div className={s.gapCompetitorBadge}>
            {gap.competitorMatches.count} competitor{gap.competitorMatches.count > 1 ? "s" : ""} covered this
          </div>
        )}

        {/* Generated idea */}
        {idea && (
          <div className={s.gapIdea}>
            <p className={s.gapIdeaTitle}>{idea.title}</p>
            <p className={s.gapIdeaHook}>{idea.hook}</p>
          </div>
        )}

        {/* Actions */}
        <div className={s.gapActions}>
          <Link
            href={`/keywords?q=${encodeURIComponent(gap.keyword)}`}
            className={s.gapPrimaryBtn}
          >
            Research keyword
          </Link>
          <button
            type="button"
            className={s.gapSecondaryBtn}
            onClick={handleGenerateIdea}
            disabled={ideaLoading}
          >
            {ideaLoading ? "Generating..." : idea ? "Regenerate" : isGuest ? "Sign in to get ideas" : "Generate idea"}
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        title="Sign in to generate ideas"
        description="Create a free account to generate AI-powered video ideas from trending opportunities."
      />
    </>
  );
}
