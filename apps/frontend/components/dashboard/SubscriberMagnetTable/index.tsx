"use client";

import { useState, useCallback } from "react";
import s from "./style.module.css";
import type { SubscriberMagnetVideo, PatternAnalysisJson } from "@/types/api";
import { copyToClipboard } from "@/components/ui/Toast";

type SortOption = "subs_per_1k" | "views_per_day" | "apv" | "avd";
type RangeOption = "7d" | "28d";

type Props = {
  videos: SubscriberMagnetVideo[];
  patternAnalysis: {
    analysisJson: PatternAnalysisJson | null;
    analysisMarkdownFallback: string | null;
  } | null;
  loading?: boolean;
  onRefresh?: (params: { range: RangeOption; sort: SortOption }) => void;
  lastUpdated?: string | null;
  isSubscribed?: boolean;
  isDemo?: boolean;
};

const INITIAL_DISPLAY = 10;
const LOAD_MORE_COUNT = 10;

export default function SubscriberMagnetTable({
  videos,
  patternAnalysis,
  loading = false,
  onRefresh,
  lastUpdated,
  isSubscribed = true,
  isDemo = false,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);
  const [range, setRange] = useState<RangeOption>("28d");
  const [sort, setSort] = useState<SortOption>("subs_per_1k");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleRangeChange = (newRange: RangeOption) => {
    setRange(newRange);
    onRefresh?.({ range: newRange, sort });
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    onRefresh?.({ range, sort: newSort });
  };

  const handleRefreshClick = () => {
    onRefresh?.({ range, sort });
  };

  const toggleExpand = (videoId: string) => {
    setExpandedId(expandedId === videoId ? null : videoId);
  };

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + LOAD_MORE_COUNT, videos.length));
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={s.card}>
        <div className={s.header}>
          <div>
            <h3 className={s.title}>Subscriber Magnets</h3>
            <p className={s.subtitle}>
              Videos that convert views → subscribers unusually well.
            </p>
          </div>
        </div>
        <div className={s.skeletonList}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={s.skeletonCard}>
              <div className={s.skeletonThumb} />
              <div className={s.skeletonContent}>
                <div
                  className={s.skeleton}
                  style={{ width: "80%", height: 16 }}
                />
                <div
                  className={s.skeleton}
                  style={{ width: "50%", height: 12, marginTop: 8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Not subscribed state
  if (!isSubscribed) {
    return (
      <div className={s.card}>
        <div className={s.lockedState}>
          <div className={s.lockedIcon}>🔒</div>
          <h3 className={s.lockedTitle}>Unlock Subscriber Insights</h3>
          <p className={s.lockedDesc}>
            Discover which videos convert viewers into subscribers and learn
            patterns to replicate.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.btnPrimary}>
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <div className={s.card}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📊</div>
          <h3 className={s.emptyTitle}>No Subscriber Data Yet</h3>
          <p className={s.emptyDesc}>
            Sync your channel to see which videos are best at converting viewers
            to subscribers.
          </p>
        </div>
      </div>
    );
  }

  const displayedVideos = videos.slice(0, displayCount);
  const hasMore = displayCount < videos.length;
  const analysis = patternAnalysis?.analysisJson;

  return (
    <div className={s.card}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerText}>
          <div className={s.headerTop}>
            <h3 className={s.title}>Subscriber Magnets</h3>
            {isDemo && <span className={s.demoBadge}>Demo Data</span>}
          </div>
          <p className={s.subtitle}>
            Videos that convert views → subscribers unusually well.
          </p>
        </div>
        <div className={s.controls}>
          <div className={s.controlGroup}>
            <select
              className={s.select}
              value={range}
              onChange={(e) => handleRangeChange(e.target.value as RangeOption)}
            >
              <option value="7d">Last 7 days</option>
              <option value="28d">Last 28 days</option>
            </select>
            <select
              className={s.select}
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
            >
              <option value="subs_per_1k">Subs/1K</option>
              <option value="views_per_day">Views/day</option>
              <option value="apv">Watch %</option>
              <option value="avd">Watch time</option>
            </select>
          </div>
          <button
            className={s.refreshBtn}
            onClick={handleRefreshClick}
            type="button"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className={s.lastUpdated}>
          Last updated: {formatRelativeTime(lastUpdated)}
        </p>
      )}

      {/* Video List */}
      <div className={s.videoList}>
        {displayedVideos.map((video, index) => (
          <VideoCard
            key={video.videoId}
            video={video}
            rank={index + 1}
            isExpanded={expandedId === video.videoId}
            onToggle={() => toggleExpand(video.videoId)}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        ))}
      </div>

      {hasMore && (
        <button className={s.loadMoreBtn} onClick={loadMore} type="button">
          Show {Math.min(LOAD_MORE_COUNT, videos.length - displayCount)} more
        </button>
      )}

      {/* Pattern Analysis */}
      {analysis && (
        <PatternAnalysisSection
          analysis={analysis}
          onCopy={handleCopy}
          copiedId={copiedId}
        />
      )}

      {/* Fallback to markdown if no JSON */}
      {!analysis && patternAnalysis?.analysisMarkdownFallback && (
        <div className={s.analysisFallback}>
          <h4 className={s.sectionTitle}>📊 Pattern Analysis</h4>
          <div className={s.markdownContent}>
            {patternAnalysis.analysisMarkdownFallback
              .split("\n")
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- VideoCard Component ---------- */
type VideoCardProps = {
  video: SubscriberMagnetVideo;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
};

function VideoCard({
  video,
  rank,
  isExpanded,
  onToggle,
  onCopy,
  copiedId,
}: VideoCardProps) {
  return (
    <div className={`${s.videoCard} ${isExpanded ? s.expanded : ""}`}>
      <button className={s.videoCardMain} onClick={onToggle} type="button">
        <div className={s.rankBadge}>#{rank}</div>
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className={s.thumbnail}
            loading="lazy"
          />
        ) : (
          <div className={s.thumbnailPlaceholder}>📹</div>
        )}
        <div className={s.videoInfo}>
          <h4 className={s.videoTitle}>{video.title}</h4>
          <div className={s.metaRow}>
            <span className={s.metaDate}>{formatDate(video.publishedAt)}</span>
            {video.durationSec && (
              <span className={s.metaDuration}>
                {formatDuration(video.durationSec)}
              </span>
            )}
          </div>
          <div className={s.metricsRow}>
            <span className={s.metricPrimary}>
              {video.subsPerThousand.toFixed(1)} subs/1k
            </span>
            <span className={s.metric}>{formatNumber(video.views)} views</span>
            {video.viewsPerDay !== undefined && (
              <span className={s.metric}>
                {formatNumber(video.viewsPerDay)}/day
              </span>
            )}
          </div>
        </div>
        <div className={s.expandIcon}>{isExpanded ? "▲" : "▼"}</div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={s.expandedContent}>
          <div className={s.detailsGrid}>
            <div className={s.detailBox}>
              <span className={s.detailLabel}>Subscribers</span>
              <span className={s.detailValue}>
                +{formatNumber(video.subscribersGained)}
              </span>
            </div>
            <div className={s.detailBox}>
              <span className={s.detailLabel}>Total Views</span>
              <span className={s.detailValue}>{formatNumber(video.views)}</span>
            </div>
            {video.avdSec && (
              <div className={s.detailBox}>
                <span className={s.detailLabel}>Avg Watch</span>
                <span className={s.detailValue}>
                  {formatDuration(video.avdSec)}
                </span>
              </div>
            )}
            {video.apv && (
              <div className={s.detailBox}>
                <span className={s.detailLabel}>Watch %</span>
                <span className={s.detailValue}>{video.apv.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {video.insight && (
            <div className={s.insightSection}>
              {(video.insight.whyItConverts?.length ?? 0) > 0 && (
                <div className={s.insightBlock}>
                  <h5 className={s.insightTitle}>💡 Why it converts</h5>
                  <ul className={s.insightList}>
                    {video.insight.whyItConverts?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(video.insight.stealThis?.length ?? 0) > 0 && (
                <div className={s.insightBlock}>
                  <h5 className={s.insightTitle}>🎯 Steal this pattern</h5>
                  <ul className={s.insightList}>
                    {video.insight.stealThis?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <button
                    className={s.copySmallBtn}
                    onClick={() =>
                      onCopy(
                        video.insight?.stealThis?.join("\n") ?? "",
                        `steal-${video.videoId}`
                      )
                    }
                    type="button"
                  >
                    {copiedId === `steal-${video.videoId}`
                      ? "✓ Copied"
                      : "Copy"}
                  </button>
                </div>
              )}
              {(video.insight.hookIdea?.length ?? 0) > 0 && (
                <div className={s.insightBlock}>
                  <h5 className={s.insightTitle}>🪝 Hook ideas</h5>
                  <ul className={s.insightList}>
                    {video.insight.hookIdea?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <button
                    className={s.copySmallBtn}
                    onClick={() =>
                      onCopy(
                        video.insight?.hookIdea?.join("\n") ?? "",
                        `hook-${video.videoId}`
                      )
                    }
                    type="button"
                  >
                    {copiedId === `hook-${video.videoId}` ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}

          <a
            href={`https://youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={s.watchLink}
          >
            Watch on YouTube →
          </a>
        </div>
      )}
    </div>
  );
}

/* ---------- Pattern Analysis Section ---------- */
type PatternAnalysisSectionProps = {
  analysis: PatternAnalysisJson;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
};

function PatternAnalysisSection({
  analysis,
  onCopy,
  copiedId,
}: PatternAnalysisSectionProps) {
  // Safely access arrays with fallbacks
  const commonPatterns = analysis.commonPatterns ?? [];
  const ctaPatterns = analysis.ctaPatterns ?? [];
  const formatPatterns = analysis.formatPatterns ?? [];
  const nextExperiments = analysis.nextExperiments ?? [];
  const hooksToTry = analysis.hooksToTry ?? [];

  const allInsights = [
    analysis.summary,
    ...commonPatterns,
    ...ctaPatterns,
    ...nextExperiments,
    ...hooksToTry,
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className={s.analysisSection}>
      <div className={s.analysisSectionHeader}>
        <h4 className={s.sectionTitle}>📊 Pattern Analysis</h4>
        <button
          className={s.copyBtn}
          onClick={() => onCopy(allInsights, "all-insights")}
          type="button"
        >
          {copiedId === "all-insights" ? "✓ Copied" : "Copy insights"}
        </button>
      </div>

      <p className={s.analysisSummary}>{analysis.summary}</p>

      <div className={s.analysisGrid}>
        <AnalysisBlock
          title="What these videos have in common"
          items={commonPatterns}
          icon="🔗"
        />
        <AnalysisBlock
          title="Winning CTA patterns"
          items={ctaPatterns}
          icon="📢"
          asChips
        />
        <AnalysisBlock
          title="Topic formats that convert"
          items={formatPatterns}
          icon="🎬"
          asChips
        />
        <AnalysisBlock title="Try next" items={nextExperiments} icon="🚀" />
      </div>

      {hooksToTry.length > 0 && (
        <div className={s.hooksSection}>
          <h5 className={s.hooksTitle}>🪝 Hooks to try</h5>
          <div className={s.hooksList}>
            {hooksToTry.map((hook, i) => (
              <div key={i} className={s.hookCard}>
                <span className={s.hookText}>&ldquo;{hook}&rdquo;</span>
                <button
                  className={s.copySmallBtn}
                  onClick={() => onCopy(hook, `hook-${i}`)}
                  type="button"
                >
                  {copiedId === `hook-${i}` ? "✓" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Analysis Block ---------- */
function AnalysisBlock({
  title,
  items,
  icon,
  asChips = false,
}: {
  title: string;
  items: string[];
  icon: string;
  asChips?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className={s.analysisBlock}>
      <h5 className={s.analysisBlockTitle}>
        <span className={s.blockIcon}>{icon}</span> {title}
      </h5>
      {asChips ? (
        <div className={s.chipList}>
          {items.map((item, i) => (
            <span key={i} className={s.chip}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <ul className={s.analysisList}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Helpers ---------- */
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
