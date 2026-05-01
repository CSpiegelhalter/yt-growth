"use client";

import { SentimentStrip, TopCommentsList } from "@/app/(app)/analyze/_components/CommentAnalysis";
import { VerdictTiles } from "@/app/(app)/analyze/_components/EnrichmentSection";
import { PatternsToBorrow } from "@/app/(app)/analyze/_components/PatternsToBorrow";
import { TagsAndSeoSection } from "@/app/(app)/analyze/_components/TagsAndSeoSection";
import s from "@/app/(app)/analyze/style.module.css";
import { VideoHeaderSimple } from "@/components/video/VideoHeaderSimple";
import type { CompetitorVideoAnalysis } from "@/types/api";

type Props = {
  data: CompetitorVideoAnalysis;
};

/* ---------- Helpers ---------- */

const OBVIOUS_PATTERNS = [
  /strong view count/i,
  /high (daily )?views/i,
  /view count of [\d,]+/i,
  /\d+[,\d]* views (indicates?|suggests?|shows?)/i,
  /views at [\d,]+/i,
  /short duration of/i,
  /duration of \d+s?/i,
  /youtube shorts format/i,
  /\d+ seconds? (is|aligns|fits)/i,
  /consistent engagement/i,
  /broad appeal/i,
  /interest in the content/i,
  /relevance to viewers/i,
  /viewer preferences for/i,
  /high like (count|rate)/i,
  /strong engagement metrics/i,
  /\d+[kKmM]?\+ (likes|comments)/i,
];

function filterObviousInsights(insights: string[]): string[] {
  return insights.filter(
    (insight) => !OBVIOUS_PATTERNS.some((pattern) => pattern.test(insight)),
  );
}

type OutperformRec = {
  category: "content" | "hook" | "clarity" | "follow-up";
  action: string;
  supportingTheme: string;
  exampleSnippets: string[];
};

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) {return text;}
  return `${text.slice(0, maxLen - 3)}...`;
}

function findSnippets(
  topComments: Array<{ text: string; likeCount: number }> | undefined,
  keyword: string,
  maxLen: number,
): string[] {
  return (
    topComments
      ?.filter((c) =>
        c.text.toLowerCase().includes(keyword.toLowerCase().slice(0, maxLen)),
      )
      .slice(0, 2)
      .map((c) => truncate(c.text, 80)) ?? []
  );
}

function buildFollowUpRecs(
  comments: NonNullable<CompetitorVideoAnalysis["comments"]>,
): OutperformRec[] {
  if (!comments.viewerAskedFor?.length) {return [];}
  return comments.viewerAskedFor.slice(0, 2).map((ask) => ({
    category: "follow-up" as const,
    action: `Create a follow-up video addressing: "${ask}"`,
    supportingTheme: "Viewer requests",
    exampleSnippets: findSnippets(comments.topComments, ask, 20),
  }));
}

function buildContentRecs(
  comments: NonNullable<CompetitorVideoAnalysis["comments"]>,
): OutperformRec[] {
  const recs: OutperformRec[] = [];
  if (comments.viewerLoved?.length) {
    recs.push({
      category: "content",
      action: `Double down on: "${comments.viewerLoved[0]}" - viewers clearly resonated with this`,
      supportingTheme: "What viewers loved",
      exampleSnippets: findSnippets(
        comments.topComments,
        comments.viewerLoved[0],
        15,
      ),
    });
  }
  if (comments.themes?.length && comments.themes[0].count >= 3) {
    const t = comments.themes[0];
    recs.push({
      category: "content",
      action: `Address the recurring "${t.theme}" theme directly in your version`,
      supportingTheme: `${t.count} comments mention this`,
      exampleSnippets:
        t.examples?.slice(0, 2).map((e) => truncate(e, 80)) ?? [],
    });
  }
  return recs;
}

