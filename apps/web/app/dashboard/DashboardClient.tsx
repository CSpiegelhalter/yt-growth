"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback,useEffect, useMemo, useState } from "react";

import { ChannelInsightsPanel } from "@/components/dashboard/ChannelInsightsPanel";
import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import VideoToolbar from "@/components/dashboard/VideoToolbar";
import { VideoCardSkeletons } from "@/components/skeletons/VideoCardSkeletons";
import { Tabs } from "@/components/ui";
import { apiFetchJson } from "@/lib/client/api";
import {
  getJSONWithExpiry,
  safeSessionGetItem,
  safeSessionRemoveItem,
  setJSONWithExpiry,
  STORAGE_KEYS,
} from "@/lib/client/safeLocalStorage";
import { formatCompact } from "@/lib/shared/format";
import { formatUsd,LIMITS, SUBSCRIPTION } from "@/lib/shared/product";
import { useSyncActiveChannel } from "@/lib/use-sync-active-channel";
import {
  applyFilters,
  type DashboardVideo,
  DEFAULT_FILTERS,
  enhanceVideosWithMetrics,
  formatContextMetric,
  loadVideoToolsState,
  saveVideoToolsState,
  shortFormBadge,
  type SortKey,
  sortVideos,
  type VideoFilters,
  type VideoWithMetrics,
} from "@/lib/video-tools";
import type { Channel,Me } from "@/types/api";

import s from "./style.module.css";

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

type VideosApiResponse = {
  channelId: string;
  videos: Video[];
  pagination?: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
};

function connectChannel() {
  window.location.href = "/api/integrations/google/start";
}

