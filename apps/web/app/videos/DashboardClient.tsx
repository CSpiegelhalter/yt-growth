"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import { apiFetchJson } from "@/lib/client/api";
import {
  getJSONWithExpiry,
  safeSessionGetItem,
  safeSessionRemoveItem,
  setJSONWithExpiry,
  STORAGE_KEYS,
} from "@/lib/client/safeLocalStorage";
import type { InsightVideoInput, VideoPublishMarker } from "@/lib/features/channel-audit";
import { toLocalDateStr } from "@/lib/shared/date-range";
import { formatUsd, LIMITS, SUBSCRIPTION } from "@/lib/shared/product";
import { useSyncActiveChannel } from "@/lib/use-sync-active-channel";
import {
  type DashboardVideo,
  enhanceVideosWithMetrics,
  sortVideos,
  type VideoWithMetrics,
} from "@/lib/video-tools";
import type { Channel, Me } from "@/types/api";

import { OverviewPanel } from "./components/OverviewPanel";
import { VideoDetailPanel } from "./components/VideoDetailPanel";
import { VideoList } from "./components/VideoList";
import s from "./style.module.css";

// ── Types ────────────────────────────────────────────────────

type Video = DashboardVideo & {
  id?: number;
  youtubeVideoId?: string;
  viewCount?: number | null;
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

// ── Small hooks ──────────────────────────────────────────────

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
      window.history.replaceState({}, "", "/videos");
    } else if (status === "canceled") {
      setErr("Checkout was canceled. You can try again anytime.");
      window.history.replaceState({}, "", "/videos");
    }
  }, [status, setSuccess, setErr]);
}

function useChannelRemovedListener(
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
) {
  useEffect(() => {
    const handler = (e: CustomEvent<{ channelId: string }>) => {
      setChannels((prev) =>
        prev.filter((c) => c.channel_id !== e.detail.channelId),
      );
    };
    window.addEventListener("channel-removed", handler as EventListener);
    return () => {
      window.removeEventListener("channel-removed", handler as EventListener);
    };
  }, [setChannels]);
}

function useVisibilityRefresh(
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
) {
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
    const handler = () => {
      void handleVisibilityChange();
    };
    document.addEventListener("visibilitychange", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
    };
  }, [setChannels]);
}

function useOAuthReturnRedirect(
  searchParams: ReturnType<typeof useSearchParams>,
) {
  useEffect(() => {
    if (searchParams.get("reconnected") !== "1") {return;}
    const returnTo = safeSessionGetItem("oauthReturnTo");
    if (returnTo) {
      safeSessionRemoveItem("oauthReturnTo");
      window.location.href = returnTo;
    }
  }, [searchParams]);
}

// ── Video data helpers ───────────────────────────────────────

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
const DASHBOARD_VIDEOS_CACHE_VERSION = "v3";
const LOOKBACK_DAYS = 30;

function buildPublishedAfter(): string {
  const d = new Date();
  d.setDate(d.getDate() - LOOKBACK_DAYS);
  return d.toISOString();
}

function useVideoLoader() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);

  const loadVideos = useCallback(async (channelId: string) => {
    setVideosLoading(true);
    try {
      const publishedAfter = buildPublishedAfter();
      const cacheKey = `${STORAGE_KEYS.DASHBOARD_VIDEOS}:${DASHBOARD_VIDEOS_CACHE_VERSION}:${channelId}:30d`;
      const cached = getJSONWithExpiry<VideosApiResponse>(cacheKey);
      if (cached?.videos) {
        setVideos(cached.videos);
        return;
      }
      const data = await apiFetchJson<VideosApiResponse>(
        `/api/me/channels/${channelId}/videos?publishedAfter=${encodeURIComponent(publishedAfter)}`,
        { cache: "no-store" },
      );
      setVideos(data.videos || []);
      setJSONWithExpiry(cacheKey, data, DASHBOARD_VIDEOS_TTL_MS);
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setVideosLoading(false);
    }
  }, []);

  return { videos, videosLoading, loadVideos };
}

function useChannelActions({
  setMe,
  setChannels,
  setErr,
  setSuccess,
  setBusy,
  activeChannelId,
  channels,
  setActiveChannelId,
  loadVideos,
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

  const unlink = useCallback(
    async (channelId: string) => {
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
        setChannels((prev) =>
          prev.filter((c) => c.channel_id !== channelId),
        );
        if (activeChannelId === channelId) {
          const remaining = channels.find(
            (c) => c.channel_id !== channelId,
          );
          setActiveChannelId(remaining?.channel_id ?? null);
        }
      } catch (error: unknown) {
        setErr(
          error instanceof Error
            ? error.message
            : "Failed to remove channel",
        );
      } finally {
        setBusy(null);
      }
    },
    [
      activeChannelId,
      channels,
      setActiveChannelId,
      setBusy,
      setChannels,
      setErr,
      setSuccess,
    ],
  );

  const refreshChannel = useCallback(
    async (channelId: string) => {
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
        if (activeChannelId === channelId) {await loadVideos(channelId);}
      } catch (error: unknown) {
        setErr(
          error instanceof Error
            ? error.message
            : "Failed to refresh channel",
        );
      } finally {
        setBusy(null);
      }
    },
    [refreshData, activeChannelId, loadVideos, setBusy, setErr, setSuccess],
  );

  return { unlink, refreshChannel };
}

