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

import { useCallback, useEffect, useRef, useState } from "react";

import {
  canAttemptOAuth,
  recordOAuthAttempt,
} from "@/lib/client/oauthAttemptTracker";
import type {
  DemographicBreakdown,
  GeographicBreakdown,
  SubscriberBreakdown,
  TrafficSourceDetail,
  VideoMetadata,
} from "@/lib/ports/YouTubePort";
import type {
  AnalyticsTotals,
  BaselineComparison,
  BottleneckResult,
  ChannelBaseline,
  DailyAnalyticsRow,
  DerivedMetrics,
  SectionConfidence,
} from "@/types/api";

import type { CoreAnalysis } from "./components/AiSummaryCard";
import { AnalysisTabs, type TabId,TabPanel } from "./components/AnalysisTabs";
import {
  CommentsPanel,
  DimensionalInsightsPanel,
  IdeasPanel,
  OverviewPanel,
  PostWatchPanel,
  RetentionPanel,
  SeoPanel,
  ShortsMetricsPanel,
  TrafficSourcePanel,
} from "./components/panels";
import { VideoHeaderCompact } from "./components/VideoHeaderCompact";
import styles from "./VideoInsightsV2.module.css";

// Types for deep dive data
type SeoData = {
  titleAnalysis?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  descriptionAnalysis?: {
    score: number;
    weaknesses: string[];
    rewrittenOpening: string;
    addTheseLines: string[];
  };
  tagAnalysis?: {
    score: number;
    feedback: string;
    missing: string[];
    impactLevel: "high" | "medium" | "low";
  };
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
  video: VideoMetadata;
  analytics: {
    totals: AnalyticsTotals;
    dailySeries: DailyAnalyticsRow[];
  };
  derived: DerivedMetrics;
  baseline: ChannelBaseline;
  comparison: BaselineComparison;
  levers: Record<string, unknown>;
  retention?: {
    points: Array<{ elapsedRatio: number; audienceWatchRatio: number }>;
    cliffTimeSec?: number | null;
  };
  bottleneck?: BottleneckResult;
  confidence?: SectionConfidence;
  isLowDataMode?: boolean;
  analyticsAvailability?: Record<string, unknown>;
  cached?: boolean;
  hasSummary?: boolean;
  subscriberBreakdown?: SubscriberBreakdown;
  geoBreakdown?: GeographicBreakdown;
  trafficDetail?: TrafficSourceDetail;
  demographicBreakdown?: DemographicBreakdown;
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
  const backLink = buildBackLink(from, channelId);

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
    } catch (error) {
      console.warn("Summary fetch error:", error);
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
      } catch (error) {
        setDeepDive((prev) => ({
          ...prev,
          seo: {
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Failed",
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
          if (errorCode === "youtube_permissions" && canAttemptOAuth()) {
              recordOAuthAttempt();
              window.location.href = `/api/integrations/google/start?channelId=${encodeURIComponent(channelId)}`;
              return;
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
      } catch (error) {
        setDeepDive((prev) => ({
          ...prev,
          comments: {
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Failed",
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
      } catch (error) {
        setDeepDive((prev) => ({
          ...prev,
          ideas: {
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Failed",
          },
        }));
      }
    };

    void fetchSeo();
    void fetchComments();
    void fetchIdeas();
  }, [channelId, videoId, range]);

  useEffect(() => {
    if (fetchedRef.current) {return;}
    fetchedRef.current = true;

    void fetchSummary();
    void prefetchDeepDives();
  }, [fetchSummary, prefetchDeepDives]);

  const { video, derived, baseline, bottleneck, retention } = analytics;
  const avgViewed = analytics.analytics.totals.averageViewPercentage ?? 0;

  const kpis = computeKpis(analytics, derived, avgViewed);
  const engagement = computeEngagement(analytics, video);
  const allMetrics = computeAllMetrics(analytics, derived);
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
          <OverviewTabContent
            analytics={analytics}
            video={video}
            derived={derived}
            baseline={baseline}
            bottleneck={bottleneck}
            avgViewed={avgViewed}
            summary={summary}
            summaryLoading={summaryLoading}
            allMetrics={allMetrics}
            discoveryStats={discoveryStats}
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

function buildBackLink(from: string | undefined, channelId: string) {
  const base =
    from === "subscriber-insights" ? "/subscriber-insights" : "/videos";
  return {
    href: `${base}?channelId=${encodeURIComponent(channelId)}`,
    label: from === "subscriber-insights" ? "Subscriber Insights" : "Videos",
  };
}

function computeAvgViewDuration(
  avgViewed: number,
  durationSec: number,
): number | null {
  if (avgViewed && durationSec) {return (avgViewed / 100) * durationSec;}
  return null;
}

function OverviewTabContent({
  analytics,
  video,
  derived,
  baseline,
  bottleneck,
  avgViewed,
  summary,
  summaryLoading,
  allMetrics,
  discoveryStats,
}: {
  analytics: AnalyticsResponse;
  video: AnalyticsResponse["video"];
  derived: AnalyticsResponse["derived"];
  baseline: AnalyticsResponse["baseline"];
  bottleneck: AnalyticsResponse["bottleneck"];
  avgViewed: number;
  summary: CoreAnalysis | null;
  summaryLoading: boolean;
  allMetrics: Array<{ label: string; value: string | number }>;
  discoveryStats: { impressions?: number | null; ctr?: number | null; dailySeries: Array<{ date: string; views: number; [key: string]: unknown }> };
}) {
  return (
    <>
      {video.durationSec <= 60 && (
        <ShortsMetricsPanel
          durationSec={video.durationSec}
          avgViewPercentage={avgViewed}
          avgViewDuration={computeAvgViewDuration(avgViewed, video.durationSec)}
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

      <DimensionalInsightsPanel
        subscriberBreakdown={analytics.subscriberBreakdown}
        geoBreakdown={analytics.geoBreakdown}
        trafficDetail={analytics.trafficDetail}
        demographicBreakdown={analytics.demographicBreakdown}
        impressionsCtr={derived.impressionsCtr}
      />

      <TrafficSourcePanel
        trafficSources={derived.trafficSources ?? null}
        totalViews={derived.totalViews}
      />

      <PostWatchPanel
        endScreenClicks={analytics.analytics.totals.annotationClicks ?? null}
        endScreenImpressions={analytics.analytics.totals.annotationImpressions ?? null}
        endScreenCtr={derived.endScreenClickRate ?? null}
        avgViewPercentage={avgViewed}
        shares={analytics.analytics.totals.shares ?? null}
        playlistAdds={analytics.analytics.totals.videosAddedToPlaylists ?? null}
        totalViews={derived.totalViews}
        baselineEndScreenCtr={baseline?.endScreenCtr?.mean ?? null}
      />
    </>
  );
}

function computeKpis(
  analytics: AnalyticsResponse,
  derived: AnalyticsResponse["derived"],
  avgViewed: number,
) {
  const netSubs =
    (analytics.analytics.totals.subscribersGained ?? 0) -
    (analytics.analytics.totals.subscribersLost ?? 0);
  return {
    views: derived.totalViews,
    watchTimeMin: analytics.analytics.totals.estimatedMinutesWatched,
    avgViewedPct: avgViewed,
    ctr: derived.impressionsCtr,
    subsGained: netSubs,
  };
}

function computeEngagement(
  analytics: AnalyticsResponse,
  video: AnalyticsResponse["video"],
) {
  return {
    likes: analytics.analytics.totals.likes ?? video.likeCount ?? 0,
    comments: analytics.analytics.totals.comments ?? video.commentCount ?? 0,
  };
}

function formatViewsPerDay(viewsPerDay: number | null | undefined): string | null {
  if (viewsPerDay == null) {return null;}
  if (viewsPerDay >= 10) {return Math.round(viewsPerDay).toString();}
  if (viewsPerDay >= 1) {return viewsPerDay.toFixed(1);}
  if (viewsPerDay > 0) {return "< 1";}
  return "0";
}

function computeAllMetrics(
  analytics: AnalyticsResponse,
  derived: AnalyticsResponse["derived"],
) {
  const viewsPerDayDisplay = formatViewsPerDay(derived.viewsPerDay);
  const metrics: Array<{ label: string; value: string | number }> = [
    { label: "Shares", value: analytics.analytics.totals.shares ?? 0 },
  ];
  if (viewsPerDayDisplay) {
    metrics.push({ label: "Views/day", value: viewsPerDayDisplay });
  }
  if (derived.engagementPerView != null) {
    metrics.push({
      label: "Engagement rate",
      value: `${(derived.engagementPerView * 100).toFixed(1)}%`,
    });
  }
  if (derived.subsPer1k != null) {
    metrics.push({ label: "Subs/1K views", value: derived.subsPer1k.toFixed(2) });
  }
  return metrics;
}
