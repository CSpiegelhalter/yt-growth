"use client";

import { useState } from "react";
import s from "../keywords.module.css";
import type { VideoIdea } from "../KeywordResearchClient";

// ============================================
// TYPES
// ============================================

interface Props {
  keyword: string;
  ideas: VideoIdea[];
  loading: boolean;
  generated: boolean;
  onGenerate: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function VideoIdeasTab({ keyword, ideas, loading, generated, onGenerate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Not generated yet - show generate button
  if (!generated && !loading) {
    return (
      <div className={s.ideasTab}>
        <div className={s.generatePrompt}>
          <h3>Generate Video Ideas</h3>
          <p>
            Get AI-powered video ideas based on &quot;{keyword}&quot; with titles, hooks, and outlines.
          </p>
          <button onClick={onGenerate} className={s.generateButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Generate Video Ideas
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={s.ideasTab}>
        <div className={s.loadingState}>
          <div className={s.spinner} />
          <p>Generating video ideas...</p>
          <p className={s.loadingSubtext}>This may take 10-20 seconds</p>
        </div>
      </div>
    );
  }

  // No ideas generated
  if (ideas.length === 0) {
    return (
      <div className={s.ideasTab}>
        <div className={s.noIdeas}>
          <p>No video ideas were generated. Try a different keyword.</p>
          <button onClick={onGenerate} className={s.retryButton}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show ideas
  return (
    <div className={s.ideasTab}>
      <div className={s.ideasGrid}>
        {ideas.map((idea) => {
          const isExpanded = expandedId === idea.id;

          return (
            <div key={idea.id} className={`${s.ideaCard} ${isExpanded ? s.ideaCardExpanded : ""}`}>
              <div className={s.ideaHeader} onClick={() => toggleExpand(idea.id)}>
                <span className={`${s.formatBadge} ${idea.format === "shorts" ? s.formatShorts : s.formatLong}`}>
                  {idea.format === "shorts" ? "Short" : "Long"}
                </span>
                <h4 className={s.ideaTitle}>{idea.title}</h4>
                <p className={s.ideaHook}>{idea.hook}</p>
                <span className={s.targetKeyword}>{idea.targetKeyword}</span>
                <button className={s.expandButton} aria-label={isExpanded ? "Collapse" : "Expand"}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {isExpanded && (
                <div className={s.ideaDetails}>
                  <div className={s.ideaSection}>
                    <h5>Why it wins</h5>
                    <p>{idea.whyItWins}</p>
                  </div>

                  <div className={s.ideaSection}>
                    <h5>Outline</h5>
                    <ol className={s.outlineList}>
                      {idea.outline.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className={s.ideaSection}>
                    <h5>SEO Keywords</h5>
                    <div className={s.seoKeywords}>
                      <span className={s.primaryKeyword}>{idea.seoNotes.primaryKeyword}</span>
                      {idea.seoNotes.supportingKeywords.map((kw, i) => (
                        <span key={i} className={s.supportingKeyword}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Regenerate button */}
      <div className={s.regenerateSection}>
        <button onClick={onGenerate} className={s.regenerateButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Regenerate Ideas
        </button>
      </div>
    </div>
  );
}
