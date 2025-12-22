"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import s from "./style.module.css";
import type { CompetitorVideoAnalysis, CompetitorVideo } from "@/types/api";
import { copyToClipboard } from "@/components/ui/Toast";

type Props = {
  videoId: string;
  channelId?: string;
  isSubscribed?: boolean;
};

/**
 * VideoDetailClient - Deep analysis view for a competitor video.
 * Shows structured insights and "what to steal" from this video.
 * Receives channelId from server (no more localStorage fallback needed).
 */
export default function VideoDetailClient({
  videoId,
  channelId,
  isSubscribed = false,
}: Props) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<CompetitorVideoAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Use channelId from server props directly
  const activeChannelId = channelId ?? null;

  // Load video analysis
  useEffect(() => {
    async function loadAnalysis() {
      if (!activeChannelId) {
        setError("No channel selected");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/competitors/video/${videoId}?channelId=${activeChannelId}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load analysis");
        }

        const data = await res.json();
        setAnalysis(data as CompetitorVideoAnalysis);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analysis"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [videoId, activeChannelId]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, []);

  if (loading) {
    return (
      <main className={s.page}>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Analyzing video...</p>
        </div>
      </main>
    );
  }

  if (error || !analysis) {
    return (
      <main className={s.page}>
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
          <h2 className={s.errorTitle}>{error || "Video not found"}</h2>
          <p className={s.errorDesc}>
            We couldn&apos;t analyze this competitor video.
          </p>
          <button onClick={() => router.back()} className={s.backBtn}>
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const {
    video,
    analysis: insights,
    comments,
    tags,
    derivedKeywords,
    moreFromChannel,
  } = analysis;
  const allTags = tags ?? derivedKeywords ?? [];
  const hasTags = allTags.length > 0;
  const visibleTags = showAllTags ? allTags : allTags.slice(0, 12);
  const hasMoreTags = allTags.length > 12;

  const whyCards = (insights.whyItsWorking ?? []).slice(0, 6);
  const themeCards = (insights.themesToRemix ?? []).slice(0, 6);
  const remixCards = (insights.remixIdeasForYou ?? []).slice(0, 6);
  const patternCards = (insights.titlePatterns ?? []).slice(0, 6).map((p) => ({
    pattern: p,
    evidence: "Observed in this video's title and topic framing",
    howToUse: "Write 2 variants using this pattern with your main keyword.",
  }));

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link href="/competitors" className={s.backLink}>
        ← Back to Competitor Winners
      </Link>

      {analysis.demo && (
        <div className={s.demoBanner}>
          <p>Demo data shown. This is sample analysis.</p>
        </div>
      )}

      {/* Video Header - Compact */}
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
          {video.durationSec && (
            <span className={s.durationBadge}>
              {formatDuration(video.durationSec)}
            </span>
          )}
        </div>

        <div className={s.videoInfo}>
          {/* Title + Channel */}
          <h1 className={s.videoTitle}>{video.title}</h1>
          <div className={s.channelMeta}>
            <a
              href={video.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.channelLink}
            >
              {video.channelTitle}
            </a>
            <span className={s.metaSep}>·</span>
            <span className={s.publishDate}>
              {formatDate(video.publishedAt)}
            </span>
          </div>

          {/* Tags/Keywords - Inline chips near top */}
          {hasTags && (
            <div className={s.tagsInline}>
              <div className={s.tagsChips}>
                {visibleTags.map((tag, i) => (
                  <span key={i} className={s.tagChip}>
                    {tag}
                  </span>
                ))}
                {hasMoreTags && !showAllTags && (
                  <button
                    className={s.showMoreTagsBtn}
                    onClick={() => setShowAllTags(true)}
                  >
                    +{allTags.length - 12} more
                  </button>
                )}
              </div>
              <button
                className={s.copyAllTagsBtn}
                onClick={() => handleCopy(allTags.join(", "), "all-tags")}
              >
                {copiedId === "all-tags" ? "Copied" : "Copy all"}
              </button>
            </div>
          )}

          {/* Metrics Grid - Responsive */}
          <div className={s.metricsGrid}>
            <MetricCard
              label="Views"
              value={formatCompact(video.stats.viewCount)}
            />
            <MetricCard
              label="Views/Day"
              value={formatCompact(video.derived.viewsPerDay)}
              highlight
            />
            {video.derived.velocity24h !== undefined && (
              <MetricCard
                label="24h Velocity"
                value={`+${formatCompact(video.derived.velocity24h)}`}
                highlight
              />
            )}
            {video.derived.velocity7d !== undefined && (
              <MetricCard
                label="7d Velocity"
                value={`+${formatCompact(video.derived.velocity7d)}`}
              />
            )}
            {video.derived.engagementPerView !== undefined && (
              <MetricCard
                label="Engagement"
                value={`${(video.derived.engagementPerView * 100).toFixed(1)}%`}
              />
            )}
            {video.derived.outlierScore !== undefined &&
              video.derived.outlierScore > 1 && (
                <MetricCard
                  label="Outlier"
                  value={`+${video.derived.outlierScore.toFixed(1)}σ`}
                  highlight
                />
              )}
          </div>

          {/* Data status indicator (only if building) */}
          {video.derived.dataStatus === "building" && (
            <p className={s.dataStatus}>
              Velocity data is being collected. Check back soon for more
              metrics.
            </p>
          )}

          <a
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.watchBtn}
          >
            Watch on YouTube
          </a>
        </div>
      </header>

      {/* Analysis Sections */}
      <div className={s.sections}>
        {/* What It's About */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>What It&apos;s About</h2>
          <p className={s.aboutText}>
            {insights.whatItsAbout || "Analysis not available yet."}
          </p>
        </section>

        {/* Why It's Working */}
        {whyCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Why it&apos;s working</h2>
            <p className={s.sectionSubtitle}>
              The strongest drivers behind this video&apos;s performance.
            </p>
            <div className={s.cardGrid}>
              {whyCards.map((text, i) => (
                <div key={i} className={s.simpleCard}>
                  <p className={s.cardText}>{text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Themes to Remix */}
        {themeCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Themes to remix</h2>
            <p className={s.sectionSubtitle}>
              Concepts that transfer well into your niche.
            </p>
            <div className={s.themesList}>
              {themeCards.map((theme, i) => (
                <div key={i} className={s.themeCard}>
                  <h4 className={s.themeTitle}>{theme.theme}</h4>
                  <p className={s.themeWhy}>{theme.why}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Patterns to Learn */}
        {patternCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Patterns to learn</h2>
            <p className={s.sectionSubtitle}>
              Portable patterns you can apply without copying the niche.
            </p>
            <div className={s.patternCards}>
              {patternCards.map((p, i) => (
                <div key={i} className={s.patternCard}>
                  <h4 className={s.patternTitle}>{p.pattern}</h4>
                  <p className={s.patternEvidence}>{p.evidence}</p>
                  <p className={s.patternHow}>{p.howToUse}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Steal This, But Make It Yours */}
        {remixCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Steal This, But Make It Yours</h2>
            <p className={s.sectionSubtitle}>
              Remix ideas tailored for your channel
            </p>

            <div className={s.remixGrid}>
              {remixCards.map((remix, i) => (
                <div key={i} className={s.remixCard}>
                  <h4 className={s.remixTitle}>{remix.title}</h4>
                  <p className={s.remixAngle}>{remix.angle}</p>

                  <div className={s.remixHook}>
                    <span className={s.hookLabel}>Hook:</span>
                    <span className={s.hookText}>
                      &ldquo;{remix.hook}&rdquo;
                    </span>
                  </div>

                  <div className={s.remixOverlay}>
                    <span className={s.overlayLabel}>Thumbnail Text:</span>
                    <span className={s.overlayText}>{remix.overlayText}</span>
                  </div>

                  <button
                    className={s.copyBtn}
                    onClick={() =>
                      handleCopy(
                        `Title: ${remix.title}\nHook: ${remix.hook}\nThumbnail: ${remix.overlayText}\nAngle: ${remix.angle}`,
                        `remix-${i}`
                      )
                    }
                  >
                    {copiedId === `remix-${i}` ? "Copied!" : "Copy Idea"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top comments & sentiment */}
        {comments && !comments.commentsDisabled && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Top comments &amp; sentiment</h2>
            {comments.error ? (
              <p className={s.commentsError}>{comments.error}</p>
            ) : (
              <div className={s.commentsAnalysis}>
                <div className={s.sentimentSection}>
                  <h4 className={s.subSectionTitle}>Viewer sentiment</h4>
                  <div className={s.sentimentBar}>
                    <div
                      className={s.sentimentPositive}
                      style={{ width: `${comments.sentiment.positive}%` }}
                    />
                    <div
                      className={s.sentimentNeutral}
                      style={{ width: `${comments.sentiment.neutral}%` }}
                    />
                    <div
                      className={s.sentimentNegative}
                      style={{ width: `${comments.sentiment.negative}%` }}
                    />
                  </div>
                  <div className={s.sentimentLabels}>
                    <span className={s.sentimentLabelPos}>
                      Positive {comments.sentiment.positive}%
                    </span>
                    <span className={s.sentimentLabelNeu}>
                      Neutral {comments.sentiment.neutral}%
                    </span>
                    <span className={s.sentimentLabelNeg}>
                      Negative {comments.sentiment.negative}%
                    </span>
                  </div>
                </div>

                <div className={s.commentSummaryGrid}>
                  {comments.viewerLoved && comments.viewerLoved.length > 0 && (
                    <div className={s.commentThemeBlock}>
                      <h4 className={s.subSectionTitle}>What viewers loved</h4>
                      <ul className={s.commentThemeList}>
                        {comments.viewerLoved.slice(0, 5).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {comments.viewerAskedFor &&
                    comments.viewerAskedFor.length > 0 && (
                      <div className={s.commentThemeBlock}>
                        <h4 className={s.subSectionTitle}>
                          What viewers asked for next
                        </h4>
                        <ul className={s.commentThemeList}>
                          {comments.viewerAskedFor
                            .slice(0, 5)
                            .map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>

                {comments.themes && comments.themes.length > 0 && (
                  <div className={s.commentThemeBlock}>
                    <h4 className={s.subSectionTitle}>Themes</h4>
                    <div className={s.themeChips}>
                      {comments.themes.slice(0, 10).map((theme, i) => (
                        <span key={i} className={s.themeChip}>
                          {theme.theme}{" "}
                          <span className={s.themeCount}>({theme.count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {comments.hookInspiration &&
                  comments.hookInspiration.length > 0 && (
                    <div className={s.commentThemeBlock}>
                      <h4 className={s.subSectionTitle}>Hook inspiration</h4>
                      <div className={s.hookQuotes}>
                        {comments.hookInspiration
                          .slice(0, 6)
                          .map((quote, i) => (
                            <div key={i} className={s.hookQuote}>
                              <span className={s.quoteText}>
                                &ldquo;{quote}&rdquo;
                              </span>
                              <button
                                className={s.copyQuoteBtn}
                                onClick={() => handleCopy(quote, `hook-${i}`)}
                              >
                                {copiedId === `hook-${i}` ? "Copied" : "Copy"}
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {comments.topComments && comments.topComments.length > 0 && (
                  <div className={s.topCommentsBlock}>
                    <button
                      className={s.commentsToggle}
                      onClick={() => setShowComments((v) => !v)}
                    >
                      {showComments ? "Hide comments" : "Show comments"}
                    </button>
                    {showComments && (
                      <div className={s.topCommentsList}>
                        {comments.topComments.slice(0, 12).map((comment, i) => (
                          <div key={i} className={s.topComment}>
                            <p className={s.commentText}>{comment.text}</p>
                            <div className={s.commentMeta}>
                              <span className={s.commentAuthor}>
                                {comment.authorName}
                              </span>
                              <span className={s.commentLikes}>
                                {comment.likeCount} likes
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Comments Disabled Notice */}
        {comments?.commentsDisabled && (
          <div className={s.commentsDisabled}>
            <p>Comments are disabled for this video.</p>
          </div>
        )}

        {/* More from This Channel */}
        {moreFromChannel && moreFromChannel.length > 0 && (
          <section className={s.moreSection}>
            <h2 className={s.sectionTitle}>More from {video.channelTitle}</h2>
            <div className={s.moreGrid}>
              {moreFromChannel.map((v) => (
                <Link
                  key={v.videoId}
                  href={`/competitors/video/${v.videoId}?channelId=${activeChannelId}`}
                  className={s.moreCard}
                >
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt=""
                      className={s.moreThumb}
                      loading="lazy"
                    />
                  ) : (
                    <div className={s.moreThumbPlaceholder} />
                  )}
                  <div className={s.moreInfo}>
                    <p className={s.moreTitle}>{v.title}</p>
                    <span className={s.moreMeta}>
                      {formatCompact(v.stats.viewCount)} views
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ---------- Sub-components ---------- */

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`${s.metricCard} ${highlight ? s.metricHighlight : ""}`}>
      <span className={s.metricValue}>{value}</span>
      <span className={s.metricLabel}>{label}</span>
    </div>
  );
}

/* ---------- Helpers ---------- */
function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
