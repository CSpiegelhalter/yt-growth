"use client";

import { useCallback, useMemo, useState } from "react";

import type { CompetitorCommentsAnalysis } from "@/types/api";

import s from "../style.module.css";

type Props = {
  comments: CompetitorCommentsAnalysis;
};

const INITIAL_COUNT = 3;

export function CommentAnalysis({ comments }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const sortedComments = useMemo(() => {
    if (!comments.topComments) {return [];}
    return [...comments.topComments].sort((a, b) => b.likeCount - a.likeCount);
  }, [comments.topComments]);

  const displayComments = showAll ? sortedComments : sortedComments.slice(0, INITIAL_COUNT);

  if (comments.commentsDisabled) {
    return <p className={s.commentsDisabledMsg}>Comments are disabled for this video.</p>;
  }

  const hasAnalysis =
    comments.sentiment.positive > 0 ||
    comments.sentiment.neutral > 0 ||
    comments.sentiment.negative > 0;

  return (
    <div>
      {/* Sentiment bar */}
      {hasAnalysis && (
        <>
          <div className={s.sentimentBar}>
            <div className={s.sentimentPositive} style={{ width: `${comments.sentiment.positive}%` }} />
            <div className={s.sentimentNeutral} style={{ width: `${comments.sentiment.neutral}%` }} />
            <div className={s.sentimentNegative} style={{ width: `${comments.sentiment.negative}%` }} />
          </div>
          <div className={s.sentimentLabels}>
            <span className={s.sentimentLabelPos}>{comments.sentiment.positive}% Positive</span>
            <span className={s.sentimentLabelNeu}>{comments.sentiment.neutral}% Neutral</span>
            <span className={s.sentimentLabelNeg}>{comments.sentiment.negative}% Negative</span>
          </div>
        </>
      )}

      {/* Recurring themes */}
      {comments.themes && comments.themes.length > 0 && (
        <div className={s.commentThemes}>
          {comments.themes.slice(0, 6).map((theme, i) => (
            <span key={i} className={s.themeChip}>
              {theme.theme} <span className={s.themeCount}>({theme.count})</span>
            </span>
          ))}
        </div>
      )}

      {/* Truncated comments */}
      <div className={s.commentsList}>
        {displayComments.map((comment, i) => {
          const isExpanded = expandedIds.has(i);
          return (
            <div key={i} className={s.commentCard}>
              <div className={s.commentHeader}>
                <span className={s.commentAuthor}>{comment.authorName ?? "Viewer"}</span>
                <span className={s.commentLikes}>&#9829; {comment.likeCount}</span>
              </div>
              <p className={`${s.commentText} ${isExpanded ? s.commentTextExpanded : ""}`}>
                {comment.text}
              </p>
              {comment.text.length > 150 && (
                <button
                  type="button"
                  className={s.commentToggle}
                  onClick={() => toggleExpand(i)}
                >
                  {isExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {sortedComments.length > INITIAL_COUNT && !showAll && (
        <button
          type="button"
          className={s.showMoreCommentsBtn}
          onClick={() => setShowAll(true)}
        >
          Show {sortedComments.length - INITIAL_COUNT} more comments
        </button>
      )}
    </div>
  );
}