function useCheckoutStatus(
  status: string | undefined,
  setSuccess: (msg: string | null) => void,
  setErr: (msg: string | null) => void,
) {
  useEffect(() => {
    if (status === "success") {
      setSuccess("Subscription activated! You now have full access.");
      window.history.replaceState({}, "", "/dashboard");
    } else if (status === "canceled") {
      setErr("Checkout was canceled. You can try again anytime.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [status, setSuccess, setErr]);
}

function useChannelRemovedListener(setChannels: React.Dispatch<React.SetStateAction<Channel[]>>) {
  useEffect(() => {
    const handler = (e: CustomEvent<{ channelId: string }>) => {
      setChannels((prev) => prev.filter((c) => c.channel_id !== e.detail.channelId));
    };
    window.addEventListener("channel-removed", handler as EventListener);
    return () => { window.removeEventListener("channel-removed", handler as EventListener); };
  }, [setChannels]);
}

function useVisibilityRefresh(setChannels: React.Dispatch<React.SetStateAction<Channel[]>>) {
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") {return;}
      try {
        const res = await fetch("/api/me/channels", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setChannels(Array.isArray(data) ? data : data.channels);
        }
      } catch (error) {
        console.error("Failed to refresh channels:", error);
      }
    };
    const handler = () => { void handleVisibilityChange(); };
    document.addEventListener("visibilitychange", handler);
    return () => { document.removeEventListener("visibilitychange", handler); };
  }, [setChannels]);
}

function useOAuthReturnRedirect(searchParams: ReturnType<typeof useSearchParams>) {
  useEffect(() => {
    if (searchParams.get("reconnected") !== "1") {return;}
    const returnTo = safeSessionGetItem("oauthReturnTo");
    if (returnTo) {
      safeSessionRemoveItem("oauthReturnTo");
      window.location.href = returnTo;
    }
  }, [searchParams]);
}

function useVideoToolsPersistence(
  activeChannelId: string | null,
  sortKey: SortKey,
  filters: VideoFilters,
  setSortKey: (k: SortKey) => void,
  setFilters: (f: VideoFilters) => void,
) {
  useEffect(() => {
    if (!activeChannelId) {return;}
    const savedState = loadVideoToolsState(activeChannelId);
    if (savedState) {
      setSortKey(savedState.sortKey);
      setFilters(savedState.filters);
    } else {
      setSortKey("newest");
      setFilters(DEFAULT_FILTERS);
    }
  }, [activeChannelId, setSortKey, setFilters]);

  useEffect(() => {
    if (!activeChannelId) {return;}
    saveVideoToolsState(activeChannelId, { sortKey, filters });
  }, [activeChannelId, sortKey, filters]);
}

function toDashboardVideo(v: Video): DashboardVideo {
  return {
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
  };
}

const DASHBOARD_VIDEOS_TTL_MS = 2 * 60 * 60 * 1000;
const DASHBOARD_VIDEOS_CACHE_VERSION = "v2";
const PAGE_SIZE = 24;

function useVideoLoader() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<{ offset: number; hasMore: boolean } | null>(null);

  const fetchPage = useCallback(
    async (channelId: string, offset: number): Promise<VideosApiResponse | null> => {
      const cacheKey = `${STORAGE_KEYS.DASHBOARD_VIDEOS}:${DASHBOARD_VIDEOS_CACHE_VERSION}:${channelId}:${PAGE_SIZE}:${offset}`;
      const cached = getJSONWithExpiry<VideosApiResponse>(cacheKey);
      if (cached?.pagination && typeof cached.pagination.offset === "number" && typeof cached.pagination.hasMore === "boolean") {
        return cached;
      }
      const data = await apiFetchJson<VideosApiResponse>(
        `/api/me/channels/${channelId}/videos?limit=${PAGE_SIZE}&offset=${offset}`,
        { cache: "no-store" },
      );
      setJSONWithExpiry(cacheKey, data, DASHBOARD_VIDEOS_TTL_MS);
      return data;
    },
    [],
  );

  const applyPageData = useCallback((data: VideosApiResponse, append: boolean) => {
    const vids = data.videos || [];
    setVideos(append ? (prev) => [...prev, ...vids] : vids);
    if (data.pagination) {
      setPagination({ offset: data.pagination.offset + vids.length, hasMore: data.pagination.hasMore });
    }
  }, []);

  const loadVideos = useCallback(async (channelId: string) => {
    setVideosLoading(true);
    setPagination(null);
    try {
      const data = await fetchPage(channelId, 0);
      if (data) { applyPageData(data, false); }
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setVideosLoading(false);
    }
  }, [fetchPage, applyPageData]);

  const loadMore = useCallback(async (channelId: string) => {
    if (!pagination?.hasMore || loadingMore) {return;}
    setLoadingMore(true);
    try {
      const data = await fetchPage(channelId, pagination.offset);
      if (data) { applyPageData(data, true); }
    } catch (error) {
      console.error("Failed to load more videos:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination, loadingMore, fetchPage, applyPageData]);

  return { videos, setVideos, videosLoading, loadingMore, pagination, loadVideos, loadMore };
}
function useChannelActions({
  setMe, setChannels, setErr, setSuccess, setBusy,
  activeChannelId, channels, setActiveChannelId, loadVideos,
}: {
  setMe: React.Dispatch<React.SetStateAction<Me>>;
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setErr: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
  setBusy: (id: string | null) => void;
  activeChannelId: string | null;
  channels: Channel[];
  setActiveChannelId: (id: string | null) => void;
  loadVideos: (id: string) => Promise<void>;
}) {
  const refreshData = useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/me/channels", { cache: "no-store" }),
      ]);
      if (mRes.ok && cRes.ok) {
        const [m, cData] = await Promise.all([mRes.json(), cRes.json()]);
        setMe(m);
        setChannels(Array.isArray(cData) ? cData : cData.channels);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, [setMe, setChannels]);

  const unlink = useCallback(async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}`, { method: "DELETE" });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove channel");
      }
      setSuccess("Channel removed successfully");
      setChannels((prev) => prev.filter((c) => c.channel_id !== channelId));
      if (activeChannelId === channelId) {
        const remaining = channels.find((c) => c.channel_id !== channelId);
        setActiveChannelId(remaining?.channel_id ?? null);
      }
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Failed to remove channel");
    } finally {
      setBusy(null);
    }
  }, [activeChannelId, channels, setActiveChannelId, setBusy, setChannels, setErr, setSuccess]);

  const refreshChannel = useCallback(async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}/sync`, { method: "POST" });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Failed to refresh channel");
      }
      setSuccess("Channel data refreshed!");
      await refreshData();
      if (activeChannelId === channelId) { await loadVideos(channelId); }
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Failed to refresh channel");
    } finally {
      setBusy(null);
    }
  }, [refreshData, activeChannelId, loadVideos, setBusy, setErr, setSuccess]);

  return { unlink, refreshChannel };
}

