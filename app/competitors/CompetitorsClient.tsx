"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import s from "./style.module.css";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import { formatCompact, formatCompactFloored } from "@/lib/format";
import type {
  Me,
  Channel,
  CompetitorFeedResponse,
  CompetitorVideo,
} from "@/types/api";

type SortOption = "velocity" | "engagement" | "newest" | "outliers";

type RateLimitError = {
  resetAt: string;
  message: string;
};

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
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // How many videos to display (start with 12, increment by 6 each time - divisible by 2 and 3)
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

  // Filter out videos with less than 100 views per day
  const MIN_VIEWS_PER_DAY = 100;
  const filteredVideos = useMemo(() => {
    if (!feedData?.videos) return [];
    return feedData.videos.filter(
      (v) => v.derived.viewsPerDay >= MIN_VIEWS_PER_DAY
    );
  }, [feedData?.videos]);

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  // Load competitor feed when channel, range, or sort changes
  useEffect(() => {
    if (!activeChannelId) return;

    setDataLoading(true);
    setVisibleCount(12); // Reset visible count
    setRateLimitError(null); // Clear previous rate limit errors
    setFetchError(null); // Clear previous fetch errors
    
    fetch(
      `/api/me/channels/${activeChannelId}/competitors?range=${range}&sort=${sort}`
    )
      .then(async (r) => {
        const data = await r.json();
        
        if (r.status === 429) {
          // Rate limited
          setRateLimitError({
            resetAt: data.resetAt,
            message: "You've made too many requests. Please wait before trying again.",
          });
          return;
        }
        
        if (!r.ok) {
          // Other server error
          setFetchError(data.error || "Failed to load competitor videos. Please try again.");
          return;
        }
        
        if (data.videos) {
          setFeedData(data as CompetitorFeedResponse);
        } else {
          setFeedData(null);
        }
      })
      .catch((err) => {
        console.error("Competitor feed fetch error:", err);
        setFetchError("Failed to load competitor videos. Please check your connection and try again.");
      })
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

  // Always increment by 6 (divisible by both 2 and 3 for grid layouts)
  const LOAD_INCREMENT = 6;

  // Handle "Load More" - show exactly 6 more videos each click
  // If we don't have enough qualifying videos, keep fetching until we do
  const handleLoadMore = useCallback(async () => {
    if (!feedData || !activeChannelId || loadingMoreVideos) return;

    const currentVisible = visibleCount;
    const targetVisible = currentVisible + LOAD_INCREMENT;
    
    console.log(`[LoadMore] Click! Current: ${currentVisible}, Target: ${targetVisible}, Filtered: ${filteredVideos.length}`);

    // If we already have enough qualifying videos, just show 6 more
    if (filteredVideos.length >= targetVisible) {
      console.log(`[LoadMore] Have enough locally, showing: ${currentVisible} -> ${targetVisible}`);
      setVisibleCount(targetVisible);
      return;
    }

    // If no more pages to fetch, show whatever remains
    if (!feedData.hasMorePages) {
      if (filteredVideos.length > currentVisible) {
        console.log(`[LoadMore] No more pages, showing all remaining: ${currentVisible} -> ${filteredVideos.length}`);
        setVisibleCount(filteredVideos.length);
      } else {
        console.log(`[LoadMore] No more pages and no more videos`);
      }
      return;
    }

    // Need to fetch more - keep fetching until we have 6 more qualifying videos
    setLoadingMoreVideos(true);
    setFetchError(null); // Clear previous errors

    try {
      // Track accumulated videos and pagination state
      let allVideos = [...(feedData.videos ?? [])];
      let currentQueryIndex = feedData.nextQueryIndex ?? feedData.currentQueryIndex ?? 0;
      let currentPageToken = feedData.nextPageToken;
      let hasMore: boolean = feedData.hasMorePages ?? false;
      let latestData = feedData;

      // Keep fetching until we have enough qualifying videos or run out of pages
      while (hasMore) {
        const qualifyingCount = allVideos.filter(
          (v) => v.derived.viewsPerDay >= MIN_VIEWS_PER_DAY
        ).length;
        
        console.log(`[LoadMore] Qualifying so far: ${qualifyingCount}, need: ${targetVisible}`);
        
        // Check if we have enough now
        if (qualifyingCount >= targetVisible) {
          console.log(`[LoadMore] Have enough qualifying videos now!`);
          break;
        }

        // Fetch more
        const params = new URLSearchParams({
          range,
          sort,
          queryIndex: String(currentQueryIndex),
        });
        if (currentPageToken) {
          params.set("pageToken", currentPageToken);
        }

        console.log(`[LoadMore] Fetching batch... queryIndex=${currentQueryIndex}`);
        const res = await fetch(
          `/api/me/channels/${activeChannelId}/competitors?${params.toString()}`
        );
        const data = await res.json();

        // Handle rate limiting
        if (res.status === 429) {
          setRateLimitError({
            resetAt: data.resetAt,
            message: "You've made too many requests. Please wait before trying again.",
          });
          return;
        }

        // Handle other errors
        if (!res.ok) {
          setFetchError(data.error || "Failed to load more videos. Please try again.");
          return;
        }

        console.log(`[LoadMore] Fetch returned ${data.videos?.length ?? 0} videos, hasMorePages=${data.hasMorePages}`);

        if (!data.videos || data.videos.length === 0) {
          hasMore = false;
          latestData = { ...latestData, hasMorePages: false };
          break;
        }

        // Dedupe and add new videos
        const existingIds = new Set(allVideos.map((v) => v.videoId));
        const newVideos = data.videos.filter(
          (v: CompetitorVideo) => !existingIds.has(v.videoId)
        );
        
        const newQualifying = newVideos.filter(
          (v: CompetitorVideo) => v.derived.viewsPerDay >= MIN_VIEWS_PER_DAY
        ).length;
        
        console.log(`[LoadMore] Got ${newVideos.length} new unique, ${newQualifying} qualify`);

        allVideos = [...allVideos, ...newVideos];
        
        // Update pagination state for next iteration
        hasMore = data.hasMorePages ?? false;
        currentQueryIndex = data.nextQueryIndex ?? currentQueryIndex;
        currentPageToken = data.nextPageToken;
        latestData = data;
      }

      // Update feedData with all accumulated videos
      setFeedData((prev) => {
        if (!prev) return latestData as CompetitorFeedResponse;
        return {
          ...latestData,
          videos: allVideos,
        };
      });

      // Calculate final qualifying count and set visible
      const finalQualifying = allVideos.filter(
        (v) => v.derived.viewsPerDay >= MIN_VIEWS_PER_DAY
      ).length;

      let newVisible: number;
      if (!hasMore && finalQualifying < targetVisible) {
        // Exhausted all videos, show everything
        newVisible = finalQualifying;
        console.log(`[LoadMore] Exhausted, showing all: ${currentVisible} -> ${newVisible}`);
      } else {
        // Show exactly 6 more
        newVisible = targetVisible;
        console.log(`[LoadMore] Showing 6 more: ${currentVisible} -> ${newVisible}`);
      }

      setVisibleCount(newVisible);

    } catch (err) {
      console.error("Failed to fetch more videos:", err);
      setFetchError("Failed to load more videos. Please try again.");
    } finally {
      setLoadingMoreVideos(false);
    }
  }, [
    activeChannelId,
    range,
    sort,
    loadingMoreVideos,
    feedData,
    filteredVideos,
    visibleCount,
  ]);

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

      {/* Rate Limit Warning */}
      {rateLimitError && (
        <div className={s.rateLimitBanner}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div className={s.rateLimitContent}>
            <p className={s.rateLimitMessage}>{rateLimitError.message}</p>
            <p className={s.rateLimitReset}>
              Try again {formatTimeUntil(rateLimitError.resetAt)}
            </p>
          </div>
          <button
            className={s.rateLimitDismiss}
            onClick={() => setRateLimitError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Fetch Error Warning */}
      {fetchError && (
        <div className={s.errorBanner}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className={s.errorMessage}>{fetchError}</p>
          <button
            className={s.errorDismiss}
            onClick={() => setFetchError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

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
      ) : feedData && filteredVideos.length > 0 ? (
        <>
          <div className={s.videoGrid}>
            {filteredVideos.slice(0, visibleCount).map((video) => (
              <CompetitorVideoCard
                key={video.videoId}
                video={video}
                channelId={activeChannel.channel_id}
              />
            ))}
          </div>

          {/* Load More Videos */}
          {(visibleCount < filteredVideos.length || feedData.hasMorePages || fetchError) && (
            <div className={s.fetchMoreWrap}>
              {fetchError && (
                <p className={s.fetchErrorHint}>
                  Something went wrong. Click below to try again.
                </p>
              )}
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
                ) : fetchError ? (
                  "Retry Loading Videos"
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
          {formatCompactFloored(video.derived.viewsPerDay)}/day
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

function formatTimeUntil(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  
  if (diffMs <= 0) return "now";
  
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  }
  
  const diffHours = Math.ceil(diffMinutes / 60);
  return `in about ${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
}
