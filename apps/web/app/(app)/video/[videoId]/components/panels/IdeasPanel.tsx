"use client";

import styles from "./panels.module.css";
import { InsightCard, BulletList } from "../ui";
import { CopyButton } from "../index";

type Idea = {
  title: string;
  hook: string;
  angle: string;
  keywords?: string[];
};

type IdeasData = {
  remixIdeas?: Idea[];
  contentGaps?: string[];
};

type IdeasPanelProps = {
  data: IdeasData | null;
  loading: boolean;
  error: string | null;
};

/**
 * IdeasPanel - Content ideas and spinoff opportunities
 * Data is prefetched by parent - no internal fetching
 */
export function IdeasPanel({
  data,
  loading,
  error,
}: IdeasPanelProps) {
  if (loading) {
    return (
      <InsightCard title="Content ideas">
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Generating content ideas</p>
        </div>
      </InsightCard>
    );
  }

  if (error) {
    return (
      <InsightCard title="Content ideas">
        <div className={styles.errorState}>
          <p>{error}</p>
        </div>
      </InsightCard>
    );
  }

  if (!data) {
    return (
      <InsightCard title="Content ideas">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No ideas generated yet</p>
          <p className={styles.emptyDesc}>
            Ideas are generated based on your video content and audience engagement.
          </p>
        </div>
      </InsightCard>
    );
  }

  const ideas = data.remixIdeas ?? [];
  const contentGaps = data.contentGaps ?? [];

  if (ideas.length === 0 && contentGaps.length === 0) {
    return (
      <InsightCard title="Content ideas">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No ideas generated yet</p>
          <p className={styles.emptyDesc}>
            Ideas are generated based on your video content and audience engagement.
          </p>
        </div>
      </InsightCard>
    );
  }

  return (
    <div className={styles.panelStack}>
      {/* Spinoff Ideas */}
      {ideas.length > 0 && (
        <InsightCard title="Spinoff video ideas">
          <div className={styles.ideasGrid}>
            {ideas.map((idea, i) => (
              <div key={i} className={styles.ideaCard}>
                <h4 className={styles.ideaTitle}>{idea.title}</h4>
                <p className={styles.ideaHook}>{idea.hook}</p>
                <p className={styles.ideaAngle}>{idea.angle}</p>
                {idea.keywords && idea.keywords.length > 0 && (
                  <div className={styles.ideaKeywords}>
                    {idea.keywords.slice(0, 3).map((kw) => (
                      <span key={kw} className={styles.keywordChip}>{kw}</span>
                    ))}
                  </div>
                )}
                <div className={styles.ideaActions}>
                  <CopyButton text={idea.title} label="Copy title" />
                  <CopyButton text={idea.hook} label="Copy hook" />
                </div>
              </div>
            ))}
          </div>
        </InsightCard>
      )}

      {/* Content Gaps */}
      {contentGaps.length > 0 && (
        <InsightCard title="Content gaps to fill">
          <BulletList type="neutral" items={contentGaps} />
        </InsightCard>
      )}
    </div>
  );
}