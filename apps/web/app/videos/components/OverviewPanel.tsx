"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import type {
  ActionableInsight,
  ChannelOverviewResult,
  InsightVideoInput,
  VideoPublishMarker,
} from "@/lib/features/channel-audit";
import {
  buildVideoSummary,
  computeActionableInsights,
} from "@/lib/features/channel-audit";

import { ActionableInsights } from "./ActionableInsights";
import { MetricPills } from "./MetricPills";
import s from "./overview-panel.module.css";
import { OverviewChart } from "./OverviewChart";
import { rankChannelMetrics } from "./rank-metrics";

type OverviewPanelProps = {
  channelId: string;
  videos?: InsightVideoInput[];
  videoMarkers?: VideoPublishMarker[];
};

type LlmInsightsResponse = {
  insights: ActionableInsight[];
};

export function OverviewPanel({ channelId, videos = [], videoMarkers }: OverviewPanelProps) {
  const [data, setData] = useState<ChannelOverviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [llmInsights, setLlmInsights] = useState<ActionableInsight[] | null>(
    null,
  );
  const [llmLoading, setLlmLoading] = useState(false);
  const llmFetchedRef = useRef<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetchJson<ChannelOverviewResult>(
        `/api/me/channels/${channelId}/overview?range=30d`,
      );
      setData(result);
    } catch {
      setError("Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    if (channelId) {
      void fetchOverview();
    }
  }, [channelId, fetchOverview]);

  const chartMarkers = videoMarkers ?? data?.videos ?? [];

  const staticInsights = useMemo(
    () => (data ? computeActionableInsights(videos, chartMarkers) : []),
    [videos, data, chartMarkers],
  );

  const rankedPills = useMemo(
    () => (data ? rankChannelMetrics(data.trends, videos) : { goingWell: [], needsWork: [] }),
    [data, videos],
  );

  useEffect(() => {
    if (!data || videos.length < 3) {
      return;
    }

    const cacheKey = `${channelId}:${videos.length}`;
    if (llmFetchedRef.current === cacheKey) {
      return;
    }
    llmFetchedRef.current = cacheKey;

    const fetchLlmInsights = async () => {
      setLlmLoading(true);
      try {
        const videoSummary = buildVideoSummary(
          videos.map((v) => ({
            views: v.views,
            likes: v.likes,
            comments: v.comments,
            durationSec: v.durationSec,
            publishedAt: v.publishedAt,
            avgViewPercentage: v.avgViewPercentage,
            subscribersGained: v.subscribersGained,
          })),
        );

        const trendMap: Record<string, (typeof data.trends)[number]> = {};
        for (const t of data.trends) {
          trendMap[t.metric] = t;
        }
        const toTrend = (key: string) => ({
          value: trendMap[key]?.percentChange ?? null,
          direction: (trendMap[key]?.direction ?? "flat") as
            | "up"
            | "down"
            | "flat",
        });

        const result = await apiFetchJson<LlmInsightsResponse>(
          `/api/me/channels/${channelId}/overview/insights`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoSummary,
              trafficSources: null,
              trends: {
                views: toTrend("views"),
                watchTime: toTrend("watchTime"),
                subscribers: toTrend("subscribers"),
              },
              endScreenCtr: null,
              totalViews: data.daily.reduce((sum, d) => sum + d.views, 0),
              netSubscribers: data.daily.reduce(
                (sum, d) => sum + d.subscribersGained - d.subscribersLost,
                0,
              ),
              subscribersGained: data.daily.reduce(
                (sum, d) => sum + d.subscribersGained,
                0,
              ),
              subscribersLost: data.daily.reduce(
                (sum, d) => sum + d.subscribersLost,
                0,
              ),
            }),
          },
        );
        if (result.insights?.length > 0) {
          setLlmInsights(result.insights);
        }
      } catch {
        // LLM insights are optional; static cards remain as fallback
      } finally {
        setLlmLoading(false);
      }
    };

    void fetchLlmInsights();
  }, [data, videos, channelId]);

  const displayInsights = llmLoading ? [] : (llmInsights ?? staticInsights);

  if (loading) {
    return (
      <div className={s.panel}>
        <div className={s.loadingState}>
          <div className={s.spinner} />
          <span>Loading overview...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={s.panel}>
        <div className={s.errorState}>
          <p>{error ?? "Unable to load overview."}</p>
          <button
            type="button"
            onClick={fetchOverview}
            className={s.retryBtn}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.panel}>
      <section className={s.section}>
        <OverviewChart daily={data.daily} videos={chartMarkers} />
      </section>

      <section className={s.section}>
        <MetricPills goingWell={rankedPills.goingWell} needsWork={rankedPills.needsWork} />
      </section>

      <section className={s.section}>
        <ActionableInsights insights={displayInsights} loading={llmLoading} />
      </section>
    </div>
  );
}
