"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import s from "./style.module.css";
import { Me, Channel } from "@/types/api";
import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";

type Video = {
  id: number;
  videoId?: string; // from retention API
  youtubeVideoId?: string; // direct from DB
  title: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  viewCount?: number | null;
  views?: number | null; // from retention API
  retention?: {
    hasData: boolean;
    cliffTimestamp?: string;
    cliffReason?: string;
  };
};

/**
 * DashboardClient - Video-centric dashboard
 * Shows a grid of videos from the active channel
 */
export default function DashboardClient() {
  const searchParams = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const canAddAnother = useMemo(() => {
    if (!me) return false;
    return (
      channels.length < (me.channel_limit ?? 1) &&
      me.subscription?.isActive !== false
    );
  }, [me, channels]);

  const isSubscribed = useMemo(() => {
    return me?.subscription?.isActive ?? false;
  }, [me]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/me/channels", { cache: "no-store" }),
      ]);
      if (!mRes.ok) throw new Error("Failed to load /api/me");
      if (!cRes.ok) throw new Error("Failed to load /api/me/channels");
      const [m, c] = await Promise.all([mRes.json(), cRes.json()]);
      setMe(m);
      setChannels(c);
      
      // Set active channel from URL, localStorage, or first channel
      const urlChannelId = searchParams.get("channelId");
      const storedChannelId = typeof window !== "undefined" 
        ? localStorage.getItem("activeChannelId") 
        : null;

      if (urlChannelId && c.some((ch: Channel) => ch.channel_id === urlChannelId)) {
        setActiveChannel(c.find((ch: Channel) => ch.channel_id === urlChannelId) || null);
      } else if (storedChannelId && c.some((ch: Channel) => ch.channel_id === storedChannelId)) {
        setActiveChannel(c.find((ch: Channel) => ch.channel_id === storedChannelId) || null);
      } else if (c.length > 0) {
        setActiveChannel(c[0]);
        if (typeof window !== "undefined") {
          localStorage.setItem("activeChannelId", c[0].channel_id);
        }
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    load();

    // Check for checkout success
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setSuccess("Subscription activated! You now have full access.");
      window.history.replaceState({}, "", "/dashboard");
    } else if (checkout === "canceled") {
      setErr("Checkout was canceled. You can try again anytime.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [load, searchParams]);

  // Load videos when active channel changes
  useEffect(() => {
    if (!activeChannel) {
      setVideos([]);
      return;
    }

    async function loadVideos() {
      setVideosLoading(true);
      try {
        const res = await fetch(
          `/api/me/channels/${activeChannel!.channel_id}/retention`,
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
  }, [activeChannel]);

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
      if (activeChannel?.channel_id === channelId) {
        setActiveChannel(null);
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
      await load();
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
              <>Showing videos from <strong>{activeChannel.title}</strong></>
            ) : (
              "Connect a channel to see your videos"
            )}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className={s.successAlert} onClick={() => setSuccess(null)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          {success}
        </div>
      )}
      {err && <ErrorAlert message={err} />}

      {/* Main Content */}
      <div className={s.content}>
        {/* No Channels State */}
        {!loading && channels.length === 0 && (
          <section className={s.channelsSection}>
            <ChannelsSection
              channels={channels}
              loading={loading}
              canAddAnother={canAddAnother}
              onConnect={connectChannel}
              onUnlink={unlink}
              onRefresh={refreshChannel}
              busyId={busy}
            />
          </section>
        )}

        {/* Video Grid */}
        {activeChannel && (
          <section className={s.videosSection}>
            {videosLoading ? (
              <div className={s.videoList}>
                {[1, 2, 3, 4].map((i) => (
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
                  <VideoCard key={getVideoId(video)} video={video} />
                ))}
              </div>
            ) : (
              <div className={s.emptyVideos}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p>No videos found. Try refreshing your channel data.</p>
                <button
                  className={s.refreshBtn}
                  onClick={() => refreshChannel(activeChannel.channel_id)}
                  disabled={busy === activeChannel.channel_id}
                >
                  {busy === activeChannel.channel_id ? "Refreshing..." : "Refresh Channel"}
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
                  Get AI-powered ideas, drop-off analysis, and subscriber driver insights.
                </p>
                <ul className={s.ctaFeatures}>
                  <li>Unlimited idea generation</li>
                  <li>Drop-off analysis with fixes</li>
                  <li>Up to 5 connected channels</li>
                </ul>
              </div>
              <div className={s.ctaAction}>
                <div className={s.ctaPrice}>
                  <span className={s.ctaPriceAmount}>$19</span>
                  <span className={s.ctaPricePeriod}>/month</span>
                </div>
                <a href="/api/integrations/stripe/checkout" className={s.ctaBtn}>
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
  // API returns "videoId", DB returns "youtubeVideoId"
  return video.videoId || video.youtubeVideoId || `video-${video.id}`;
}

/* ---------- Video Card Component ---------- */
function VideoCard({ video }: { video: Video }) {
  const videoId = getVideoId(video);
  const hasDropOff = video.retention?.hasData && video.retention.cliffTimestamp;
  const viewCount = video.views ?? video.viewCount;
  
  // Guard against missing video ID
  if (!videoId || videoId.startsWith("video-")) {
    console.error("Video missing videoId:", video);
  }
  
  return (
    <Link 
      href={videoId && !videoId.startsWith("video-") ? `/video/${videoId}` : "#"} 
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
          <img
            src={video.thumbnailUrl}
            alt=""
            className={s.videoThumb}
            loading="lazy"
          />
        ) : (
          <div className={s.videoThumbPlaceholder}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
          {video.publishedAt && (
            <span>{formatDate(video.publishedAt)}</span>
          )}
          {viewCount != null && (
            <span>{formatCompact(viewCount)} views</span>
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

function formatCompact(num: number | null | undefined): string {
  if (num == null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
