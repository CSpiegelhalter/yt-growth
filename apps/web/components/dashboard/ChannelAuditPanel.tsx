"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./ChannelAuditPanel.module.css";

type ChannelAuditData = {
  bottleneck: {
    type: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  };
  actions: Array<{
    title: string;
    description: string;
    category: string;
    effort: "low" | "medium" | "high";
  }>;
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
    underperformers: Array<{
      videoId: string;
      title: string;
      metric: string;
      value: string;
    }>;
    formatInsights: Array<{
      pattern: string;
      impact: "positive" | "negative";
      evidence: string;
    }>;
  };
  metrics: {
    totalViews: number;
    totalWatchTimeMin: number;
    netSubscribers: number;
    endScreenCtr: number | null;
  } | null;
  range: string;
  videoCount: number;
};

type Props = {
  channelId: string;
};

export function ChannelAuditPanel({ channelId }: Props) {
  const [audit, setAudit] = useState<ChannelAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/audit?range=28d`);
      if (!res.ok) {
        throw new Error("Failed to fetch audit");
      }
      const data = await res.json();
      setAudit(data);
    } catch (err: any) {
      setError(err.message || "Failed to load audit");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    if (channelId) {
      fetchAudit();
    }
  }, [channelId, fetchAudit]);

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Channel Audit</h3>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Analyzing channel...</span>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Channel Audit</h3>
        </div>
        <div className={styles.error}>
          <p>Unable to load channel audit</p>
          <button onClick={fetchAudit} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { bottleneck, actions, trafficSources, trends, patterns } = audit;

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Channel Audit</h3>
        <span className={styles.range}>Last 28 days</span>
      </div>

      {/* Primary Bottleneck */}
      {bottleneck.type !== "INSUFFICIENT_DATA" && (
        <div
          className={`${styles.bottleneck} ${styles[`priority-${bottleneck.priority}`]}`}
        >
          <div className={styles.bottleneckHeader}>
            <span className={styles.bottleneckLabel}>Primary Focus</span>
            <span
              className={`${styles.priorityBadge} ${styles[bottleneck.priority]}`}
            >
              {bottleneck.priority}
            </span>
          </div>
          <h4 className={styles.bottleneckTitle}>{bottleneck.title}</h4>
          <p className={styles.bottleneckDesc}>{bottleneck.description}</p>
        </div>
      )}

      {/* Top Actions */}
      {actions.length > 0 && (
        <div className={styles.actionsSection}>
          <h4 className={styles.sectionTitle}>Top Actions</h4>
          <div className={styles.actionsList}>
            {actions.map((action, i) => (
              <div key={i} className={styles.actionCard}>
                <div className={styles.actionHeader}>
                  <span className={styles.actionNumber}>{i + 1}</span>
                  <span
                    className={`${styles.effortBadge} ${styles[action.effort]}`}
                  >
                    {action.effort} effort
                  </span>
                </div>
                <h5 className={styles.actionTitle}>{action.title}</h5>
                <p className={styles.actionDesc}>{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Details */}
      <button
        className={styles.expandBtn}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Show less" : "Show more details"}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={expanded ? styles.rotated : ""}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className={styles.expandedContent}>
          {/* Traffic Sources */}
          {trafficSources && (
            <div className={styles.trafficSection}>
              <h4 className={styles.sectionTitle}>Traffic Sources</h4>
              <div className={styles.trafficBars}>
                {trafficSources.browse && (
                  <TrafficBar
                    label="Browse"
                    percentage={trafficSources.browse.percentage}
                    views={trafficSources.browse.views}
                  />
                )}
                {trafficSources.suggested && (
                  <TrafficBar
                    label="Suggested"
                    percentage={trafficSources.suggested.percentage}
                    views={trafficSources.suggested.views}
                  />
                )}
                {trafficSources.search && (
                  <TrafficBar
                    label="Search"
                    percentage={trafficSources.search.percentage}
                    views={trafficSources.search.views}
                  />
                )}
                {trafficSources.external && (
                  <TrafficBar
                    label="External"
                    percentage={trafficSources.external.percentage}
                    views={trafficSources.external.views}
                  />
                )}
              </div>
            </div>
          )}

          {/* Trends */}
          <div className={styles.trendsSection}>
            <h4 className={styles.sectionTitle}>Trends vs Previous Period</h4>
            <div className={styles.trendsGrid}>
              <TrendCard
                label="Views"
                value={trends.views.value}
                direction={trends.views.direction}
              />
              <TrendCard
                label="Watch Time"
                value={trends.watchTime.value}
                direction={trends.watchTime.direction}
              />
              <TrendCard
                label="Subscribers"
                value={trends.subscribers.value}
                direction={trends.subscribers.direction}
              />
            </div>
          </div>

          {/* Subscriber Engagement Analysis */}
          <SubscriberEngagementSection audit={audit} />

          {/* Pattern Insights */}
          {patterns.formatInsights.length > 0 && (
            <div className={styles.insightsSection}>
              <h4 className={styles.sectionTitle}>Pattern Insights</h4>
              <div className={styles.insightsList}>
                {patterns.formatInsights.map((insight, i) => (
                  <div
                    key={i}
                    className={`${styles.insightCard} ${styles[insight.impact]}`}
                  >
                    <span className={styles.insightPattern}>
                      {insight.pattern}
                    </span>
                    <span className={styles.insightEvidence}>
                      {insight.evidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Performers */}
          {patterns.topPerformers.length > 0 && (
            <div className={styles.performersSection}>
              <h4 className={styles.sectionTitle}>Top Performers</h4>
              <div className={styles.performersList}>
                {patterns.topPerformers.map((video) => (
                  <div key={video.videoId} className={styles.performerCard}>
                    <span className={styles.performerTitle}>{video.title}</span>
                    <span className={styles.performerValue}>{video.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-components

function TrafficBar({
  label,
  percentage,
  views,
}: {
  label: string;
  percentage: number;
  views: number;
}) {
  return (
    <div className={styles.trafficBar}>
      <div className={styles.trafficInfo}>
        <span className={styles.trafficLabel}>{label}</span>
        <span className={styles.trafficPercent}>{percentage}%</span>
      </div>
      <div className={styles.trafficTrack}>
        <div
          className={styles.trafficFill}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <span className={styles.trafficViews}>
        {views.toLocaleString()} views
      </span>
    </div>
  );
}

function TrendCard({
  label,
  value,
  direction,
}: {
  label: string;
  value: number | null;
  direction: "up" | "down" | "flat";
}) {
  const displayValue =
    value != null ? `${value > 0 ? "+" : ""}${value.toFixed(0)}%` : "–";

  return (
    <div className={`${styles.trendCard} ${styles[`trend-${direction}`]}`}>
      <span className={styles.trendLabel}>{label}</span>
      <div className={styles.trendValue}>
        {direction === "up" && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        )}
        {direction === "down" && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
        <span>{displayValue}</span>
      </div>
    </div>
  );
}

/**
 * SubscriberEngagementSection - Analyzes subscriber engagement patterns
 * Uses available metrics to infer audience loyalty
 */
function SubscriberEngagementSection({ audit }: { audit: ChannelAuditData }) {
  const { metrics, trafficSources } = audit;

  // Calculate subscriber engagement metrics from available data
  const totalViews = metrics?.totalViews ?? 0;
  const netSubs = metrics?.netSubscribers ?? 0;
  const endScreenCtr = metrics?.endScreenCtr ?? null;

  // Estimate subscriber engagement based on browse + notification traffic
  // (subscribers typically come from these sources)
  const browseViews = trafficSources?.browse?.views ?? 0;
  const subscriberEstimate =
    totalViews > 0 ? Math.round((browseViews / totalViews) * 100) : null;

  // Calculate subscriber conversion rate (subs gained per 1K views)
  const subsPer1k =
    totalViews > 0 ? (netSubs / (totalViews / 1000)).toFixed(2) : null;

  // Determine engagement status
  const engagementStatus = getEngagementStatus(
    subscriberEstimate,
    subsPer1k ? parseFloat(subsPer1k) : null,
    endScreenCtr,
  );

  if (!subscriberEstimate && !subsPer1k) {
    return null;
  }

  return (
    <div className={styles.engagementSection}>
      <h4 className={styles.sectionTitle}>Audience Loyalty</h4>

      <div className={styles.engagementStats}>
        {subscriberEstimate != null && (
          <div className={styles.engagementStat}>
            <span className={styles.engagementValue}>
              {subscriberEstimate}%
            </span>
            <span className={styles.engagementLabel}>
              Est. subscriber views
            </span>
          </div>
        )}
        {subsPer1k != null && (
          <div className={styles.engagementStat}>
            <span className={styles.engagementValue}>{subsPer1k}</span>
            <span className={styles.engagementLabel}>Subs per 1K views</span>
          </div>
        )}
        {endScreenCtr != null && (
          <div className={styles.engagementStat}>
            <span className={styles.engagementValue}>
              {endScreenCtr.toFixed(1)}%
            </span>
            <span className={styles.engagementLabel}>End screen CTR</span>
          </div>
        )}
      </div>

      {engagementStatus && (
        <div
          className={`${styles.engagementDiagnosis} ${styles[engagementStatus.status]}`}
        >
          <span className={styles.engagementDiagnosisTitle}>
            {engagementStatus.title}
          </span>
          <p className={styles.engagementDiagnosisText}>
            {engagementStatus.message}
          </p>
        </div>
      )}
    </div>
  );
}

function getEngagementStatus(
  subscriberEstimate: number | null,
  subsPer1k: number | null,
  endScreenCtr: number | null,
): {
  title: string;
  message: string;
  status: "success" | "warning" | "info";
} | null {
  // High subscriber retention (many views from browse = subscribers watching)
  if (subscriberEstimate != null && subscriberEstimate > 30) {
    return {
      title: "Strong subscriber engagement",
      message:
        "A significant portion of your views come from the home feed, indicating your subscribers are actively watching. Keep them engaged with consistent uploads.",
      status: "success",
    };
  }

  // Good conversion but low returning viewers
  if (
    subsPer1k != null &&
    subsPer1k > 2 &&
    subscriberEstimate != null &&
    subscriberEstimate < 15
  ) {
    return {
      title: "Discovery-driven growth",
      message:
        "You're gaining subscribers but most views come from new viewers. This is healthy growth - focus on retaining new subscribers with consistent content.",
      status: "info",
    };
  }

  // Low conversion rate
  if (subsPer1k != null && subsPer1k < 0.5) {
    return {
      title: "Low subscriber conversion",
      message:
        "Viewers aren't converting to subscribers at a healthy rate. Ensure your content delivers on title/thumbnail promises and add clear subscribe CTAs.",
      status: "warning",
    };
  }

  // Weak end screen engagement
  if (endScreenCtr != null && endScreenCtr < 2) {
    return {
      title: "Weak session continuation",
      message:
        "Few viewers click your end screens. Verbally pitch your next video and ensure end screens link to relevant content.",
      status: "warning",
    };
  }

  return null;
}

export default ChannelAuditPanel;