function buildSentimentRecs(
  comments: NonNullable<CompetitorVideoAnalysis["comments"]>,
): OutperformRec[] {
  if (!comments.sentiment) {return [];}
  const recs: OutperformRec[] = [];
  if (comments.sentiment.negative > 15) {
    recs.push({
      category: "clarity",
      action: `${comments.sentiment.negative}% of comments are negative - find and address the common complaints`,
      supportingTheme: "Sentiment analysis",
      exampleSnippets:
        comments.topComments
          ?.slice(0, 5)
          .filter((c) => c.likeCount < 10)
          .slice(0, 2)
          .map((c) => truncate(c.text, 80)) ?? [],
    });
  }
  if (comments.sentiment.positive > 70) {
    recs.push({
      category: "hook",
      action:
        "Study the opening - high positive sentiment suggests the hook delivers on the promise",
      supportingTheme: `${comments.sentiment.positive}% positive sentiment`,
      exampleSnippets: [],
    });
  }
  return recs;
}

function buildHookRecs(
  comments: NonNullable<CompetitorVideoAnalysis["comments"]>,
): OutperformRec[] {
  if (!comments.hookInspiration?.length) {return [];}
  return [
    {
      category: "hook" as const,
      action: `Use viewer language in your hook: "${comments.hookInspiration[0]}"`,
      supportingTheme: "Hook inspiration",
      exampleSnippets: [],
    },
  ];
}

