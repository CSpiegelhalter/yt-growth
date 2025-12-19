"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import s from "./style.module.css";
import type {
  Me,
  Channel,
  CompetitorFeedResponse,
  CompetitorVideo,
} from "@/types/api";

type SortOption = "velocity" | "engagement" | "newest" | "outliers";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

/**
 * CompetitorsClient - Video-first competitor winners feed.
 * Receives bootstrap data from server, handles interactions client-side.
 */
export default function CompetitorsClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
}: Props) {
  // State initialized from server props
  const [channels] = useState<Channel[]>(initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    initialActiveChannelId
  );

  // Feed data and loading states
  const [feedData, setFeedData] = useState<CompetitorFeedResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [range, setRange] = useState<"7d" | "28d">("7d");
  const [sort, setSort] = useState<SortOption>("velocity");

  const activeChannel = useMemo(
    () => channels.find((c) => c.channel_id === activeChannelId) ?? null,
    [channels, activeChannelId]
  );

  const isSubscribed = useMemo(
    () => initialMe.subscription?.isActive ?? false,
    [initialMe]
  );

  // Sync activeChannelId to localStorage
  useEffect(() => {
    if (activeChannelId && typeof window !== "undefined") {
      localStorage.setItem("activeChannelId", activeChannelId);
    }
  }, [activeChannelId]);

  // Load competitor feed when channel, range, or sort changes
  useEffect(() => {
    if (!activeChannelId) return;

    setDataLoading(true);
    fetch(
      `/api/me/channels/${activeChannelId}/competitors?range=${range}&sort=${sort}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.videos) {
          setFeedData(data as CompetitorFeedResponse);
        } else {
          setFeedData(null);
        }
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [activeChannelId, range, sort]);

  // Load more videos
  const handleLoadMore = useCallback(async () => {
    if (!activeChannelId || !feedData?.nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/me/channels/${activeChannelId}/competitors?range=${range}&sort=${sort}&cursor=${feedData.nextCursor}`
      );
      const data = await res.json();
      if (data.videos) {
        setFeedData((prev) => ({
          ...data,
          videos: [...(prev?.videos || []), ...data.videos],
        }));
      }
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [activeChannelId, feedData?.nextCursor, range, sort, loadingMore]);

  const handleRangeChange = useCallback((newRange: "7d" | "28d") => {
    setRange(newRange);
    setFeedData(null);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setFeedData(null);
  }, []);

  // No channels state
  if (!activeChannel) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <h1 className={s.title}>Competitor Winners</h1>
          <p className={s.subtitle}>
            See what&apos;s working for competitors in your niche
          </p>
        </div>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Connect a Channel First</h2>
          <p className={s.emptyDesc}>
            Connect your YouTube channel to discover what&apos;s working for
            competitors in your niche.
          </p>
          <a href="/dashboard" className={s.emptyBtn}>
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Competitor Winners</h1>
          <p className={s.subtitle}>
            Videos working right now for channels similar to{" "}
            <strong>{activeChannel.title}</strong>
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className={s.controls}>
        <div className={s.controlGroup}>
          <select
            className={s.select}
            value={range}
            onChange={(e) => handleRangeChange(e.target.value as "7d" | "28d")}
          >
            <option value="7d">Last 7 days</option>
            <option value="28d">Last 28 days</option>
          </select>

          <select
            className={s.select}
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
          >
            <option value="velocity">Trending Now</option>
            <option value="engagement">Best Engagement</option>
            <option value="newest">Newest</option>
            <option value="outliers">Biggest Outliers</option>
          </select>
        </div>
      </div>

      {!isSubscribed && (
        <div className={s.upgradeBanner}>
          <p>Upgrade to Pro to unlock competitor analysis and deep insights.</p>
          <a href="/api/integrations/stripe/checkout" className={s.upgradeBtn}>
            Upgrade
          </a>
        </div>
      )}

      {feedData?.demo && (
        <div className={s.demoBanner}>
          <p>
            Demo data shown. Connect a channel with content to see real
            competitor insights.
          </p>
        </div>
      )}

      {/* Video Grid */}
      {dataLoading ? (
        <div className={s.videoGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={s.videoCardSkeleton}>
              <div className={s.skeletonThumb} />
              <div className={s.skeletonContent}>
                <div className={s.skeletonTitle} />
                <div className={s.skeletonMeta} />
              </div>
            </div>
          ))}
        </div>
      ) : feedData && feedData.videos.length > 0 ? (
        <>
          <div className={s.videoGrid}>
            {feedData.videos.map((video) => (
              <CompetitorVideoCard
                key={video.videoId}
                video={video}
                channelId={activeChannel.channel_id}
              />
            ))}
          </div>

          {/* Load More */}
          {feedData.nextCursor && (
            <div className={s.loadMoreWrap}>
              <button
                className={s.loadMoreBtn}
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className={s.spinnerSmall} />
                    Loading...
                  </>
                ) : (
                  "Load More Videos"
                )}
              </button>
            </div>
          )}

          {/* Last Updated */}
          {feedData.generatedAt && (
            <p className={s.lastUpdated}>
              Last updated: {formatRelativeTime(feedData.generatedAt)}
              {feedData.demo && " (Demo data)"}
            </p>
          )}
        </>
      ) : (
        <div className={s.emptyVideos}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p>
            No competitor videos found. Try expanding your date range or
            ensuring your channel has enough content for niche matching.
          </p>
        </div>
      )}
    </main>
  );
}

