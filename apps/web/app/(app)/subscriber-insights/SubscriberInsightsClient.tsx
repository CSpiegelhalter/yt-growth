"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { VideoCardSkeletons } from "@/components/skeletons/VideoCardSkeletons";
import { SearchIcon } from "@/components/icons";
import s from "./style.module.css";
import { formatDurationBadge } from "@/lib/competitor-utils";
import type {
  Me,
  Channel,
  SubscriberAuditResponse,
  SubscriberMagnetVideo,
} from "@/types/api";
import { SUBSCRIPTION, formatUsd } from "@/lib/shared/product";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

const INITIAL_DISPLAY = 12;
const LOAD_MORE_COUNT = 12;

// Compute rollup stats from an array of videos
function computeRollups(videos: SubscriberMagnetVideo[]) {
  if (videos.length === 0) {
    return {
      countVideos: 0,
      avgSubsGained: 0,
      avgEngagedRate: 0,
      strongCount: 0,
      averageCount: 0,
      weakCount: 0,
      totalSubsGained: 0,
      totalViews: 0,
    };
  }

  return {
    countVideos: videos.length,
    avgSubsGained:
      videos.reduce((sum, v) => sum + v.subscribersGained, 0) / videos.length,
    avgEngagedRate:
      videos.reduce((sum, v) => sum + (v.engagedRate ?? 0), 0) / videos.length,
    strongCount: videos.filter((v) => v.conversionTier === "strong").length,
    averageCount: videos.filter((v) => v.conversionTier === "average").length,
    weakCount: videos.filter((v) => v.conversionTier === "weak").length,
    totalSubsGained: videos.reduce((sum, v) => sum + v.subscribersGained, 0),
    totalViews: videos.reduce((sum, v) => sum + v.views, 0),
  };
}