export default function DashboardClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
  checkoutStatus,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  const [me, setMe] = useState<Me>(initialMe);
  const [channels, setChannels] = useState<Channel[]>(initialChannels);

  const { activeChannelId, setActiveChannelId } = useSyncActiveChannel({
    channels,
    initialActiveChannelId,
    urlChannelId,
  });

  useEffect(() => { setMe(initialMe); }, [initialMe]);
  useEffect(() => { setChannels(initialChannels); }, [initialChannels]);
  useOAuthReturnRedirect(searchParams);

  const { videos, videosLoading, loadingMore, pagination, loadVideos, loadMore } = useVideoLoader();

  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [filters, setFilters] = useState<VideoFilters>(DEFAULT_FILTERS);
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

  const dashboardVideos = useMemo((): DashboardVideo[] => {
    return videos.map(toDashboardVideo);
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

  useCheckoutStatus(checkoutStatus, setSuccess, setErr);
  useChannelRemovedListener(setChannels);
  useVisibilityRefresh(setChannels);

  useEffect(() => {
    if (activeChannelId) { void loadVideos(activeChannelId); }
  }, [activeChannelId, loadVideos]);

  const loadMoreVideos = useCallback(async () => {
    if (activeChannelId) { await loadMore(activeChannelId); }
  }, [activeChannelId, loadMore]);

  useVideoToolsPersistence(activeChannelId, sortKey, filters, setSortKey, setFilters);

  const { unlink, refreshChannel } = useChannelActions({
    setMe, setChannels, setErr, setSuccess, setBusy,
    activeChannelId, channels, setActiveChannelId, loadVideos,
  });

  return (
    <main className={s.page}>
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

        {activeChannel && activeTab === "videos" && (
          <VideosTabContent
            videosLoading={videosLoading}
            videos={videos}
            dashboardVideos={dashboardVideos}
            filteredAndSortedVideos={filteredAndSortedVideos}
            sortKey={sortKey}
            filters={filters}
            onSortChange={handleSortChange}
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters}
            pagination={pagination}
            loadingMore={loadingMore}
            onLoadMore={loadMoreVideos}
            activeChannelId={activeChannelId}
            activeChannel={activeChannel}
            busy={busy}
            onRefreshChannel={refreshChannel}
          />
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

function VideosTabContent({
  videosLoading, videos, dashboardVideos, filteredAndSortedVideos,
  sortKey, filters, onSortChange, onFiltersChange, onResetFilters,
  pagination, loadingMore, onLoadMore, activeChannelId, activeChannel, busy, onRefreshChannel,
}: {
  videosLoading: boolean;
  videos: Video[];
  dashboardVideos: DashboardVideo[];
  filteredAndSortedVideos: VideoWithMetrics[];
  sortKey: SortKey;
  filters: VideoFilters;
  onSortChange: (k: SortKey) => void;
  onFiltersChange: (f: VideoFilters) => void;
  onResetFilters: () => void;
  pagination: { offset: number; hasMore: boolean } | null;
  loadingMore: boolean;
  onLoadMore: () => void;
  activeChannelId: string | null;
  activeChannel: Channel;
  busy: string | null;
  onRefreshChannel: (id: string) => void;
}) {
  if (videosLoading) {
    return (
      <section className={s.videosSection}>
        <div className={s.videoList}><VideoCardSkeletons s={s} /></div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className={s.videosSection}>
        <div className={s.emptyVideos}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p>No videos found. Try refreshing your channel data.</p>
          <button
            className={s.refreshBtn}
            onClick={() => onRefreshChannel(activeChannel.channel_id)}
            disabled={busy === activeChannel.channel_id}
          >
            {busy === activeChannel.channel_id ? "Refreshing..." : "Refresh Channel"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={s.videosSection}>
      <VideoToolbar
        videos={dashboardVideos}
        filteredVideos={filteredAndSortedVideos}
        sortKey={sortKey}
        filters={filters}
        onSortChange={onSortChange}
        onFiltersChange={onFiltersChange}
        onReset={onResetFilters}
      />
      {filteredAndSortedVideos.length > 0 ? (
        <div className={s.videoList}>
          {filteredAndSortedVideos.map((video) => (
            <VideoCard key={video.videoId} video={video} channelId={activeChannelId} sortKey={sortKey} />
          ))}
        </div>
      ) : (
        <div className={s.emptyFiltered}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p>No videos match these filters</p>
          <button className={s.resetBtn} onClick={onResetFilters}>Reset filters</button>
        </div>
      )}
      {pagination?.hasMore && (
        <div className={s.loadMoreWrap}>
          <button className={s.loadMoreBtn} onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? (<><span className={s.spinner} />Loading...</>) : "Load More Videos"}
          </button>
        </div>
      )}
    </section>
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
      ? (channelId
        ? `/video/${videoId}?channelId=${encodeURIComponent(channelId)}`
        : `/video/${videoId}`)
      : "#";

  // Get context metric based on current sort
  const contextMetric = formatContextMetric(video, sortKey);
  const durationBadge = shortFormBadge(video.durationSec);

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
  if (num == null) {return "0";}
  return formatCompact(num);
}
