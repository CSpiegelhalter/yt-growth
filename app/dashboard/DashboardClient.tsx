"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import s from "./style.module.css";
import { LIMITS, SUBSCRIPTION, formatUsd } from "@/lib/product";
import { Me, Channel } from "@/types/api";
import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import ChannelGoals from "@/components/dashboard/ChannelGoals";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import { formatCompact } from "@/lib/format";

type Video = {
  id: number;
  videoId?: string;
  youtubeVideoId?: string;
  title: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  viewCount?: number | null;
  views?: number | null;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  // State initialized from server props
  const [me, setMe] = useState<Me>(initialMe);
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    initialActiveChannelId
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

  // Video loading state
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);

  // UI state
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const activeChannel = useMemo(
    () => channels.find((c) => c.channel_id === activeChannelId) ?? null,
    [channels, activeChannelId]
  );

  const canAddAnother = useMemo(() => {
    // Channel limit already accounts for plan (FREE=1, PRO=3)
    // No need to check isActive - FREE users can still add up to their limit
    return channels.length < (me.channel_limit ?? 1);
  }, [me, channels]);

  const isSubscribed = useMemo(() => {
    return me.subscription?.isActive ?? false;
  }, [me]);

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
      handleChannelRemoved as EventListener
    );
    return () => {
      window.removeEventListener(
        "channel-removed",
        handleChannelRemoved as EventListener
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
                (c: Channel) => c.channel_id === activeChannelId
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

  // Load videos when active channel changes (FREE endpoint - no subscription required)
  useEffect(() => {
    if (!activeChannelId) {
      setVideos([]);
      return;
    }

    async function loadVideos() {
      setVideosLoading(true);
      try {
        const res = await fetch(
          `/api/me/channels/${activeChannelId}/videos`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setVideos(data.videos || []);
        }
      } catch (error) {
        console.error("Failed to load videos:", error);
      } finally {
        setVideosLoading(false);
      }
    }

    loadVideos();
  }, [activeChannelId]);

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
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Your Videos</h1>
          <p className={s.subtitle}>
            {activeChannel ? (
              <>
                Showing videos from <strong>{activeChannel.title}</strong>
              </>
            ) : (
              "Connect a channel to see your videos"
            )}
          </p>
        </div>
      </div>

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

        {/* Channel Goals/Milestones */}
        {activeChannel && videos.length > 0 && (
          <ChannelGoals
            videos={videos}
            channelTitle={activeChannel.title ?? undefined}
          />
        )}

        {/* Video Grid */}
        {activeChannel && (
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
              <div className={s.videoList}>
                {videos.map((video) => (
                  <VideoCard
                    key={getVideoId(video)}
                    video={video}
                    channelId={activeChannelId}
                  />
                ))}
              </div>
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
                  <li>Up to {LIMITS.PRO_MAX_CONNECTED_CHANNELS} connected channels</li>
                </ul>
              </div>
              <div className={s.ctaAction}>
                <div className={s.ctaPrice}>
                  <span className={s.ctaPriceAmount}>
                    {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}
                  </span>
                  <span className={s.ctaPricePeriod}>/{SUBSCRIPTION.PRO_INTERVAL}</span>
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

/* ---------- Helper to get video ID ---------- */
function getVideoId(video: Video): string {
  return video.videoId || video.youtubeVideoId || `video-${video.id}`;
}

/* ---------- Video Card Component ---------- */
function VideoCard({ video, channelId }: { video: Video; channelId: string | null }) {
  const videoId = getVideoId(video);
  const hasDropOff = video.retention?.hasData && video.retention.cliffTimestamp;
  const viewCount = video.views ?? video.viewCount;

  if (!videoId || videoId.startsWith("video-")) {
    console.error("Video missing videoId:", video);
  }

  const href =
    videoId && !videoId.startsWith("video-")
      ? channelId
        ? `/video/${videoId}?channelId=${encodeURIComponent(channelId)}`
        : `/video/${videoId}`
      : "#";

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
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={`${video.title ?? "Video"} thumbnail`}
            fill
            className={s.videoThumb}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
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
        )}
        {hasDropOff && (
          <span className={s.dropOffBadge}>
            Drop @ {video.retention!.cliffTimestamp}
          </span>
        )}
      </div>
      <div className={s.videoCardContent}>
        <h3 className={s.videoCardTitle}>{video.title ?? "Untitled"}</h3>
        <div className={s.videoCardMeta}>
          {video.publishedAt && <span>{formatDate(video.publishedAt)}</span>}
          {viewCount != null && (
            <span>{formatCompactMaybe(viewCount)} views</span>
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
