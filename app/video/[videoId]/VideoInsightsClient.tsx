"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import s from "./style.module.css";
import type { VideoInsightsResponse } from "@/types/api";
import {
  LoadingState,
  ErrorState,
  VideoHero,
  QuickStats,
  WinsLeaks,
  KeyFindings,
  ViewerVoice,
  TitleTagsOptimization,
  PriorityActions,
  VisibilityPlan,
  RemixIdeas,
  AllMetrics,
  RetentionCurve,
  // Premium components
  Scorecard,
  BottleneckBanner,
  ShareKit,
  LowDataModePanel,
  ImpactSimulator,
  Benchmarks,
} from "./components";

type Props = {
  videoId: string;
  channelId?: string;
  initialInsights: VideoInsightsResponse | null;
  initialRange: "7d" | "28d" | "90d";
  from?: string;
};

type InsightsError =
  | {
      kind: "limit_reached";
      used: number;
      limit: number;
      remaining: number;
      resetAt: string;
      upgrade: boolean;
      requestId?: string;
    }
  | { kind: "upgrade_required"; message: string; requestId?: string }
  | { kind: "youtube_permissions"; message: string; requestId?: string }
  | { kind: "generic"; message: string; status: number; requestId?: string };

/**
 * VideoInsightsClient - Clean, story-driven video analytics
 */
