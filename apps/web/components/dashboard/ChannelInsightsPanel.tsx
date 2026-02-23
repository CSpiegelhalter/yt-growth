"use client";

import { useCallback,useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SubsGradientDef,ViewsGradientDef } from "@/components/ui/ChartGradients";

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

/* ------------------------------------------------------------------ */
/*  Data-transformation helpers (extracted to reduce complexity)       */
/* ------------------------------------------------------------------ */

type MetricValues = {
  totalViews: number;
  totalWatchTimeMin: number;
  netSubscribers: number;
  avgViewPercentage: number;
  subscribersGained: number;
  subscribersLost: number;
};

function extractMetricValues(
  metrics: ChannelInsightsData["metrics"],
): MetricValues {
  return {
    totalViews: metrics?.totalViews ?? 0,
    totalWatchTimeMin: metrics?.totalWatchTimeMin ?? 0,
    netSubscribers: metrics?.netSubscribers ?? 0,
    avgViewPercentage: metrics?.avgViewPercentage ?? 0,
    subscribersGained: metrics?.subscribersGained ?? 0,
    subscribersLost: metrics?.subscribersLost ?? 0,
  };
}

type TrafficDatum = { name: string; value: number };

function prepareTrafficData(
  trafficSources: ChannelInsightsData["trafficSources"],
): TrafficDatum[] {
  if (!trafficSources) {return [];}
  return [
    { name: "Browse", value: trafficSources.browse?.percentage ?? 0 },
    { name: "Suggested", value: trafficSources.suggested?.percentage ?? 0 },
    { name: "Search", value: trafficSources.search?.percentage ?? 0 },
    { name: "External", value: trafficSources.external?.percentage ?? 0 },
  ].filter((d) => d.value > 0);
}

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

/* ------------------------------------------------------------------ */
/*  Section sub-components (extracted to reduce main-component size)   */
/* ------------------------------------------------------------------ */

