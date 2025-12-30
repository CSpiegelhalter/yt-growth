"use client";

import s from "../style.module.css";
import { CopyButton } from "./CopyButton";

type Theme = {
  theme: string;
  count?: number;
  examples?: string[];
};

type CommentInsights = {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  themes?: Theme[];
  viewerLoved?: string[];
  viewerAskedFor?: string[];
  hookInspiration?: string[];
};

type ViewerVoiceProps = {
  commentInsights: CommentInsights;
};

/**
 * ViewerVoice - Insights extracted from video comments
 */
export function ViewerVoice({ commentInsights }: ViewerVoiceProps) {
  const hasContent =
    (commentInsights.themes?.length ?? 0) > 0 ||
    (commentInsights.viewerLoved?.length ?? 0) > 0 ||
    (commentInsights.viewerAskedFor?.length ?? 0) > 0 ||
    (commentInsights.hookInspiration?.length ?? 0) > 0;

  if (!hasContent) {
    return null;
  }

  return (
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
            {commentInsights.sentiment.positive}% positive •{" "}
            {commentInsights.sentiment.neutral}% neutral •{" "}
            {commentInsights.sentiment.negative}% negative
          </p>

          {(commentInsights.themes?.length ?? 0) > 0 && (
            <div className={s.feedbackGroup}>
              <span className={s.feedbackLabelAlt}>Themes</span>
              <ul>
                {commentInsights.themes?.slice(0, 5).map((t, i) => (
                  <li key={i}>
                    <strong>{t.theme}</strong>
                    {typeof t.count === "number" ? ` (${t.count})` : ""}
                    {t.examples?.length ? ` — "${t.examples[0]}"` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {(commentInsights.viewerLoved?.length ?? 0) > 0 && (
          <div className={s.packagingCard}>
            <div className={s.packagingHeader}>
              <span className={s.packagingLabel}>What viewers loved</span>
            </div>
            <div className={s.feedbackGroup}>
              <ul>
                {commentInsights.viewerLoved?.slice(0, 6).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {(commentInsights.viewerAskedFor?.length ?? 0) > 0 && (
          <div className={s.packagingCard}>
            <div className={s.packagingHeader}>
              <span className={s.packagingLabel}>What viewers asked for</span>
            </div>
            <div className={s.feedbackGroup}>
              <ul>
                {commentInsights.viewerAskedFor?.slice(0, 6).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {(commentInsights.hookInspiration?.length ?? 0) > 0 && (
          <div className={s.packagingCard}>
            <div className={s.packagingHeader}>
              <span className={s.packagingLabel}>Hook inspiration</span>
            </div>
            <div className={s.suggestions}>
              {commentInsights.hookInspiration
                ?.filter(Boolean)
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
  );
}

