"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "./style.module.css";
import type { VideoInsightsResponse } from "@/types/api";

type Props = {
  videoId: string;
  channelId?: string;
  initialInsights: VideoInsightsResponse | null;
  initialRange: "7d" | "28d" | "90d";
};

/**
 * VideoInsightsClient - Clean, story-driven video analytics
 */
export default function VideoInsightsClient({
  videoId,
  channelId,
  initialInsights,
  initialRange,
}: Props) {
  const router = useRouter();
  const [insights, setInsights] = useState<VideoInsightsResponse | null>(
    initialInsights
  );
  const [loading, setLoading] = useState(!initialInsights);
  const [extraRemixes, setExtraRemixes] = useState<
    Array<{
      id: string;
      title: string;
      hook: string;
      keywords: string[];
      isNew?: boolean;
    }>
  >([]);
  const [generatingRemixes, setGeneratingRemixes] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const url = channelId
        ? `/api/me/channels/${channelId}/videos/${videoId}/insights?range=28d`
        : `/api/me/channels/_demo/videos/${videoId}/insights?range=28d`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setLoading(false);
    }
  }, [channelId, videoId]);

  useEffect(() => {
    setExtraRemixes([]);
    setGeneratingRemixes(false);

    if (initialInsights) {
      setInsights(initialInsights);
      setLoading(false);
    } else {
      setInsights(null);
      fetchInsights();
    }
  }, [videoId, initialInsights, fetchInsights]);

  // Loading state
  if (loading && !insights) {
    return (
      <main className={s.page}>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Analyzing your video...</p>
        </div>
      </main>
    );
  }

  // No data state
  if (!insights) {
    return (
      <main className={s.page}>
        <Link href="/dashboard" className={s.backLink}>
          ← Back to Dashboard
        </Link>
        <div className={s.errorState}>
          <h2 className={s.errorTitle}>Couldn't load insights</h2>
          <p className={s.errorDesc}>
            {!channelId
              ? "Please select a channel to view video insights."
              : "We couldn't analyze this video. Try again later."}
          </p>
          <button onClick={() => router.back()} className={s.backBtn}>
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const { video, derived, llmInsights } = insights;
  const baseRemixes = llmInsights?.remixIdeas ?? [];
  const remixItems = [
    ...baseRemixes.map((r) => ({
      id: `base:${r.title}:${r.hook}`,
      title: r.title,
      hook: r.hook,
      keywords: r.keywords ?? [],
      isNew: false,
    })),
    ...extraRemixes,
  ];

  const handleGenerateMoreRemixes = async () => {
    if (!channelId) return;
    setGeneratingRemixes(true);
    try {
      const res = await fetch(
        `/api/me/channels/${channelId}/videos/${videoId}/remixes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            range: "28d",
            seed: {
              title: video.title,
              tags: video.tags ?? [],
              currentRemixTitles: remixItems.map((r) => r.title),
              currentHooks: remixItems.map((r) => r.hook),
            },
          }),
        }
      );

      if (!res.ok) return;

      const data = (await res.json()) as {
        remixIdeas: Array<{
          title: string;
          hook: string;
          keywords: string[];
        }>;
      };
      const now = Date.now();
      const appended = (data.remixIdeas ?? []).map((r, idx) => ({
        id: `new:${now}:${idx}:${r.title}`,
        title: r.title,
        hook: r.hook,
        keywords: r.keywords ?? [],
        isNew: true,
      }));

      setExtraRemixes((prev) => [...prev, ...appended]);
      setTimeout(() => {
        setExtraRemixes((prev) =>
          prev.map((r) => (r.isNew ? { ...r, isNew: false } : r))
        );
      }, 2500);
    } catch (err) {
      console.error("Failed to generate remixes:", err);
    } finally {
      setGeneratingRemixes(false);
    }
  };

  // Calculate performance indicators
  const avgViewed = insights.analytics.totals.averageViewPercentage ?? 0;
  const engagementRate = derived.engagementPerView
    ? derived.engagementPerView * 100
    : 0;
  const subsPer1k = derived.subsPer1k ?? 0;

  // Determine overall sentiment
  const getPerformanceLevel = () => {
    let score = 0;
    if (avgViewed >= 50) score += 2;
    else if (avgViewed >= 40) score += 1;
    if (engagementRate >= 5) score += 2;
    else if (engagementRate >= 3) score += 1;
    if (subsPer1k >= 2.5) score += 2;
    else if (subsPer1k >= 1.5) score += 1;

    if (score >= 5) return { level: "excellent", label: "Performing Well" };
    if (score >= 3) return { level: "good", label: "Solid Performance" };
    if (score >= 1) return { level: "fair", label: "Room to Grow" };
    return { level: "needs-work", label: "Needs Attention" };
  };

  const performance = getPerformanceLevel();

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link href="/dashboard" className={s.backLink}>
        ← Back to Dashboard
      </Link>

      {/* Demo Banner */}
      {insights.demo && (
        <div className={s.demoBanner}>
          <span className={s.demoBadge}>Demo</span>
          <span>Sample data - connect your channel for real insights</span>
        </div>
      )}

      {/* Hero Header */}
      <header className={s.hero}>
        <div className={s.heroMedia}>
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt="" className={s.heroThumbnail} />
          ) : (
            <div className={s.heroThumbnailPlaceholder}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <a
            href={`https://youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={s.watchLink}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
            Watch
          </a>
        </div>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>{video.title}</h1>
          <div className={s.heroMeta}>
            {video.publishedAt && (
              <span>{formatRelativeDate(video.publishedAt)}</span>
            )}
            <span>•</span>
            <span>{formatDuration(video.durationSec)}</span>
            <span>•</span>
            <span>{formatCompact(derived.totalViews)} views</span>
          </div>
          <div className={`${s.performanceBadge} ${s[performance.level]}`}>
            {performance.label}
          </div>
        </div>
      </header>

      {/* AI Summary - The Main Story */}
      {llmInsights?.summary && (
        <section className={s.aiSummary}>
          <div className={s.aiIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className={s.aiText}>
            <p className={s.aiHeadline}>{llmInsights.summary.headline}</p>
            <p className={s.aiDetail}>{llmInsights.summary.oneLiner}</p>
          </div>
        </section>
      )}

      {/* Quick Stats - The Numbers That Matter */}
      <section className={s.quickStats}>
        <div className={s.statGroup}>
          <div className={s.statMain}>
            <span className={s.statValue}>{formatCompact(derived.totalViews)}</span>
            <span className={s.statLabel}>Total Views</span>
          </div>
          <div className={s.statSecondary}>
            <span>{formatCompact(derived.viewsPerDay)}/day</span>
          </div>
        </div>

        <div className={s.statDivider} />

        <div className={s.statGroup}>
          <div className={s.statMain}>
            <span className={s.statValue}>{avgViewed.toFixed(0)}%</span>
            <span className={s.statLabel}>Avg Watched</span>
          </div>
          <div className={s.statSecondary}>
            <span>{derived.avgWatchTimeMin?.toFixed(1) ?? "-"} min/view</span>
          </div>
        </div>

        <div className={s.statDivider} />

        <div className={s.statGroup}>
          <div className={s.statMain}>
            <span className={s.statValue}>{engagementRate.toFixed(1)}%</span>
            <span className={s.statLabel}>Engagement</span>
          </div>
          <div className={s.statSecondary}>
            <span>{insights.analytics.totals.likes ?? 0} likes</span>
          </div>
        </div>

        <div className={s.statDivider} />

        <div className={s.statGroup}>
          <div className={s.statMain}>
            <span className={s.statValue}>+{(insights.analytics.totals.subscribersGained ?? 0) - (insights.analytics.totals.subscribersLost ?? 0)}</span>
            <span className={s.statLabel}>Net Subs</span>
          </div>
          <div className={s.statSecondary}>
            <span>{subsPer1k.toFixed(1)}/1K views</span>
          </div>
        </div>
      </section>

      {/* What's Working / Needs Work */}
      {llmInsights && (llmInsights.wins?.length > 0 || llmInsights.leaks?.length > 0) && (
        <section className={s.winsLeaks}>
          {llmInsights.wins?.length > 0 && (
            <div className={s.winsCol}>
              <h3 className={s.colTitle}>
                <span className={s.winDot} />
                What's Working
              </h3>
              <div className={s.colCards}>
                {llmInsights.wins.map((win, i) => (
                  <div key={i} className={s.winCard}>
                    <strong>{win.label}</strong>
                    <span>{win.why}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {llmInsights.leaks?.length > 0 && (
            <div className={s.leaksCol}>
              <h3 className={s.colTitle}>
                <span className={s.leakDot} />
                Needs Work
              </h3>
              <div className={s.colCards}>
                {llmInsights.leaks.map((leak, i) => (
                  <div key={i} className={s.leakCard}>
                    <strong>{leak.label}</strong>
                    <span>{leak.why}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Key Findings */}
      {llmInsights?.keyFindings && llmInsights.keyFindings.length > 0 && (
        <section className={s.findings}>
          <h2 className={s.sectionTitle}>Key Findings</h2>
          <div className={s.findingsList}>
            {llmInsights.keyFindings.map((finding, i) => (
              <div
                key={i}
                className={`${s.findingItem} ${
                  finding.significance === "positive" ? s.findingPos :
                  finding.significance === "negative" ? s.findingNeg : s.findingNeutral
                }`}
              >
                <div className={s.findingIndicator}>
                  {finding.significance === "positive" ? "↑" :
                   finding.significance === "negative" ? "↓" : "→"}
                </div>
                <div className={s.findingContent}>
                  <div className={s.findingMeta}>{finding.dataPoint}</div>
                  <p className={s.findingText}>{finding.finding}</p>
                  <p className={s.findingAction}>→ {finding.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Title & Tags Analysis */}
      {llmInsights && (llmInsights.titleAnalysis || llmInsights.tagAnalysis) && (
        <section className={s.packaging}>
          <h2 className={s.sectionTitle}>Packaging Analysis</h2>
          <p className={s.sectionDesc}>How well your title and tags are optimized for discovery</p>

          <div className={s.packagingGrid}>
            {llmInsights.titleAnalysis && (
              <div className={s.packagingCard}>
                <div className={s.packagingHeader}>
                  <span className={s.packagingLabel}>Title</span>
                  <span className={`${s.packagingScore} ${
                    llmInsights.titleAnalysis.score >= 8 ? s.scoreGreen :
                    llmInsights.titleAnalysis.score >= 5 ? s.scoreYellow : s.scoreRed
                  }`}>
                    {llmInsights.titleAnalysis.score}/10
                  </span>
                </div>
                <p className={s.currentValue}>"{video.title}"</p>

                {llmInsights.titleAnalysis.strengths?.length > 0 && (
                  <div className={s.feedbackGroup}>
                    <span className={s.feedbackLabel}>✓ Strengths</span>
                    <ul>
                      {llmInsights.titleAnalysis.strengths.map((str, i) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {llmInsights.titleAnalysis.weaknesses?.length > 0 && (
                  <div className={s.feedbackGroup}>
                    <span className={s.feedbackLabelWarn}>✗ Could Improve</span>
                    <ul>
                      {llmInsights.titleAnalysis.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {llmInsights.titleAnalysis.suggestions?.length > 0 && (
                  <div className={s.suggestions}>
                    <span className={s.feedbackLabelAlt}>💡 Try Instead</span>
                    {llmInsights.titleAnalysis.suggestions.map((sug, i) => (
                      <div key={i} className={s.suggestionRow}>
                        <span>{sug}</span>
                        <CopyButton text={sug} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {llmInsights.tagAnalysis && (
              <div className={s.packagingCard}>
                <div className={s.packagingHeader}>
                  <span className={s.packagingLabel}>Tags</span>
                  <span className={`${s.packagingScore} ${
                    llmInsights.tagAnalysis.score >= 8 ? s.scoreGreen :
                    llmInsights.tagAnalysis.score >= 5 ? s.scoreYellow : s.scoreRed
                  }`}>
                    {llmInsights.tagAnalysis.score}/10
                  </span>
                </div>
                <p className={s.tagFeedback}>{llmInsights.tagAnalysis.feedback}</p>

                {llmInsights.tagAnalysis.missing?.length > 0 && (
                  <div className={s.missingTagsSection}>
                    <span className={s.feedbackLabelAlt}>Add These Tags</span>
                    <div className={s.missingTagsList}>
                      {llmInsights.tagAnalysis.missing.map((tag, i) => (
                        <span key={i} className={s.missingTagChip}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Priority Actions */}
      {llmInsights?.actions && llmInsights.actions.length > 0 && (
        <section className={s.actions}>
          <h2 className={s.sectionTitle}>What To Do Next</h2>
          <p className={s.sectionDesc}>Prioritized actions based on this video's data</p>

          <div className={s.actionsList}>
            {llmInsights.actions.slice(0, 5).map((action, i) => (
              <div
                key={i}
                className={`${s.actionItem} ${
                  action.priority === "high" ? s.actionHigh :
                  action.priority === "medium" ? s.actionMed : s.actionLow
                }`}
              >
                <div className={s.actionNumber}>{i + 1}</div>
                <div className={s.actionContent}>
                  <div className={s.actionTop}>
                    <span className={s.actionLeverBadge}>{action.lever}</span>
                    {action.priority === "high" && <span className={s.priorityBadge}>High Priority</span>}
                  </div>
                  <p className={s.actionText}>{action.action}</p>
                  <p className={s.actionReason}>{action.reason}</p>
                  {action.expectedImpact && (
                    <span className={s.actionImpact}>Expected: {action.expectedImpact}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Thumbnail Hints */}
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
      {remixItems.length > 0 && (
        <section className={s.remixes}>
          <h2 className={s.sectionTitle}>Video Ideas From This</h2>
          <p className={s.sectionDesc}>Spin-off concepts inspired by what worked</p>

          <div className={s.remixGrid}>
            {remixItems.slice(0, 6).map((remix) => (
              <div key={remix.id} className={s.remixCard}>
                {remix.isNew && <span className={s.newBadge}>New</span>}
                <h4 className={s.remixTitle}>{remix.title}</h4>
                <p className={s.remixHook}>"{remix.hook}"</p>
                <div className={s.remixActions}>
                  <CopyButton text={remix.title} label="Copy title" />
                  <CopyButton text={remix.hook} label="Copy hook" />
                </div>
              </div>
            ))}
          </div>

          {channelId && (
            <button
              className={s.moreRemixesBtn}
              onClick={handleGenerateMoreRemixes}
              disabled={generatingRemixes}
            >
              {generatingRemixes ? "Generating..." : "Generate More Ideas"}
            </button>
          )}
        </section>
      )}

      {/* Additional Metrics (collapsed by default) */}
      <details className={s.moreMetrics}>
        <summary className={s.moreMetricsSummary}>View All Metrics</summary>
        <div className={s.metricsTable}>
          <MetricRow label="Watch Time Total" value={`${formatCompact(insights.analytics.totals.estimatedMinutesWatched ?? 0)} min`} />
          <MetricRow label="Comments" value={String(insights.analytics.totals.comments ?? 0)} sub={derived.commentsPer1k ? `${derived.commentsPer1k.toFixed(1)}/1K` : undefined} />
          <MetricRow label="Shares" value={String(insights.analytics.totals.shares ?? 0)} sub={derived.sharesPer1k ? `${derived.sharesPer1k.toFixed(1)}/1K` : undefined} />
          <MetricRow label="Playlist Saves" value={`+${(insights.analytics.totals.videosAddedToPlaylists ?? 0) - (insights.analytics.totals.videosRemovedFromPlaylists ?? 0)}`} />
          <MetricRow label="Like Ratio" value={derived.likeRatio != null ? `${derived.likeRatio.toFixed(1)}%` : "-"} />
          {derived.cardClickRate != null && <MetricRow label="Card CTR" value={`${derived.cardClickRate.toFixed(2)}%`} />}
          {derived.endScreenClickRate != null && <MetricRow label="End Screen CTR" value={`${derived.endScreenClickRate.toFixed(2)}%`} />}
          {insights.analytics.totals.estimatedRevenue != null && <MetricRow label="Revenue" value={`$${insights.analytics.totals.estimatedRevenue.toFixed(2)}`} />}
          {derived.rpm != null && <MetricRow label="RPM" value={`$${derived.rpm.toFixed(2)}`} />}
        </div>
      </details>
    </main>
  );
}

/* Sub-components */

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={s.metricRow}>
      <span className={s.metricLabel}>{label}</span>
      <div className={s.metricValue}>
        <span>{value}</span>
        {sub && <span className={s.metricSub}>{sub}</span>}
      </div>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button onClick={handleCopy} className={s.copyBtn} type="button">
      {copied ? "✓" : label}
    </button>
  );
}

/* Helpers */

function formatRelativeDate(dateStr: string): string {
  const published = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Published today";
  if (diffDays === 1) return "Published yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}
