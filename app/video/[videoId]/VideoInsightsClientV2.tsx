"use client";

/**
 * VideoInsightsClientV2 - REDESIGNED
 * 
 * Before: Vertical stack of sections, emojis, numeric ratings, tabs at bottom
 * After: Clean header with KPIs, sticky tabs at top, scannable content panels
 * 
 * Changes:
 * - Replaced VideoHero with compact VideoHeaderCompact (KPIs in header)
 * - Moved tabs to top with sticky behavior
 * - Removed all emojis from UI
 * - Removed numeric ratings (x/10), replaced with status chips
 * - Restructured content into "What's working / What to improve" format
 * - Added proper MetricsPanel with expandable detail
 * - Parallel prefetching: All tab data fetched on mount (non-blocking)
 * - Data cached in state: Users can switch tabs without refetching
 * - 12-hour cache: Server-side caching before refresh
 */

import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./VideoInsightsV2.module.css";
import { VideoHeaderCompact } from "./components/VideoHeaderCompact";
import { AnalysisTabs, TabPanel, type TabId } from "./components/AnalysisTabs";
import { LoadingState, ErrorState } from "./components";
import {
  OverviewPanel,
  RetentionPanel,
  SeoPanel,
  CommentsPanel,
  IdeasPanel,
} from "./components/panels";
import type { CoreAnalysis } from "./components/AiSummaryCard";
import type { BottleneckResult } from "@/types/api";

// Types for deep dive data
type SeoData = {
  titleAnalysis?: any;
  descriptionAnalysis?: any;
  tagAnalysis?: any;
};

type CommentsData = {
  noComments?: boolean;
  sentiment?: { positive: number; neutral: number; negative: number };
  themes?: Array<{ theme: string; count: number }>;
  viewerLoved?: string[];
  viewerAskedFor?: string[];
  hookInspiration?: string[];
};

type IdeasData = {
  remixIdeas?: Array<{ title: string; hook: string; angle: string; keywords?: string[] }>;
  contentGaps?: string[];
};

type DeepDiveState = {
  seo: { data: SeoData | null; loading: boolean; error: string | null };
  comments: { data: CommentsData | null; loading: boolean; error: string | null };
  ideas: { data: IdeasData | null; loading: boolean; error: string | null };
};

