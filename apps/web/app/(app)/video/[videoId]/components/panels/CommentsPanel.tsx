"use client";

import styles from "./panels.module.css";
import { InsightCard, BulletList, NextSteps } from "../ui";

type CommentsData = {
  noComments?: boolean;
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  themes?: Array<{ theme: string; count: number }>;
  viewerLoved?: string[];
  viewerAskedFor?: string[];
  hookInspiration?: string[];
};

type CommentsPanelProps = {
  data: CommentsData | null;
  loading: boolean;
  error: string | null;
  channelId: string;
};

/**
 * CommentsPanel - Clean viewer insights from comments
 * Data is prefetched by parent - no internal fetching
 */
export function CommentsPanel({
  data,
  loading,
  error,
  channelId,
}: CommentsPanelProps) {
  if (loading) {
    return (
      <InsightCard title="Comment insights">
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Analyzing viewer comments</p>
        </div>
      </InsightCard>
    );
  }

  // Check for permission error
  if (error?.toLowerCase().includes("google access")) {
    return (
      <InsightCard title="Comment insights">
        <div className={styles.permissionError}>
          <p className={styles.permissionTitle}>Google connection issue</p>
          <p className={styles.permissionDesc}>
            We tried to refresh your connection automatically. 
            Please reconnect with the Google account that owns this channel.
          </p>
          <a
            href={`/api/integrations/google/start?channelId=${encodeURIComponent(channelId)}`}
            className={styles.reconnectBtn}
          >
            Connect Google Account
          </a>
        </div>
      </InsightCard>
    );
  }

  if (error) {
    return (
      <InsightCard title="Comment insights">
        <div className={styles.errorState}>
          <p>{error}</p>
        </div>
      </InsightCard>
    );
  }

  if (!data || data.noComments) {
    return (
      <InsightCard title="Comment insights">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No comments available</p>
          <p className={styles.emptyDesc}>
            This video doesn&apos;t have comments yet, or comments may be disabled.
          </p>
        </div>
      </InsightCard>
    );
  }

  const sentiment = data.sentiment;
  const themes = data.themes ?? [];
  const viewerLoved = data.viewerLoved ?? [];
  const viewerAskedFor = data.viewerAskedFor ?? [];
  const hookInspiration = data.hookInspiration ?? [];

  // Determine overall sentiment status
  const sentimentStatus = sentiment
    ? sentiment.positive > 60 ? "strong"
    : sentiment.negative > 30 ? "needs-work"
    : "mixed"
    : "neutral";

  return (
    <div className={styles.panelStack}>
      {/* Sentiment Overview */}
      {sentiment && (
        <InsightCard
          title="Audience sentiment"
          status={sentimentStatus as "strong" | "mixed" | "needs-work"}
        >
          <div className={styles.sentimentBar}>
            <div
              className={styles.sentimentPos}
              style={{ width: `${sentiment.positive}%` }}
            />
            <div
              className={styles.sentimentNeutral}
              style={{ width: `${sentiment.neutral}%` }}
            />
            <div
              className={styles.sentimentNeg}
              style={{ width: `${sentiment.negative}%` }}
            />
          </div>
          <div className={styles.sentimentLabels}>
            <span className={styles.sentimentLabelPos}>
              Positive {sentiment.positive}%
            </span>
            <span className={styles.sentimentLabelNeutral}>
              Neutral {sentiment.neutral}%
            </span>
            <span className={styles.sentimentLabelNeg}>
              Negative {sentiment.negative}%
            </span>
          </div>
        </InsightCard>
      )}

      {/* Common Themes */}
      {themes.length > 0 && (
        <InsightCard title="Common themes">
          <div className={styles.themeChips}>
            {themes.map((theme, i) => (
              <span key={i} className={styles.themeChip}>
                {theme.theme}
                <span className={styles.themeCount}>{theme.count}</span>
              </span>
            ))}
          </div>
        </InsightCard>
      )}

      {/* What Viewers Loved */}
      {viewerLoved.length > 0 && (
        <InsightCard title="What resonated">
          <BulletList type="positive" items={viewerLoved} />
        </InsightCard>
      )}

      {/* Content Requests */}
      {viewerAskedFor.length > 0 && (
        <InsightCard title="Audience requests">
          <BulletList type="neutral" items={viewerAskedFor} />
          <NextSteps
            title="Content opportunities"
            actions={[
              { label: "Generate follow-up video ideas", variant: "secondary" },
            ]}
          />
        </InsightCard>
      )}

      {/* Hook-Worthy Quotes */}
      {hookInspiration.length > 0 && (
        <InsightCard title="Quotable moments">
          <div className={styles.quoteList}>
            {hookInspiration.map((quote, i) => (
              <blockquote key={i} className={styles.quote}>
                &ldquo;{quote}&rdquo;
              </blockquote>
            ))}
          </div>
        </InsightCard>
      )}
    </div>
  );
}

export default CommentsPanel;
