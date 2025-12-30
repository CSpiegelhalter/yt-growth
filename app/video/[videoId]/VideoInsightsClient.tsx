"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import s from "./style.module.css";
import type { VideoInsightsResponse } from "@/types/api";
import {
  getPerformanceLevel,
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
  const llmAutoKeyRef = useRef<string | null>(null);
  const [llmProgress, setLlmProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("Preparing analysis...");
  const [allowPartial, setAllowPartial] = useState(false);

  const refreshInsights =
    useCallback(async (): Promise<VideoInsightsResponse> => {
      if (!channelId) throw new Error("No channel selected");
      setLoadingStage("Generating AI insights...");
      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/videos/${videoId}/insights`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ range, llmOnly: true }),
          }
        );
        if (!res.ok) {
          let body: any = null;
          try {
            body = await res.json();
          } catch {
            body = null;
          }
          const msg =
            body?.error ?? body?.message ?? `Request failed (${res.status})`;
          throw new Error(String(msg));
        }
        return (await res.json()) as VideoInsightsResponse;
      } finally {
        // no-op; caller owns loading state
      }
    }, [channelId, videoId, range]);

  const needsBlockingLLM =
    !!insights &&
    !allowPartial &&
    !insights.demo &&
    !!channelId &&
    insights.llmInsights == null;
  const isBlockingLoading = loading || needsBlockingLLM;

  // Prevent scroll while we're showing the blocking loader.
  useEffect(() => {
    if (!isBlockingLoading) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isBlockingLoading]);

  // Smooth progress bar + stage text while the analysis is running
  useEffect(() => {
    if (!isBlockingLoading) return;
    setLlmProgress(12);
    setLoadingStage("Fetching video analytics...");

    const stages: Array<{ atMs: number; text: string }> = [
      { atMs: 0, text: "Fetching video analytics..." },
      { atMs: 1400, text: "Comparing to your channel baseline..." },
      { atMs: 3200, text: "Reading top comments..." },
      { atMs: 5200, text: "Generating recommendations..." },
    ];
    const startedAt = Date.now();

    const stageTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next =
        [...stages].reverse().find((s) => elapsed >= s.atMs)?.text ??
        "Analyzing...";
      setLoadingStage(next);
    }, 450);

    const t = window.setInterval(() => {
      setLlmProgress((p) => {
        const target = 92;
        const next = p + Math.max(1, Math.round((target - p) * 0.08));
        return Math.min(target, next);
      });
    }, 350);
    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(t);
    };
  }, [isBlockingLoading]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAllowPartial(false);
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
        return;
      }

      const data = (await res.json()) as VideoInsightsResponse;

      // Make this page blocking: if AI insights are missing, wait for the llmOnly
      // request to complete before rendering the rest of the page.
      if (data && !data.demo && data.llmInsights == null && channelId) {
        const k = `${channelId}:${videoId}:${range}`;
        if (llmAutoKeyRef.current !== k) {
          llmAutoKeyRef.current = k;
        }

        try {
          const full = await refreshInsights();
          setLlmProgress(100);
          setInsights(full);
        } catch (err) {
          // Fallback: show non-AI analytics instead of blocking forever.
          console.error("Failed to generate AI insights:", err);
          setAllowPartial(true);
          setInsights(data);
        }
      } else {
        setLlmProgress(100);
        setInsights(data);
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError({
        kind: "generic",
        message: "Network error while loading insights.",
        status: 0,
      });
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [channelId, videoId, range, refreshInsights]);

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

  // Loading state
  if (isBlockingLoading && (!insights || needsBlockingLLM)) {
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
  const performance = getPerformanceLevel(avgViewed, engagementRate, subsPer1k);
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
        performance={performance}
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
                <span className={s.hintIcon}>🎨</span>
                <span>{hint}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Remix Ideas */}
      <RemixIdeas remixes={remixItems} />

      {/* Additional Metrics */}
      <AllMetrics totals={insights.analytics.totals} derived={derived} />
    </main>
  );
}