/* ---------- Competitor Video Card ---------- */
function CompetitorVideoCard({
  video,
  channelId,
}: {
  video: CompetitorVideo;
  channelId: string;
}) {
  const isBuilding = video.derived.dataStatus === "building";
  const hasVelocity = video.derived.velocity24h !== undefined;
  const hasOutlier = video.derived.outlierScore !== undefined;

  return (
    <Link
      href={`/competitors/video/${video.videoId}?channelId=${channelId}`}
      className={s.videoCard}
    >
      <div className={s.videoThumbWrap}>
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className={s.videoThumb}
            loading="lazy"
          />
        ) : (
          <div className={s.videoThumbPlaceholder}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Views/day badge */}
        <span className={s.vpdBadge}>
          {formatCompact(video.derived.viewsPerDay)}/day
        </span>

        {/* Velocity badge if available */}
        {hasVelocity && (
          <span className={s.velocityBadge}>
            +{formatCompact(video.derived.velocity24h!)} 24h
          </span>
        )}
      </div>

      <div className={s.videoCardContent}>
        <h3 className={s.videoCardTitle}>{video.title}</h3>

        <div className={s.channelRow}>
          {video.channelThumbnailUrl && (
            <img
              src={video.channelThumbnailUrl}
              alt=""
              className={s.channelAvatar}
              loading="lazy"
            />
          )}
          <span className={s.channelName}>{video.channelTitle}</span>
        </div>

        <div className={s.videoCardMeta}>
          <span>{formatCompact(video.stats.viewCount)} views</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>

        {/* Metric chips row */}
        <div className={s.metricChips}>
          {/* Engagement chip */}
          {video.derived.engagementPerView !== undefined && (
            <span className={s.metricChip}>
              {(video.derived.engagementPerView * 100).toFixed(1)}% eng
            </span>
          )}

          {/* Outlier score chip */}
          {hasOutlier && video.derived.outlierScore! > 1.5 && (
            <span className={`${s.metricChip} ${s.outlierChip}`}>
              Outlier +{video.derived.outlierScore!.toFixed(1)}σ
            </span>
          )}

          {/* Building data indicator */}
          {isBuilding && (
            <span className={`${s.metricChip} ${s.buildingChip}`}>
              Building data
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ---------- Helpers ---------- */
function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