export default function VideoInsightsClient({
  videoId,
  channelId,
  initialInsights,
  initialRange,
  from,
}: Props) {
  // Determine back link based on where user came from
  const backLinkBase =
    from === "subscriber-insights" ? "/subscriber-insights" : "/dashboard";
  const backLink = {
    href: channelId
      ? `${backLinkBase}?channelId=${encodeURIComponent(channelId)}`
      : backLinkBase,
    label:
      from === "subscriber-insights"
        ? "Back to Subscriber Insights"
        : "Back to Dashboard",
  };

  const [range] = useState<"7d" | "28d" | "90d">(initialRange);
  const [insights, setInsights] = useState<VideoInsightsResponse | null>(
    initialInsights
  );
  const [loading, setLoading] = useState(!initialInsights);
  const [error, setError] = useState<InsightsError | null>(null);
  const lastAutoFetchKeyRef = useRef<string | null>(null);
  const [llmProgress, setLlmProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("Preparing analysis...");

  // Show loading state while fetching (blocks until everything is ready)
  const isInitialLoading = loading;

  // Smooth progress bar animation while loading
  useEffect(() => {
    if (!loading) {
      return;
    }
    setLlmProgress(8);

    const stages: Array<{ atMs: number; text: string }> = [
      { atMs: 0, text: "Fetching video analytics..." },
      { atMs: 1200, text: "Analyzing performance data..." },
      { atMs: 2400, text: "Generating SEO insights..." },
      { atMs: 3600, text: "Creating strategy recommendations..." },
      { atMs: 4800, text: "Finding remix opportunities..." },
      { atMs: 6000, text: "Analyzing viewer comments..." },
    ];
    const startedAt = Date.now();

    const stageTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next =
        [...stages].reverse().find((s) => elapsed >= s.atMs)?.text ??
        "Finalizing...";
      setLoadingStage(next);
    }, 400);

    const progressTimer = window.setInterval(() => {
      setLlmProgress((p) => {
        const target = 92;
        const next = p + Math.max(1, Math.round((target - p) * 0.08));
        return Math.min(target, next);
      });
    }, 300);

    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(progressTimer);
    };
  }, [loading]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingStage("Fetching video analytics...");
    setLlmProgress(8);
    try {
      const url = channelId
        ? `/api/me/channels/${channelId}/videos/${videoId}/insights?range=${range}`
        : `/api/me/channels/_demo/videos/${videoId}/insights?range=${range}`;
      const res = await fetch(url);
      if (!res.ok) {
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          body = null;
        }

        const requestId =
          (body &&
            typeof body === "object" &&
            body.error &&
            typeof body.error === "object" &&
            typeof body.error.requestId === "string" &&
            body.error.requestId) ||
          res.headers.get("x-request-id") ||
          undefined;

        const errObj =
          body &&
          typeof body === "object" &&
          body.error &&
          typeof body.error === "object"
            ? body.error
            : null;
        const details =
          body &&
          typeof body === "object" &&
          body.details &&
          typeof body.details === "object"
            ? body.details
            : null;
        const legacyError =
          (details &&
            typeof (details as any).error === "string" &&
            (details as any).error) ||
          (body &&
            typeof body === "object" &&
            typeof body.error === "string" &&
            body.error) ||
          null;

        if (
          body?.code === "youtube_permissions" ||
          details?.code === "youtube_permissions"
        ) {
          setError({
            kind: "youtube_permissions",
            message:
              (typeof body?.error === "string"
                ? body?.error
                : errObj?.message) ??
              "Google account is missing required YouTube permissions. Reconnect Google and try again.",
            requestId,
          });
          setInsights(null);
          setLoading(false);
          return;
        }

        if (
          errObj?.code === "LIMIT_REACHED" &&
          legacyError === "limit_reached"
        ) {
          setError({
            kind: "limit_reached",
            used: Number((details as any)?.used ?? 0),
            limit: Number((details as any)?.limit ?? 0),
            remaining: Number((details as any)?.remaining ?? 0),
            resetAt: String((details as any)?.resetAt ?? ""),
            upgrade: Boolean((details as any)?.upgrade),
            requestId,
          });
          setInsights(null);
          setLoading(false);
          return;
        }

        if (
          errObj?.code === "LIMIT_REACHED" &&
          legacyError === "upgrade_required"
        ) {
          setError({
            kind: "upgrade_required",
            message:
              errObj?.message ??
              (typeof (details as any)?.message === "string"
                ? (details as any).message
                : null) ??
              "Upgrade required to use this feature.",
            requestId,
          });
          setInsights(null);
          setLoading(false);
          return;
        }

        const msg =
          errObj?.message ??
          legacyError ??
          body?.message ??
          `Request failed (${res.status})`;
        setError({
          kind: "generic",
          message: String(msg),
          status: res.status,
          requestId,
        });
        setInsights(null);
        setLoading(false);
        return;
      }

      const data = (await res.json()) as VideoInsightsResponse;

      // LLM insights are now generated in the single GET request
      // No need for a second POST call
      setLlmProgress(100);
      setInsights(data);

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError({
        kind: "generic",
        message: "Network error while loading insights.",
        status: 0,
      });
      setInsights(null);
      setLoading(false);
    }
  }, [channelId, videoId, range]);

  useEffect(() => {
    if (initialInsights) {
      setInsights(initialInsights);
      setLoading(false);
    } else {
      setInsights(null);
      // Avoid double-fetch in React 18 StrictMode (dev) which can burn daily credits
      const k = `${channelId ?? "no-channel"}:${videoId}:${range}`;
      if (lastAutoFetchKeyRef.current !== k) {
        lastAutoFetchKeyRef.current = k;
        fetchInsights();
      }
    }
  }, [videoId, initialInsights, fetchInsights, channelId, range]);

  // Initial loading state - only show when no data at all
  if (isInitialLoading) {
    return (
      <LoadingState loadingStage={loadingStage} llmProgress={llmProgress} />
    );
  }

  // No data / error state
  if (!insights) {
    return (
      <ErrorState
        error={error}
        channelId={channelId}
        backLink={backLink}
        onRetry={fetchInsights}
      />
    );
  }

  const { video, derived, llmInsights, baseline, comparison, bottleneck, confidence, isLowDataMode: lowDataMode, analyticsAvailability } = insights;
  const remixItems = (llmInsights?.remixIdeas ?? []).map((r) => ({
    id: `base:${r.title}:${r.hook}`,
    title: r.title,
    hook: r.hook,
    keywords: r.keywords ?? [],
  }));

  // Calculate performance indicators
  const avgViewed = insights.analytics.totals.averageViewPercentage ?? 0;
  const engagementRate = derived.engagementPerView
    ? derived.engagementPerView * 100
    : 0;
  const subsPer1k = derived.subsPer1k ?? 0;
  const netSubs =
    (insights.analytics.totals.subscribersGained ?? 0) -
    (insights.analytics.totals.subscribersLost ?? 0);

  // Check if tags should be shown prominently (only if search-driven)
  const isSearchDriven = derived.trafficSources?.search != null && 
    derived.trafficSources.search > (derived.trafficSources.total ?? 1) * 0.3;

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link href={backLink.href} className={s.backLink}>
        ← {backLink.label}
      </Link>

      {/* Hero Header */}
      <VideoHero
        videoId={videoId}
        video={video}
        totalViews={derived.totalViews}
        isDemo={insights.demo}
      />

      {/* Scorecard with grouped metrics */}
      <Scorecard
        derived={derived}
        comparison={comparison}
        confidence={confidence}
        analyticsAvailability={analyticsAvailability}
      />

      {/* Bottleneck Banner - prominent diagnosis */}
      {bottleneck && (
        <BottleneckBanner
          bottleneck={bottleneck}
          confidence={
            confidence
              ? bottleneck.bottleneck === "RETENTION"
                ? confidence.retention
                : bottleneck.bottleneck.startsWith("DISCOVERY")
                ? confidence.discovery
                : bottleneck.bottleneck === "CONVERSION"
                ? confidence.conversion
                : "Low"
              : "Low"
          }
        />
      )}

      {/* Quick Stats - additional context */}
      <QuickStats
        totalViews={derived.totalViews}
        viewsPerDay={derived.viewsPerDay}
        avgViewed={avgViewed}
        avgWatchTimeMin={derived.avgWatchTimeMin ?? null}
        engagementRate={engagementRate}
        likes={insights.analytics.totals.likes ?? 0}
        netSubs={netSubs}
        subsPer1k={subsPer1k}
      />

      {/* Retention Curve */}
      {insights.retention?.points && insights.retention.points.length > 0 && (
        <RetentionCurve
          points={insights.retention.points}
          durationSec={video.durationSec}
          cliffTimeSec={insights.retention.cliffTimeSec}
        />
      )}

      {/* Low Data Mode Panel - when data is insufficient */}
      {lowDataMode && (
        <LowDataModePanel
          views={derived.totalViews}
          impressions={derived.impressions}
          analyticsConnected={analyticsAvailability?.hasImpressions ?? false}
          llmInsights={llmInsights}
        />
      )}

      {/* What's Working / Needs Work - only show with enough data */}
      {llmInsights && derived.totalViews >= 100 && !lowDataMode && (
        <WinsLeaks
          wins={llmInsights.wins ?? []}
          leaks={llmInsights.leaks ?? []}
        />
      )}

      {/* Key Findings */}
      {llmInsights?.keyFindings && !lowDataMode && (
        <KeyFindings findings={llmInsights.keyFindings} />
      )}

      {/* Benchmarks - Your typical range vs this video */}
      {baseline && baseline.sampleSize > 0 && (
        <Benchmarks
          derived={derived}
          baseline={baseline}
          comparison={comparison}
        />
      )}

      {/* Viewer Voice (Comments) */}
      {llmInsights?.commentInsights && (
        <ViewerVoice commentInsights={llmInsights.commentInsights} />
      )}

      {/* 
        CONSOLIDATED SEO SECTION
        Title, Description, and Tags in one section (no duplicates)
        Tags are de-emphasized unless search-driven
      */}
      {llmInsights && (llmInsights.titleAnalysis || llmInsights.descriptionAnalysis || llmInsights.tagAnalysis) && (
        <section className={s.packaging}>
          <h2 className={s.sectionTitle}>SEO & Packaging</h2>
          <p className={s.sectionDesc}>
            Title, description, and tags analysis
            {!isSearchDriven && llmInsights.tagAnalysis && (
              <span className={s.tagsNote}> · Tags are low-impact for non-search content</span>
            )}
          </p>

          <div className={s.packagingGrid}>
            {/* Title Panel */}
            {llmInsights.titleAnalysis && (
              <TitlePanel 
                videoTitle={video.title ?? ""} 
                analysis={llmInsights.titleAnalysis} 
              />
            )}

            {/* Description Panel */}
            {llmInsights.descriptionAnalysis && (
              <DescriptionPanel analysis={llmInsights.descriptionAnalysis} />
            )}

            {/* Tags Panel - with warning if not search-driven */}
            {llmInsights.tagAnalysis && (
              <TagsPanel 
                analysis={llmInsights.tagAnalysis}
                isSearchDriven={isSearchDriven}
              />
            )}
          </div>
        </section>
      )}

      {/* Priority Actions */}
      {llmInsights?.actions && !lowDataMode && (
        <PriorityActions actions={llmInsights.actions} />
      )}

      {/* Visibility Plan */}
      {llmInsights?.visibilityPlan && !lowDataMode && (
        <VisibilityPlan plan={llmInsights.visibilityPlan} />
      )}

      {/* Impact Simulator - what-if projections */}
      {baseline && baseline.sampleSize > 0 && !lowDataMode && (
        <ImpactSimulator derived={derived} baseline={baseline} />
      )}

      {/* Thumbnail Tips */}
      {llmInsights?.thumbnailHints && llmInsights.thumbnailHints.length > 0 && (
        <section className={s.thumbnailSection}>
          <h2 className={s.sectionTitle}>Thumbnail Tips</h2>
          <div className={s.thumbnailHints}>
            {llmInsights.thumbnailHints.map((hint, i) => (
              <div key={i} className={s.thumbnailHint}>
                {hint}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Remix Ideas */}
      {llmInsights && <RemixIdeas remixes={remixItems} />}

      {/* Share Kit - Promotion copy and share links */}
      <ShareKit
        videoId={videoId}
        videoTitle={video.title ?? ""}
        promoPack={llmInsights?.promoPack}
      />

      {/* Additional Metrics */}
      <AllMetrics totals={insights.analytics.totals} derived={derived} />
    </main>
  );
}

// ============================================
// SUB-COMPONENTS FOR CONSOLIDATED SEO SECTION
// ============================================

import { CopyButton, TagChip } from "./components";

type TitleAnalysis = {
  score: number;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
};

function TitlePanel({ videoTitle, analysis }: { videoTitle: string; analysis: TitleAnalysis }) {
  const getScoreClass = (score: number) => {
    if (score >= 8) return s.scoreGreen;
    if (score >= 5) return s.scoreYellow;
    return s.scoreRed;
  };

  return (
    <div className={s.packagingCard}>
      <div className={s.packagingHeader}>
        <span className={s.packagingLabel}>Title</span>
        <span className={`${s.packagingScore} ${getScoreClass(analysis.score)}`}>
          {analysis.score}/10
        </span>
      </div>
      <p className={s.currentValue}>&quot;{videoTitle}&quot;</p>

      {(analysis.strengths?.length ?? 0) > 0 && (
        <div className={s.feedbackGroup}>
          <span className={s.feedbackLabel}>✓ Strengths</span>
          <ul>
            {analysis.strengths?.map((str, i) => (
              <li key={i}>{str}</li>
            ))}
          </ul>
        </div>
      )}

      {(analysis.weaknesses?.length ?? 0) > 0 && (
        <div className={s.feedbackGroup}>
          <span className={s.feedbackLabelWarn}>✗ Could Improve</span>
          <ul>
            {analysis.weaknesses?.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {(analysis.suggestions?.length ?? 0) > 0 && (
        <div className={s.suggestions}>
          <span className={s.feedbackLabelAlt}>💡 Try Instead</span>
          {analysis.suggestions?.map((sug, i) => (
            <div key={i} className={s.suggestionRow}>
              <span>{sug}</span>
              <CopyButton text={sug} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type DescriptionAnalysis = {
  score: number;
  weaknesses?: string[];
  rewrittenOpening?: string;
  addTheseLines?: string[];
};

function DescriptionPanel({ analysis }: { analysis: DescriptionAnalysis }) {
  const getScoreClass = (score: number) => {
    if (score >= 8) return s.scoreGreen;
    if (score >= 5) return s.scoreYellow;
    return s.scoreRed;
  };

  return (
    <div className={s.packagingCard}>
      <div className={s.packagingHeader}>
        <span className={s.packagingLabel}>Description</span>
        <span className={`${s.packagingScore} ${getScoreClass(analysis.score)}`}>
          {analysis.score}/10
        </span>
      </div>

      <p className={s.tagFeedback}>
        {analysis.weaknesses?.length
          ? analysis.weaknesses[0]
          : "Description SEO review."}
      </p>

      {analysis.rewrittenOpening && (
        <div className={s.suggestions}>
          <span className={s.feedbackLabelAlt}>
            Stronger opening (copy/paste)
          </span>
          <div className={s.suggestionRow}>
            <span>{analysis.rewrittenOpening}</span>
            <CopyButton text={analysis.rewrittenOpening} />
          </div>
        </div>
      )}

      {(analysis.addTheseLines?.length ?? 0) > 0 && (
        <div className={s.suggestions} style={{ marginTop: 12 }}>
          <span className={s.feedbackLabelAlt}>
            Add these lines (copy/paste)
          </span>
          {analysis.addTheseLines
            ?.filter(Boolean)
            .slice(0, 6)
            .map((line, i) => (
              <div key={i} className={s.suggestionRow}>
                <span>{line}</span>
                <CopyButton text={line} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

type TagAnalysis = {
  score: number;
  feedback: string;
  missing?: string[];
};

function TagsPanel({ analysis, isSearchDriven }: { analysis: TagAnalysis; isSearchDriven: boolean }) {
  const getScoreClass = (score: number) => {
    if (score >= 8) return s.scoreGreen;
    if (score >= 5) return s.scoreYellow;
    return s.scoreRed;
  };

  const seoTags = (analysis.missing ?? [])
    .map((t) => String(t ?? "").trim())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 25);

  return (
    <div className={s.packagingCard}>
      <div className={s.packagingHeader}>
        <span className={s.packagingLabel}>
          Tags
          {!isSearchDriven && (
            <span className={s.lowImpactBadge}>Optional</span>
          )}
        </span>
        {/* Only show score if search-driven, otherwise it's misleading */}
        {isSearchDriven && (
          <span className={`${s.packagingScore} ${getScoreClass(analysis.score)}`}>
            {analysis.score}/10
          </span>
        )}
      </div>
      
      <p className={s.tagFeedback}>{analysis.feedback}</p>
      
      {!isSearchDriven && (
        <p className={s.tagNote}>
          Tags are most useful for search-driven videos. We only suggest tags we can justify from your content.
        </p>
      )}

      {seoTags.length > 0 && (
        <div className={s.missingTagsSection}>
          <div className={s.missingTagsHeader}>
            <span className={s.feedbackLabelAlt}>
              Copy-paste SEO tags
            </span>
            <CopyButton text={seoTags.join(", ")} label="Copy all" />
          </div>

          <div className={s.tagChips}>
            {seoTags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
