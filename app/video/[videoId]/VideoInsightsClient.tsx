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
    href: channelId ? `${backLinkBase}?channelId=${encodeURIComponent(channelId)}` : backLinkBase,
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
          body && typeof body === "object" && body.error && typeof body.error === "object"
            ? body.error
            : null;
        const details =
          body && typeof body === "object" && body.details && typeof body.details === "object"
            ? body.details
            : null;
        const legacyError =
          (details && typeof (details as any).error === "string" && (details as any).error) ||
          (body && typeof body === "object" && typeof body.error === "string" && body.error) ||
          null;

        if (body?.code === "youtube_permissions" || details?.code === "youtube_permissions") {
          setError({
            kind: "youtube_permissions",
            message:
              (typeof body?.error === "string" ? body?.error : errObj?.message) ??
              "Google account is missing required YouTube permissions. Reconnect Google and try again.",
            requestId,
          });
          setInsights(null);
          setLoading(false);
          return;
        }

        if (errObj?.code === "LIMIT_REACHED" && legacyError === "limit_reached") {
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

        if (errObj?.code === "LIMIT_REACHED" && legacyError === "upgrade_required") {
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

      // If AI insights are missing, fetch them and WAIT for them before showing page
      if (data && !data.demo && data.llmInsights == null && channelId) {
        try {
          // POST to generate LLM insights (this triggers the parallel LLM calls)
          const llmRes = await fetch(
            `/api/me/channels/${channelId}/videos/${videoId}/insights`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ range, llmOnly: true }),
            }
          );
          if (llmRes.ok) {
            const fullData = (await llmRes.json()) as VideoInsightsResponse;
            setLlmProgress(100);
            setInsights(fullData);
          } else {
            // LLM failed, show analytics without AI insights
            console.error("LLM request failed, showing analytics only");
            setInsights(data);
          }
        } catch (llmErr) {
          // LLM failed, show analytics without AI insights
          console.error("Failed to generate AI insights:", llmErr);
          setInsights(data);
        }
      } else {
        // Already has LLM insights (cached) or demo mode
        setLlmProgress(100);
        setInsights(data);
      }
      
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
    return <LoadingState loadingStage={loadingStage} llmProgress={llmProgress} />;
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

  const { video, derived, llmInsights } = insights;
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

      {/* Quick Stats */}
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

      {/* What's Working / Needs Work */}
      {llmInsights && derived.totalViews >= 100 && (
        <WinsLeaks
          wins={llmInsights.wins ?? []}
          leaks={llmInsights.leaks ?? []}
        />
      )}

      {/* Low views notice */}
      {derived.totalViews < 100 && (
        <section className={s.lowViewsNotice}>
          <div className={s.noticeIcon}>📊</div>
          <div className={s.noticeText}>
            <strong>Not enough data yet</strong>
            <p>
              This video has {derived.totalViews} view
              {derived.totalViews !== 1 ? "s" : ""}. Performance insights like
              engagement rate and subscriber conversion become meaningful after
              ~100 views.
            </p>
          </div>
        </section>
      )}

      {/* Key Findings */}
      {llmInsights?.keyFindings && (
        <KeyFindings findings={llmInsights.keyFindings} />
      )}

      {/* Viewer Voice (Comments) */}
      {llmInsights?.commentInsights && (
        <ViewerVoice commentInsights={llmInsights.commentInsights} />
      )}

      {/* Title & Tags Analysis */}
      {llmInsights &&
        (llmInsights.titleAnalysis || llmInsights.tagAnalysis) && (
          <TitleTagsOptimization
            videoTitle={video.title ?? ""}
            titleAnalysis={llmInsights.titleAnalysis}
            descriptionAnalysis={llmInsights.descriptionAnalysis}
            tagAnalysis={llmInsights.tagAnalysis}
          />
        )}

      {/* Priority Actions */}
      {llmInsights?.actions && (
        <PriorityActions actions={llmInsights.actions} />
      )}

      {/* Visibility Plan */}
      {llmInsights?.visibilityPlan && (
        <VisibilityPlan plan={llmInsights.visibilityPlan} />
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

      {/* Additional Metrics */}
      <AllMetrics totals={insights.analytics.totals} derived={derived} />
    </main>
  );
}