function dedup(recs: OutperformRec[]): OutperformRec[] {
  const seen = new Set<string>();
  return recs
    .filter((r) => {
      const key = r.action.slice(0, 50);
      if (seen.has(key)) {return false;}
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function generateWaysToOutperform(
  comments: CompetitorVideoAnalysis["comments"],
): OutperformRec[] {
  if (!comments || comments.commentsDisabled) {return [];}
  return dedup([
    ...buildFollowUpRecs(comments),
    ...buildContentRecs(comments),
    ...buildSentimentRecs(comments),
    ...buildHookRecs(comments),
  ]);
}

function prepareCards(insights: CompetitorVideoAnalysis["analysis"]) {
  return {
    whyCards: filterObviousInsights(insights.whyItsWorking ?? []).slice(0, 4),
    themeCards: (insights.themesToRemix ?? []).slice(0, 3),
    patternCards: (insights.titlePatterns ?? []).slice(0, 3),
    remixCards: (insights.remixIdeasForYou ?? []).slice(0, 3),
  };
}

/* ---------- Inline OutperformList ---------- */

const categoryLabels: Record<OutperformRec["category"], string> = {
  content: "Content",
  hook: "Hook/Pacing",
  clarity: "Clarity",
  "follow-up": "Follow-up Ideas",
};

const categoryColors: Record<OutperformRec["category"], string> = {
  content: "content",
  hook: "hook",
  clarity: "clarity",
  "follow-up": "followup",
};

function OutperformList({
  recommendations,
}: {
  recommendations: OutperformRec[];
}) {
  const grouped = recommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec);
      return acc;
    },
    {} as Record<string, OutperformRec[]>,
  );

  return (
    <div className={s.outperformList}>
      {Object.entries(grouped).map(([category, recs]) => (
        <div key={category} className={s.outperformCategory}>
          <span
            className={s.categoryBadge}
            data-category={
              categoryColors[category as OutperformRec["category"]]
            }
          >
            {categoryLabels[category as OutperformRec["category"]]}
          </span>
          <ul className={s.outperformItems}>
            {recs.map((rec, i) => (
              <li key={i} className={s.outperformItem}>
                <span className={s.outperformAction}>{rec.action}</span>
                {rec.supportingTheme && (
                  <span className={s.outperformTheme}>
                    Based on: {rec.supportingTheme}
                  </span>
                )}
                {rec.exampleSnippets.length > 0 && (
                  <div className={s.snippets}>
                    {rec.exampleSnippets.map((snippet, j) => (
                      <span key={j} className={s.snippet}>
                        &ldquo;{snippet}&rdquo;
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------- Region sub-components ---------- */

function TopRegion({ data }: Props) {
  const { video, publicSignals, strategicInsights } = data;
  return (
    <section className={s.topRegion}>
      <div className={s.topRegionVideo}>
        <VideoHeaderSimple
          thumbnailUrl={video.thumbnailUrl}
          title={video.title}
          publishedAt={video.publishedAt}
          views={video.stats.viewCount}
          likes={video.stats.likeCount ?? 0}
          comments={video.stats.commentCount ?? 0}
        />
      </div>
      <div className={s.topRegionVerdict}>
        <p className={s.regionLabel}>Verdict</p>
        {strategicInsights ? (
          <VerdictTiles strategicInsights={strategicInsights} publicSignals={publicSignals} />
        ) : (
          <p className={s.verdictMissing}>Verdict not available for this video.</p>
        )}
      </div>
    </section>
  );
}

function AudienceRegion({ comments }: { comments: CompetitorVideoAnalysis["comments"] }) {
  if (!comments) {return null;}
  return (
    <section className={s.region}>
      <p className={s.regionLabel}>How viewers reacted</p>
      {comments.commentsDisabled ? (
        <p className={s.commentsDisabledMsg}>
          Comments are disabled for this video &mdash; audience signals unavailable.
        </p>
      ) : (
        <div className={s.audienceStrip}>
          <SentimentStrip comments={comments} />
        </div>
      )}
    </section>
  );
}

function WaysToOutperformSection({ recommendations }: { recommendations: OutperformRec[] }) {
  if (recommendations.length === 0) {return null;}
  return (
    <section className={s.region}>
      <h2 className={s.sectionHeader}>Ways to outperform</h2>
      <OutperformList recommendations={recommendations} />
    </section>
  );
}

function BetterVersionSection({ remixCards }: { remixCards: CompetitorVideoAnalysis["analysis"]["remixIdeasForYou"] }) {
  if (remixCards.length === 0) {return null;}
  return (
    <section className={s.region}>
      <h2 className={s.sectionHeader}>Your better version</h2>
      <p className={s.sectionSubtitle}>Differentiated ideas for your channel &mdash; not clones.</p>
      <div className={s.remixGrid}>
        {remixCards.map((remix, i) => (
          <div key={i} className={s.remixCard}>
            <h4 className={s.remixTitle}>{remix.title}</h4>
            <p className={s.remixAngle}>{remix.angle}</p>
            <div className={s.remixHook}>
              <span className={s.hookLabel}>Hook: </span>
              <span className={s.hookText}>&ldquo;{remix.hook}&rdquo;</span>
            </div>
            <div className={s.remixOverlay}>
              <span className={s.overlayLabel}>Thumbnail Text: </span>
              <span className={s.overlayText}>{remix.overlayText}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopCommentsSection({ comments }: { comments: CompetitorVideoAnalysis["comments"] }) {
  if (!comments || comments.commentsDisabled) {return null;}
  if ((comments.topComments?.length ?? 0) === 0) {return null;}
  return (
    <section className={s.region}>
      <h2 className={s.sectionHeader}>Top viewer comments</h2>
      <TopCommentsList comments={comments} />
    </section>
  );
}


/* ---------- Main Component ---------- */

export function AnalyzeResultsPublic({ data }: Props) {
  const { analysis: insights, comments, tags, derivedKeywords } = data;
  const allTags = tags ?? derivedKeywords ?? [];
  const { whyCards, themeCards, patternCards, remixCards } = prepareCards(insights);
  const waysToOutperform = generateWaysToOutperform(comments);

  return (
    <div className={s.regionsContainer}>
      <TopRegion data={data} />
      <AudienceRegion comments={comments} />
      <WaysToOutperformSection recommendations={waysToOutperform} />
      <BetterVersionSection remixCards={remixCards} />
      <TopCommentsSection comments={comments} />
      <PatternsToBorrow whyCards={whyCards} themeCards={themeCards} patternCards={patternCards} />
      <TagsAndSeoSection tags={allTags} />
    </div>
  );
}
