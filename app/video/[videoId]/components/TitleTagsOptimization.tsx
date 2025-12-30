"use client";

import s from "../style.module.css";
import { CopyButton } from "./CopyButton";
import { TagChip } from "./TagChip";

type TitleAnalysis = {
  score: number;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
};

type DescriptionAnalysis = {
  score: number;
  weaknesses?: string[];
  rewrittenOpening?: string;
  addTheseLines?: string[];
};

type TagAnalysis = {
  score: number;
  feedback: string;
  missing?: string[];
};

type TitleTagsOptimizationProps = {
  videoTitle: string;
  titleAnalysis?: TitleAnalysis;
  descriptionAnalysis?: DescriptionAnalysis;
  tagAnalysis?: TagAnalysis;
};

/**
 * TitleTagsOptimization - SEO optimization suggestions for title, description, and tags
 */
export function TitleTagsOptimization({
  videoTitle,
  titleAnalysis,
  descriptionAnalysis,
  tagAnalysis,
}: TitleTagsOptimizationProps) {
  if (!titleAnalysis && !tagAnalysis) {
    return null;
  }

  const seoTags = (tagAnalysis?.missing ?? [])
    .map((t) => String(t ?? "").trim())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 25);

  const getScoreClass = (score: number) => {
    if (score >= 8) return s.scoreGreen;
    if (score >= 5) return s.scoreYellow;
    return s.scoreRed;
  };

  return (
    <section className={s.packaging}>
      <h2 className={s.sectionTitle}>Title & Tags Optimization</h2>
      <p className={s.sectionDesc}>
        How well your title and tags are optimized for clicks and discovery
      </p>

      <div className={s.packagingGrid}>
        {titleAnalysis && (
          <div className={s.packagingCard}>
            <div className={s.packagingHeader}>
              <span className={s.packagingLabel}>Title</span>
              <span
                className={`${s.packagingScore} ${getScoreClass(titleAnalysis.score)}`}
              >
                {titleAnalysis.score}/10
              </span>
            </div>
            <p className={s.currentValue}>&quot;{videoTitle}&quot;</p>

            {(titleAnalysis.strengths?.length ?? 0) > 0 && (
              <div className={s.feedbackGroup}>
                <span className={s.feedbackLabel}>✓ Strengths</span>
                <ul>
                  {titleAnalysis.strengths?.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {(titleAnalysis.weaknesses?.length ?? 0) > 0 && (
              <div className={s.feedbackGroup}>
                <span className={s.feedbackLabelWarn}>✗ Could Improve</span>
                <ul>
                  {titleAnalysis.weaknesses?.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {(titleAnalysis.suggestions?.length ?? 0) > 0 && (
              <div className={s.suggestions}>
                <span className={s.feedbackLabelAlt}>💡 Try Instead</span>
                {titleAnalysis.suggestions?.map((sug, i) => (
                  <div key={i} className={s.suggestionRow}>
                    <span>{sug}</span>
                    <CopyButton text={sug} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {descriptionAnalysis && (
          <div className={s.packagingCard}>
            <div className={s.packagingHeader}>
              <span className={s.packagingLabel}>Description</span>
              <span
                className={`${s.packagingScore} ${getScoreClass(descriptionAnalysis.score)}`}
              >
                {descriptionAnalysis.score}/10
              </span>
            </div>

            <p className={s.tagFeedback}>
              {descriptionAnalysis.weaknesses?.length
                ? descriptionAnalysis.weaknesses[0]
                : "Description SEO review."}
            </p>

            {descriptionAnalysis.rewrittenOpening && (
              <div className={s.suggestions}>
                <span className={s.feedbackLabelAlt}>
                  Stronger opening (copy/paste)
                </span>
                <div className={s.suggestionRow}>
                  <span>{descriptionAnalysis.rewrittenOpening}</span>
                  <CopyButton text={descriptionAnalysis.rewrittenOpening} />
                </div>
              </div>
            )}

            {(descriptionAnalysis.addTheseLines?.length ?? 0) > 0 && (
              <div className={s.suggestions} style={{ marginTop: 12 }}>
                <span className={s.feedbackLabelAlt}>
                  Add these lines (copy/paste)
                </span>
                {descriptionAnalysis.addTheseLines
                  ?.filter(Boolean)
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

        {tagAnalysis && (
          <div className={s.packagingCard}>
            <div className={s.packagingHeader}>
              <span className={s.packagingLabel}>Tags</span>
              <span
                className={`${s.packagingScore} ${getScoreClass(tagAnalysis.score)}`}
              >
                {tagAnalysis.score}/10
              </span>
            </div>
            <p className={s.tagFeedback}>{tagAnalysis.feedback}</p>

            {seoTags.length > 0 && (
              <div className={s.missingTagsSection}>
                <div className={s.missingTagsHeader}>
                  <span className={s.feedbackLabelAlt}>
                    Copy-paste SEO tags
                  </span>
                  <CopyButton text={seoTags.join(", ")} label="Copy all" />
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
  );
}