// ── Main Component ───────────────────────────────────────────

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

  useEffect(() => {
    setMe(initialMe);
  }, [initialMe]);
  useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);
  useOAuthReturnRedirect(searchParams);

  const { videos, videosLoading, loadVideos } = useVideoLoader();

  // null = overview selected, string = specific video id
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  // Mobile: when a video/overview is selected, show the detail panel
  const [showDetail, setShowDetail] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const activeChannel = useMemo(
    () => channels.find((c) => c.channel_id === activeChannelId) ?? null,
    [channels, activeChannelId],
  );

  const canAddAnother = useMemo(
    () => channels.length < (me.channel_limit ?? 1),
    [me, channels],
  );

  const isSubscribed = useMemo(
    () => me.subscription?.isActive ?? false,
    [me],
  );

  const dashboardVideos = useMemo(
    (): DashboardVideo[] => videos.map(toDashboardVideo),
    [videos],
  );

  const videosWithMetrics = useMemo(
    (): VideoWithMetrics[] =>
      sortVideos(enhanceVideosWithMetrics(dashboardVideos), "newest"),
    [dashboardVideos],
  );

  const insightVideos = useMemo(
    (): InsightVideoInput[] =>
      videosWithMetrics.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        durationSec: v.durationSec,
        publishedAt: v.publishedAt,
        avgViewPercentage: v.avgViewPercentage ?? null,
        subscribersGained: v.subscribersGained ?? null,
        shares: v.shares ?? null,
      })),
    [videosWithMetrics],
  );

  const videoMarkers = useMemo(
    (): VideoPublishMarker[] =>
      videosWithMetrics
        .filter((v): v is VideoWithMetrics & { publishedAt: string } => !!v.publishedAt)
        .map((v) => ({
          videoId: v.videoId,
          title: v.title ?? "Untitled",
          thumbnailUrl: v.thumbnailUrl ?? null,
          publishedAt: v.publishedAt,
          chartDate: toLocalDateStr(new Date(v.publishedAt)),
        })),
    [videosWithMetrics],
  );

  useCheckoutStatus(checkoutStatus, setSuccess, setErr);
  useChannelRemovedListener(setChannels);
  useVisibilityRefresh(setChannels);

  useEffect(() => {
    if (activeChannelId) {void loadVideos(activeChannelId);}
  }, [activeChannelId, loadVideos]);

  const { unlink, refreshChannel } = useChannelActions({
    setMe,
    setChannels,
    setErr,
    setSuccess,
    setBusy,
    activeChannelId,
    channels,
    setActiveChannelId,
    loadVideos,
  });

  const selectedVideo = useMemo(
    () =>
      selectedVideoId
        ? videosWithMetrics.find((v) => v.videoId === selectedVideoId) ?? null
        : null,
    [selectedVideoId, videosWithMetrics],
  );

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedVideoId(id);
      setShowDetail(true);
    },
    [],
  );

  const handleBack = useCallback(() => {
    setShowDetail(false);
  }, []);

  return (
    <main className={s.page}>
      {/* Alerts */}
      {success && (
        <button
          type="button"
          className={s.successAlert}
          onClick={() => setSuccess(null)}
        >
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
        </button>
      )}
      {err && <ErrorAlert message={err} />}

      <div className={s.content}>
        {/* No Channels State */}
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

        {/* Split-panel layout */}
        {activeChannel && activeChannelId && (
          <div className={s.splitPanel}>
            {/* Left: Video list */}
            <div
              className={`${s.leftPanel} ${showDetail ? s.leftPanelHiddenMobile : ""}`}
            >
              <VideoList
                videos={videosWithMetrics}
                selectedId={selectedVideoId}
                onSelect={handleSelect}
                loading={videosLoading}
              />
            </div>

            {/* Right: Dynamic detail panel */}
            <div
              className={`${s.rightPanel} ${showDetail ? s.rightPanelVisibleMobile : ""}`}
            >
              {/* Mobile back button */}
              <button
                type="button"
                className={s.backBtn}
                onClick={handleBack}
                aria-label="Back to video list"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {selectedVideoId === null ? (
                <OverviewPanel
                  channelId={activeChannelId}
                  videos={insightVideos}
                  videoMarkers={videoMarkers}
                />
              ) : (
                <VideoDetailPanel
                  video={selectedVideo}
                  channelId={activeChannelId}
                />
              )}
            </div>
          </div>
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
                    Up to {LIMITS.PRO_MAX_CONNECTED_CHANNELS} connected
                    channels
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
