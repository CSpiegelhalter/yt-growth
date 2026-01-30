"use client";

/**
 * VideoInsightsClientV2
 *
 * Clean video insights view with:
 * - Compact header with KPIs
 * - Sticky tabs at top
 * - Content panels for each analysis area
 *
 * Analytics data is fetched server-side and passed as required prop.
 * Summary and deep dives are fetched client-side progressively.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./VideoInsightsV2.module.css";
import { VideoHeaderCompact } from "./components/VideoHeaderCompact";
import { AnalysisTabs, TabPanel, type TabId } from "./components/AnalysisTabs";
import {
  OverviewPanel,
  RetentionPanel,
  SeoPanel,
  CommentsPanel,
  IdeasPanel,
  TrafficSourcePanel,
  PostWatchPanel,
  ShortsMetricsPanel,
  DimensionalInsightsPanel,
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
  remixIdeas?: Array<{
    title: string;
    hook: string;
    angle: string;
    keywords?: string[];
  }>;
  contentGaps?: string[];
};

type DeepDiveState = {
  seo: { data: SeoData | null; loading: boolean; error: string | null };
  comments: {
    data: CommentsData | null;
    loading: boolean;
    error: string | null;
  };
  ideas: { data: IdeasData | null; loading: boolean; error: string | null };
};

// Analytics response from server
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
  subscriberBreakdown?: any;
  geoBreakdown?: any;
  trafficDetail?: any;
  demographicBreakdown?: any;
};

type SummaryResponse = {
  summary: CoreAnalysis;
  cached?: boolean;
};

type Props = {
  videoId: string;
  channelId: string;
  initialRange: "7d" | "28d" | "90d";
  from?: string;
  /** Analytics data fetched server-side (required) */
  analytics: AnalyticsResponse;
};

