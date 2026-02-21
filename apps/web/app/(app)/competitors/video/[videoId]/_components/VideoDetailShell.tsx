/**
 * VideoDetailShell - Main server component for competitor video analysis.
 *
 * Receives pre-fetched analysis data and renders the UI.
 * Interactive parts are delegated to client components.
 * 
 * Section Order:
 * 1. Back Link
 * 2. Video Header (thumbnail, title, channel, date)
 * 3. Performance Snapshot (Views, Views/Day, Likes, Comments, Age, Outlier)
 * 4. Tags Section (copyable)
 * 5. Top Comments & Sentiment (with filters)
 * 6. Ways to Outperform (comment-driven)
 * 7. What It's About
 * 8. What's Driving Performance
 * 9. Portable Patterns
 * 10. Title Patterns (always visible, no emoji)
 * 11. Make Your Better Version
 * 12. Data Limitations
 * 13. More from Channel
 */
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CompetitorVideoAnalysis } from "@/types/api";
import { DataLimitations } from "../components";
import {
  TagsSection,
  CommentsSection,
  WaysToOutperform,
  EngagementBadge,
} from "./InteractiveHeaderClient";
import { formatDurationBadge } from "@/lib/competitor-utils";
import s from "../style.module.css";

type Props = {
  analysis: CompetitorVideoAnalysis;
  activeChannelId: string;
  moreFromChannelSlot?: ReactNode;
};

/* ---------- Helpers ---------- */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


function formatCompact(num: number): string {
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return m >= 10 ? `${Math.round(m)}M` : `${m.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    return k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(1)}K`;
  }
  return String(Math.round(num));
}

