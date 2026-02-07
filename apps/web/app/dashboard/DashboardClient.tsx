"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import s from "./style.module.css";
import { LIMITS, SUBSCRIPTION, formatUsd } from "@/lib/product";
import { Me, Channel } from "@/types/api";
import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import VideoToolbar from "@/components/dashboard/VideoToolbar";
import { ChannelInsightsPanel } from "@/components/dashboard/ChannelInsightsPanel";
import { Tabs } from "@/components/ui";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import { formatCompact } from "@/lib/format";
import {
  DashboardVideo,
  VideoWithMetrics,
  SortKey,
  VideoFilters,
  DEFAULT_FILTERS,
  enhanceVideosWithMetrics,
  applyFilters,
  sortVideos,
  loadVideoToolsState,
  saveVideoToolsState,
  formatContextMetric,
  formatDurationBadge,
} from "@/lib/video-tools";

type Video = DashboardVideo & {
  id?: number;
  youtubeVideoId?: string;
  viewCount?: number | null;
  retention?: {
    hasData: boolean;
    cliffTimestamp?: string;
    cliffReason?: string;
  };
};

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
  checkoutStatus?: string;
};

/**
 * DashboardClient - Video-centric dashboard
 * Receives bootstrap data from server, handles interactions client-side.
 */