// Types for analytics response
type AnalyticsResponse = {
  video: {
    videoId: string;
    title: string;
    description: string;
    publishedAt: string;
    tags: string[];
    categoryId: string | null;
    thumbnailUrl: string | null;
    durationSec: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  analytics: {
    totals: any;
    dailySeries: any[];
  };
  derived: any;
  baseline: any;
  comparison: any;
  levers: any;
  retention?: {
    points: Array<{ elapsedRatio: number; audienceWatchRatio: number }>;
    cliffTimeSec?: number | null;
  };
  bottleneck?: BottleneckResult;
  confidence?: any;
  isLowDataMode?: boolean;
  analyticsAvailability?: any;
  cached?: boolean;
  hasSummary?: boolean;
  demo?: boolean;
};

type SummaryResponse = {
  summary: CoreAnalysis;
  cached?: boolean;
  demo?: boolean;
};

type InsightsError =
  | { kind: "youtube_permissions"; message: string }
  | { kind: "generic"; message: string; status: number };

type Props = {
  videoId: string;
  channelId?: string;
  initialRange: "7d" | "28d" | "90d";
  from?: string;
};

export default function VideoInsightsClientV2({
  videoId,
  channelId,
  initialRange,
  from,
}: Props) {
  // Navigation
  const backLinkBase = from === "subscriber-insights" ? "/subscriber-insights" : "/dashboard";
  const backLink = {
    href: channelId
      ? `${backLinkBase}?channelId=${encodeURIComponent(channelId)}`
      : backLinkBase,
    label: from === "subscriber-insights" ? "Subscriber Insights" : "Dashboard",
  };

  // State
  const [range] = useState(initialRange);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [summary, setSummary] = useState<CoreAnalysis | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<InsightsError | null>(null);
  const fetchedRef = useRef<string | null>(null);
  
  // Deep dive data - prefetched in parallel
  const [deepDive, setDeepDive] = useState<DeepDiveState>({
    seo: { data: null, loading: false, error: null },
    comments: { data: null, loading: false, error: null },
    ideas: { data: null, loading: false, error: null },
  });

  // Fetch analytics (fast, no LLM)
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setError(null);

    try {
      const url = channelId
        ? `/api/me/channels/${channelId}/videos/${videoId}/insights/analytics?range=${range}`
        : `/api/me/channels/_demo/videos/${videoId}/insights/analytics?range=${range}`;

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errorObj = body?.error;
        const unifiedCode = typeof errorObj === "object" ? errorObj?.code : null;
        const detailsCode = body?.details?.code;
        const legacyCode = body?.code;
        const errorCode = detailsCode || legacyCode || unifiedCode;
        const errorMessage = typeof errorObj === "object" 
          ? errorObj?.message 
          : (typeof errorObj === "string" ? errorObj : `Request failed (${res.status})`);
        
        const isYouTubePermissionError = 
          errorCode === "youtube_permissions" || 
          errorCode === "YOUTUBE_PERMISSIONS" ||
          (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("google access"));
        
        if (isYouTubePermissionError) {
          throw { kind: "youtube_permissions", message: errorMessage };
        }
        throw { kind: "generic", message: errorMessage, status: res.status };
      }

      const data = (await res.json()) as AnalyticsResponse;
      setAnalytics(data);
      return data;
    } catch (err: any) {
      if (err.kind) {
        setError(err);
      } else {
        setError({ kind: "generic", message: err.message || "Network error", status: 0 });
      }
      return null;
    } finally {
      setAnalyticsLoading(false);
    }
  }, [channelId, videoId, range]);

  // Fetch AI summary
  const fetchSummary = useCallback(async () => {
    if (!channelId) return;
    
    setSummaryLoading(true);
    try {
      const url = `/api/me/channels/${channelId}/videos/${videoId}/insights/summary?range=${range}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("Summary fetch failed:", res.status);
        return;
      }
      const data = (await res.json()) as SummaryResponse;
      setSummary(data.summary);
    } catch (err) {
      console.warn("Summary fetch error:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [channelId, videoId, range]);

  // Prefetch deep dive data (non-blocking, parallel)
  const prefetchDeepDives = useCallback(async () => {
    if (!channelId) return;

    // Set all to loading
    setDeepDive({
      seo: { data: null, loading: true, error: null },
      comments: { data: null, loading: true, error: null },
      ideas: { data: null, loading: true, error: null },
    });

    // Fetch SEO
    const fetchSeo = async () => {
      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/videos/${videoId}/insights/seo?range=${range}`
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || errData.error || "Failed to load SEO");
        }
        const result = await res.json();
        setDeepDive((prev) => ({
          ...prev,
          seo: { data: result.seo, loading: false, error: null },
        }));
      } catch (err) {
        setDeepDive((prev) => ({
          ...prev,
          seo: { data: null, loading: false, error: err instanceof Error ? err.message : "Failed" },
        }));
      }
    };

    // Fetch Comments
    const fetchComments = async () => {
      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/videos/${videoId}/insights/comments?range=${range}`
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errorCode = errData.details?.code || errData.code || errData.error?.code;
          if (errorCode === "youtube_permissions") {
            // Auto-redirect to OAuth
            const lastAttempt = sessionStorage.getItem("lastOAuthAttempt");
            const isRecentAttempt = lastAttempt && Date.now() - parseInt(lastAttempt) < 60000;
            if (!isRecentAttempt) {
              sessionStorage.setItem("lastOAuthAttempt", Date.now().toString());
              window.location.href = `/api/integrations/google/start?channelId=${encodeURIComponent(channelId)}`;
              return;
            }
          }
          throw new Error(errData.error?.message || errData.error || "Failed to load comments");
        }
        const result = await res.json();
        setDeepDive((prev) => ({
          ...prev,
          comments: { data: result.comments, loading: false, error: null },
        }));
      } catch (err) {
        setDeepDive((prev) => ({
          ...prev,
          comments: { data: null, loading: false, error: err instanceof Error ? err.message : "Failed" },
        }));
      }
    };

    // Fetch Ideas
    const fetchIdeas = async () => {
      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/videos/${videoId}/insights/ideas?range=${range}`
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || errData.error || "Failed to load ideas");
        }
        const result = await res.json();
        setDeepDive((prev) => ({
          ...prev,
          ideas: { data: result.ideas, loading: false, error: null },
        }));
      } catch (err) {
        setDeepDive((prev) => ({
          ...prev,
          ideas: { data: null, loading: false, error: err instanceof Error ? err.message : "Failed" },
        }));
      }
    };

    // Fire all in parallel (non-blocking)
    fetchSeo();
    fetchComments();
    fetchIdeas();
  }, [channelId, videoId, range]);

  // Initial load
  useEffect(() => {
    const key = `${channelId ?? "demo"}:${videoId}:${range}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    fetchAnalytics().then((data) => {
      if (!data) return;

      if (data.hasSummary) {
        fetchSummary();
      } else if (data.demo) {
        setSummary({
          headline: "Strong engagement but retention drops mid-video",
          wins: [
            { label: "High engagement rate", metric: "6.4% vs 4.2% baseline", why: "Personal story format resonates" },
            { label: "Strong subscriber conversion", metric: "3.0 subs/1K vs 2.5 baseline", why: "Topic attracts ideal audience" },
            { label: "Above-average sharing", metric: "2.8 shares/1K views", why: "Emotionally resonant content" },
          ],
          improvements: [
            { label: "Mid-video retention drop", metric: "39% avg viewed", fix: "Add pattern interrupt at 4-minute mark" },
            { label: "Slow intro", metric: "First 30s steepest drop", fix: "Get to value within 15 seconds" },
            { label: "Missing search optimization", metric: "Tags missing trending terms", fix: "Add 'youtube algorithm 2024' to tags" },
          ],
          topAction: {
            what: "Add a pattern interrupt at the 4-minute mark with a quick preview of what's coming",
            why: "Your retention drops sharply here - this could recover 5-10% watch time",
            effort: "low",
          },
        });
      } else {
        fetchSummary();
      }

      // Prefetch all deep dive data in parallel (non-blocking)
      // Ideas can be generated even in low data mode (uses video title/description)
      if (channelId) {
        prefetchDeepDives();
      }
    });
  }, [videoId, channelId, range, fetchAnalytics, fetchSummary, prefetchDeepDives]);

  // Error state
  if (error && !analytics) {
    return (
      <ErrorState
        error={error}
        channelId={channelId}
        backLink={backLink}
        onRetry={fetchAnalytics}
      />
    );
  }

  // Full loading state
  if (analyticsLoading && !analytics) {
    return <LoadingState loadingStage="Loading video analytics..." llmProgress={10} />;
  }

  // No analytics available
  if (!analytics) {
    return (
      <ErrorState
        error={{ kind: "generic", message: "Failed to load video data", status: 0 }}
        channelId={channelId}
        backLink={backLink}
        onRetry={fetchAnalytics}
      />
    );
  }

  // Destructure analytics
  const {
    video,
    derived,
    baseline,
    comparison,
    bottleneck,
    isLowDataMode: lowDataMode,
    retention,
    demo,
  } = analytics;

  // KPIs for header
  const avgViewed = analytics.analytics.totals.averageViewPercentage ?? 0;
  const netSubs =
    (analytics.analytics.totals.subscribersGained ?? 0) -
    (analytics.analytics.totals.subscribersLost ?? 0);

  const kpis = {
    views: derived.totalViews,
    watchTimeMin: analytics.analytics.totals.estimatedMinutesWatched,
    avgViewedPct: avgViewed,
    ctr: derived.impressionsCtr,
    subsGained: netSubs,
  };

  // Build all metrics for display
  const allMetrics = [
    { label: "Views", value: derived.totalViews },
    { label: "Watch time", value: `${Math.round(analytics.analytics.totals.estimatedMinutesWatched ?? 0)} min` },
    { label: "Avg viewed", value: `${avgViewed.toFixed(1)}%` },
    ...(derived.impressionsCtr ? [{ label: "CTR", value: `${derived.impressionsCtr.toFixed(1)}%` }] : []),
    { label: "Likes", value: analytics.analytics.totals.likes ?? 0 },
    { label: "Subscribers", value: netSubs > 0 ? `+${netSubs}` : String(netSubs) },
    { label: "Comments", value: analytics.analytics.totals.comments ?? video.commentCount ?? 0 },
    { label: "Shares", value: analytics.analytics.totals.shares ?? 0 },
    ...(derived.impressions ? [{ label: "Impressions", value: derived.impressions }] : []),
    ...(derived.viewsPerDay ? [{ label: "Views/day", value: Math.round(derived.viewsPerDay) }] : []),
    ...(derived.engagementPerView ? [{ label: "Engagement rate", value: `${(derived.engagementPerView * 100).toFixed(1)}%` }] : []),
    ...(derived.subsPer1k ? [{ label: "Subs/1K views", value: derived.subsPer1k.toFixed(2) }] : []),
  ];

  // No disabled tabs - let users explore all tabs
  // Each panel handles its own empty/error states
  const disabledTabs: TabId[] = [];

  return (
    <main className={styles.page}>
      {/* Compact Header with KPIs */}
      <VideoHeaderCompact
        videoId={videoId}
        video={video}
        kpis={kpis}
        backHref={backLink.href}
        backLabel={backLink.label}
        isDemo={demo}
      />

      {/* Sticky Tabs */}
      <AnalysisTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        disabledTabs={disabledTabs}
        loadingTabs={{
          overview: summaryLoading,
          seo: deepDive.seo.loading,
          comments: deepDive.comments.loading,
          ideas: deepDive.ideas.loading,
        }}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        <TabPanel id="overview" activeTab={activeTab}>
          <OverviewPanel
            summary={summary}
            summaryLoading={summaryLoading}
            bottleneck={bottleneck}
            metrics={allMetrics}
            isLowDataMode={lowDataMode}
          />
        </TabPanel>

        <TabPanel id="retention" activeTab={activeTab}>
          <RetentionPanel
            points={retention?.points ?? []}
            durationSec={video.durationSec}
            cliffTimeSec={retention?.cliffTimeSec}
            avgViewedPct={avgViewed}
            baseline={baseline}
          />
        </TabPanel>

        <TabPanel id="seo" activeTab={activeTab}>
          <SeoPanel
            video={{
              title: video.title,
              description: video.description,
              tags: video.tags,
              categoryId: video.categoryId,
              publishedAt: video.publishedAt,
            }}
            data={deepDive.seo.data}
            loading={deepDive.seo.loading}
            error={deepDive.seo.error}
          />
        </TabPanel>

        <TabPanel id="comments" activeTab={activeTab}>
          {channelId && (
            <CommentsPanel
              data={deepDive.comments.data}
              loading={deepDive.comments.loading}
              error={deepDive.comments.error}
              channelId={channelId}
            />
          )}
        </TabPanel>

        <TabPanel id="ideas" activeTab={activeTab}>
          {channelId && (
            <IdeasPanel
              data={deepDive.ideas.data}
              loading={deepDive.ideas.loading}
              error={deepDive.ideas.error}
            />
          )}
        </TabPanel>
      </div>
    </main>
  );
}
