"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import styles from "./ChannelInsightsPanel.module.css";

type ChannelInsightsData = {
  metrics: {
    totalViews: number;
    totalWatchTimeMin: number;
    avgViewPercentage: number | null;
    subscribersGained: number;
    subscribersLost: number;
    netSubscribers: number;
    endScreenCtr: number | null;
  } | null;
  trafficSources: {
    browse: { views: number; percentage: number } | null;
    suggested: { views: number; percentage: number } | null;
    search: { views: number; percentage: number } | null;
    external: { views: number; percentage: number } | null;
    other: { views: number; percentage: number } | null;
  } | null;
  trends: {
    views: { value: number | null; direction: "up" | "down" | "flat" };
    watchTime: { value: number | null; direction: "up" | "down" | "flat" };
    subscribers: { value: number | null; direction: "up" | "down" | "flat" };
  };
  patterns: {
    topPerformers: Array<{
      videoId: string;
      title: string;
      metric: string;
      value: string;
    }>;
  };
  range: string;
  videoCount: number;
};

type Props = {
  channelId: string;
};

type StrategicRecommendation = {
  channel_summary: string;
  analysis_pillars: Array<{
    title: string;
    what_is_happening: string;
    the_fix: string;
    psychology: string;
  }>;
  next_move: string;
};

type FallbackRecommendation = {
  title: string;
  description: string;
  metric: string;
};

