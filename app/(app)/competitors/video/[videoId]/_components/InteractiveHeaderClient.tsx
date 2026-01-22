"use client";

import { useState, useCallback, memo, useMemo } from "react";
import { copyToClipboard } from "@/components/ui/Toast";
import type { CompetitorCommentsAnalysis } from "@/types/api";
import s from "../style.module.css";

/* ============================================
   ENGAGEMENT BADGE
   ============================================ */

type EngagementLevel = "High" | "Above Avg" | "Average" | "Low";

type EngagementBadgeProps = {
  views: number;
  comments: number;
};

/**
 * EngagementBadge - Shows engagement level based on comment-to-view ratio.
 * Displayed inline with the comments metric.
 */
export const EngagementBadge = memo(function EngagementBadge({
  views,
  comments,
}: EngagementBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const { level, explanation } = getEngagementLevel(views, comments);

  return (
    <span
      className={s.engagementBadge}
      data-level={level.toLowerCase().replace(" ", "-")}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {level}
      {showTooltip && <span className={s.engagementTooltip}>{explanation}</span>}
    </span>
  );
});

function getEngagementLevel(
  views: number,
  comments: number
): { level: EngagementLevel; explanation: string } {
  if (views === 0) {
    return { level: "Average", explanation: "No views yet" };
  }

  const commentsPer1k = (comments / views) * 1000;

  if (commentsPer1k >= 5) {
    return {
      level: "High",
      explanation: `${commentsPer1k.toFixed(1)} comments per 1K views`,
    };
  }
  if (commentsPer1k >= 2.5) {
    return {
      level: "Above Avg",
      explanation: `${commentsPer1k.toFixed(1)} comments per 1K views`,
    };
  }
  if (commentsPer1k >= 1) {
    return {
      level: "Average",
      explanation: `${commentsPer1k.toFixed(1)} comments per 1K views`,
    };
  }
  return {
    level: "Low",
    explanation: `${commentsPer1k.toFixed(1)} comments per 1K views`,
  };
}

/* ============================================
   TAGS SECTION
   ============================================ */

type TagsSectionProps = {
  tags: string[];
};

/**
 * TagsSection - Dedicated section for video tags with copy functionality.
 */