export default function SubscriberInsightsClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  const [channels] = useState<Channel[]>(initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    initialActiveChannelId
  );
  const [auditData, setAuditData] = useState<SubscriberAuditResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);

  const activeChannel = useMemo(
    () => channels.find((c) => c.channel_id === activeChannelId) ?? null,
    [channels, activeChannelId]
  );

  const isSubscribed = useMemo(
    () => initialMe.subscription?.isActive ?? false,
    [initialMe]
  );

  // Keep client state in sync when server props / URL params change.
  useEffect(() => {
    const next = urlChannelId ?? initialActiveChannelId ?? null;
    setActiveChannelId(next);
  }, [urlChannelId, initialActiveChannelId]);

  // Load subscriber insights data (all-time, no date filter)
  useEffect(() => {
    if (!activeChannelId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/me/channels/${activeChannelId}/subscriber-audit`)
      .then((r) => r.json())
      .then((data) => {
        if (data.videos) {
          setAuditData(data as SubscriberAuditResponse);
        } else {
          setAuditData(null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeChannelId]);

  // Filter and sort videos (always by subscribers gained)
  const filteredVideos = useMemo(() => {
    if (!auditData?.videos) return [];
    let videos = [...auditData.videos];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      videos = videos.filter((v) => v.title.toLowerCase().includes(q));
    }

    // Sort by subscribers gained (descending)
    videos.sort((a, b) => b.subscribersGained - a.subscribersGained);

    return videos;
  }, [auditData?.videos, searchQuery]);

  // Compute view-specific rollups (from filtered list)
  const viewRollups = useMemo(
    () => computeRollups(filteredVideos),
    [filteredVideos]
  );

  const displayedVideos = filteredVideos.slice(0, displayCount);
  const hasMore = displayCount < filteredVideos.length;

  const loadMore = () => {
    setDisplayCount((prev) =>
      Math.min(prev + LOAD_MORE_COUNT, filteredVideos.length)
    );
  };

  // No channels state
  if (!activeChannel) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <h1 className={s.title}>Subscriber Drivers</h1>
          <p className={s.subtitle}>
            See which videos turn viewers into subscribers — and what to
            replicate.
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
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Connect a Channel First</h2>
          <p className={s.emptyDesc}>
            Connect your YouTube channel to discover which videos convert
            viewers into subscribers.
          </p>
          <Link href="/dashboard" className={s.emptyBtn}>
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const insufficientData = !auditData?.videos || auditData.videos.length < 8;

  return (
    <main className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>Subscriber Drivers</h1>
        <p className={s.subtitle}>
          See which videos turn viewers into subscribers and what to replicate.
        </p>
        <p className={s.attributionNote}>
          <svg
            className={s.infoIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <circle cx="12" cy="8" r="0.5" fill="currentColor" />
          </svg>
          <span>
            These numbers only count subscribers YouTube can directly attribute
            to a specific video. Many subscribers come from your channel page or
            other sources. Use these to compare which videos convert best.
          </span>
        </p>
      </div>

      {/* Upgrade Banner */}
      {!isSubscribed && (
        <div className={s.upgradeBanner}>
          <p>
            Upgrade to Pro to unlock full subscriber conversion insights —{" "}
            {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
            {SUBSCRIPTION.PRO_INTERVAL}.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.upgradeBtn}>
            Upgrade — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
            {SUBSCRIPTION.PRO_INTERVAL}
          </a>
        </div>
      )}

      {/* Toolbar - Search */}
      <div className={s.toolbar}>
        <div className={s.toolbarRow}>
          <div className={s.searchWrap}>
            <SearchIcon size={16} className={s.searchIcon} />
            <input
              type="text"
              className={s.searchInput}
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* View Summary (rollups from current view) */}
      {!loading && filteredVideos.length > 0 && (
        <div className={s.summarySection}>
          <div className={s.summaryHeader}>
            <h2 className={s.summaryTitle}>All-time summary</h2>
            <span className={s.summaryCount}>
              {viewRollups.countVideos} videos
            </span>
          </div>
          <div className={s.summaryGrid}>
            <div className={s.summaryCard}>
              <span className={s.summaryValue}>
                {formatNumber(viewRollups.totalSubsGained)}
              </span>
              <span className={s.summaryLabel}>Attributed Subs</span>
            </div>
            <div className={s.summaryCard}>
              <span className={s.summaryValue}>
                {formatNumber(viewRollups.totalViews)}
              </span>
              <span className={s.summaryLabel}>Total Views</span>
            </div>
            <div className={s.summaryCard}>
              <span className={s.summaryValue}>
                {viewRollups.avgSubsGained.toFixed(1)}
              </span>
              <span className={s.summaryLabel}>Avg Subs/Video</span>
            </div>
            <div className={`${s.summaryCard} ${s.tiersCard}`}>
              {insufficientData ? (
                <div className={s.buildingBaseline}>
                  <span className={s.buildingText}>Building baseline</span>
                  <span className={s.buildingSubtext}>Need 8+ videos</span>
                </div>
              ) : (
                <div className={s.tiersDisplay}>
                  <div className={s.tierBar}>
                    <div
                      className={s.tierBarStrong}
                      style={{ flex: viewRollups.strongCount || 0.1 }}
                    />
                    <div
                      className={s.tierBarAverage}
                      style={{ flex: viewRollups.averageCount || 0.1 }}
                    />
                    <div
                      className={s.tierBarWeak}
                      style={{ flex: viewRollups.weakCount || 0.1 }}
                    />
                  </div>
                  <div className={s.tierLegend}>
                    <span className={s.tierLegendItem}>
                      <span className={`${s.tierDot} ${s.dotStrong}`} />
                      {viewRollups.strongCount} strong
                    </span>
                    <span className={s.tierLegendItem}>
                      <span className={`${s.tierDot} ${s.dotAverage}`} />
                      {viewRollups.averageCount} avg
                    </span>
                    <span className={s.tierLegendItem}>
                      <span className={`${s.tierDot} ${s.dotWeak}`} />
                      {viewRollups.weakCount} weak
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={s.videoGrid}>
          <VideoCardSkeletons s={s} />
        </div>
      )}

      {/* Video Grid */}
      {!loading && displayedVideos.length > 0 && (
        <>
          <div className={s.videoGrid}>
            {displayedVideos.map((video, idx) => (
              <VideoCard
                key={video.videoId}
                video={video}
                rank={idx + 1}
                insufficientData={insufficientData}
                channelId={activeChannelId}
              />
            ))}
          </div>

          {hasMore && (
            <button className={s.loadMoreBtn} onClick={loadMore} type="button">
              Show{" "}
              {Math.min(LOAD_MORE_COUNT, filteredVideos.length - displayCount)}{" "}
              more
            </button>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && displayedVideos.length === 0 && (
        <div className={s.emptyVideos}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>
            {searchQuery
              ? "No videos match your search."
              : "No subscriber data available yet. Videos need time to gather analytics."}
          </p>
        </div>
      )}
    </main>
  );
}

/* ---------- Video Card ---------- */
function VideoCard({
  video,
  rank,
  insufficientData,
  channelId,
}: {
  video: SubscriberMagnetVideo;
  rank: number;
  insufficientData: boolean;
  channelId: string | null;
}) {
  const tierLabel = insufficientData
    ? "Building"
    : video.conversionTier === "strong"
    ? "Strong"
    : video.conversionTier === "weak"
    ? "Weak"
    : "Average";
  const tierClass = insufficientData
    ? s.tierBuilding
    : video.conversionTier === "strong"
    ? s.tierStrong
    : video.conversionTier === "weak"
    ? s.tierWeak
    : s.tierAverage;

  const videoParams = new URLSearchParams();
  videoParams.set("from", "subscriber-insights");
  if (channelId) {
    videoParams.set("channelId", channelId);
  }
  const videoUrl = `/video/${video.videoId}?${videoParams.toString()}`;

  return (
    <div className={s.videoCard}>
      <Link href={videoUrl} className={s.thumbnailWrap}>
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={`${video.title} thumbnail`}
            fill
            className={s.thumbnail}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={s.thumbnailPlaceholder}>
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
        <span className={s.rankBadge}>#{rank}</span>
        {video.durationSec && (
          <span className={s.durationBadge}>
            {formatDurationBadge(video.durationSec)}
          </span>
        )}
      </Link>

      <div className={s.cardContent}>
        <div className={s.cardMain}>
          <Link href={videoUrl} className={s.videoTitle}>
            {video.title}
          </Link>

          <div className={s.metaRow}>
            <span>{formatDate(video.publishedAt)}</span>
            <span>{formatNumber(video.views)} views</span>
          </div>

          {/* Hero Metric + Tier */}
          <div className={s.heroRow}>
            <div className={s.heroMetric}>
              <span className={s.heroValue}>
                +{formatNumber(video.subscribersGained)}
              </span>
              <span className={s.heroLabel}>subs</span>
            </div>
            <span className={`${s.tierBadge} ${tierClass}`}>{tierLabel}</span>
          </div>

          {/* Compact Metrics */}
          <div className={s.metricsRow}>
            <span className={s.metricPill}>
              {formatNumber(video.views)} views
            </span>
            {video.engagedRate !== null && video.engagedRate !== undefined && (
              <span className={s.metricPill}>
                {(video.engagedRate * 100).toFixed(1)}% engaged
              </span>
            )}
          </div>
        </div>

        {/* View Insights Link - Always at bottom */}
        <Link href={videoUrl} className={s.insightsLink}>
          View Insights
        </Link>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}


function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