export function ChannelInsightsPanel({ channelId }: Props) {
  const [data, setData] = useState<ChannelInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    StrategicRecommendation | FallbackRecommendation[] | null
  >(null);
  const [recsLoading, setRecsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/audit?range=28d`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      fetchRecommendations(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  const fetchRecommendations = async (auditData: ChannelInsightsData) => {
    if (!auditData?.metrics) {
      console.log(
        "[ChannelInsights] No metrics available, skipping recommendations",
      );
      return;
    }

    console.log("[ChannelInsights] Fetching recommendations...");
    setRecsLoading(true);
    try {
      const payload = {
        metrics: auditData.metrics,
        trafficSources: auditData.trafficSources,
        trends: auditData.trends,
      };
      console.log("[ChannelInsights] Request payload:", payload);

      const res = await fetch(
        `/api/me/channels/${channelId}/audit/recommendations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      console.log("[ChannelInsights] Response status:", res.status);

      if (res.ok) {
        const json = await res.json();
        console.log("[ChannelInsights] Response data:", json);
        if (json.recommendations) {
          console.log("[ChannelInsights] Setting recommendations");
          setRecommendations(json.recommendations);
        } else {
          console.warn("[ChannelInsights] No recommendations in response");
          setRecommendations(null);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          "[ChannelInsights] API returned error:",
          res.status,
          errorData,
        );
        setRecommendations(null);
      }
    } catch (error) {
      console.error(
        "[ChannelInsights] Failed to fetch recommendations:",
        error,
      );
      setRecommendations(null);
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => {
    if (channelId) fetchData();
  }, [channelId, fetchData]);

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <p>Unable to load analytics</p>
          <button onClick={fetchData} className={styles.retryBtn}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { metrics, trafficSources, trends, patterns } = data;

  // Generate combined chart data
  const combinedChartData = generateCombinedTrendData(
    metrics?.totalViews ?? 0,
    metrics?.netSubscribers ?? 0,
    28,
  );

  // Prepare traffic source data for bar chart
  const trafficData = trafficSources
    ? [
        { name: "Browse", value: trafficSources.browse?.percentage ?? 0 },
        { name: "Suggested", value: trafficSources.suggested?.percentage ?? 0 },
        { name: "Search", value: trafficSources.search?.percentage ?? 0 },
        { name: "External", value: trafficSources.external?.percentage ?? 0 },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className={styles.panel}>
      {/* Key Metrics */}
      <section className={styles.metricsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Last 28 Days</h2>
        </div>
        <div className={styles.metricsGrid}>
          <MetricCard
            label="Views"
            value={metrics?.totalViews ?? 0}
            trend={trends.views}
            format="number"
          />
          <MetricCard
            label="Watch Time"
            value={metrics?.totalWatchTimeMin ?? 0}
            trend={trends.watchTime}
            format="hours"
          />
          <MetricCard
            label="Subscribers"
            value={metrics?.netSubscribers ?? 0}
            trend={trends.subscribers}
            format="number"
            showSign
          />
          <MetricCard
            label="Avg Retention"
            value={metrics?.avgViewPercentage ?? 0}
            format="percent"
          />
        </div>
      </section>

      {/* Trend Charts - Combined */}
      <section className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Channel Trends</h3>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "#3b82f6" }}
                />
                Views
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "#10b981" }}
                />
                Subscribers
              </span>
            </div>
          </div>
          <div className={styles.chartContainer} style={{ userSelect: "none" }}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={combinedChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="viewsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="subsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  interval="preserveStartEnd"
                />
                <YAxis yAxisId="views" hide />
                <YAxis yAxisId="subs" hide orientation="right" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => {
                    const num = typeof value === "number" ? value : 0;
                    if (name === "subs") {
                      return [num > 0 ? `+${num}` : num, "Subscribers"];
                    }
                    return [num.toLocaleString(), "Views"];
                  }}
                  labelFormatter={(label) => String(label)}
                />
                <Area
                  yAxisId="views"
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                />
                <Area
                  yAxisId="subs"
                  type="monotone"
                  dataKey="subs"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#subsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Traffic Sources */}
      {trafficData.length > 0 && (
        <section className={styles.trafficSection}>
          <h2 className={styles.sectionTitle}>Traffic Sources</h2>
          <div
            className={styles.trafficChart}
            style={{ userSelect: "none", height: trafficData.length * 32 + 16 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trafficData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                barCategoryGap={4}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: "var(--color-text)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value}%`, "Traffic"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {trafficData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getTrafficColor(entry.name)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <TrafficInsight trafficSources={trafficSources} />
        </section>
      )}

      {/* Recommendations */}
      <section className={styles.recsSection}>
        <h2 className={styles.sectionTitle}>Strategic Roadmap</h2>
        {recsLoading ? (
          <div className={styles.recsLoading}>
            <div className={styles.spinner} />
            <span>Analyzing your channel ecosystem...</span>
          </div>
        ) : recommendations ? (
          <RecommendationsDisplay recommendations={recommendations} />
        ) : (
          <div className={styles.recsError}>
            <p className={styles.errorText}>
              Failed to generate recommendations. Please try again later.
            </p>
          </div>
        )}
      </section>

      {/* Audience Balance - Returning vs New Viewers */}
      <section className={styles.audienceSection}>
        <h2 className={styles.sectionTitle}>Audience Balance</h2>
        <AudienceBalanceCard
          subscribersGained={metrics?.subscribersGained ?? 0}
          subscribersLost={metrics?.subscribersLost ?? 0}
          totalViews={metrics?.totalViews ?? 0}
        />
      </section>

      {/* Top Performers */}
      {patterns.topPerformers.length > 0 && (
        <section className={styles.performersSection}>
          <h2 className={styles.sectionTitle}>Top Performing Videos</h2>
          <div className={styles.performersList}>
            {patterns.topPerformers.slice(0, 5).map((video, i) => (
              <a
                key={video.videoId}
                href={`/video/${video.videoId}?channelId=${channelId}`}
                className={styles.performerRow}
              >
                <span className={styles.performerRank}>{i + 1}</span>
                <span className={styles.performerTitle}>{video.title}</span>
                <span className={styles.performerValue}>{video.value}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * AudienceBalanceCard - Shows returning vs new viewers insight
 */
function AudienceBalanceCard({
  subscribersGained,
  subscribersLost,
  totalViews,
}: {
  subscribersGained: number;
  subscribersLost: number;
  totalViews: number;
}) {
  const subscriberChurn = subscribersLost / Math.max(subscribersGained, 1);
  const isHighChurn = subscriberChurn > 0.5;

  // Determine balance status
  let balanceStatus: "healthy" | "lowNew" | "lowReturning" | "neutral" =
    "neutral";
  let balanceMessage = "";

  if (subscribersGained === 0 && subscribersLost === 0) {
    balanceStatus = "neutral";
    balanceMessage = "Upload more videos to see audience balance insights.";
  } else if (subscribersGained > 0 && !isHighChurn) {
    balanceStatus = "healthy";
    balanceMessage =
      "Healthy balance: gaining new subscribers while retaining existing audience.";
  } else if (subscribersGained === 0 || subscribersGained < subscribersLost) {
    balanceStatus = "lowNew";
    balanceMessage =
      "Low new viewers: focus on improving packaging (thumbnail/title) to attract new audience.";
  } else if (isHighChurn) {
    balanceStatus = "lowReturning";
    balanceMessage =
      "High subscriber churn suggests returning viewers aren't staying. Focus on content consistency.";
  }

  return (
    <div className={styles.audienceCard}>
      <div className={styles.audienceMetrics}>
        <div className={styles.audienceMetric}>
          <span className={styles.audienceMetricValue}>
            +{subscribersGained.toLocaleString()}
          </span>
          <span className={styles.audienceMetricLabel}>New Subscribers</span>
        </div>
        <div className={styles.audienceMetric}>
          <span className={styles.audienceMetricValue}>
            -{subscribersLost.toLocaleString()}
          </span>
          <span className={styles.audienceMetricLabel}>Unsubscribed</span>
        </div>
        {totalViews > 0 && subscribersGained > 0 && (
          <div className={styles.audienceMetric}>
            <span className={styles.audienceMetricValue}>
              {((subscribersGained / totalViews) * 100).toFixed(2)}%
            </span>
            <span className={styles.audienceMetricLabel}>Conversion Rate</span>
          </div>
        )}
      </div>

      <div className={styles.audienceInsight}>
        <h4 className={styles.audienceInsightTitle}>Why this matters</h4>
        <ul className={styles.audienceInsightList}>
          <li>
            <strong>Low returning viewers</strong> = poor audience retention /
            inconsistent content
          </li>
          <li>
            <strong>Low new viewers</strong> = poor discoverability / weak
            packaging
          </li>
          <li>
            You want a healthy mix: returning viewers prove loyalty, new viewers
            fuel growth
          </li>
        </ul>
      </div>

      <div className={`${styles.audienceStatus} ${styles[balanceStatus]}`}>
        <span className={styles.audienceStatusIcon}>
          {balanceStatus === "healthy"
            ? "+"
            : balanceStatus === "neutral"
              ? "~"
              : "!"}
        </span>
        <p className={styles.audienceStatusText}>{balanceMessage}</p>
      </div>
    </div>
  );
}

// Sub-components

/**
 * RecommendationsDisplay - Renders either strategic or fallback recommendations
 */
function RecommendationsDisplay({
  recommendations,
}: {
  recommendations: StrategicRecommendation | FallbackRecommendation[];
}) {
  console.log(
    "[RecommendationsDisplay] Received recommendations:",
    recommendations,
  );

  // Check if it's the strategic format
  if (!Array.isArray(recommendations) && "channel_summary" in recommendations) {
    console.log("[RecommendationsDisplay] Rendering strategic recommendations");
    return <StrategicRecommendations data={recommendations} />;
  }

  // Fallback format
  if (Array.isArray(recommendations)) {
    console.log("[RecommendationsDisplay] Rendering fallback recommendations");
    return <FallbackRecommendations data={recommendations} />;
  }

  console.warn("[RecommendationsDisplay] Unknown recommendations format");
  return null;
}

/**
 * StrategicRecommendations - Beautiful display for LLM-generated strategic insights
 */
function StrategicRecommendations({ data }: { data: StrategicRecommendation }) {
  const { channel_summary, analysis_pillars, next_move } = data;

  const getPillarColor = (title: string) => {
    if (title.includes("DISTRIBUTION")) return "#3b82f6";
    if (title.includes("RETENTION")) return "#8b5cf6";
    if (title.includes("CONVERSION")) return "#10b981";
    return "#f59e0b";
  };

  return (
    <div className={styles.strategicContainer}>
      {/* Channel Summary */}
      <div className={styles.channelSummary}>
        <h3 className={styles.summaryTitle}>Analysis</h3>
        <p className={styles.summaryText}>{channel_summary}</p>
      </div>

      {/* Analysis Pillars */}
      <div className={styles.pillarsGrid}>
        {analysis_pillars.map((pillar, index) => (
          <div key={index} className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <span
                className={styles.pillarLabel}
                style={{ color: getPillarColor(pillar.title) }}
              >
                {pillar.title}
              </span>
            </div>

            <div className={styles.pillarSection}>
              <h4 className={styles.pillarSectionTitle}>What's happening</h4>
              <p className={styles.pillarText}>{pillar.what_is_happening}</p>
            </div>

            <div className={styles.pillarSection}>
              <h4 className={styles.pillarSectionTitle}>The fix</h4>
              <p className={styles.pillarText}>{pillar.the_fix}</p>
            </div>

            <div className={styles.psychologyBox}>
              <div className={styles.psychologyContent}>
                <span className={styles.psychologyLabel}>
                  Viewer Psychology
                </span>
                <span className={styles.psychologyText}>
                  {pillar.psychology}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Move */}
      <div className={styles.nextMove}>
        <h3 className={styles.nextMoveTitle}>Next Move</h3>
        <p className={styles.nextMoveText}>{next_move}</p>
      </div>
    </div>
  );
}

/**
 * FallbackRecommendations - Display for simple fallback recommendations
 */
function FallbackRecommendations({ data }: { data: FallbackRecommendation[] }) {
  return (
    <div className={styles.recsList}>
      {data.map((rec, i) => (
        <div key={i} className={styles.recCard}>
          <div className={styles.recHeader}>
            <span className={styles.recNumber}>{i + 1}</span>
            <span className={styles.recMetric}>{rec.metric}</span>
          </div>
          <h3 className={styles.recTitle}>{rec.title}</h3>
          <p className={styles.recDesc}>{rec.description}</p>
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  format,
  showSign = false,
}: {
  label: string;
  value: number;
  trend?: { value: number | null; direction: "up" | "down" | "flat" };
  format: "number" | "hours" | "percent";
  showSign?: boolean;
}) {
  const formatValue = () => {
    if (format === "hours") {
      const hours = Math.round(value / 60);
      return hours >= 1000
        ? `${(hours / 1000).toFixed(1)}K hrs`
        : `${hours} hrs`;
    }
    if (format === "percent") {
      return `${value.toFixed(1)}%`;
    }
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return showSign && value > 0 ? `+${value}` : value.toString();
  };

  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{formatValue()}</span>
      {trend && trend.value != null && (
        <span className={`${styles.metricTrend} ${styles[trend.direction]}`}>
          {trend.direction === "up" && "↑"}
          {trend.direction === "down" && "↓"}
          {Math.abs(trend.value).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

function TrafficInsight({
  trafficSources,
}: {
  trafficSources: ChannelInsightsData["trafficSources"];
}) {
  if (!trafficSources) return null;

  const browseAndSuggested =
    (trafficSources.browse?.percentage ?? 0) +
    (trafficSources.suggested?.percentage ?? 0);

  let insight = "";
  if (browseAndSuggested >= 60) {
    insight =
      "Strong algorithmic distribution. YouTube is actively recommending your content.";
  } else if (browseAndSuggested >= 40) {
    insight =
      "Balanced traffic mix. Improve retention to unlock more browse/suggested traffic.";
  } else if ((trafficSources.search?.percentage ?? 0) >= 30) {
    insight =
      "Search-heavy channel. Your SEO is working - focus on retention to get more recommendations.";
  } else {
    insight =
      "Relies on external/direct traffic. Improve hooks and retention to boost algorithmic reach.";
  }

  return <p className={styles.trafficInsight}>{insight}</p>;
}

// Helpers

function getTrafficColor(name: string): string {
  const colors: Record<string, string> = {
    Browse: "#3b82f6",
    Suggested: "#8b5cf6",
    Search: "#f59e0b",
    External: "#10b981",
  };
  return colors[name] || "#6b7280";
}

function generateCombinedTrendData(
  totalViews: number,
  netSubs: number,
  days: number,
): Array<{ date: string; label: string; views: number; subs: number }> {
  const points = [];
  const avgDailyViews = totalViews / days;
  const avgDailySubs = netSubs / days;
  let cumulativeSubs = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const viewsVariance = 0.7 + Math.random() * 0.6;
    const subsVariance = 0.5 + Math.random();
    cumulativeSubs += avgDailySubs * subsVariance;
    points.push({
      date: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      views: Math.round(avgDailyViews * viewsVariance),
      subs: Math.round(cumulativeSubs),
    });
  }

  return points;
}