function MetricsSection({
  mv,
  trends,
}: {
  mv: MetricValues;
  trends: ChannelInsightsData["trends"];
}) {
  return (
    <section className={styles.metricsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Last 28 Days</h2>
      </div>
      <div className={styles.metricsGrid}>
        <MetricCard label="Views" value={mv.totalViews} trend={trends.views} format="number" />
        <MetricCard label="Watch Time" value={mv.totalWatchTimeMin} trend={trends.watchTime} format="hours" />
        <MetricCard label="Subscribers" value={mv.netSubscribers} trend={trends.subscribers} format="number" showSign />
        <MetricCard label="Avg Retention" value={mv.avgViewPercentage} format="percent" />
      </div>
    </section>
  );
}

function TrendChartSection({ chartData }: { chartData: ReturnType<typeof generateCombinedTrendData> }) {
  return (
    <section className={styles.chartsSection}>
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Channel Trends</h3>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#3b82f6" }} />
              Views
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#10b981" }} />
              Subscribers
            </span>
          </div>
        </div>
        <div className={styles.chartContainer} style={{ userSelect: "none" }}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <ViewsGradientDef />
                <SubsGradientDef />
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
                labelFormatter={String}
              />
              <Area yAxisId="views" type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fill="url(#viewsGradient)" />
              <Area yAxisId="subs" type="monotone" dataKey="subs" stroke="#10b981" strokeWidth={2} fill="url(#subsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function TrafficSourcesSection({
  trafficData,
  trafficSources,
}: {
  trafficData: TrafficDatum[];
  trafficSources: ChannelInsightsData["trafficSources"];
}) {
  if (trafficData.length === 0) {return null;}
  return (
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
                <Cell key={`cell-${index}`} fill={getTrafficColor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TrafficInsight trafficSources={trafficSources} />
    </section>
  );
}

function RecommendationsSection({
  loading,
  recommendations,
}: {
  loading: boolean;
  recommendations: StrategicRecommendation | FallbackRecommendation[] | null;
}) {
  return (
    <section className={styles.recsSection}>
      <h2 className={styles.sectionTitle}>Strategic Roadmap</h2>
      {loading ? (
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
  );
}

function TopPerformersSection({
  performers,
  channelId,
}: {
  performers: ChannelInsightsData["patterns"]["topPerformers"];
  channelId: string;
}) {
  if (performers.length === 0) {return null;}
  return (
    <section className={styles.performersSection}>
      <h2 className={styles.sectionTitle}>Top Performing Videos</h2>
      <div className={styles.performersList}>
        {performers.slice(0, 5).map((video, i) => (
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
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function ChannelInsightsPanel({ channelId }: Props) {
  const [data, setData] = useState<ChannelInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    StrategicRecommendation | FallbackRecommendation[] | null
  >(null);
  const [recsLoading, setRecsLoading] = useState(false);

  const fetchRecommendations = useCallback(async (auditData: ChannelInsightsData) => {
    if (!auditData?.metrics) {return;}

    setRecsLoading(true);
    try {
      const payload = {
        metrics: auditData.metrics,
        trafficSources: auditData.trafficSources,
        trends: auditData.trends,
      };

      const res = await fetch(
        `/api/me/channels/${channelId}/audit/recommendations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        const json = await res.json();
        setRecommendations(json.recommendations ?? null);
      } else {
        setRecommendations(null);
      }
    } catch {
      setRecommendations(null);
    } finally {
      setRecsLoading(false);
    }
  }, [channelId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/audit?range=28d`);
      if (!res.ok) {throw new Error("Failed to fetch");}
      const json = await res.json();
      setData(json);
      void fetchRecommendations(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [channelId, fetchRecommendations]);

  useEffect(() => {
    if (channelId) {void fetchData();}
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

  const mv = extractMetricValues(data.metrics);
  const trafficData = prepareTrafficData(data.trafficSources);
  const combinedChartData = generateCombinedTrendData(mv.totalViews, mv.netSubscribers, 28);

  return (
    <div className={styles.panel}>
      <MetricsSection mv={mv} trends={data.trends} />
      <TrendChartSection chartData={combinedChartData} />
      <TrafficSourcesSection trafficData={trafficData} trafficSources={data.trafficSources} />
      <RecommendationsSection loading={recsLoading} recommendations={recommendations} />
      <AudienceSection mv={mv} />
      <TopPerformersSection performers={data.patterns.topPerformers} channelId={channelId} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Remaining sub-components                                          */
/* ------------------------------------------------------------------ */

function AudienceSection({ mv }: { mv: MetricValues }) {
  return (
    <section className={styles.audienceSection}>
      <h2 className={styles.sectionTitle}>Audience Balance</h2>
      <AudienceBalanceCard
        subscribersGained={mv.subscribersGained}
        subscribersLost={mv.subscribersLost}
        totalViews={mv.totalViews}
      />
    </section>
  );
}

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
  const { balanceStatus, balanceMessage } = deriveAudienceBalance(
    subscribersGained,
    subscribersLost,
    subscriberChurn,
  );
  const showConversion = totalViews > 0 && subscribersGained > 0;
  const conversionRate = showConversion
    ? ((subscribersGained / totalViews) * 100).toFixed(2)
    : null;

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
        {showConversion && (
          <div className={styles.audienceMetric}>
            <span className={styles.audienceMetricValue}>{conversionRate}%</span>
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
          <BalanceStatusIcon status={balanceStatus} />
        </span>
        <p className={styles.audienceStatusText}>{balanceMessage}</p>
      </div>
    </div>
  );
}

function deriveAudienceBalance(
  subscribersGained: number,
  subscribersLost: number,
  subscriberChurn: number,
): { balanceStatus: "healthy" | "lowNew" | "lowReturning" | "neutral"; balanceMessage: string } {
  if (subscribersGained === 0 && subscribersLost === 0) {
    return { balanceStatus: "neutral", balanceMessage: "Upload more videos to see audience balance insights." };
  }
  if (subscribersGained > 0 && subscriberChurn <= 0.5) {
    return { balanceStatus: "healthy", balanceMessage: "Healthy balance: gaining new subscribers while retaining existing audience." };
  }
  if (subscribersGained === 0 || subscribersGained < subscribersLost) {
    return { balanceStatus: "lowNew", balanceMessage: "Low new viewers: focus on improving packaging (thumbnail/title) to attract new audience." };
  }
  return { balanceStatus: "lowReturning", balanceMessage: "High subscriber churn suggests returning viewers aren't staying. Focus on content consistency." };
}

function BalanceStatusIcon({ status }: { status: "healthy" | "lowNew" | "lowReturning" | "neutral" }) {
  const iconMap: Record<string, string> = { healthy: "+", neutral: "~" };
  return <>{iconMap[status] ?? "!"}</>;
}

function RecommendationsDisplay({
  recommendations,
}: {
  recommendations: StrategicRecommendation | FallbackRecommendation[];
}) {
  if (!Array.isArray(recommendations) && "channel_summary" in recommendations) {
    return <StrategicRecommendations data={recommendations} />;
  }

  if (Array.isArray(recommendations)) {
    return <FallbackRecommendations data={recommendations} />;
  }

  return null;
}

function StrategicRecommendations({ data }: { data: StrategicRecommendation }) {
  const { channel_summary, analysis_pillars, next_move } = data;

  return (
    <div className={styles.strategicContainer}>
      <div className={styles.channelSummary}>
        <h3 className={styles.summaryTitle}>Analysis</h3>
        <p className={styles.summaryText}>{channel_summary}</p>
      </div>

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
              <h4 className={styles.pillarSectionTitle}>What&apos;s happening</h4>
              <p className={styles.pillarText}>{pillar.what_is_happening}</p>
            </div>
            <div className={styles.pillarSection}>
              <h4 className={styles.pillarSectionTitle}>The fix</h4>
              <p className={styles.pillarText}>{pillar.the_fix}</p>
            </div>
            <div className={styles.psychologyBox}>
              <div className={styles.psychologyContent}>
                <span className={styles.psychologyLabel}>Viewer Psychology</span>
                <span className={styles.psychologyText}>{pillar.psychology}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.nextMove}>
        <h3 className={styles.nextMoveTitle}>Next Move</h3>
        <p className={styles.nextMoveText}>{next_move}</p>
      </div>
    </div>
  );
}

function getPillarColor(title: string) {
  if (title.includes("DISTRIBUTION")) {return "#3b82f6";}
  if (title.includes("RETENTION")) {return "#8b5cf6";}
  if (title.includes("CONVERSION")) {return "#10b981";}
  return "#f59e0b";
}

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
  const formatted = formatMetricValue(value, format, showSign);
  const showTrend = trend && trend.value != null;

  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{formatted}</span>
      {showTrend && (
        <span className={`${styles.metricTrend} ${styles[trend!.direction]}`}>
          {trend!.direction === "up" && "↑"}
          {trend!.direction === "down" && "↓"}
          {Math.abs(trend!.value!).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

function formatMetricValue(value: number, format: string, showSign: boolean): string {
  if (format === "hours") {
    const hours = Math.round(value / 60);
    return hours >= 1000 ? `${(hours / 1000).toFixed(1)}K hrs` : `${hours} hrs`;
  }
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  if (value >= 1_000_000) {return `${(value / 1_000_000).toFixed(1)}M`;}
  if (value >= 1000) {return `${(value / 1000).toFixed(1)}K`;}
  return showSign && value > 0 ? `+${value}` : value.toString();
}

function TrafficInsight({
  trafficSources,
}: {
  trafficSources: ChannelInsightsData["trafficSources"];
}) {
  if (!trafficSources) {return null;}

  const browseAndSuggested =
    (trafficSources.browse?.percentage ?? 0) +
    (trafficSources.suggested?.percentage ?? 0);

  const insight = deriveTrafficInsight(browseAndSuggested, trafficSources.search?.percentage ?? 0);

  return <p className={styles.trafficInsight}>{insight}</p>;
}

function deriveTrafficInsight(browseAndSuggested: number, searchPct: number): string {
  if (browseAndSuggested >= 60) {
    return "Strong algorithmic distribution. YouTube is actively recommending your content.";
  }
  if (browseAndSuggested >= 40) {
    return "Balanced traffic mix. Improve retention to unlock more browse/suggested traffic.";
  }
  if (searchPct >= 30) {
    return "Search-heavy channel. Your SEO is working - focus on retention to get more recommendations.";
  }
  return "Relies on external/direct traffic. Improve hooks and retention to boost algorithmic reach.";
}
