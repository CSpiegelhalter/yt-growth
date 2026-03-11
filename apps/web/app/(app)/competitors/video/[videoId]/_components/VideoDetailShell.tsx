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
import Link from "next/link";
import type { ReactNode } from "react";

import { VideoHeader } from "@/components/video/VideoHeader";
import type { CompetitorVideoAnalysis } from "@/types/api";

import { DataLimitations } from "../components";
import s from "../style.module.css";
import {
  CommentsSection,
  TagsSection,
  WaysToOutperform,
} from "./InteractiveHeaderClient";

type Props = {
  analysis: CompetitorVideoAnalysis;
  activeChannelId: string;
  moreFromChannelSlot?: ReactNode;
};

/* ---------- Data Preparation ---------- */

function prepareAnalysisCards(insights: CompetitorVideoAnalysis["analysis"]) {
  return {
    whyCards: filterObviousInsights(insights.whyItsWorking ?? []).slice(0, 4),
    themeCards: (insights.themesToRemix ?? []).slice(0, 6),
    remixCards: (insights.remixIdeasForYou ?? []).slice(0, 6),
    patternCards: (insights.titlePatterns ?? []).slice(0, 6).map((p) => ({
      pattern: p,
      evidence: "Observed in this video's title and topic framing",
      howToUse: "Write 2 variants using this pattern with your main keyword.",
    })),
  };
}

/* ---------- Main Shell Component ---------- */
export default function VideoDetailShell({
  analysis: data,
  activeChannelId,
  moreFromChannelSlot,
}: Props) {
  const { video, analysis: insights, comments, tags, derivedKeywords, publicSignals, dataLimitations } = data;

  const allTags = tags ?? derivedKeywords ?? [];
  const { whyCards, themeCards, remixCards, patternCards } = prepareAnalysisCards(insights);
  const ageDays = publicSignals?.videoAgeDays ?? 1;
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

      <VideoHeader video={video} ageDays={ageDays} thumbnailWidth={280} showPlayOverlay />

      <AnalysisSections
        allTags={allTags}
        comments={comments}
        waysToOutperform={waysToOutperform}
        insights={insights}
        whyCards={whyCards}
        themeCards={themeCards}
        patternCards={patternCards}
        remixCards={remixCards}
        dataLimitations={dataLimitations}
        moreFromChannelSlot={moreFromChannelSlot}
      />
    </main>
  );
}

/* ---------- Analysis Sections ---------- */

type AnalysisCardsResult = ReturnType<typeof prepareAnalysisCards>;

