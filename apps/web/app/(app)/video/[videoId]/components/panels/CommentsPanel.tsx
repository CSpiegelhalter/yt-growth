"use client";

import { BulletList, InsightCard, NextSteps } from "../ui";
import styles from "./panels.module.css";

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
  if (loading) {return <CommentsLoading />;}
  if (isPermissionError(error)) {
    return <CommentsPermissionError channelId={channelId} />;
  }
  if (error) {return <CommentsError error={error} />;}
  if (!data || data.noComments) {return <CommentsEmpty />;}

  return <CommentsContent data={data} />;
}

function isPermissionError(error: string | null): boolean {
  return error != null && error.toLowerCase().includes("google access");
}

function CommentsContent({ data }: { data: CommentsData }) {
  const sentiment = data.sentiment;
  const themes = data.themes ?? [];
  const viewerLoved = data.viewerLoved ?? [];
  const viewerAskedFor = data.viewerAskedFor ?? [];
  const hookInspiration = data.hookInspiration ?? [];

  return (
    <div className={styles.panelStack}>
      {sentiment && <SentimentCard sentiment={sentiment} />}

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

      {viewerLoved.length > 0 && (
        <InsightCard title="What resonated">
          <BulletList type="positive" items={viewerLoved} />
        </InsightCard>
      )}

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

function getSentimentStatus(sentiment: NonNullable<CommentsData["sentiment"]>) {
  if (sentiment.positive > 60) {return "strong" as const;}
  if (sentiment.negative > 30) {return "needs-work" as const;}
  return "mixed" as const;
}

function SentimentCard({
  sentiment,
}: {
  sentiment: NonNullable<CommentsData["sentiment"]>;
}) {
  return (
    <InsightCard
      title="Audience sentiment"
      status={getSentimentStatus(sentiment)}
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
  );
}

function CommentsLoading() {
  return (
    <InsightCard title="Comment insights">
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p>Analyzing viewer comments</p>
      </div>
    </InsightCard>
  );
}

function CommentsPermissionError({ channelId }: { channelId: string }) {
  return (
    <InsightCard title="Comment insights">
      <div className={styles.permissionError}>
        <p className={styles.permissionTitle}>Google connection issue</p>
        <p className={styles.permissionDesc}>
          We tried to refresh your connection automatically. Please reconnect
          with the Google account that owns this channel.
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

function CommentsError({ error }: { error: string }) {
  return (
    <InsightCard title="Comment insights">
      <div className={styles.errorState}>
        <p>{error}</p>
      </div>
    </InsightCard>
  );
}

function CommentsEmpty() {
  return (
    <InsightCard title="Comment insights">
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>No comments available</p>
        <p className={styles.emptyDesc}>
          This video doesn&apos;t have comments yet, or comments may be
          disabled.
        </p>
      </div>
    </InsightCard>
  );
}