export default function VideoInsightsClientV2({
  videoId,
  channelId,
  initialRange,
  from,
  analytics,
}: Props) {
  // Navigation
  const backLinkBase =
    from === "subscriber-insights" ? "/subscriber-insights" : "/dashboard";
  const backLink = {
    href: `${backLinkBase}?channelId=${encodeURIComponent(channelId)}`,
    label: from === "subscriber-insights" ? "Subscriber Insights" : "Dashboard",
  };

  // State
  const [range] = useState(initialRange);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [summary, setSummary] = useState<CoreAnalysis | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const fetchedRef = useRef(false);

  // Deep dive data - prefetched in parallel
  const [deepDive, setDeepDive] = useState<DeepDiveState>({
    seo: { data: null, loading: false, error: null },
    comments: { data: null, loading: false, error: null },
    ideas: { data: null, loading: false, error: null },
  });

  // Fetch AI summary
  const fetchSummary = useCallback(async () => {
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
          `/api/me/channels/${channelId}/videos/${videoId}/insights/seo?range=${range}`,
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error?.message || errData.error || "Failed to load SEO",
          );
        }
        const result = await res.json();
        setDeepDive((prev) => ({
          ...prev,
          seo: { data: result.seo, loading: false, error: null },
        }));
      } catch (err) {
        setDeepDive((prev) => ({
          ...prev,
          seo: {
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Failed",
          },
        }));
      }
    };

    // Fetch Comments
    const fetchComments = async () => {
      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/videos/${videoId}/insights/comments?range=${range}`,
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errorCode =
            errData.details?.code || errData.code || errData.error?.code;
          if (errorCode === "youtube_permissions") {
            const lastAttempt = sessionStorage.getItem("lastOAuthAttempt");
            const isRecentAttempt =
              lastAttempt && Date.now() - parseInt(lastAttempt) < 60000;
            if (!isRecentAttempt) {
              sessionStorage.setItem("lastOAuthAttempt", Date.now().toString());
              window.location.href = `/api/integrations/google/start?channelId=${encodeURIComponent(channelId)}`;
              return;
            }
          }
          throw new Error(
            errData.error?.message ||
              errData.error ||
              "Failed to load comments",
          );
        }
        const result = await res.json();
        setDeepDive((prev) => ({
          ...prev,
          comments: { data: result.comments, loading: false, error: null },
        }));
      } catch (err) {
        setDeepDive((prev) => ({
          ...prev,
          comments: {
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Failed",
          },
        }));
      }
    };

    // Fetch Ideas
    const fetchIdeas = async () => {
      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/videos/${videoId}/insights/ideas?range=${range}`,
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error?.message || errData.error || "Failed to load ideas",
          );
        }
        const result = await res.json();
        setDeepDive((prev) => ({
          ...prev,
          ideas: { data: result.ideas, loading: false, error: null },
        }));
      } catch (err) {
        setDeepDive((prev) => ({
          ...prev,
          ideas: {
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Failed",
          },
        }));
      }
    };

    // Fire all in parallel (non-blocking)
    fetchSeo();
    fetchComments();
    fetchIdeas();
  }, [channelId, videoId, range]);

  // Fetch summary and deep dives on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchSummary();
    prefetchDeepDives();
  }, [fetchSummary, prefetchDeepDives]);

  // Destructure analytics
  const { video, derived, baseline, bottleneck, retention } = analytics;

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

  // Engagement stats for display next to thumbnail
  const engagement = {
    likes: analytics.analytics.totals.likes ?? video.likeCount ?? 0,
    comments: analytics.analytics.totals.comments ?? video.commentCount ?? 0,
  };

  // Format views/day - show decimal for low values
  const viewsPerDayDisplay =
    derived.viewsPerDay != null
      ? derived.viewsPerDay >= 10
        ? Math.round(derived.viewsPerDay).toString()
        : derived.viewsPerDay >= 1
          ? derived.viewsPerDay.toFixed(1)
          : derived.viewsPerDay > 0
            ? `< 1`
            : "0"
      : null;

  const allMetrics = [
    { label: "Shares", value: analytics.analytics.totals.shares ?? 0 },
    ...(viewsPerDayDisplay
      ? [{ label: "Views/day", value: viewsPerDayDisplay }]
      : []),
    ...(derived.engagementPerView != null
      ? [
          {
            label: "Engagement rate",
            value: `${(derived.engagementPerView * 100).toFixed(1)}%`,
          },
        ]
      : []),
    ...(derived.subsPer1k != null
      ? [{ label: "Subs/1K views", value: derived.subsPer1k.toFixed(2) }]
      : []),
  ];

  // Discovery stats for the chart panel
  const discoveryStats = {
    impressions: derived.impressions,
    ctr: derived.impressionsCtr,
    dailySeries: analytics.analytics.dailySeries,
  };

  const disabledTabs: TabId[] = [];

  return (
    <main className={styles.page}>
      {/* Compact Header with KPIs */}
      <VideoHeaderCompact
        videoId={videoId}
        video={video}
        kpis={kpis}
        engagement={engagement}
        backHref={backLink.href}
        backLabel={backLink.label}
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
          {/* Shorts-specific metrics (show for videos <= 60 seconds) */}
          {video.durationSec <= 60 && (
            <ShortsMetricsPanel
              durationSec={video.durationSec}
              avgViewPercentage={avgViewed}
              avgViewDuration={
                avgViewed && video.durationSec
                  ? (avgViewed / 100) * video.durationSec
                  : null
              }
            />
          )}

          <OverviewPanel
            summary={summary}
            summaryLoading={summaryLoading}
            bottleneck={bottleneck}
            metrics={allMetrics}
            discoveryStats={discoveryStats}
            publishedAt={video.publishedAt}
          />

          {/* Dimensional Insights - Subscriber, Geo, Traffic Detail, Demographics */}
          <DimensionalInsightsPanel
            subscriberBreakdown={analytics.subscriberBreakdown}
            geoBreakdown={analytics.geoBreakdown}
            trafficDetail={analytics.trafficDetail}
            demographicBreakdown={analytics.demographicBreakdown}
            impressionsCtr={derived.impressionsCtr}
          />

          {/* Traffic Sources */}
          <TrafficSourcePanel
            trafficSources={derived.trafficSources ?? null}
            totalViews={derived.totalViews}
          />

          {/* Post-Watch Behavior */}
          <PostWatchPanel
            endScreenClicks={
              analytics.analytics.totals.annotationClicks ?? null
            }
            endScreenImpressions={
              analytics.analytics.totals.annotationImpressions ?? null
            }
            endScreenCtr={derived.endScreenClickRate ?? null}
            avgViewPercentage={avgViewed}
            shares={analytics.analytics.totals.shares ?? null}
            playlistAdds={
              analytics.analytics.totals.videosAddedToPlaylists ?? null
            }
            totalViews={derived.totalViews}
            baselineEndScreenCtr={baseline?.endScreenCtr?.mean ?? null}
          />
        </TabPanel>

        <TabPanel id="retention" activeTab={activeTab}>
          <RetentionPanel
            points={retention?.points ?? []}
            durationSec={video.durationSec}
            cliffTimeSec={retention?.cliffTimeSec}
            avgViewedPct={avgViewed}
            baseline={baseline}
            videoId={videoId}
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
          <CommentsPanel
            data={deepDive.comments.data}
            loading={deepDive.comments.loading}
            error={deepDive.comments.error}
            channelId={channelId}
          />
        </TabPanel>

        <TabPanel id="ideas" activeTab={activeTab}>
          <IdeasPanel
            data={deepDive.ideas.data}
            loading={deepDive.ideas.loading}
            error={deepDive.ideas.error}
          />
        </TabPanel>
      </div>
    </main>
  );
}
