"use client";

import { CommentAnalysis } from "@/app/(app)/analyze/_components/CommentAnalysis";
import { EnrichmentSection } from "@/app/(app)/analyze/_components/EnrichmentSection";
import { TagSelector } from "@/app/videos/components/full-report/components/discoverability/TagSelector";
import { VideoHeaderSimple } from "@/components/video/VideoHeaderSimple";
import type { CompetitorVideoAnalysis } from "@/types/api";

import s from "@/app/(app)/analyze/style.module.css";

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

/* ---------- Section wrapper (accordion) ---------- */

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="accordion__item" open={defaultOpen}>
      <summary className="accordion__trigger">
        <span className="accordion__title">{title}</span>
        <svg
          className="accordion__chevron"
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="accordion__content">{children}</div>
    </details>
  );
}

/* ---------- Sub-sections ---------- */

function RemixSection({
  remixCards,
}: {
  remixCards: CompetitorVideoAnalysis["analysis"]["remixIdeasForYou"];
}) {
  return (
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
  );
}

/* ---------- Insights Sub-sections ---------- */

function InsightsSections({ insights }: { insights: CompetitorVideoAnalysis["analysis"] }) {
  const { whyCards, themeCards, patternCards, remixCards } = prepareCards(insights);

  return (
    <>
      {whyCards.length > 0 && (
        <Section title="What's Driving Performance">
          <p className={s.sectionSubtitle}>
            Observed signals from public data &mdash; use these to inform your own content strategy
          </p>
          <div className={s.cardGrid}>
            {whyCards.map((text, i) => (
              <div key={i} className={s.simpleCard}>
                <p className={s.cardText}>{text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {themeCards.length > 0 && (
        <Section title="Portable Patterns">
          <p className={s.sectionSubtitle}>Templates you can adapt for your own videos</p>
          <div className={s.themesList}>
            {themeCards.map((theme, i) => (
              <div key={i} className={s.themeCard}>
                <h4 className={s.themeTitle}>{theme.theme}</h4>
                <p className={s.themeWhy}>{theme.why}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {patternCards.length > 0 && (
        <Section title="Title Patterns">
          <p className={s.sectionSubtitle}>Structural patterns you can borrow for your titles</p>
          <div className={s.patternCards}>
            {patternCards.map((pattern, i) => (
              <div key={i} className={s.patternCard}>
                <h4 className={s.patternTitle}>{pattern}</h4>
                <p className={s.patternHow}>
                  Write 2 variants using this pattern with your main keyword.
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {remixCards.length > 0 && (
        <Section title="Make Your Better Version">
          <p className={s.sectionSubtitle}>Differentiated ideas for your channel &mdash; not clones</p>
          <RemixSection remixCards={remixCards} />
        </Section>
      )}
    </>
  );
}

/* ---------- Comments + Outperform Sub-section ---------- */

function CommentsAndOutperform({ comments }: { comments: CompetitorVideoAnalysis["comments"] }) {
  const waysToOutperform = generateWaysToOutperform(comments);

  return (
    <>
      {comments && !comments.commentsDisabled && (
        <Section title="Comment Analysis">
          <CommentAnalysis comments={comments} />
        </Section>
      )}
      {comments?.commentsDisabled && (
        <p className={s.commentsDisabledMsg}>Comments are disabled for this video.</p>
      )}
      {waysToOutperform.length > 0 && (
        <Section title="Ways to Outperform">
          <OutperformList recommendations={waysToOutperform} />
        </Section>
      )}
    </>
  );
}

/* ---------- Main Component ---------- */

export function AnalyzeResultsPublic({ data }: Props) {
  const { video, analysis: insights, comments, tags, derivedKeywords, publicSignals, strategicInsights } = data;
  const allTags = tags ?? derivedKeywords ?? [];

  return (
    <>
      <div className={s.videoHeader}>
        <VideoHeaderSimple
          thumbnailUrl={video.thumbnailUrl}
          title={video.title}
          publishedAt={video.publishedAt}
          views={video.stats.viewCount}
          likes={video.stats.likeCount ?? 0}
          comments={video.stats.commentCount ?? 0}
        />
      </div>

      <div className={s.resultsContainer}>
        {allTags.length > 0 && (
          <Section title="Tags">
            <TagSelector tags={allTags} />
          </Section>
        )}

        <CommentsAndOutperform comments={comments} />
        <InsightsSections insights={insights} />

        {strategicInsights && (
          <Section title="Strategic Insights">
            <EnrichmentSection
              strategicInsights={strategicInsights}
              publicSignals={publicSignals}
            />
          </Section>
        )}
      </div>
    </>
  );
}
