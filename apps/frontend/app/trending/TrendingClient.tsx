"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import s from "./style.module.css";
import type {
  Me,
  Channel,
  TrendingListResponse,
  TrendingVideo,
} from "@/types/api";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

/**
 * TrendingClient - Video-first trending page.
 * Receives bootstrap data from server, handles interactions client-side.
 */
export default function TrendingClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
}: Props) {
  // State initialized from server props
  const [channels] = useState<Channel[]>(initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    initialActiveChannelId
  );

  // Trending data state
  const [trendingData, setTrendingData] = useState<TrendingListResponse | null>(
    null
  );
  const [dataLoading, setDataLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [range, setRange] = useState<"7d" | "14d" | "28d">("7d");

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

  // Load trending videos when channel or range changes
  useEffect(() => {
    if (!activeChannelId) return;

    setDataLoading(true);
    fetch(`/api/me/channels/${activeChannelId}/trending?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.videos) {
          setTrendingData(data as TrendingListResponse);
        } else {
          setTrendingData(null);
        }
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [activeChannelId, range]);

  // Load more videos
  const handleLoadMore = useCallback(async () => {
    if (!activeChannelId || !trendingData?.nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/me/channels/${activeChannelId}/trending?range=${range}&cursor=${trendingData.nextCursor}`
      );
      const data = await res.json();
      if (data.videos) {
        setTrendingData((prev) => ({
          ...data,
          videos: [...(prev?.videos || []), ...data.videos],
        }));
      }
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [activeChannelId, trendingData?.nextCursor, range, loadingMore]);

  const handleRangeChange = useCallback((newRange: "7d" | "14d" | "28d") => {
    setRange(newRange);
  }, []);

  // No channels state
  if (!activeChannel) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <h1 className={s.title}>Trending in Your Niche</h1>
          <p className={s.subtitle}>
            Discover what&apos;s taking off in your niche right now
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
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Connect a Channel First</h2>
          <p className={s.emptyDesc}>
            Connect your YouTube channel to see what&apos;s trending in your
            niche.
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
          <h1 className={s.title}>Trending in Your Niche</h1>
          <p className={s.subtitle}>
            What&apos;s taking off for channels similar to{" "}
            <strong>{activeChannel.title}</strong>
          </p>
        </div>
        <div className={s.controls}>
          <select
            className={s.rangeSelect}
            value={range}
            onChange={(e) =>
              handleRangeChange(e.target.value as "7d" | "14d" | "28d")
            }
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="28d">Last 28 days</option>
          </select>
        </div>
      </div>

      {!isSubscribed && (
        <div className={s.upgradeBanner}>
          <p>
            Upgrade to Pro to unlock trending analysis and deep insights.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.upgradeBtn}>
            Upgrade
          </a>
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
      ) : trendingData && trendingData.videos.length > 0 ? (
        <>
          <div className={s.videoGrid}>
            {trendingData.videos.map((video) => (
              <TrendingVideoCard key={video.videoId} video={video} />
            ))}
          </div>

          {/* Load More */}
          {trendingData.nextCursor && (
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
          {trendingData.generatedAt && (
            <p className={s.lastUpdated}>
              Last updated: {formatRelativeTime(trendingData.generatedAt)}
              {trendingData.demo && " (Demo data)"}
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
          <p>No trending videos found. Try expanding your date range.</p>
        </div>
      )}
    </main>
  );
}

/* ---------- Trending Video Card ---------- */
function TrendingVideoCard({ video }: { video: TrendingVideo }) {
  return (
    <Link
      href={`/trending/${video.videoId}?channelId=${video.channelId}`}
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
        <span className={s.vpdBadge}>{formatCompact(video.viewsPerDay)}/day</span>
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
          <span>{formatCompact(video.viewCount)} views</span>
          <span>{formatDate(video.publishedAt)}</span>
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
