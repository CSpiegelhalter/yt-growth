"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import s from "./style.module.css";
import type { VideoInsightsResponse } from "@/types/api";
import { formatCompactRounded as formatCompact } from "@/lib/format";

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
    }
  | { kind: "upgrade_required"; message: string }
  | { kind: "youtube_permissions"; message: string }
  | { kind: "generic"; message: string; status: number };

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
  const backLink =
    from === "subscriber-insights"
      ? { href: "/subscriber-insights", label: "Back to Subscriber Insights" }
      : { href: "/dashboard", label: "Back to Dashboard" };
  const router = useRouter();
  const [range] = useState<"7d" | "28d" | "90d">(initialRange);
  const [insights, setInsights] = useState<VideoInsightsResponse | null>(
    initialInsights
  );
  const [loading, setLoading] = useState(!initialInsights);
  const [error, setError] = useState<InsightsError | null>(null);
  const lastAutoFetchKeyRef = useRef<string | null>(null);
  const [llmRefreshing, setLlmRefreshing] = useState(false);
  const llmAutoKeyRef = useRef<string | null>(null);
  const [llmProgress, setLlmProgress] = useState(0);

  const refreshInsights = useCallback(async () => {
    if (!channelId) return;
    setLlmRefreshing(true);
    try {
      const res = await fetch(
        `/api/me/channels/${channelId}/videos/${videoId}/insights`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ range, llmOnly: true }),
        }
      );
      if (res.ok) {
        const data = (await res.json()) as VideoInsightsResponse;
        setInsights(data);
      }
    } finally {
      setLlmRefreshing(false);
    }
  }, [channelId, videoId, range]);

  // Smooth progress bar for "insights generation" (we don't have real progress).
  useEffect(() => {
    if (!llmRefreshing) return;
    setLlmProgress(12);
    const t = window.setInterval(() => {
      setLlmProgress((p) => {
        const target = 92;
        const next = p + Math.max(1, Math.round((target - p) * 0.08));
        return Math.min(target, next);
      });
    }, 350);
    return () => window.clearInterval(t);
  }, [llmRefreshing]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
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

        if (body?.code === "youtube_permissions") {
          setError({
            kind: "youtube_permissions",
            message:
              body?.error ??
              "Google account is missing required YouTube permissions. Reconnect Google and try again.",
          });
          setInsights(null);
          return;
        }

        if (body?.error === "limit_reached") {
          setError({
            kind: "limit_reached",
            used: Number(body.used ?? 0),
            limit: Number(body.limit ?? 0),
            remaining: Number(body.remaining ?? 0),
            resetAt: String(body.resetAt ?? ""),
            upgrade: Boolean(body.upgrade),
          });
          setInsights(null);
          return;
        }

        if (body?.error === "upgrade_required") {
          setError({
            kind: "upgrade_required",
            message: body?.message ?? "Upgrade required to use this feature.",
          });
          setInsights(null);
          return;
        }

        const msg =
          body?.error ?? body?.message ?? `Request failed (${res.status})`;
        setError({ kind: "generic", message: String(msg), status: res.status });
        setInsights(null);
        return;
      }

      const data = await res.json();
      setInsights(data);

      // Performance: auto-generate full insights in a separate request if missing.
      // This keeps initial page load fast (analytics/derived first, narrative later).
      if (data && !data.demo && data.llmInsights == null && channelId) {
        const k = `${channelId}:${videoId}:${range}`;
        if (llmAutoKeyRef.current !== k) {
          llmAutoKeyRef.current = k;
          // Don't await; keep UI responsive
          void refreshInsights();
        }
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
      // when the result isn't cached yet.
      const k = `${channelId ?? "no-channel"}:${videoId}:${range}`;
      if (lastAutoFetchKeyRef.current !== k) {
        lastAutoFetchKeyRef.current = k;
        fetchInsights();
      }
    }
  }, [videoId, initialInsights, fetchInsights, channelId, range]);

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
        <Link href={backLink.href} className={s.backLink}>
          ← {backLink.label}
        </Link>
        <div className={s.errorState}>
          <h2 className={s.errorTitle}>
            {error?.kind === "limit_reached"
              ? "Daily limit reached"
              : error?.kind === "youtube_permissions"
              ? "Permissions needed"
              : error?.kind === "upgrade_required"
              ? "Upgrade required"
              : "Couldn't load insights"}
          </h2>

          <p className={s.errorDesc}>
            {!channelId
              ? "Please select a channel to view video insights."
              : error?.kind === "limit_reached"
              ? `You used ${error.used}/${
                  error.limit
                } video analyses today. You can analyze more after ${formatResetAt(
                  error.resetAt
                )}.`
              : error?.kind === "youtube_permissions"
              ? "Your Google connection is missing YouTube Analytics permissions (often because permissions were denied). Reconnect Google and allow the requested access."
              : error?.kind === "upgrade_required"
              ? error.message
              : error?.kind === "generic"
              ? error.message
              : "We couldn't analyze this video. Try again later."}
          </p>

          <div className={s.errorActions}>
            {error?.kind === "youtube_permissions" && (
              <a className={s.backBtn} href="/api/integrations/google/start">
                Reconnect Google
              </a>
            )}

            {(error?.kind === "limit_reached" ||
              error?.kind === "upgrade_required") && (
              <a className={s.backBtn} href="/api/integrations/stripe/checkout">
                Upgrade to Pro
              </a>
            )}

            <button
              onClick={() => fetchInsights()}
              className={s.secondaryBtn}
              type="button"
            >
              Try Again
            </button>

            <button
              onClick={() => router.back()}
              className={s.secondaryBtn}
              type="button"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
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
  const seoTags = (llmInsights?.tagAnalysis?.missing ?? [])
    .map((t) => String(t ?? "").trim())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 25);

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link href={backLink.href} className={s.backLink}>
        ← {backLink.label}
      </Link>

      {/* Insights generation progress (background) */}
      {!insights.demo && insights.llmInsights == null && channelId && (
        <div className={s.insightsProgress}>
          <div className={s.insightsProgressTitle}>Generating insights…</div>
          <div
            className={s.progressTrack}
            role="progressbar"
            aria-label="Generating insights"
          >
            <div
              className={s.progressFill}
              style={{ width: `${Math.max(8, llmProgress || 12)}%` }}
            />
          </div>
          <div className={s.insightsProgressHint}>
            You can keep browsing — this usually takes 5–20 seconds.
          </div>
        </div>
      )}

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
            <div className={s.heroThumbWrap}>
              <Image
                src={video.thumbnailUrl}
                alt={`${video.title ?? "Video"} thumbnail`}
                fill
                className={s.heroThumbnail}
                sizes="(max-width: 560px) 100vw, 280px"
                priority
              />
            </div>
          ) : (
            <div className={s.heroThumbWrap}>
              <div className={s.heroThumbnailPlaceholder}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          <a
            href={`https://youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={s.watchLink}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
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

      {/* Quick Stats - The Numbers That Matter */}
      <section className={s.quickStats}>
        <div className={s.statGroup}>
          <div className={s.statMain}>
            <span className={s.statValue}>
              {formatCompact(derived.totalViews)}
            </span>
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
            <span className={s.statValue}>
              +
              {(insights.analytics.totals.subscribersGained ?? 0) -
                (insights.analytics.totals.subscribersLost ?? 0)}
            </span>
            <span className={s.statLabel}>Net Subs</span>
          </div>
          <div className={s.statSecondary}>
            <span>{subsPer1k.toFixed(1)}/1K views</span>
          </div>
        </div>
      </section>

      {/* What's Working / Needs Work - Only show if we have enough data */}
      {llmInsights &&
        derived.totalViews >= 100 &&
        (llmInsights.wins?.length > 0 || llmInsights.leaks?.length > 0) && (
          <section className={s.winsLeaks}>
            {llmInsights.wins?.length > 0 && (
              <div className={s.winsCol}>
                <h3 className={s.colTitle}>
                  <span className={s.winDot} />
                  What{"'"}s Working
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
      {llmInsights?.keyFindings && llmInsights.keyFindings.length > 0 && (
        <section className={s.findings}>
          <h2 className={s.sectionTitle}>Key Findings</h2>
          <div className={s.findingsList}>
            {llmInsights.keyFindings.map((finding, i) => (
              <div
                key={i}
                className={`${s.findingItem} ${
                  finding.significance === "positive"
                    ? s.findingPos
                    : finding.significance === "negative"
                    ? s.findingNeg
                    : s.findingNeutral
                }`}
              >
                <div className={s.findingIndicator}>
                  {finding.significance === "positive"
                    ? "↑"
                    : finding.significance === "negative"
                    ? "↓"
                    : "→"}
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

      {/* Viewer Voice (Comments) */}
      {llmInsights?.commentInsights &&
        (llmInsights.commentInsights.themes?.length > 0 ||
          llmInsights.commentInsights.viewerLoved?.length > 0 ||
          llmInsights.commentInsights.viewerAskedFor?.length > 0 ||
          llmInsights.commentInsights.hookInspiration?.length > 0) && (
          <section className={s.packaging}>
            <h2 className={s.sectionTitle}>Viewer Voice (from comments)</h2>
            <p className={s.sectionDesc}>
              What viewers are reacting to, what they want next, and hook-worthy
              language you can reuse
            </p>

            <div className={s.packagingGrid}>
              <div className={s.packagingCard}>
                <div className={s.packagingHeader}>
                  <span className={s.packagingLabel}>Sentiment</span>
                </div>
                <p className={s.tagFeedback}>
                  {llmInsights.commentInsights.sentiment.positive}% positive •{" "}
                  {llmInsights.commentInsights.sentiment.neutral}% neutral •{" "}
                  {llmInsights.commentInsights.sentiment.negative}% negative
                </p>

                {llmInsights.commentInsights.themes?.length > 0 && (
                  <div className={s.feedbackGroup}>
                    <span className={s.feedbackLabelAlt}>Themes</span>
                    <ul>
                      {llmInsights.commentInsights.themes
                        .slice(0, 5)
                        .map((t, i) => (
                          <li key={i}>
                            <strong>{t.theme}</strong>
                            {typeof t.count === "number" ? ` (${t.count})` : ""}
                            {t.examples?.length ? ` — “${t.examples[0]}”` : ""}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>

              {llmInsights.commentInsights.viewerLoved?.length > 0 && (
                <div className={s.packagingCard}>
                  <div className={s.packagingHeader}>
                    <span className={s.packagingLabel}>What viewers loved</span>
                  </div>
                  <div className={s.feedbackGroup}>
                    <ul>
                      {llmInsights.commentInsights.viewerLoved
                        .slice(0, 6)
                        .map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              {llmInsights.commentInsights.viewerAskedFor?.length > 0 && (
                <div className={s.packagingCard}>
                  <div className={s.packagingHeader}>
                    <span className={s.packagingLabel}>
                      What viewers asked for
                    </span>
                  </div>
                  <div className={s.feedbackGroup}>
                    <ul>
                      {llmInsights.commentInsights.viewerAskedFor
                        .slice(0, 6)
                        .map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              {llmInsights.commentInsights.hookInspiration?.length > 0 && (
                <div className={s.packagingCard}>
                  <div className={s.packagingHeader}>
                    <span className={s.packagingLabel}>Hook inspiration</span>
                  </div>
                  <div className={s.suggestions}>
                    {llmInsights.commentInsights.hookInspiration
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((quote, i) => (
                        <div key={i} className={s.suggestionRow}>
                          <span>&quot;{quote}&quot;</span>
                          <CopyButton text={quote} />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      {/* Title & Tags Analysis */}
      {llmInsights &&
        (llmInsights.titleAnalysis || llmInsights.tagAnalysis) && (
          <section className={s.packaging}>
            <h2 className={s.sectionTitle}>Title & Tags Optimization</h2>
            <p className={s.sectionDesc}>
              How well your title and tags are optimized for clicks and
              discovery
            </p>

            <div className={s.packagingGrid}>
              {llmInsights.titleAnalysis && (
                <div className={s.packagingCard}>
                  <div className={s.packagingHeader}>
                    <span className={s.packagingLabel}>Title</span>
                    <span
                      className={`${s.packagingScore} ${
                        llmInsights.titleAnalysis.score >= 8
                          ? s.scoreGreen
                          : llmInsights.titleAnalysis.score >= 5
                          ? s.scoreYellow
                          : s.scoreRed
                      }`}
                    >
                      {llmInsights.titleAnalysis.score}/10
                    </span>
                  </div>
                  <p className={s.currentValue}>&quot;{video.title}&quot;</p>

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
                      <span className={s.feedbackLabelWarn}>
                        ✗ Could Improve
                      </span>
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

              {llmInsights.descriptionAnalysis && (
                <div className={s.packagingCard}>
                  <div className={s.packagingHeader}>
                    <span className={s.packagingLabel}>Description</span>
                    <span
                      className={`${s.packagingScore} ${
                        llmInsights.descriptionAnalysis.score >= 8
                          ? s.scoreGreen
                          : llmInsights.descriptionAnalysis.score >= 5
                          ? s.scoreYellow
                          : s.scoreRed
                      }`}
                    >
                      {llmInsights.descriptionAnalysis.score}/10
                    </span>
                  </div>

                  <p className={s.tagFeedback}>
                    {llmInsights.descriptionAnalysis.weaknesses?.length
                      ? llmInsights.descriptionAnalysis.weaknesses[0]
                      : "Description SEO review."}
                  </p>

                  {llmInsights.descriptionAnalysis.rewrittenOpening && (
                    <div className={s.suggestions}>
                      <span className={s.feedbackLabelAlt}>
                        Stronger opening (copy/paste)
                      </span>
                      <div className={s.suggestionRow}>
                        <span>
                          {llmInsights.descriptionAnalysis.rewrittenOpening}
                        </span>
                        <CopyButton
                          text={
                            llmInsights.descriptionAnalysis.rewrittenOpening
                          }
                        />
                      </div>
                    </div>
                  )}

                  {llmInsights.descriptionAnalysis.addTheseLines?.length >
                    0 && (
                    <div className={s.suggestions} style={{ marginTop: 12 }}>
                      <span className={s.feedbackLabelAlt}>
                        Add these lines (copy/paste)
                      </span>
                      {llmInsights.descriptionAnalysis.addTheseLines
                        .filter(Boolean)
                        .slice(0, 6)
                        .map((line, i) => (
                          <div key={i} className={s.suggestionRow}>
                            <span>{line}</span>
                            <CopyButton text={line} />
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
                    <span
                      className={`${s.packagingScore} ${
                        llmInsights.tagAnalysis.score >= 8
                          ? s.scoreGreen
                          : llmInsights.tagAnalysis.score >= 5
                          ? s.scoreYellow
                          : s.scoreRed
                      }`}
                    >
                      {llmInsights.tagAnalysis.score}/10
                    </span>
                  </div>
                  <p className={s.tagFeedback}>
                    {llmInsights.tagAnalysis.feedback}
                  </p>

                  {seoTags.length > 0 && (
                    <div className={s.missingTagsSection}>
                      <div className={s.missingTagsHeader}>
                        <span className={s.feedbackLabelAlt}>
                          Copy-paste SEO tags
                        </span>
                        <CopyButton
                          text={seoTags.join(", ")}
                          label="Copy all"
                        />
                      </div>

                      <div className={s.tagChips}>
                        {seoTags.map((tag) => (
                          <TagChip key={tag} tag={tag} />
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
          <p className={s.sectionDesc}>
            Prioritized actions based on this video{"'"}s data
          </p>

          <div className={s.actionsList}>
            {llmInsights.actions.slice(0, 5).map((action, i) => (
              <div
                key={i}
                className={`${s.actionItem} ${
                  action.priority === "high"
                    ? s.actionHigh
                    : action.priority === "medium"
                    ? s.actionMed
                    : s.actionLow
                }`}
              >
                <div className={s.actionNumber}>{i + 1}</div>
                <div className={s.actionContent}>
                  <div className={s.actionTop}>
                    <span className={s.actionLeverBadge}>{action.lever}</span>
                    {action.priority === "high" && (
                      <span className={s.priorityBadge}>High Priority</span>
                    )}
                  </div>
                  <p className={s.actionText}>{action.action}</p>
                  <p className={s.actionReason}>{action.reason}</p>
                  {action.expectedImpact && (
                    <span className={s.actionImpact}>
                      Expected: {action.expectedImpact}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Visibility Plan */}
      {llmInsights?.visibilityPlan && (
        <section className={s.actions}>
          <h2 className={s.sectionTitle}>Get More Views</h2>
          <p className={s.sectionDesc}>
            Your current bottleneck:{" "}
            <strong>{llmInsights.visibilityPlan.bottleneck}</strong> (
            {llmInsights.visibilityPlan.confidence} confidence)
          </p>

          <div className={s.actionsList}>
            {llmInsights.visibilityPlan.doNext?.slice(0, 5).map((step, i) => (
              <div
                key={i}
                className={`${s.actionItem} ${
                  step.priority === "high"
                    ? s.actionHigh
                    : step.priority === "medium"
                    ? s.actionMed
                    : s.actionLow
                }`}
              >
                <div className={s.actionNumber}>{i + 1}</div>
                <div className={s.actionContent}>
                  <div className={s.actionTop}>
                    <span className={s.actionLeverBadge}>Visibility</span>
                    {step.priority === "high" && (
                      <span className={s.priorityBadge}>High Priority</span>
                    )}
                  </div>
                  <p className={s.actionText}>{step.action}</p>
                  <p className={s.actionReason}>{step.reason}</p>
                  {step.expectedImpact && (
                    <span className={s.actionImpact}>
                      Expected: {step.expectedImpact}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {llmInsights.visibilityPlan.promotionChecklist?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p className={s.sectionDesc} style={{ marginBottom: 8 }}>
                Promotion checklist
              </p>
              <ul style={{ paddingLeft: 18 }}>
                {llmInsights.visibilityPlan.promotionChecklist
                  .slice(0, 10)
                  .map((x, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      {x}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {llmInsights.visibilityPlan.whatToMeasureNext?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p className={s.sectionDesc} style={{ marginBottom: 8 }}>
                What to measure next
              </p>
              <div className={s.tagChips}>
                {llmInsights.visibilityPlan.whatToMeasureNext
                  .slice(0, 10)
                  .map((m) => (
                    <span key={m} className={s.missingTagChip}>
                      {m}
                    </span>
                  ))}
              </div>
            </div>
          )}
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
          <p className={s.sectionDesc}>
            Spin-off concepts inspired by what worked
          </p>

          <div className={s.remixGrid}>
            {remixItems.slice(0, 6).map((remix) => (
              <div key={remix.id} className={s.remixCard}>
                <h4 className={s.remixTitle}>{remix.title}</h4>
                <p className={s.remixHook}>&quot;{remix.hook}&quot;</p>
                <div className={s.remixActions}>
                  <CopyButton text={remix.title} label="Copy title" />
                  <CopyButton text={remix.hook} label="Copy hook" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additional Metrics (collapsed by default) */}
      <details className={s.moreMetrics}>
        <summary className={s.moreMetricsSummary}>View All Metrics</summary>
        <div className={s.metricsTable}>
          <MetricRow
            label="Watch Time Total"
            value={`${formatCompact(
              insights.analytics.totals.estimatedMinutesWatched ?? 0
            )} min`}
          />
          <MetricRow
            label="Comments"
            value={String(insights.analytics.totals.comments ?? 0)}
            sub={
              derived.commentsPer1k
                ? `${derived.commentsPer1k.toFixed(1)}/1K`
                : undefined
            }
          />
          <MetricRow
            label="Shares"
            value={String(insights.analytics.totals.shares ?? 0)}
            sub={
              derived.sharesPer1k
                ? `${derived.sharesPer1k.toFixed(1)}/1K`
                : undefined
            }
          />
          <MetricRow
            label="Playlist Saves"
            value={`+${
              (insights.analytics.totals.videosAddedToPlaylists ?? 0) -
              (insights.analytics.totals.videosRemovedFromPlaylists ?? 0)
            }`}
          />
          <MetricRow
            label="Like Ratio"
            value={
              derived.likeRatio != null
                ? `${derived.likeRatio.toFixed(1)}%`
                : "-"
            }
          />
          {derived.cardClickRate != null && (
            <MetricRow
              label="Card CTR"
              value={`${derived.cardClickRate.toFixed(2)}%`}
            />
          )}
          {derived.endScreenClickRate != null && (
            <MetricRow
              label="End Screen CTR"
              value={`${derived.endScreenClickRate.toFixed(2)}%`}
            />
          )}
          {insights.analytics.totals.estimatedRevenue != null && (
            <MetricRow
              label="Revenue"
              value={`$${insights.analytics.totals.estimatedRevenue.toFixed(
                2
              )}`}
            />
          )}
          {derived.rpm != null && (
            <MetricRow label="RPM" value={`$${derived.rpm.toFixed(2)}`} />
          )}
        </div>
      </details>
    </main>
  );
}

/* Sub-components */

function MetricRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
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

function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
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

function TagChip({ tag }: { tag: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${s.tagChipBtn} ${copied ? s.tagChipCopied : ""}`}
      aria-label={`Copy tag: ${tag}`}
      title={copied ? "Copied" : "Click to copy"}
    >
      {tag}
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

function formatResetAt(resetAt: string): string {
  const d = new Date(resetAt);
  if (Number.isNaN(d.getTime())) return "tomorrow";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// formatCompact is imported from `@/lib/format` to keep formatting consistent.
