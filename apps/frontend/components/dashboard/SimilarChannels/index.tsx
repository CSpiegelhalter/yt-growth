"use client";

import { useState, useCallback } from "react";
import s from "./style.module.css";
import type { SimilarChannelsResponse, SimilarChannel } from "@/types/api";
import { copyToClipboard } from "@/components/ui/Toast";

type Props = {
  data: SimilarChannelsResponse | null;
  loading?: boolean;
  onRefresh?: (range: "7d" | "14d") => void;
  onLoadMore?: (channelId: string) => Promise<void>;
  isSubscribed?: boolean;
  isDemo?: boolean;
};

export default function SimilarChannelsSection({
  data,
  loading = false,
  onRefresh,
  onLoadMore,
  isSubscribed = true,
  isDemo = false,
}: Props) {
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number | null>(null);
  const [range, setRange] = useState<"7d" | "14d">("7d");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleRangeChange = (newRange: "7d" | "14d") => {
    setRange(newRange);
    onRefresh?.(newRange);
  };

  const handleLoadMore = useCallback(async (channelId: string) => {
    if (!onLoadMore || loadingMore) return;
    setLoadingMore(channelId);
    try {
      await onLoadMore(channelId);
    } finally {
      setLoadingMore(null);
    }
  }, [onLoadMore, loadingMore]);

  const selectedChannel = selectedChannelIndex !== null 
    ? data?.similarChannels[selectedChannelIndex] 
    : null;

  // Loading skeleton
  if (loading) {
    return (
      <div className={s.card}>
        <div className={s.header}>
          <div>
            <h3 className={s.title}>Similar Channels</h3>
            <p className={s.subtitle}>Discover what&apos;s working for channels like yours</p>
          </div>
        </div>
        <div className={s.skeletonChannels}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={s.skeletonChannelCard} />
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
          <div className={s.lockedIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3 className={s.lockedTitle}>Unlock Competitor Insights</h3>
          <p className={s.lockedDesc}>
            See what similar channels are doing, their recent successful videos, and ideas to steal.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.btnPrimary}>
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.similarChannels.length === 0) {
    return (
      <div className={s.card}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3 className={s.emptyTitle}>No Similar Channels Found</h3>
          <p className={s.emptyDesc}>
            Upload more videos to help us find channels in your niche.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.card}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerText}>
          <div className={s.headerTop}>
            <h3 className={s.title}>Similar Channels</h3>
            {isDemo && <span className={s.demoBadge}>Demo Data</span>}
          </div>
          <p className={s.subtitle}>Discover what&apos;s working for channels like yours</p>
        </div>
        <div className={s.controls}>
          <select
            className={s.select}
            value={range}
            onChange={(e) => handleRangeChange(e.target.value as "7d" | "14d")}
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
          </select>
        </div>
      </div>

      {/* Channels Carousel */}
      <div className={s.channelsSection}>
        <div className={s.channelCarousel}>
          {data.similarChannels.map((channel, index) => (
            <button
              key={channel.channelId}
              className={`${s.channelCard} ${selectedChannelIndex === index ? s.selected : ""}`}
              onClick={() => setSelectedChannelIndex(selectedChannelIndex === index ? null : index)}
              type="button"
            >
              {channel.channelThumbnailUrl ? (
                <img
                  src={channel.channelThumbnailUrl}
                  alt=""
                  className={s.channelThumb}
                  loading="lazy"
                />
              ) : (
                <div className={s.channelThumbPlaceholder}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              )}
              <span className={s.channelName}>{channel.channelTitle}</span>
              <span className={s.channelScore}>
                {Math.round(channel.similarityScore * 100)}% match
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Channel Details */}
      {selectedChannel && (
        <ChannelDetails
          channel={selectedChannel}
          onCopy={handleCopy}
          copiedId={copiedId}
          onLoadMore={() => handleLoadMore(selectedChannel.channelId)}
          loadingMore={loadingMore === selectedChannel.channelId}
        />
      )}

      {/* Insights Section */}
      {data.insights && (
        <InsightsSection
          insights={data.insights}
          onCopy={handleCopy}
          copiedId={copiedId}
        />
      )}

      {/* Last Updated */}
      {data.generatedAt && (
        <p className={s.lastUpdated}>
          Last updated: {formatRelativeTime(data.generatedAt)}
        </p>
      )}
    </div>
  );
}

/* ---------- Channel Details ---------- */
function ChannelDetails({
  channel,
  onCopy,
  copiedId,
  onLoadMore,
  loadingMore,
}: {
  channel: SimilarChannel;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  if (channel.recentWinners.length === 0) {
    return (
      <div className={s.channelDetails}>
        <h4 className={s.channelDetailsTitle}>{channel.channelTitle}</h4>
        <p className={s.noVideos}>No recent videos in this time range</p>
      </div>
    );
  }

  return (
    <div className={s.channelDetails}>
      <h4 className={s.channelDetailsTitle}>
        <span>{channel.channelTitle}</span>
        <a
          href={`https://youtube.com/channel/${channel.channelId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={s.channelLink}
        >
          View Channel →
        </a>
      </h4>
      
      <p className={s.recentLabel}>Recent Winners</p>
      
      <div className={s.videoGrid}>
        {channel.recentWinners.map((video) => (
          <div key={video.videoId} className={s.videoCard}>
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt=""
                className={s.videoThumb}
                loading="lazy"
              />
            ) : (
              <div className={s.videoThumbPlaceholder}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
            )}
            <div className={s.videoInfo}>
              <h5 className={s.videoTitle}>{video.title}</h5>
              <div className={s.videoMeta}>
                <span>{formatNumber(video.views)} views</span>
                <span className={s.vpd}>{formatNumber(video.viewsPerDay)}/day</span>
              </div>
            </div>
            <button
              className={s.copyIdeaBtn}
              onClick={() => onCopy(`Topic idea inspired by: "${video.title}"`, `video-${video.videoId}`)}
              type="button"
            >
              {copiedId === `video-${video.videoId}` ? "✓" : "Copy idea"}
            </button>
          </div>
        ))}
      </div>

      {/* Load More Winners Button */}
      {onLoadMore && (
        <button
          type="button"
          className={s.loadMoreBtn}
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <>
              <span className={s.spinner} />
              Loading...
            </>
          ) : (
            "Load More Winners"
          )}
        </button>
      )}
    </div>
  );
}

/* ---------- Insights Section ---------- */
function InsightsSection({
  insights,
  onCopy,
  copiedId,
}: {
  insights: SimilarChannelsResponse["insights"];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const allInsights = [
    ...insights.whatTheyreDoing,
    ...insights.ideasToSteal,
    ...insights.formatsToTry,
  ].join("\n• ");

  const hasContent = 
    insights.whatTheyreDoing.length > 0 ||
    insights.ideasToSteal.length > 0 ||
    insights.formatsToTry.length > 0;

  if (!hasContent) return null;

  return (
    <div className={s.insightsSection}>
      <div className={s.insightsHeader}>
        <h4 className={s.insightsTitle}>Insights</h4>
        <button
          className={s.copyInsightsBtn}
          onClick={() => onCopy(`• ${allInsights}`, "all-insights")}
          type="button"
        >
          {copiedId === "all-insights" ? "✓ Copied" : "Copy All"}
        </button>
      </div>

      <div className={s.insightsGrid}>
        {insights.whatTheyreDoing.length > 0 && (
          <div className={s.insightBlock}>
            <h5 className={s.insightBlockTitle}>What They&apos;re Doing</h5>
            <ul className={s.insightList}>
              {insights.whatTheyreDoing.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {insights.ideasToSteal.length > 0 && (
          <div className={s.insightBlock}>
            <h5 className={s.insightBlockTitle}>Ideas to Steal</h5>
            <ul className={s.insightList}>
              {insights.ideasToSteal.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {insights.formatsToTry.length > 0 && (
          <div className={s.insightBlock}>
            <h5 className={s.insightBlockTitle}>Formats to Try</h5>
            <ul className={s.insightList}>
              {insights.formatsToTry.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function formatNumber(num: number | undefined | null): string {
  if (num == null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
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