export const TagsSection = memo(function TagsSection({
  tags,
}: TagsSectionProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAll = useCallback(async () => {
    const success = await copyToClipboard(tags.join(", "));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [tags]);

  if (tags.length === 0) {
    return null;
  }

  const visibleTags = showAllTags ? tags : tags.slice(0, 15);
  const hasMoreTags = tags.length > 15;

  return (
    <section className={s.section}>
      <div className={s.tagsSectionHeader}>
        <h2 className={s.sectionTitle}>Tags</h2>
        <button className={s.copyAllBtn} onClick={handleCopyAll}>
          {copied ? "Copied!" : "Copy All"}
        </button>
      </div>
      <div className={s.tagsGrid}>
        {visibleTags.map((tag, i) => (
          <span key={i} className={s.tagPill}>
            {tag}
          </span>
        ))}
        {hasMoreTags && !showAllTags && (
          <button
            className={s.showMoreTagsBtn}
            onClick={() => setShowAllTags(true)}
          >
            +{tags.length - 15} more
          </button>
        )}
      </div>
      {tags.length === 0 && (
        <p className={s.emptyState}>No tags available for this video.</p>
      )}
    </section>
  );
});

/* ============================================
   COMMENTS SECTION WITH FILTERS
   ============================================ */

type CommentFilter = "all" | "positive" | "neutral" | "negative" | "questions";

type CommentsSectionProps = {
  comments: CompetitorCommentsAnalysis;
};

/**
 * CommentsSection - Shows comment themes, sentiment, and filterable comments.
 */
export const CommentsSection = memo(function CommentsSection({
  comments,
}: CommentsSectionProps) {
  const [filter, setFilter] = useState<CommentFilter>("all");
  const [showAllComments, setShowAllComments] = useState(false);

  const hasAnalysis =
    comments.sentiment.positive > 0 ||
    comments.sentiment.neutral > 0 ||
    comments.sentiment.negative > 0;

  // Sort comments by likes (most liked first) and filter
  const filteredComments = useMemo(() => {
    if (!comments.topComments) return [];
    
    // Sort by likes descending to surface what people agree with
    const sorted = [...comments.topComments].sort(
      (a, b) => b.likeCount - a.likeCount
    );
    
    if (filter === "questions") {
      return sorted.filter((c) => c.text.includes("?"));
    }
    return sorted;
  }, [comments.topComments, filter]);

  const displayComments = showAllComments
    ? filteredComments
    : filteredComments.slice(0, 6);

  if (comments.error) {
    return (
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Top Comments &amp; Sentiment</h2>
        <p className={s.commentsError}>{comments.error}</p>
      </section>
    );
  }

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        Top Comments &amp; Sentiment
        <span className={s.howGenerated} title="Themes extracted from top comments using AI analysis">
          ⓘ
        </span>
      </h2>

      {/* Summary Section */}
      {hasAnalysis && (
        <div className={s.commentsSummary}>
          {/* Sentiment Bar */}
          <div className={s.sentimentSection}>
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
                {comments.sentiment.positive}% Positive
              </span>
              <span className={s.sentimentLabelNeu}>
                {comments.sentiment.neutral}% Neutral
              </span>
              <span className={s.sentimentLabelNeg}>
                {comments.sentiment.negative}% Negative
              </span>
            </div>
          </div>

          {/* Themes */}
          {comments.themes && comments.themes.length > 0 && (
            <div className={s.themesCompact}>
              <span className={s.themesLabel}>Recurring themes:</span>
              <div className={s.themeChips}>
                {comments.themes.slice(0, 6).map((theme, i) => (
                  <span key={i} className={s.themeChip}>
                    {theme.theme}{" "}
                    <span className={s.themeCount}>({theme.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Highlights Grid */}
          <div className={s.highlightsGrid}>
            {comments.viewerLoved && comments.viewerLoved.length > 0 && (
              <div className={s.highlightBox}>
                <h4 className={s.highlightTitle}>What viewers loved</h4>
                <ul className={s.highlightList}>
                  {comments.viewerLoved.slice(0, 3).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {comments.viewerAskedFor && comments.viewerAskedFor.length > 0 && (
              <div className={s.highlightBox}>
                <h4 className={s.highlightTitle}>Questions &amp; requests</h4>
                <ul className={s.highlightList}>
                  {comments.viewerAskedFor.slice(0, 3).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className={s.commentFilters}>
        <button
          className={`${s.filterBtn} ${filter === "all" ? s.active : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`${s.filterBtn} ${filter === "questions" ? s.active : ""}`}
          onClick={() => setFilter("questions")}
        >
          Questions
        </button>
      </div>

      {/* Comments List */}
      <div className={s.topCommentsList}>
        {displayComments.map((comment, i) => (
          <div key={i} className={s.topComment}>
            <div className={s.topCommentHeader}>
              <span className={s.topCommentAuthor}>{comment.authorName}</span>
              <span className={s.topCommentLikes}>♥ {comment.likeCount}</span>
            </div>
            <p className={s.topCommentText}>{comment.text}</p>
          </div>
        ))}
      </div>

      {filteredComments.length > 6 && !showAllComments && (
        <button
          className={s.loadMoreBtn}
          onClick={() => setShowAllComments(true)}
        >
          Show {filteredComments.length - 6} more comments
        </button>
      )}

      {filteredComments.length === 0 && filter !== "all" && (
        <p className={s.emptyState}>No {filter} comments found.</p>
      )}
    </section>
  );
});

/* ============================================
   WAYS TO OUTPERFORM SECTION
   ============================================ */

type OutperformRecommendation = {
  category: "content" | "hook" | "clarity" | "follow-up";
  action: string;
  supportingTheme: string;
  exampleSnippets: string[];
};

type WaysToOutperformProps = {
  recommendations: OutperformRecommendation[];
};

const categoryLabels: Record<OutperformRecommendation["category"], string> = {
  content: "Content",
  hook: "Hook/Pacing",
  clarity: "Clarity",
  "follow-up": "Follow-up Ideas",
};

const categoryColors: Record<OutperformRecommendation["category"], string> = {
  content: "content",
  hook: "hook",
  clarity: "clarity",
  "follow-up": "followup",
};

/**
 * WaysToOutperform - Comment-driven recommendations for differentiation.
 */
export const WaysToOutperform = memo(function WaysToOutperform({
  recommendations,
}: WaysToOutperformProps) {
  if (recommendations.length === 0) {
    return null;
  }

  // Group by category
  const grouped = recommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec);
      return acc;
    },
    {} as Record<string, OutperformRecommendation[]>
  );

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        Ways to Outperform
        <span className={s.sectionBadge} data-type="generated">
          Comment-driven
        </span>
      </h2>
      <p className={s.sectionSubtitle}>
        Actionable recommendations grounded in viewer feedback
      </p>

      <div className={s.outperformList}>
        {Object.entries(grouped).map(([category, recs]) => (
          <div key={category} className={s.outperformCategory}>
            <span
              className={s.categoryBadge}
              data-category={categoryColors[category as OutperformRecommendation["category"]]}
            >
              {categoryLabels[category as OutperformRecommendation["category"]]}
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
                          "{snippet}"
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
    </section>
  );
});

/* ============================================
   LEGACY EXPORTS (kept for compatibility)
   ============================================ */

type TagsInlineProps = {
  tags: string[];
};

/**
 * TagsInline - Legacy inline tags component.
 * @deprecated Use TagsSection instead
 */
export const TagsInline = memo(function TagsInline({ tags }: TagsInlineProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAll = useCallback(async () => {
    const success = await copyToClipboard(tags.join(", "));
    if (success) {
      setCopiedId("all-tags");
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, [tags]);

  if (tags.length === 0) {
    return null;
  }

  const visibleTags = showAllTags ? tags : tags.slice(0, 12);
  const hasMoreTags = tags.length > 12;

  return (
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
            +{tags.length - 12} more
          </button>
        )}
      </div>
      <button className={s.copyAllTagsBtn} onClick={handleCopyAll}>
        {copiedId === "all-tags" ? "Copied" : "Copy all"}
      </button>
    </div>
  );
});

type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

/**
 * CopyButton - Generic copy-to-clipboard button with feedback.
 */
export const CopyButton = memo(function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);

  return (
    <button className={className ?? s.copyBtn} onClick={handleCopy}>
      {copied ? copiedLabel : label}
    </button>
  );
});

type HookQuoteCopyProps = {
  quote: string;
};

/**
 * HookQuoteCopy - Copy button for hook inspiration quotes.
 */
export const HookQuoteCopy = memo(function HookQuoteCopy({
  quote,
}: HookQuoteCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(quote);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [quote]);

  return (
    <div className={s.hookQuote}>
      <span className={s.quoteText}>&ldquo;{quote}&rdquo;</span>
      <button className={s.copyQuoteBtn} onClick={handleCopy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
});

type RemixCardCopyProps = {
  remix: {
    title: string;
    hook: string;
    overlayText: string;
    angle: string;
  };
};

/**
 * RemixCardCopy - Copy button for remix idea cards.
 */
export const RemixCardCopy = memo(function RemixCardCopy({
  remix,
}: RemixCardCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = `Title: ${remix.title}\nHook: ${remix.hook}\nThumbnail: ${remix.overlayText}\nAngle: ${remix.angle}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [remix]);

  return (
    <button className={s.copyBtn} onClick={handleCopy}>
      {copied ? "Copied!" : "Copy Idea"}
    </button>
  );
});
