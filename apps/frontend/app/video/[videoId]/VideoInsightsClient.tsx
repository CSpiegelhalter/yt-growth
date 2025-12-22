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
 * VideoInsightsClient - Displays owned video analytics and LLM insights
 * Receives initial data from server, handles range changes and refresh client-side
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
  const [range, setRange] = useState<"7d" | "28d" | "90d">(initialRange);
  const [loading, setLoading] = useState(!initialInsights); // Start loading if no initial data
  const [refreshing, setRefreshing] = useState(false);
  const [extraRemixes, setExtraRemixes] = useState<
    Array<{
      id: string;
      title: string;
      hook: string;
      keywords: string[];
      inspiredByVideoIds?: string[];
      isNew?: boolean;
    }>
  >([]);
  const [generatingRemixes, setGeneratingRemixes] = useState(false);

  const fetchInsights = useCallback(
    async (newRange: "7d" | "28d" | "90d") => {
      setLoading(true);
      try {
        // Try with channelId if available, otherwise let API return demo data
        const url = channelId
          ? `/api/me/channels/${channelId}/videos/${videoId}/insights?range=${newRange}`
          : `/api/me/channels/_demo/videos/${videoId}/insights?range=${newRange}`;
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
    },
    [channelId, videoId]
  );

  // Reset local state when the route videoId changes so we never show stale data.
  useEffect(() => {
    setExtraRemixes([]);
    setGeneratingRemixes(false);
    setRefreshing(false);
    setRange(initialRange);

    if (initialInsights) {
      setInsights(initialInsights);
      setLoading(false);
    } else {
      setInsights(null);
      // Fetch fresh insights for this videoId
      fetchInsights(initialRange);
    }
    // We intentionally depend on videoId so navigation always resets.
  }, [videoId, initialRange, initialInsights, fetchInsights]);

  // (No separate "mount" fetch effect needed; the reset-on-videoId effect handles this.)

  const handleRangeChange = useCallback(
    (newRange: "7d" | "28d" | "90d") => {
      setRange(newRange);
      fetchInsights(newRange);
    },
    [fetchInsights]
  );

  const handleRefresh = useCallback(async () => {
    if (!channelId) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/me/channels/${channelId}/videos/${videoId}/insights`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ range }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (err) {
      console.error("Failed to refresh insights:", err);
    } finally {
      setRefreshing(false);
    }
  }, [channelId, videoId, range]);

  // Loading state
  if (loading && !insights) {
    return (
      <main className={s.page}>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Loading video insights...</p>
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
          <div className={s.errorIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className={s.errorTitle}>Insights not available</h2>
          <p className={s.errorDesc}>
            {!channelId
              ? "Please select a channel to view video insights."
              : "We couldn't load insights for this video. Try refreshing."}
          </p>
          <button onClick={() => router.back()} className={s.backBtn}>
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const { video, derived, comparison, levers, llmInsights } = insights;
  const baseRemixes = llmInsights?.remixIdeas ?? [];
  const remixItems = [
    ...baseRemixes.map((r) => ({
      id: `base:${r.title}:${r.hook}`,
      title: r.title,
      hook: r.hook,
      keywords: r.keywords ?? [],
      inspiredByVideoIds: r.inspiredByVideoIds ?? [],
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
            range,
            seed: {
              title: video.title,
              tags: video.tags ?? [],
              currentRemixTitles: remixItems.map((r) => r.title),
              currentHooks: remixItems.map((r) => r.hook),
              keyMetrics: {
                subsPer1k: derived.subsPer1k ?? null,
                avgViewPercentage:
                  insights.analytics.totals.averageViewPercentage ?? null,
                watchTimePerViewSec: derived.watchTimePerViewSec ?? null,
                viewsPerDay: derived.viewsPerDay ?? null,
              },
            },
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Remix generation failed:", data);
        return;
      }

      const data = (await res.json()) as {
        remixIdeas: Array<{
          title: string;
          hook: string;
          keywords: string[];
          inspiredByVideoIds?: string[];
        }>;
      };
      const now = Date.now();
      const appended = (data.remixIdeas ?? []).map((r, idx) => ({
        id: `new:${now}:${idx}:${r.title}`,
        title: r.title,
        hook: r.hook,
        keywords: r.keywords ?? [],
        inspiredByVideoIds: r.inspiredByVideoIds ?? [],
        isNew: true,
      }));

      setExtraRemixes((prev) => [...prev, ...appended]);
      // Clear the "New" tag after a moment
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

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link href="/dashboard" className={s.backLink}>
        ← Back to Dashboard
      </Link>

      {/* Demo Banner */}
      {insights.demo && (
        <div className={s.demoBanner}>
          <span className={s.demoBadge}>Demo Data</span>
          <span>
            This is sample data. Connect your channel to see real insights.
          </span>
        </div>
      )}

      {/* Video Header */}
      <header className={s.videoHeader}>
        <div className={s.thumbnailWrap}>
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt="" className={s.thumbnail} />
          ) : (
            <div className={s.thumbnailPlaceholder}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <a
            href={`https://youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={s.watchBtn}
          >
            Watch on YouTube
          </a>
        </div>
        <div className={s.videoMeta}>
          <h1 className={s.videoTitle}>{video.title}</h1>
          <div className={s.metaRow}>
            {video.publishedAt && (
              <span className={s.metaItem}>
                Published {formatDate(video.publishedAt)}
              </span>
            )}
            <span className={s.metaItem}>
              {formatDuration(video.durationSec)}
            </span>
          </div>
          <div className={s.headerChips}>
            <span
              className={`${s.healthChip} ${
                comparison.healthScore >= 60 ? s.healthGood : s.healthWarn
              }`}
            >
              Health Score: {comparison.healthScore.toFixed(0)}
            </span>
            <span className={s.healthLabel}>{comparison.healthLabel}</span>
          </div>
        </div>
      </header>

      {/* Range Selector + Refresh */}
      <div className={s.controls}>
        <div className={s.rangeTabs}>
          {(["7d", "28d", "90d"] as const).map((r) => (
            <button
              key={r}
              className={`${s.rangeTab} ${range === r ? s.rangeTabActive : ""}`}
              onClick={() => handleRangeChange(r)}
              disabled={loading}
            >
              {r === "7d" ? "7 Days" : r === "28d" ? "28 Days" : "90 Days"}
            </button>
          ))}
        </div>
        <button
          className={s.refreshBtn}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Content Sections */}
      <div className={s.sections}>
        {/* Scorecard */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Performance</h2>
          <div className={s.scorecard}>
            <ScoreCard
              label="Views"
              value={formatCompact(derived.totalViews)}
              sub={`${formatCompact(derived.viewsPerDay)}/day`}
              delta={comparison.viewsPerDay.delta}
              vsBaseline={comparison.viewsPerDay.vsBaseline}
            />
            <ScoreCard
              label="Watch Time"
              value={formatCompact(
                insights.analytics.totals.estimatedMinutesWatched ?? 0
              )}
              sub={
                derived.watchTimePerViewSec
                  ? `${formatDuration(derived.watchTimePerViewSec)}/view`
                  : "-"
              }
            />
            <ScoreCard
              label="Avg % Viewed"
              value={
                insights.analytics.totals.averageViewPercentage != null
                  ? `${insights.analytics.totals.averageViewPercentage.toFixed(
                      1
                    )}%`
                  : "-"
              }
              delta={comparison.avgViewPercentage.delta}
              vsBaseline={comparison.avgViewPercentage.vsBaseline}
            />
            <ScoreCard
              label="Subscribers"
              value={`+${insights.analytics.totals.subscribersGained ?? 0}`}
              sub={
                derived.subsPer1k
                  ? `${derived.subsPer1k.toFixed(1)}/1K views`
                  : "-"
              }
              delta={comparison.subsPer1k.delta}
              vsBaseline={comparison.subsPer1k.vsBaseline}
            />
            <ScoreCard
              label="Engagement"
              value={
                derived.engagementPerView != null
                  ? `${(derived.engagementPerView * 100).toFixed(2)}%`
                  : "-"
              }
              sub={`${insights.analytics.totals.likes ?? 0} likes`}
              delta={comparison.engagementPerView.delta}
              vsBaseline={comparison.engagementPerView.vsBaseline}
            />
            <ScoreCard
              label="Shares"
              value={String(insights.analytics.totals.shares ?? 0)}
              sub={
                derived.sharesPer1k
                  ? `${derived.sharesPer1k.toFixed(1)}/1K`
                  : "-"
              }
              delta={comparison.sharesPer1k.delta}
              vsBaseline={comparison.sharesPer1k.vsBaseline}
            />
          </div>
        </section>

        {/* 3 Levers */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>3 Levers</h2>
          <p className={s.sectionSubtitle}>
            Focus areas for improving this video
          </p>
          <div className={s.leversGrid}>
            <LeverCard
              title="Retention"
              grade={levers.retention.grade}
              color={levers.retention.color}
              reason={levers.retention.reason}
              action={levers.retention.action}
            />
            <LeverCard
              title="Conversion"
              grade={levers.conversion.grade}
              color={levers.conversion.color}
              reason={levers.conversion.reason}
              action={levers.conversion.action}
            />
            <LeverCard
              title="Engagement"
              grade={levers.engagement.grade}
              color={levers.engagement.color}
              reason={levers.engagement.reason}
              action={levers.engagement.action}
            />
          </div>
        </section>

        {/* Wins & Leaks */}
        {llmInsights &&
          (llmInsights.wins.length > 0 || llmInsights.leaks.length > 0) && (
            <section className={s.section}>
              <div className={s.winsLeaksGrid}>
                {llmInsights.wins.length > 0 && (
                  <div className={s.winsColumn}>
                    <h3 className={s.columnTitle}>What's Working</h3>
                    {llmInsights.wins.map((win, i) => (
                      <div key={i} className={s.winCard}>
                        <span className={s.winLabel}>{win.label}</span>
                        <p className={s.winWhy}>{win.why}</p>
                      </div>
                    ))}
                  </div>
                )}
                {llmInsights.leaks.length > 0 && (
                  <div className={s.leaksColumn}>
                    <h3 className={s.columnTitle}>What's Leaking</h3>
                    {llmInsights.leaks.map((leak, i) => (
                      <div key={i} className={s.leakCard}>
                        <span className={s.leakLabel}>{leak.label}</span>
                        <p className={s.leakWhy}>{leak.why}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

        {/* What to change next */}
        {llmInsights && llmInsights.actions.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>What to change next</h2>
            <p className={s.sectionSubtitle}>
              Actionable fixes prioritized by leverage on retention, conversion,
              and engagement.
            </p>
            <div className={s.actionsGrid}>
              {llmInsights.actions.slice(0, 6).map((action, i) => (
                <div key={i} className={s.actionCard}>
                  <div className={s.actionTopRow}>
                    <span className={s.actionLever}>{action.lever}</span>
                    {action.expectedImpact && (
                      <span className={s.actionImpact}>
                        {action.expectedImpact}
                      </span>
                    )}
                  </div>
                  <p className={s.actionText}>{action.action}</p>
                  <p className={s.actionReason}>{action.reason}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Remix Ideas */}
        {llmInsights && remixItems.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Remix Ideas</h2>
            <p className={s.sectionSubtitle}>
              Ready-to-film angles inspired by what worked here.
            </p>
            <div className={s.remixGrid}>
              {remixItems.slice(0, 10).map((remix) => (
                <div key={remix.id} className={s.remixCard}>
                  <div className={s.remixHeaderRow}>
                    <h4 className={s.remixTitle}>{remix.title}</h4>
                    {remix.isNew && <span className={s.newPill}>New</span>}
                  </div>
                  <p className={s.remixHook}>&ldquo;{remix.hook}&rdquo;</p>
                  {remix.keywords.length > 0 && (
                    <div className={s.remixKeywords}>
                      {remix.keywords.slice(0, 6).map((kw) => (
                        <span key={kw} className={s.remixKeyword}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={s.remixActionsRow}>
                    <CopyButton label="Copy title" text={remix.title} />
                    <CopyButton label="Copy hook" text={remix.hook} />
                  </div>
                </div>
              ))}
            </div>
            <div className={s.remixFooterRow}>
              <button
                className={s.primaryBtn}
                onClick={handleGenerateMoreRemixes}
                disabled={!channelId || generatingRemixes}
              >
                {generatingRemixes ? "Generating..." : "Generate more remixes"}
              </button>
              {!channelId && (
                <span className={s.mutedHint}>
                  Select a channel to generate more.
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* Sub-components */

function ScoreCard({
  label,
  value,
  sub,
  delta,
  vsBaseline,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  vsBaseline?: "above" | "at" | "below" | "unknown";
}) {
  return (
    <div className={s.scoreCard}>
      <span className={s.scoreLabel}>{label}</span>
      <span className={s.scoreValue}>{value}</span>
      {sub && <span className={s.scoreSub}>{sub}</span>}
      {delta != null && vsBaseline && vsBaseline !== "unknown" && (
        <span
          className={`${s.scoreDelta} ${
            vsBaseline === "above"
              ? s.deltaPositive
              : vsBaseline === "below"
              ? s.deltaNegative
              : s.deltaNeutral
          }`}
        >
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}% vs avg
        </span>
      )}
    </div>
  );
}

function LeverCard({
  title,
  grade,
  color,
  reason,
  action,
}: {
  title: string;
  grade: string;
  color: string;
  reason: string;
  action: string;
}) {
  return (
    <div className={s.leverCard}>
      <div className={s.leverHeader}>
        <span className={s.leverTitle}>{title}</span>
        <span className={s.leverGrade} data-color={color}>
          {grade}
        </span>
      </div>
      <p className={s.leverReason}>{reason}</p>
      <p className={s.leverAction}>{action}</p>
    </div>
  );
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button onClick={handleCopy} className={s.secondaryBtn} type="button">
      {copied ? "Copied" : label}
    </button>
  );
}

/* Helpers */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
