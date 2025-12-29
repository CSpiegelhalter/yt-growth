"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import s from "./style.module.css";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import { formatCompact } from "@/lib/format";
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
  const [loadingMoreVideos, setLoadingMoreVideos] = useState(false);

  // How many videos to display (show 12 more each time)
  const [visibleCount, setVisibleCount] = useState(12);

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

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  // Load competitor feed when channel, range, or sort changes
  useEffect(() => {
    if (!activeChannelId) return;

    setDataLoading(true);
    setVisibleCount(12); // Reset visible count
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

  const handleRangeChange = useCallback((newRange: "7d" | "28d") => {
    setRange(newRange);
    setFeedData(null);
    setVisibleCount(12);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setFeedData(null);
    setVisibleCount(12);
  }, []);

  // Handle "Load More" - show 12 more videos, fetch from YouTube if needed
  const handleLoadMore = useCallback(async () => {
    if (!feedData) return;

    const totalFetched = feedData.videos.length;
    const currentlyVisible = visibleCount;

    // If we have more videos already fetched, just show more
    if (currentlyVisible < totalFetched) {
      setVisibleCount((prev) => Math.min(prev + 12, totalFetched));
      return;
    }

    // Need to fetch more from YouTube
    if (!activeChannelId || loadingMoreVideos || !feedData.hasMorePages) return;

    // Use pagination info from the last API response
    const nextQueryIndex =
      feedData.nextQueryIndex ?? feedData.currentQueryIndex ?? 0;
    const nextPageToken = feedData.nextPageToken;

    setLoadingMoreVideos(true);

    try {
      // Build URL with pagination parameters
      const params = new URLSearchParams({
        range,
        sort,
        queryIndex: String(nextQueryIndex),
      });
      if (nextPageToken) {
        params.set("pageToken", nextPageToken);
      }

      const res = await fetch(
        `/api/me/channels/${activeChannelId}/competitors?${params.toString()}`
      );
      const data = await res.json();

      if (data.videos && data.videos.length > 0) {
        // Append new videos to existing ones (dedupe by videoId)
        setFeedData((prev) => {
          if (!prev) return data as CompetitorFeedResponse;
          const existingIds = new Set(prev.videos.map((v) => v.videoId));
          const newVideos = data.videos.filter(
            (v: CompetitorVideo) => !existingIds.has(v.videoId)
          );
          return {
            ...data,
            videos: [...prev.videos, ...newVideos],
          };
        });
        // Show 12 more of the new videos
        setVisibleCount((prev) => prev + 12);
      } else {
        // No more videos, update state to reflect that
        setFeedData((prev) => (prev ? { ...prev, hasMorePages: false } : null));
      }
    } catch (err) {
      console.error("Failed to fetch more videos:", err);
    } finally {
      setLoadingMoreVideos(false);
    }
  }, [activeChannelId, range, sort, loadingMoreVideos, feedData, visibleCount]);

  // No channels state
  if (!activeChannel) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <h1 className={s.title}>Competitor Winners</h1>
          <p className={s.subtitle}>
            See what's working for competitors in your niche
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
            Connect your YouTube channel to discover what's working for
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
            Videos from{" "}
            {feedData?.targetSizeDescription ? (
              <strong>{feedData.targetSizeDescription}</strong>
            ) : (
              "similar channels"
            )}{" "}
            in your niche
          </p>
        </div>
      </div>

      {/* Controls - Side by side */}
      <div className={s.controls}>
        <div className={s.filterGroup}>
          <label className={s.filterLabel}>Time Range</label>
          <select
            className={s.select}
            value={range}
            onChange={(e) => handleRangeChange(e.target.value as "7d" | "28d")}
          >
            <option value="7d">Last 7 days</option>
            <option value="28d">Last 28 days</option>
          </select>
        </div>

        <div className={s.filterGroup}>
          <label className={s.filterLabel}>Sort By</label>
          <select
            className={s.select}
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            title={getSortDescription(sort)}
          >
            <option value="velocity">Gaining Views Fast</option>
            <option value="engagement">High Engagement</option>
            <option value="newest">Recently Posted</option>
          </select>
        </div>

        {/* Sort explanation */}
        <div className={s.sortHint}>{getSortDescription(sort)}</div>
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
            {feedData.videos.slice(0, visibleCount).map((video) => (
              <CompetitorVideoCard
                key={video.videoId}
                video={video}
                channelId={activeChannel.channel_id}
              />
            ))}
          </div>

          {/* Load More Videos */}
          {(visibleCount < feedData.videos.length || feedData.hasMorePages) && (
            <div className={s.fetchMoreWrap}>
              <button
                className={s.fetchMoreBtn}
                onClick={handleLoadMore}
                disabled={loadingMoreVideos}
              >
                {loadingMoreVideos ? (
                  <>
                    <span className={s.spinnerSmall} />
                    Loading more videos...
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
  const hasVelocity = video.derived.velocity24h !== undefined;
  const [thumbOk, setThumbOk] = useState(true);
  const [avatarOk, setAvatarOk] = useState(true);

  return (
    <Link
      href={`/competitors/video/${video.videoId}?channelId=${channelId}`}
      className={s.videoCard}
    >
      <div className={s.videoThumbWrap}>
        {video.thumbnailUrl && thumbOk ? (
          <Image
            src={video.thumbnailUrl}
            alt={`${video.title} thumbnail`}
            fill
            className={s.videoThumb}
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setThumbOk(false)}
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
          {video.channelThumbnailUrl && avatarOk ? (
            <Image
              src={video.channelThumbnailUrl}
              alt={`${video.channelTitle} channel avatar`}
              width={24}
              height={24}
              className={s.channelAvatar}
              sizes="24px"
              onError={() => setAvatarOk(false)}
            />
          ) : null}
          <span className={s.channelName}>{video.channelTitle}</span>
        </div>

        <div className={s.videoCardMeta}>
          <span>{formatCompact(video.stats.viewCount)} views</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

/* ---------- Helpers ---------- */
function getSortDescription(sort: SortOption): string {
  switch (sort) {
    case "velocity":
      return "Videos gaining the most views in the last 24 hours";
    case "outliers":
      return "Videos performing significantly above the channel's average";
    case "engagement":
      return "Videos with the highest like and comment rates";
    case "newest":
      return "Most recently published videos";
    default:
      return "";
  }
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