function AnalysisSections({
  allTags,
  comments,
  waysToOutperform,
  insights,
  whyCards,
  themeCards,
  patternCards,
  remixCards,
  dataLimitations,
  moreFromChannelSlot,
}: {
  allTags: string[];
  comments: CompetitorVideoAnalysis["comments"];
  waysToOutperform: OutperformRecommendation[];
  insights: CompetitorVideoAnalysis["analysis"];
  whyCards: AnalysisCardsResult["whyCards"];
  themeCards: AnalysisCardsResult["themeCards"];
  patternCards: AnalysisCardsResult["patternCards"];
  remixCards: AnalysisCardsResult["remixCards"];
  dataLimitations: CompetitorVideoAnalysis["dataLimitations"];
  moreFromChannelSlot: ReactNode;
}) {
  return (
    <div className={s.sections}>
      {allTags.length > 0 && <TagsSection tags={allTags} />}

      {comments && !comments.commentsDisabled && (
        <CommentsSection comments={comments} />
      )}

      {comments?.commentsDisabled && (
        <div className={s.commentsDisabled}>
          <p>Comments are disabled for this video.</p>
        </div>
      )}

      {waysToOutperform.length > 0 && (
        <WaysToOutperform recommendations={waysToOutperform} />
      )}

      <section className={s.section}>
        <h2 className={s.sectionTitle}>What It's About</h2>
        <p className={s.aboutText}>
          {insights.whatItsAbout || "Analysis not available yet."}
        </p>
      </section>

      {whyCards.length > 0 && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            What's driving performance
            <span className={s.sectionBadge} data-type="hypothesis">Hypotheses</span>
          </h2>
          <p className={s.sectionSubtitle}>
            Observed signals from public data (we cannot measure CTR or retention)
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

      {themeCards.length > 0 && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            Portable patterns
            <span className={s.sectionBadge} data-type="generated">Generated</span>
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

      {patternCards.length > 0 && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>Title Patterns</h2>
          <p className={s.sectionSubtitle}>Structural patterns observed in this title</p>
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

      {remixCards.length > 0 && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            Make your better version
            <span className={s.sectionBadge} data-type="generated">Generated</span>
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
                  <span className={s.hookText}>&ldquo;{remix.hook}&rdquo;</span>
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

      {dataLimitations && (
        <DataLimitations
          whatWeCanKnow={dataLimitations.whatWeCanKnow}
          whatWeCantKnow={dataLimitations.whatWeCantKnow}
        />
      )}

      {moreFromChannelSlot}
    </div>
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
  if (!comments || comments.commentsDisabled) { return []; }

  const recommendations = [
    ...buildFollowUpRecs(comments),
    ...buildContentRecs(comments),
    ...buildThemeRecs(comments),
    ...buildSentimentRecs(comments),
    ...buildHookRecs(comments),
  ];

  return deduplicateRecs(recommendations);
}

function findMatchingSnippets(
  topComments: Array<{ text: string; likeCount: number }> | undefined,
  keyword: string,
  maxLen: number,
): string[] {
  return topComments
    ?.filter((c) => c.text.toLowerCase().includes(keyword.toLowerCase().slice(0, maxLen)))
    .slice(0, 2)
    .map((c) => truncate(c.text, 80)) ?? [];
}

function buildFollowUpRecs(comments: NonNullable<CompetitorVideoAnalysis["comments"]>): OutperformRecommendation[] {
  if (!comments.viewerAskedFor || comments.viewerAskedFor.length === 0) { return []; }
  return comments.viewerAskedFor.slice(0, 2).map((ask) => ({
    category: "follow-up" as const,
    action: `Create a follow-up video addressing: "${ask}"`,
    supportingTheme: "Viewer requests",
    exampleSnippets: findMatchingSnippets(comments.topComments, ask, 20),
  }));
}

function buildContentRecs(comments: NonNullable<CompetitorVideoAnalysis["comments"]>): OutperformRecommendation[] {
  if (!comments.viewerLoved || comments.viewerLoved.length === 0) { return []; }
  const loved = comments.viewerLoved[0];
  return [{
    category: "content" as const,
    action: `Double down on: "${loved}" - viewers clearly resonated with this`,
    supportingTheme: "What viewers loved",
    exampleSnippets: findMatchingSnippets(comments.topComments, loved, 15),
  }];
}

function buildThemeRecs(comments: NonNullable<CompetitorVideoAnalysis["comments"]>): OutperformRecommendation[] {
  if (!comments.themes || comments.themes.length === 0) { return []; }
  const topTheme = comments.themes[0];
  if (topTheme.count < 3) { return []; }
  return [{
    category: "content" as const,
    action: `Address the recurring "${topTheme.theme}" theme directly in your version`,
    supportingTheme: `${topTheme.count} comments mention this`,
    exampleSnippets: topTheme.examples?.slice(0, 2).map((e) => truncate(e, 80)) ?? [],
  }];
}

function buildSentimentRecs(comments: NonNullable<CompetitorVideoAnalysis["comments"]>): OutperformRecommendation[] {
  if (!comments.sentiment) { return []; }
  const recs: OutperformRecommendation[] = [];
  const { negative, positive } = comments.sentiment;
  if (negative > 15) {
    recs.push({
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
    recs.push({
      category: "hook",
      action: "Study the opening - high positive sentiment suggests the hook delivers on the promise",
      supportingTheme: `${positive}% positive sentiment`,
      exampleSnippets: [],
    });
  }
  return recs;
}

function buildHookRecs(comments: NonNullable<CompetitorVideoAnalysis["comments"]>): OutperformRecommendation[] {
  if (!comments.hookInspiration || comments.hookInspiration.length === 0) { return []; }
  return [{
    category: "hook" as const,
    action: `Use viewer language in your hook: "${comments.hookInspiration[0]}"`,
    supportingTheme: "Hook inspiration",
    exampleSnippets: [],
  }];
}

function deduplicateRecs(recommendations: OutperformRecommendation[]): OutperformRecommendation[] {
  const seen = new Set<string>();
  return recommendations
    .filter((r) => {
      const key = r.action.slice(0, 50);
      if (seen.has(key)) { return false; }
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) { return text; }
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
