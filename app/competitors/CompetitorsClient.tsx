"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import s from "./style.module.css";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import type {
  Me,
  Channel,
  CompetitorFeedResponse,
  CompetitorVideo,
} from "@/types/api";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import CompetitorVideoCard from "./CompetitorVideoCard";
import {
  type SortOption,
  getSortDescription,
  formatRelativeTime,
  formatTimeUntil,
} from "./utils";

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
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  // State initialized from server props
  const [channels] = useState<Channel[]>(initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    initialActiveChannelId
  );

  // Keep client state in sync when server props / URL params change.
  useEffect(() => {
    const next = urlChannelId ?? initialActiveChannelId ?? null;
    setActiveChannelId(next);
  }, [urlChannelId, initialActiveChannelId]);

  // Feed data and loading states
  const [feedData, setFeedData] = useState<CompetitorFeedResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadingMoreVideos, setLoadingMoreVideos] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | null>(
    null
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Track if API told us subscription is required (overrides bootstrap data)
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  // How many videos to display (start with 12, increment by 6 each time - divisible by 2 and 3)
  const [visibleCount, setVisibleCount] = useState(12);

  const [sort, setSort] = useState<SortOption>("velocity");

  const activeChannel = useMemo(
    () => channels.find((c) => c.channel_id === activeChannelId) ?? null,
    [channels, activeChannelId]
  );

  // Use bootstrap subscription status, but override if API tells us otherwise
  const isSubscribedFromBootstrap = useMemo(
    () => initialMe.subscription?.isActive ?? false,
    [initialMe]
  );
  const isSubscribed = isSubscribedFromBootstrap && !subscriptionRequired;

  // Filter out videos with less than 10 views per day (minimal quality threshold)
  const MIN_VIEWS_PER_DAY = 10;
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
    // Skip API call if we already know subscription is not active
    if (!isSubscribedFromBootstrap) {
      setSubscriptionRequired(true);
      return;
    }

    setDataLoading(true);
    setVisibleCount(12); // Reset visible count
    setRateLimitError(null); // Clear previous rate limit errors
    setFetchError(null); // Clear previous fetch errors

    (async () => {
      try {
        const data = await apiFetchJson<any>(
          `/api/me/channels/${activeChannelId}/competitors?sort=${sort}`,
          { cache: "no-store" }
        );
        setSubscriptionRequired(false);
        setFeedData(data?.videos ? (data as CompetitorFeedResponse) : null);
      } catch (err) {
        // Handle subscription required error gracefully
        if (
          isApiClientError(err) &&
          err.status === 403 &&
          err.code === "SUBSCRIPTION_REQUIRED"
        ) {
          setSubscriptionRequired(true);
          setFeedData(null);
          // Don't log or set fetchError - the UI will show the locked state
          return;
        }
        console.error("Competitor feed fetch error:", err);
        if (isApiClientError(err) && err.status === 429) {
          setRateLimitError({
            resetAt: String((err.details as any)?.resetAt ?? ""),
            message: "Too many requests. Try again soon.",
          });
        } else if (isApiClientError(err)) {
          setFetchError(err.message);
        } else {
          setFetchError(
            "Failed to load competitor videos. Please check your connection and try again."
          );
        }
      } finally {
        setDataLoading(false);
      }
    })();
  }, [activeChannelId, sort, isSubscribedFromBootstrap]);

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

    console.log(
      `[LoadMore] Click! Current: ${currentVisible}, Target: ${targetVisible}, Filtered: ${filteredVideos.length}`
    );

    // If we already have enough qualifying videos, just show 6 more
    if (filteredVideos.length >= targetVisible) {
      console.log(
        `[LoadMore] Have enough locally, showing: ${currentVisible} -> ${targetVisible}`
      );
      setVisibleCount(targetVisible);
      return;
    }

    // If no more pages to fetch, show whatever remains
    if (!feedData.hasMorePages) {
      if (filteredVideos.length > currentVisible) {
        console.log(
          `[LoadMore] No more pages, showing all remaining: ${currentVisible} -> ${filteredVideos.length}`
        );
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
      let currentQueryIndex =
        feedData.nextQueryIndex ?? feedData.currentQueryIndex ?? 0;
      let currentPageToken = feedData.nextPageToken;
      let hasMore: boolean = feedData.hasMorePages ?? false;
      let latestData = feedData;

      // Keep fetching until we have enough qualifying videos or run out of pages/queries
      while (hasMore) {
        const qualifyingCount = allVideos.filter(
          (v) => v.derived.viewsPerDay >= MIN_VIEWS_PER_DAY
        ).length;

        console.log(
          `[LoadMore] Qualifying: ${qualifyingCount}/${allVideos.length}, need: ${targetVisible}`
        );

        // Check if we have enough now
        if (qualifyingCount >= targetVisible) {
          console.log(`[LoadMore] Have enough qualifying videos!`);
          break;
        }

        // Fetch more
        const params = new URLSearchParams({
          sort,
          queryIndex: String(currentQueryIndex),
        });
        if (currentPageToken) {
          params.set("pageToken", currentPageToken);
        }

        console.log(
          `[LoadMore] Fetching batch... queryIndex=${currentQueryIndex}`
        );
        const res = await fetch(
          `/api/me/channels/${activeChannelId}/competitors?${params.toString()}`
        );
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        if (!res.ok) {
          if (res.status === 429) {
            setRateLimitError({
              resetAt: data?.details?.resetAt ?? data?.resetAt ?? "",
              message: "Too many requests. Try again soon.",
            });
            return;
          }
          if (
            res.status === 403 &&
            (data?.code === "SUBSCRIPTION_REQUIRED" ||
              data?.error?.code === "SUBSCRIPTION_REQUIRED")
          ) {
            setSubscriptionRequired(true);
            setFeedData(null);
            return;
          }
          setFetchError(
            data?.error?.message ?? data?.error ?? "Failed to load more videos."
          );
          return;
        }

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
        console.log(
          `[LoadMore] Got ${newVideos.length} new, ${newQualifying} qualify`
        );

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
        // Exhausted all queries, show everything we have
        newVisible = finalQualifying;
        console.log(
          `[LoadMore] Exhausted all queries, showing all: ${currentVisible} -> ${newVisible}`
        );
      } else {
        // Show 6 more
        newVisible = targetVisible;
        console.log(
          `[LoadMore] Showing 6 more: ${currentVisible} -> ${newVisible}`
        );
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

  // Show locked state if subscription is required
  if (!isSubscribed) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Competitor Winners</h1>
            <p className={s.subtitle}>
              See what's working for channels in your niche
            </p>
          </div>
        </div>
        <div className={s.lockedState}>
          <div className={s.lockedIcon}>
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
          <h2 className={s.lockedTitle}>Unlock Competitor Winners</h2>
          <p className={s.lockedDesc}>
            See what's working for channels in your niche. Discover winning
            video ideas, analyze thumbnails, and learn from competitors'
            success.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.lockedBtn}>
            Subscribe to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
            {SUBSCRIPTION.PRO_INTERVAL}
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
          {(visibleCount < filteredVideos.length ||
            feedData.hasMorePages ||
            fetchError) && (
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