/* ---------- Main Shell Component ---------- */
export default function VideoDetailShell({
  analysis: data,
  activeChannelId,
  moreFromChannelSlot,
}: Props) {
  const {
    video,
    analysis: insights,
    comments,
    tags,
    derivedKeywords,
    publicSignals,
    dataLimitations,
  } = data;

  const allTags = tags ?? derivedKeywords ?? [];

  // Filter out obvious/low-value insights that just restate metrics
  const whyCards = filterObviousInsights(insights.whyItsWorking ?? []).slice(0, 4);
  const themeCards = (insights.themesToRemix ?? []).slice(0, 6);
  const remixCards = (insights.remixIdeasForYou ?? []).slice(0, 6);
  const patternCards = (insights.titlePatterns ?? []).slice(0, 6).map((p) => ({
    pattern: p,
    evidence: "Observed in this video's title and topic framing",
    howToUse: "Write 2 variants using this pattern with your main keyword.",
  }));

  // Video age from server-computed publicSignals
  const ageDays = publicSignals?.videoAgeDays ?? 1;

  // Generate comment-driven ways to outperform
  const waysToOutperform = generateWaysToOutperform(comments);

  return (
    <main className={s.page}>
      {/* Back Link */}
      <Link
        href={`/competitors?channelId=${encodeURIComponent(activeChannelId)}`}
        className={s.backLink}
      >
        ← Back to Competitor Winners
      </Link>

      {/* Video Header - Compact (no metrics here) */}
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
                {formatDurationBadge(video.durationSec)}
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

          {/* Inline Metrics */}
          <div className={s.metricsRow}>
            <span className={s.metric}>
              {formatCompact(video.stats.viewCount)} views
            </span>
            <span className={s.metricSep}>·</span>
            <span className={s.metric}>
              {formatCompact(video.derived.viewsPerDay)}/day
            </span>
            <span className={s.metricSep}>·</span>
            <span className={s.metric}>
              <svg className={s.metricIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              {formatCompact(video.stats.likeCount ?? 0)}
            </span>
            <span className={s.metricSep}>·</span>
            <span className={s.metric}>
              <svg className={s.metricIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {formatCompact(video.stats.commentCount ?? 0)}
              <EngagementBadge views={video.stats.viewCount} comments={video.stats.commentCount ?? 0} />
            </span>
            <span className={s.metricSep}>·</span>
            <span className={s.metric}>
              {ageDays}d old
            </span>
          </div>
        </div>
      </header>

      {/* Analysis Sections */}
      <div className={s.sections}>

        {/* 2. Tags Section - Copyable */}
        {allTags.length > 0 && <TagsSection tags={allTags} />}

        {/* 3. Top Comments & Sentiment - High signal, near top */}
        {comments && !comments.commentsDisabled && (
          <CommentsSection comments={comments} />
        )}

        {/* Comments Disabled Notice */}
        {comments?.commentsDisabled && (
          <div className={s.commentsDisabled}>
            <p>Comments are disabled for this video.</p>
          </div>
        )}

        {/* 4. Ways to Outperform - Comment-driven */}
        {waysToOutperform.length > 0 && (
          <WaysToOutperform recommendations={waysToOutperform} />
        )}

        {/* 5. What It's About */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>What It's About</h2>
          <p className={s.aboutText}>
            {insights.whatItsAbout || "Analysis not available yet."}
          </p>
        </section>

        {/* 6. What's Driving Performance */}
        {whyCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>
              What's driving performance
              <span className={s.sectionBadge} data-type="hypothesis">
                Hypotheses
              </span>
            </h2>
            <p className={s.sectionSubtitle}>
              Observed signals from public data (we cannot measure CTR or
              retention)
            </p>
            <div className={s.cardGrid}>
              {whyCards.slice(0, 4).map((text, i) => (
                <div key={i} className={s.simpleCard}>
                  <p className={s.cardText}>{text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Portable Patterns */}
        {themeCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>
              Portable patterns
              <span className={s.sectionBadge} data-type="generated">
                Generated
              </span>
            </h2>
            <p className={s.sectionSubtitle}>
              Title and topic templates extracted from this video
            </p>
            <div className={s.themesList}>
              {themeCards.slice(0, 3).map((theme, i) => (
                <div key={i} className={s.themeCard}>
                  <h4 className={s.themeTitle}>{theme.theme}</h4>
                  <p className={s.themeWhy}>{theme.why}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Title Patterns - Always visible section (not dropdown, no emoji) */}
        {patternCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Title Patterns</h2>
            <p className={s.sectionSubtitle}>
              Structural patterns observed in this title
            </p>
            <div className={s.patternCards}>
              {patternCards.slice(0, 3).map((p, i) => (
                <div key={i} className={s.patternCard}>
                  <h4 className={s.patternTitle}>{p.pattern}</h4>
                  <p className={s.patternEvidence}>{p.evidence}</p>
                  <p className={s.patternHow}>{p.howToUse}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. Make Your Better Version */}
        {remixCards.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>
              Make your better version
              <span className={s.sectionBadge} data-type="generated">
                Generated
              </span>
            </h2>
            <p className={s.sectionSubtitle}>
              Differentiated ideas - not clones of the competitor
            </p>

            <div className={s.remixGrid}>
              {remixCards.slice(0, 3).map((remix, i) => (
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
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 10. Data Limitations - Honest disclosure */}
        {dataLimitations && (
          <DataLimitations
            whatWeCanKnow={dataLimitations.whatWeCanKnow}
            whatWeCantKnow={dataLimitations.whatWeCantKnow}
          />
        )}

        {/* 11. More from This Channel - via Suspense slot */}
        {moreFromChannelSlot}
      </div>
    </main>
  );
}

/* ---------- Helpers for Ways to Outperform ---------- */

type OutperformRecommendation = {
  category: "content" | "hook" | "clarity" | "follow-up";
  action: string;
  supportingTheme: string;
  exampleSnippets: string[];
};

function generateWaysToOutperform(
  comments: CompetitorVideoAnalysis["comments"]
): OutperformRecommendation[] {
  const recommendations: OutperformRecommendation[] = [];

  if (!comments || comments.commentsDisabled) {
    return recommendations;
  }

  // Content improvements from viewerAskedFor
  if (comments.viewerAskedFor && comments.viewerAskedFor.length > 0) {
    comments.viewerAskedFor.slice(0, 2).forEach((ask) => {
      recommendations.push({
        category: "follow-up",
        action: `Create a follow-up video addressing: "${ask}"`,
        supportingTheme: "Viewer requests",
        exampleSnippets: comments.topComments
          ?.filter((c) =>
            c.text.toLowerCase().includes(ask.toLowerCase().slice(0, 20))
          )
          .slice(0, 2)
          .map((c) => truncate(c.text, 80)) ?? [],
      });
    });
  }

  // Content improvements from viewerLoved (amplify what works)
  if (comments.viewerLoved && comments.viewerLoved.length > 0) {
    const loved = comments.viewerLoved[0];
    recommendations.push({
      category: "content",
      action: `Double down on: "${loved}" - viewers clearly resonated with this`,
      supportingTheme: "What viewers loved",
      exampleSnippets: comments.topComments
        ?.filter((c) =>
          c.text.toLowerCase().includes(loved.toLowerCase().slice(0, 15))
        )
        .slice(0, 2)
        .map((c) => truncate(c.text, 80)) ?? [],
    });
  }

  // Themes-based recommendations
  if (comments.themes && comments.themes.length > 0) {
    const topTheme = comments.themes[0];
    if (topTheme.count >= 3) {
      recommendations.push({
        category: "content",
        action: `Address the recurring "${topTheme.theme}" theme directly in your version`,
        supportingTheme: `${topTheme.count} comments mention this`,
        exampleSnippets: topTheme.examples?.slice(0, 2).map((e) => truncate(e, 80)) ?? [],
      });
    }
  }

  // Hook improvement from sentiment
  if (comments.sentiment) {
    const { negative, positive } = comments.sentiment;
    if (negative > 15) {
      recommendations.push({
        category: "clarity",
        action: `${negative}% of comments are negative - find and address the common complaints`,
        supportingTheme: "Sentiment analysis",
        exampleSnippets: comments.topComments
          ?.slice(0, 5)
          .filter((c) => c.likeCount < 10)
          .slice(0, 2)
          .map((c) => truncate(c.text, 80)) ?? [],
      });
    }
    if (positive > 70) {
      recommendations.push({
        category: "hook",
        action: "Study the opening - high positive sentiment suggests the hook delivers on the promise",
        supportingTheme: `${positive}% positive sentiment`,
        exampleSnippets: [],
      });
    }
  }

  // Add a general hook recommendation if we have hookInspiration
  if (comments.hookInspiration && comments.hookInspiration.length > 0) {
    recommendations.push({
      category: "hook",
      action: `Use viewer language in your hook: "${comments.hookInspiration[0]}"`,
      supportingTheme: "Hook inspiration",
      exampleSnippets: [],
    });
  }

  // Deduplicate and limit
  const seen = new Set<string>();
  return recommendations
    .filter((r) => {
      const key = r.action.slice(0, 50);
      if (seen.has(key)) {return false;}
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) {return text;}
  return `${text.slice(0, maxLen - 3)  }...`;
}

/**
 * Filter out obvious/low-value insights that just restate metrics.
 * 
 * Removes patterns like:
 * - "Strong view count of X indicates..."
 * - "High daily views at X suggest..."
 * - "Short duration of X (YouTube Shorts format)..."
 * - Generic statements about views/likes being high/low
 */
function filterObviousInsights(insights: string[]): string[] {
  const obviousPatterns = [
    // View count statements
    /strong view count/i,
    /high (daily )?views/i,
    /view count of [\d,]+/i,
    /\d+[,\d]* views (indicates?|suggests?|shows?)/i,
    /views at [\d,]+/i,
    
    // Duration statements
    /short duration of/i,
    /duration of \d+s?/i,
    /youtube shorts format/i,
    /\d+ seconds? (is|aligns|fits)/i,
    
    // Generic engagement statements
    /consistent engagement/i,
    /broad appeal/i,
    /interest in the content/i,
    /relevance to viewers/i,
    /viewer preferences for/i,
    
    // Like/comment count restating
    /high like (count|rate)/i,
    /strong engagement metrics/i,
    /\d+[kKmM]?\+ (likes|comments)/i,
  ];

  return insights.filter((insight) => {
    const isObvious = obviousPatterns.some((pattern) => pattern.test(insight));
    return !isObvious;
  });
}
