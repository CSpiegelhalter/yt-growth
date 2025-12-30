"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import s from "./style.module.css";
import type { CompetitorVideoAnalysis, CompetitorVideo } from "@/types/api";
import { copyToClipboard } from "@/components/ui/Toast";
import { formatCompact, formatCompactFloored } from "@/lib/format";

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("Preparing analysis...");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const lastAutoFetchKeyRef = useRef<string | null>(null);
  const moreFromChannelKeyRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  // Use channelId from server props directly
  const activeChannelId = channelId ?? null;

  // Smooth progress bar while the analysis request is running (we don't have real progress).
  useEffect(() => {
    if (!loading) return;
    setLoadingProgress(12);
    setLoadingStage("Fetching video details...");

    const stages: Array<{ atMs: number; text: string }> = [
      { atMs: 0, text: "Fetching video details..." },
      { atMs: 1400, text: "Reading top comments..." },
      { atMs: 3200, text: "Finding patterns that made it work..." },
      { atMs: 5200, text: "Generating remix ideas..." },
    ];
    const startedAt = Date.now();

    const stageTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next =
        [...stages].reverse().find((s) => elapsed >= s.atMs)?.text ??
        "Analyzing...";
      setLoadingStage(next);
    }, 450);

    const progressTimer = window.setInterval(() => {
      setLoadingProgress((p) => {
        const target = 92;
        const next = p + Math.max(1, Math.round((target - p) * 0.08));
        return Math.min(target, next);
      });
    }, 350);

    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(progressTimer);
    };
  }, [loading]);

  // Load video analysis
  useEffect(() => {
    mountedRef.current = true;
    async function loadAnalysis() {
      if (!activeChannelId) {
        if (!mountedRef.current) return;
        setError("No channel selected");
        setLoading(false);
        return;
      }

      // Avoid double-fetch in React 18 StrictMode (dev) which can double-count entitlements.
      const k = `${activeChannelId}:${videoId}`;
      if (lastAutoFetchKeyRef.current === k) return;
      lastAutoFetchKeyRef.current = k;

      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/competitors/video/${videoId}?channelId=${activeChannelId}&includeMoreFromChannel=0`,
          {}
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load analysis");
        }

        const data = await res.json();
        if (!mountedRef.current) return;
        setLoadingProgress(100);
        setAnalysis(data as CompetitorVideoAnalysis);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to load analysis"
        );
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
      }
    }

    void loadAnalysis();

    return () => {
      mountedRef.current = false;
    };
  }, [videoId, activeChannelId]);

  // Fetch "More from this channel" in the background (not critical path for the initial render).
  useEffect(() => {
    if (!analysis) return;
    if (!activeChannelId) return;
    if (analysis.moreFromChannel && analysis.moreFromChannel.length > 0) return;

    const k = `${activeChannelId}:${videoId}`;
    if (moreFromChannelKeyRef.current === k) return;
    moreFromChannelKeyRef.current = k;

    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/competitors/video/${videoId}/more?channelId=${activeChannelId}`,
          { signal: ac.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as CompetitorVideo[];
        if (!Array.isArray(data)) return;
        setAnalysis((prev) =>
          prev ? { ...prev, moreFromChannel: data } : prev
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Non-critical; ignore
      }
    })();

    return () => ac.abort();
  }, [analysis, activeChannelId, videoId]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, []);

  if (loading) {
    return (
      <main className={s.loadingPage}>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p className={s.loadingStage}>{loadingStage}</p>
          <div className={s.loadingProgress}>
            <div
              className={s.progressTrack}
              role="progressbar"
              aria-label="Analyzing competitor video"
              aria-valuenow={Math.round(Math.max(8, loadingProgress || 12))}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={s.progressFill}
                style={{ width: `${Math.max(8, loadingProgress || 12)}%` }}
              />
            </div>
            <div className={s.loadingProgressHint}>
              This can take a bit on first view (we cache results for next
              time).
            </div>
          </div>
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
            We couldn't analyze this competitor video.
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
    strategicInsights,
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

  // Strategic insights
  const titleAnalysis = strategicInsights?.titleAnalysis;
  const competitionDifficulty = strategicInsights?.competitionDifficulty;
  const opportunityScore = strategicInsights?.opportunityScore;
  const beatChecklist = strategicInsights?.beatThisVideo ?? [];
  const engagementBenchmarks = strategicInsights?.engagementBenchmarks;
  const lengthAnalysis = strategicInsights?.lengthAnalysis;
  const postingTiming = strategicInsights?.postingTiming;
  const formatSignals = strategicInsights?.formatSignals;
  const descriptionAnalysis = strategicInsights?.descriptionAnalysis;

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link
        href={
          activeChannelId
            ? `/competitors?channelId=${encodeURIComponent(activeChannelId)}`
            : "/competitors"
        }
        className={s.backLink}
      >
        ← Back to Competitor Winners
      </Link>

      {analysis.demo && (
        <div className={s.demoBanner}>
          <p>Demo data shown. This is sample analysis.</p>
        </div>
      )}

      {/* Video Header - Compact */}
      <header className={s.videoHeader}>
        <a
          href={video.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={s.thumbnailLink}
        >
          <div className={s.thumbnailWrap}>
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={`${video.title} thumbnail`}
                fill
                className={s.thumbnail}
                sizes="(max-width: 768px) 100vw, 280px"
                priority
              />
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
            <div className={s.playOverlay}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </a>

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
              value={formatCompactFloored(video.derived.viewsPerDay)}
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
        </div>
      </header>

      {/* Analysis Sections */}
      <div className={s.sections}>
        {/* What It's About */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>What It's About</h2>
          <p className={s.aboutText}>
            {insights.whatItsAbout || "Analysis not available yet."}
          </p>
        </section>

        {/* Quick Stats Bar - Strategic Overview */}
        {strategicInsights && (
          <section className={s.quickStatsSection}>
            <div className={s.quickStatsGrid}>
              {/* Title Score */}
              {titleAnalysis && (
                <div className={s.quickStat}>
                  <div className={s.quickStatValue}>
                    <span
                      className={s.scoreCircle}
                      data-score={
                        titleAnalysis.score >= 7
                          ? "good"
                          : titleAnalysis.score >= 5
                          ? "ok"
                          : "poor"
                      }
                    >
                      {titleAnalysis.score}/10
                    </span>
                  </div>
                  <div className={s.quickStatLabel}>Title Score</div>
                </div>
              )}

              {/* Competition Difficulty */}
              {competitionDifficulty && (
                <div className={s.quickStat}>
                  <div className={s.quickStatValue}>
                    <span
                      className={s.difficultyBadge}
                      data-difficulty={competitionDifficulty.score
                        .toLowerCase()
                        .replace(" ", "-")}
                    >
                      {competitionDifficulty.score}
                    </span>
                  </div>
                  <div className={s.quickStatLabel}>Competition</div>
                </div>
              )}

              {/* Opportunity Score */}
              {opportunityScore && (
                <div className={s.quickStat}>
                  <div className={s.quickStatValue}>
                    <span
                      className={s.scoreCircle}
                      data-score={
                        opportunityScore.score >= 7
                          ? "good"
                          : opportunityScore.score >= 5
                          ? "ok"
                          : "poor"
                      }
                    >
                      {opportunityScore.score}/10
                    </span>
                  </div>
                  <div className={s.quickStatLabel}>Opportunity</div>
                </div>
              )}

              {/* Engagement */}
              {engagementBenchmarks && (
                <div className={s.quickStat}>
                  <div className={s.quickStatValue}>
                    <span
                      className={s.engagementBadge}
                      data-verdict={engagementBenchmarks.likeRateVerdict
                        .toLowerCase()
                        .replace(" ", "-")}
                    >
                      {engagementBenchmarks.likeRateVerdict}
                    </span>
                  </div>
                  <div className={s.quickStatLabel}>Engagement</div>
                </div>
              )}

              {/* Format */}
              {formatSignals && (
                <div className={s.quickStat}>
                  <div className={s.quickStatValue}>
                    <span className={s.formatBadge}>
                      {formatSignals.likelyFormat}
                    </span>
                  </div>
                  <div className={s.quickStatLabel}>Format</div>
                </div>
              )}

              {/* Length */}
              {lengthAnalysis && (
                <div className={s.quickStat}>
                  <div className={s.quickStatValue}>
                    <span className={s.lengthValue}>
                      {lengthAnalysis.minutes}m
                    </span>
                  </div>
                  <div className={s.quickStatLabel}>
                    {lengthAnalysis.category}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Title Analysis */}
        {titleAnalysis && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Title Breakdown</h2>
            <div className={s.titleAnalysisGrid}>
              <div className={s.titleScoreCard}>
                <div
                  className={s.titleScoreCircle}
                  data-score={
                    titleAnalysis.score >= 7
                      ? "good"
                      : titleAnalysis.score >= 5
                      ? "ok"
                      : "poor"
                  }
                >
                  <span className={s.titleScoreNumber}>
                    {titleAnalysis.score}
                  </span>
                  <span className={s.titleScoreMax}>/10</span>
                </div>
                <div className={s.titleMeta}>
                  <span>{titleAnalysis.characterCount} chars</span>
                  {titleAnalysis.hasNumber && (
                    <span className={s.titleCheck}>✓ Number</span>
                  )}
                  {titleAnalysis.hasPowerWord && (
                    <span className={s.titleCheck}>✓ Power Word</span>
                  )}
                  {titleAnalysis.hasCuriosityGap && (
                    <span className={s.titleCheck}>✓ Curiosity Gap</span>
                  )}
                </div>
              </div>
              <div className={s.titleFeedback}>
                {titleAnalysis.strengths.length > 0 && (
                  <div className={s.titleStrengths}>
                    <h4 className={s.feedbackTitle}>✓ Strengths</h4>
                    <ul>
                      {titleAnalysis.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {titleAnalysis.weaknesses.length > 0 && (
                  <div className={s.titleWeaknesses}>
                    <h4 className={s.feedbackTitle}>⚠ Could Improve</h4>
                    <ul>
                      {titleAnalysis.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Opportunity Assessment */}
        {opportunityScore && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Opportunity Assessment</h2>
            <div className={s.opportunityHeader}>
              <div
                className={s.opportunityScoreBig}
                data-score={
                  opportunityScore.score >= 7
                    ? "good"
                    : opportunityScore.score >= 5
                    ? "ok"
                    : "poor"
                }
              >
                {opportunityScore.score}/10
              </div>
              <p className={s.opportunityVerdict}>{opportunityScore.verdict}</p>
            </div>

            {opportunityScore.gaps.length > 0 && (
              <div className={s.opportunityBlock}>
                <h4 className={s.opportunityBlockTitle}>Gaps to Exploit</h4>
                <ul className={s.opportunityList}>
                  {opportunityScore.gaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {opportunityScore.angles.length > 0 && (
              <div className={s.opportunityBlock}>
                <h4 className={s.opportunityBlockTitle}>Fresh Angles</h4>
                <ul className={s.opportunityList}>
                  {opportunityScore.angles.map((angle, i) => (
                    <li key={i}>{angle}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Beat This Video Checklist */}
        {beatChecklist.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Beat This Video</h2>
            <p className={s.sectionSubtitle}>
              Action checklist to outperform this competitor
            </p>
            <div className={s.checklistGrid}>
              {beatChecklist.map((item, i) => (
                <div key={i} className={s.checklistItem}>
                  <div className={s.checklistAction}>{item.action}</div>
                  <div className={s.checklistMeta}>
                    <span
                      className={s.checklistDifficulty}
                      data-level={item.difficulty.toLowerCase()}
                    >
                      {item.difficulty}
                    </span>
                    <span
                      className={s.checklistImpact}
                      data-level={item.impact.toLowerCase()}
                    >
                      {item.impact} Impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video Intelligence */}
        {(postingTiming || lengthAnalysis || descriptionAnalysis) && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Video Intelligence</h2>
            <div className={s.intelligenceGrid}>
              {postingTiming && (
                <div className={s.intelCard}>
                  <h4 className={s.intelTitle}>Posting</h4>
                  <p className={s.intelValue}>
                    {postingTiming.dayOfWeek} at {postingTiming.hourOfDay}:00
                  </p>
                  <p className={s.intelNote}>{postingTiming.timingInsight}</p>
                </div>
              )}
              {lengthAnalysis && (
                <div className={s.intelCard}>
                  <h4 className={s.intelTitle}>Length</h4>
                  <p className={s.intelValue}>
                    {lengthAnalysis.minutes} minutes ({lengthAnalysis.category})
                  </p>
                  <p className={s.intelNote}>{lengthAnalysis.insight}</p>
                </div>
              )}
              {engagementBenchmarks && (
                <div className={s.intelCard}>
                  <h4 className={s.intelTitle}>Engagement</h4>
                  <p className={s.intelValue}>
                    {engagementBenchmarks.likeRate}% like rate ·{" "}
                    {engagementBenchmarks.commentRate} comments/1K views
                  </p>
                  <p className={s.intelNote}>
                    Likes: {engagementBenchmarks.likeRateVerdict} · Comments:{" "}
                    {engagementBenchmarks.commentRateVerdict}
                  </p>
                </div>
              )}
              {descriptionAnalysis && (
                <div className={s.intelCard}>
                  <h4 className={s.intelTitle}>Description</h4>
                  <p className={s.intelValue}>
                    {descriptionAnalysis.estimatedWordCount} words
                  </p>
                  <div className={s.intelTags}>
                    {descriptionAnalysis.hasTimestamps && (
                      <span className={s.intelTag}>Timestamps</span>
                    )}
                    {descriptionAnalysis.hasLinks && (
                      <span className={s.intelTag}>Links</span>
                    )}
                    {descriptionAnalysis.hasCTA && (
                      <span className={s.intelTag}>CTA</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Why It's Working */}
        {whyCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Why it's working</h2>
            <p className={s.sectionSubtitle}>
              The strongest drivers behind this video's performance.
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
            ) : comments.sentiment.positive === 0 &&
              comments.sentiment.neutral === 0 &&
              comments.sentiment.negative === 0 ? (
              <div className={s.commentsAnalysis}>
                <p className={s.commentsNote}>
                  Comment analysis is processing. Showing raw top comments
                  below.
                </p>
                {comments.topComments && comments.topComments.length > 0 && (
                  <div className={s.topCommentsList}>
                    {comments.topComments.slice(0, 8).map((comment, i) => (
                      <div key={i} className={s.topComment}>
                        <div className={s.topCommentHeader}>
                          <span className={s.topCommentAuthor}>
                            {comment.authorName}
                          </span>
                          <span className={s.topCommentLikes}>
                            ♥ {comment.likeCount}
                          </span>
                        </div>
                        <p className={s.topCommentText}>{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                      <h4 className={s.subSectionTitle}>
                        Hook lines (inspired by comments)
                      </h4>
                      <p className={s.subSectionHint}>
                        Short openers you can adapt for your first 5–10 seconds.
                        These are generated based on patterns in top comments
                        (not direct viewer quotes).
                      </p>
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
                    <Image
                      src={v.thumbnailUrl}
                      alt={`${v.title} thumbnail`}
                      width={320}
                      height={180}
                      className={s.moreThumb}
                      sizes="(max-width: 639px) 50vw, 25vw"
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