export default function DashboardClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
  checkoutStatus,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  // State initialized from server props
  const [me, setMe] = useState<Me>(initialMe);
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    initialActiveChannelId,
  );

  // Keep client state in sync when server props / URL params change.
  // (Next.js will re-render the page with new props, but `useState(initialX)` won't auto-update.)
  useEffect(() => {
    setMe(initialMe);
  }, [initialMe]);

  useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);

  useEffect(() => {
    // Prefer URL (source of truth for server bootstrap), fallback to server prop.
    const next = urlChannelId ?? initialActiveChannelId ?? null;
    setActiveChannelId(next);
  }, [urlChannelId, initialActiveChannelId]);

  // Handle OAuth return - redirect to original page after reconnecting
  useEffect(() => {
    const reconnected = searchParams.get("reconnected") === "1";
    if (reconnected && typeof window !== "undefined") {
      const returnTo = sessionStorage.getItem("oauthReturnTo");
      if (returnTo) {
        sessionStorage.removeItem("oauthReturnTo");
        // Redirect to the original page
        window.location.href = returnTo;
      }
    }
  }, [searchParams]);

  // Video loading state
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<{
    offset: number;
    hasMore: boolean;
  } | null>(null);
  // Background sync state - when channel data is stale (>24h), a sync runs in background
  const [syncing, setSyncing] = useState(false);
  const [, setLastSyncedAt] = useState<string | null>(null);

  // Video Tools state (sorting, filtering)
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [filters, setFilters] = useState<VideoFilters>(DEFAULT_FILTERS);

  // Fixed page size for consistent grid layout (divisible by 1,2,3,4,6,8,12,24)
  const pageSize = 24;

  // Dashboard tab state - Videos is default
  const [activeTab, setActiveTab] = useState<"analytics" | "videos">("videos");

  // UI state
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const activeChannel = useMemo(
    () => channels.find((c) => c.channel_id === activeChannelId) ?? null,
    [channels, activeChannelId],
  );

  const canAddAnother = useMemo(() => {
    // Channel limit already accounts for plan (FREE=1, PRO=3)
    // No need to check isActive - FREE users can still add up to their limit
    return channels.length < (me.channel_limit ?? 1);
  }, [me, channels]);

  const isSubscribed = useMemo(() => {
    return me.subscription?.isActive ?? false;
  }, [me]);

  // Convert videos to DashboardVideo format and enhance with computed metrics
  const dashboardVideos = useMemo((): DashboardVideo[] => {
    return videos.map((v) => ({
      videoId: v.videoId || v.youtubeVideoId || `video-${v.id}`,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      durationSec: v.durationSec ?? null,
      publishedAt: v.publishedAt,
      views: v.views ?? v.viewCount ?? 0,
      likes: v.likes ?? 0,
      comments: v.comments ?? 0,
      avgViewDuration: v.avgViewDuration,
      avgViewPercentage: v.avgViewPercentage,
      subscribersGained: v.subscribersGained,
      subscribersLost: v.subscribersLost,
      estimatedMinutesWatched: v.estimatedMinutesWatched,
      shares: v.shares,
    }));
  }, [videos]);

  // Enhance videos with computed metrics
  const videosWithMetrics = useMemo((): VideoWithMetrics[] => {
    return enhanceVideosWithMetrics(dashboardVideos);
  }, [dashboardVideos]);

  // Apply filters and sorting
  const filteredAndSortedVideos = useMemo((): VideoWithMetrics[] => {
    const filtered = applyFilters(videosWithMetrics, filters);
    return sortVideos(filtered, sortKey);
  }, [videosWithMetrics, filters, sortKey]);

  // Handlers for VideoToolbar
  const handleSortChange = useCallback((key: SortKey) => {
    setSortKey(key);
  }, []);

  const handleFiltersChange = useCallback((newFilters: VideoFilters) => {
    setFilters(newFilters);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSortKey("newest");
  }, []);

  // Handle checkout success/cancel from URL
  useEffect(() => {
    if (checkoutStatus === "success") {
      setSuccess("Subscription activated! You now have full access.");
      window.history.replaceState({}, "", "/dashboard");
    } else if (checkoutStatus === "canceled") {
      setErr("Checkout was canceled. You can try again anytime.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [checkoutStatus]);

  // Sync activeChannelId to localStorage
  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  // Listen for channel-removed events (from profile page or elsewhere)
  useEffect(() => {
    const handleChannelRemoved = (e: CustomEvent<{ channelId: string }>) => {
      const removedId = e.detail.channelId;
      setChannels((prev) => prev.filter((c) => c.channel_id !== removedId));
      if (activeChannelId === removedId) {
        setActiveChannelId(null);
        localStorage.removeItem("activeChannelId");
      }
    };

    window.addEventListener(
      "channel-removed",
      handleChannelRemoved as EventListener,
    );
    return () => {
      window.removeEventListener(
        "channel-removed",
        handleChannelRemoved as EventListener,
      );
    };
  }, [activeChannelId]);

  // Refresh channels when page becomes visible (handles navigation back from profile)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/api/me/channels", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            // Handle both old format (array) and new format ({channels, channelLimit, plan})
            const freshChannels = Array.isArray(data) ? data : data.channels;
            setChannels(freshChannels);
            // If active channel no longer exists, clear it
            if (
              activeChannelId &&
              !freshChannels.some(
                (c: Channel) => c.channel_id === activeChannelId,
              )
            ) {
              const newActiveId = freshChannels[0]?.channel_id ?? null;
              setActiveChannelId(newActiveId);
              if (!newActiveId) {
                localStorage.removeItem("activeChannelId");
              }
            }
          }
        } catch (err) {
          console.error("Failed to refresh channels:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeChannelId]);

  // Clear stale activeChannelId if it doesn't exist in channels
  useEffect(() => {
    if (activeChannelId && channels.length > 0) {
      const exists = channels.some((c) => c.channel_id === activeChannelId);
      if (!exists) {
        // Active channel was deleted, switch to first available or clear
        const newActiveId = channels[0]?.channel_id ?? null;
        setActiveChannelId(newActiveId);
        if (!newActiveId) {
          localStorage.removeItem("activeChannelId");
        }
      }
    } else if (activeChannelId && channels.length === 0) {
      // All channels deleted, clear the stale ID
      setActiveChannelId(null);
      localStorage.removeItem("activeChannelId");
    }
  }, [activeChannelId, channels]);

  // Load videos for a channel (initial load)
  const loadVideos = useCallback(
    async (channelId: string) => {
      setVideosLoading(true);
      setPagination(null);
      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/videos?limit=${pageSize}&offset=0`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = await res.json();
          setVideos(data.videos || []);
          if (data.pagination) {
            setPagination({
              offset: data.pagination.offset + (data.videos?.length ?? 0),
              hasMore: data.pagination.hasMore,
            });
          }
          // Track background sync state
          setSyncing(data.syncing ?? false);
          setLastSyncedAt(data.lastSyncedAt ?? null);
        }
      } catch (error) {
        console.error("Failed to load videos:", error);
      } finally {
        setVideosLoading(false);
      }
    },
    [pageSize],
  );

  // Load more videos (pagination)
  const loadMoreVideos = useCallback(async () => {
    if (!activeChannelId || !pagination?.hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/me/channels/${activeChannelId}/videos?limit=${pageSize}&offset=${pagination.offset}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        setVideos((prev) => [...prev, ...(data.videos || [])]);
        if (data.pagination) {
          setPagination({
            offset: data.pagination.offset + (data.videos?.length ?? 0),
            hasMore: data.pagination.hasMore,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load more videos:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [activeChannelId, pagination, loadingMore, pageSize]);

  // Load videos when active channel changes
  useEffect(() => {
    if (!activeChannelId) {
      setVideos([]);
      return;
    }
    loadVideos(activeChannelId);

    // Pre-warm the niche cache in background (non-blocking)
    // This ensures niche is ready when user navigates to competitors or ideas page
    fetch(`/api/me/channels/${activeChannelId}/niche`, {
      method: "POST",
    }).catch(() => {
      // Silently ignore errors - this is just a pre-warm optimization
    });
  }, [activeChannelId, loadVideos, pageSize]);

  // Load saved video tools state when channel changes
  useEffect(() => {
    if (!activeChannelId) return;
    const savedState = loadVideoToolsState(activeChannelId);
    if (savedState) {
      setSortKey(savedState.sortKey);
      setFilters(savedState.filters);
    } else {
      // Reset to defaults for new channel
      setSortKey("newest");
      setFilters(DEFAULT_FILTERS);
    }
  }, [activeChannelId]);

  // Save video tools state when it changes
  useEffect(() => {
    if (!activeChannelId) return;
    saveVideoToolsState(activeChannelId, { sortKey, filters });
  }, [activeChannelId, sortKey, filters]);

  // Auto-reload videos when background sync completes
  // Poll every 10 seconds while syncing, then stop once sync is done
  useEffect(() => {
    if (!syncing || !activeChannelId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/me/channels/${activeChannelId}/videos?limit=${pageSize}&offset=0`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = await res.json();
          if (!data.syncing) {
            // Sync completed - update videos and stop polling
            setVideos(data.videos || []);
            setSyncing(false);
            setLastSyncedAt(data.lastSyncedAt ?? null);
            if (data.pagination) {
              setPagination({
                offset: data.pagination.offset + (data.videos?.length ?? 0),
                hasMore: data.pagination.hasMore,
              });
            }
          }
        }
      } catch {
        // Ignore errors during polling
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [syncing, activeChannelId, pageSize]);

  // Refresh data (re-fetch channels)
  const refreshData = useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/me/channels", { cache: "no-store" }),
      ]);
      if (mRes.ok && cRes.ok) {
        const [m, cData] = await Promise.all([mRes.json(), cRes.json()]);
        // Handle both old format (array) and new format ({channels, channelLimit, plan})
        const c = Array.isArray(cData) ? cData : cData.channels;
        setMe(m);
        setChannels(c);
      }
    } catch (e) {
      console.error("Failed to refresh data:", e);
    }
  }, []);

  const unlink = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove channel");
      }
      setSuccess("Channel removed successfully");
      setChannels((prev) => prev.filter((c) => c.channel_id !== channelId));
      if (activeChannelId === channelId) {
        const remaining = channels.filter((c) => c.channel_id !== channelId);
        setActiveChannelId(remaining[0]?.channel_id ?? null);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to remove channel");
    } finally {
      setBusy(null);
    }
  };

  const refreshChannel = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}/sync`, {
        method: "POST",
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Failed to refresh channel");
      }
      setSuccess("Channel data refreshed!");
      await refreshData();
      // Also reload videos to reflect updated metrics (views, likes, etc.)
      if (activeChannelId === channelId) {
        await loadVideos(channelId);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to refresh channel");
    } finally {
      setBusy(null);
    }
  };

  const connectChannel = () => {
    window.location.href = "/api/integrations/google/start";
  };

  return (
    <main className={s.page}>
      {/* Syncing indicator - shows when background sync is running */}
      {syncing && (
        <div className={s.syncingBanner}>
          <span className={s.spinner} />
          <span>Refreshing your channel data...</span>
        </div>
      )}

      {/* Alerts */}
      {success && (
        <div className={s.successAlert} onClick={() => setSuccess(null)}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          {success}
        </div>
      )}
      {err && <ErrorAlert message={err} />}

      {/* Main Content */}
      <div className={s.content}>
        {/* No Channels State - show when no channels OR when activeChannel doesn't exist */}
        {(channels.length === 0 || !activeChannel) && (
          <section className={s.channelsSection}>
            <ChannelsSection
              channels={channels}
              loading={false}
              canAddAnother={canAddAnother}
              onConnect={connectChannel}
              onUnlink={unlink}
              onRefresh={refreshChannel}
              busyId={busy}
            />
          </section>
        )}

        {/* Tab Navigation */}
        {activeChannel && activeChannelId && (
          <Tabs
            items={[
              {
                id: "videos",
                label: "Videos",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="2.18" />
                    <path d="M10 8l6 4-6 4V8z" />
                  </svg>
                ),
                // Don't show badge count - we don't have accurate total since we only sync on-demand
              },
              {
                id: "analytics",
                label: "Analytics",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                ),
              },
            ]}
            activeId={activeTab}
            onTabChange={(id) => setActiveTab(id as "analytics" | "videos")}
            ariaLabel="Dashboard content"
          />
        )}

        {/* Analytics Tab Content */}
        {activeChannel && activeChannelId && activeTab === "analytics" && (
          <ChannelInsightsPanel channelId={activeChannelId} />
        )}

        {/* Videos Tab Content */}
        {activeChannel && activeTab === "videos" && (
          <section className={s.videosSection}>
            {videosLoading ? (
              <div className={s.videoList}>
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
            ) : videos.length > 0 ? (
              <>
                {/* Video Tools Bar */}
                <VideoToolbar
                  videos={dashboardVideos}
                  filteredVideos={filteredAndSortedVideos}
                  sortKey={sortKey}
                  filters={filters}
                  onSortChange={handleSortChange}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleResetFilters}
                  // Don't pass totalVideoCount - we only sync first page for performance
                />

                {/* Video List */}
                {filteredAndSortedVideos.length > 0 ? (
                  <div className={s.videoList}>
                    {filteredAndSortedVideos.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        channelId={activeChannelId}
                        sortKey={sortKey}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={s.emptyFiltered}>
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <p>No videos match these filters</p>
                    <button className={s.resetBtn} onClick={handleResetFilters}>
                      Reset filters
                    </button>
                  </div>
                )}

                {/* Load More Button */}
                {pagination?.hasMore && (
                  <div className={s.loadMoreWrap}>
                    <button
                      className={s.loadMoreBtn}
                      onClick={loadMoreVideos}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <span className={s.spinner} />
                          Loading...
                        </>
                      ) : (
                        "Load More Videos"
                      )}
                    </button>
                  </div>
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
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p>No videos found. Try refreshing your channel data.</p>
                <button
                  className={s.refreshBtn}
                  onClick={() => refreshChannel(activeChannel.channel_id)}
                  disabled={busy === activeChannel.channel_id}
                >
                  {busy === activeChannel.channel_id
                    ? "Refreshing..."
                    : "Refresh Channel"}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Subscribe CTA */}
        {!isSubscribed && channels.length > 0 && (
          <section className={s.ctaSection}>
            <div className={s.ctaCard}>
              <div className={s.ctaContent}>
                <h3 className={s.ctaTitle}>Unlock Full Insights</h3>
                <p className={s.ctaDesc}>
                  Get video ideas, retention analysis, and subscriber driver
                  insights.
                </p>
                <ul className={s.ctaFeatures}>
                  <li>Unlimited idea generation</li>
                  <li>Video analysis with fixes</li>
                  <li>
                    Up to {LIMITS.PRO_MAX_CONNECTED_CHANNELS} connected channels
                  </li>
                </ul>
              </div>
              <div className={s.ctaAction}>
                <div className={s.ctaPrice}>
                  <span className={s.ctaPriceAmount}>
                    {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}
                  </span>
                  <span className={s.ctaPricePeriod}>
                    /{SUBSCRIPTION.PRO_INTERVAL}
                  </span>
                </div>
                <a
                  href="/api/integrations/stripe/checkout"
                  className={s.ctaBtn}
                >
                  Subscribe Now
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ---------- Video Card Component ---------- */
function VideoCard({
  video,
  channelId,
  sortKey,
}: {
  video: VideoWithMetrics;
  channelId: string | null;
  sortKey: SortKey;
}) {
  const [imgError, setImgError] = useState(false);
  const videoId = video.videoId;

  if (!videoId || videoId.startsWith("video-")) {
    console.error("Video missing videoId:", video);
  }

  const href =
    videoId && !videoId.startsWith("video-")
      ? channelId
        ? `/video/${videoId}?channelId=${encodeURIComponent(channelId)}`
        : `/video/${videoId}`
      : "#";

  // Get context metric based on current sort
  const contextMetric = formatContextMetric(video, sortKey);
  const durationBadge = formatDurationBadge(video.durationSec);

  const showPlaceholder = !video.thumbnailUrl || imgError;

  return (
    <Link
      href={href}
      className={s.videoCard}
      onClick={(e) => {
        if (!videoId || videoId.startsWith("video-")) {
          e.preventDefault();
          console.error("Cannot navigate: video missing ID");
        }
      }}
    >
      <div className={s.videoThumbWrap}>
        {showPlaceholder ? (
          <div className={s.videoThumbPlaceholder}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        ) : (
          <Image
            src={video.thumbnailUrl!}
            alt={`${video.title ?? "Video"} thumbnail`}
            fill
            className={s.videoThumb}
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setImgError(true)}
          />
        )}
        {/* Duration badge */}
        {durationBadge && (
          <span className={s.durationBadge}>{durationBadge}</span>
        )}
      </div>
      <div className={s.videoCardContent}>
        <h3 className={s.videoCardTitle}>{video.title ?? "Untitled"}</h3>
        <div className={s.videoCardMeta}>
          {video.publishedAt && <span>{formatDate(video.publishedAt)}</span>}
          <span>{formatCompactMaybe(video.views)} views</span>
          {/* Context metric based on sort */}
          {contextMetric && (
            <span className={s.contextMetric}>{contextMetric}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ---------- Helpers ---------- */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCompactMaybe(num: number | null | undefined): string {
  if (num == null) return "0";
  return formatCompact(num);
}
