"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import s from "./style.module.css";
import type {
  Me,
  Channel,
  SubscriberAuditResponse,
  SubscriberMagnetVideo,
} from "@/types/api";
import { copyToClipboard } from "@/components/ui/Toast";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";

type RangeOption = "28d" | "90d";
type SortOption = "subs_per_1k" | "views" | "newest" | "engaged_rate";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
  initialRange: RangeOption;
};

const INITIAL_DISPLAY = 12;
const LOAD_MORE_COUNT = 12;

// Compute rollup stats from an array of videos
function computeRollups(videos: SubscriberMagnetVideo[]) {
  if (videos.length === 0) {
    return {
      countVideos: 0,
      avgSubsPer1k: 0,
      medianSubsPer1k: 0,
      avgEngagedRate: 0,
      strongCount: 0,
      averageCount: 0,
      weakCount: 0,
      totalSubsGained: 0,
    };
  }

  const sorted = [...videos].sort(
    (a, b) => a.subsPerThousand - b.subsPerThousand
  );
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1].subsPerThousand + sorted[mid].subsPerThousand) / 2
      : sorted[mid].subsPerThousand;

  return {
    countVideos: videos.length,
    avgSubsPer1k:
      videos.reduce((sum, v) => sum + v.subsPerThousand, 0) / videos.length,
    medianSubsPer1k: median,
    avgEngagedRate:
      videos.reduce((sum, v) => sum + (v.engagedRate ?? 0), 0) / videos.length,
    strongCount: videos.filter((v) => v.conversionTier === "strong").length,
    averageCount: videos.filter((v) => v.conversionTier === "average").length,
    weakCount: videos.filter((v) => v.conversionTier === "weak").length,
    totalSubsGained: videos.reduce((sum, v) => sum + v.subscribersGained, 0),
  };
}

export default function SubscriberInsightsClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
  initialRange,
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
  const [range, setRange] = useState<RangeOption>(initialRange);
  const [sort, setSort] = useState<SortOption>("subs_per_1k");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Load subscriber insights data
  useEffect(() => {
    if (!activeChannelId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/me/channels/${activeChannelId}/subscriber-audit?range=${range}`)
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
  }, [activeChannelId, range]);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    if (!auditData?.videos) return [];
    let videos = [...auditData.videos];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      videos = videos.filter((v) => v.title.toLowerCase().includes(q));
    }

    // Sort
    videos.sort((a, b) => {
      switch (sort) {
        case "views":
          return b.views - a.views;
        case "newest":
          return (
            new Date(b.publishedAt ?? 0).getTime() -
            new Date(a.publishedAt ?? 0).getTime()
          );
        case "engaged_rate":
          return (b.engagedRate ?? 0) - (a.engagedRate ?? 0);
        case "subs_per_1k":
        default:
          return b.subsPerThousand - a.subsPerThousand;
      }
    });

    return videos;
  }, [auditData?.videos, searchQuery, sort]);

  // Compute view-specific rollups (from filtered list)
  const viewRollups = useMemo(
    () => computeRollups(filteredVideos),
    [filteredVideos]
  );

  // Channel baseline (from ALL videos in range)
  const channelBaseline = useMemo(
    () => (auditData?.videos ? computeRollups(auditData.videos) : null),
    [auditData?.videos]
  );

  // Calculate the threshold for "Strong" tier
  const strongThreshold = useMemo(() => {
    if (!auditData?.videos || auditData.videos.length < 4) return null;
    const sorted = [...auditData.videos].sort(
      (a, b) => b.subsPerThousand - a.subsPerThousand
    );
    const p75Index = Math.floor(sorted.length * 0.25); // Top 25%
    return sorted[p75Index]?.subsPerThousand ?? null;
  }, [auditData?.videos]);

  const displayedVideos = filteredVideos.slice(0, displayCount);
  const hasMore = displayCount < filteredVideos.length;

  const handleCopy = useCallback(async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

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
          See which videos turn viewers into subscribers — and what to
          replicate.
        </p>
      </div>

      {/* Upgrade Banner */}
      {!isSubscribed && (
        <div className={s.upgradeBanner}>
          <p>
            Upgrade to Pro to unlock full subscriber conversion insights —{" "}
            {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.upgradeBtn}>
            Upgrade — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}
          </a>
        </div>
      )}

      {/* Toolbar - Mobile First */}
      <div className={s.toolbar}>
        <div className={s.toolbarRow}>
          <div className={s.searchWrap}>
            <svg
              className={s.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className={s.searchInput}
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className={s.toolbarControls}>
          <select
            className={s.select}
            value={range}
            onChange={(e) => setRange(e.target.value as RangeOption)}
          >
            <option value="28d">28 days</option>
            <option value="90d">90 days</option>
          </select>
          <select
            className={s.select}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
          >
            <option value="subs_per_1k">Subs/1K</option>
            <option value="views">Views</option>
            <option value="engaged_rate">Engaged Rate</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* View Summary (rollups from current view) */}
      {!loading && filteredVideos.length > 0 && (
        <div className={s.summarySection}>
          <div className={s.summaryHeader}>
            <h2 className={s.summaryTitle}>This view summary</h2>
            <span className={s.summaryCount}>
              {viewRollups.countVideos} videos
            </span>
          </div>
          <div className={s.summaryGrid}>
            <div className={s.summaryCard}>
              <span className={s.summaryValue}>
                {viewRollups.avgSubsPer1k.toFixed(1)}
              </span>
              <span className={s.summaryLabel}>Avg Subs/1K</span>
            </div>
            <div className={s.summaryCard}>
              <span className={s.summaryValue}>
                {formatNumber(viewRollups.totalSubsGained)}
              </span>
              <span className={s.summaryLabel}>Total Subs Gained</span>
            </div>
            <div className={s.summaryCard}>
              <span className={s.summaryValue}>
                {(viewRollups.avgEngagedRate * 100).toFixed(1)}%
              </span>
              <span className={s.summaryLabel}>Avg Engaged Rate</span>
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
          {/* Channel baseline comparison */}
          {channelBaseline &&
            filteredVideos.length !== auditData?.videos?.length && (
              <div className={s.baselineNote}>
                <span className={s.baselineLabel}>
                  Channel baseline ({range}):
                </span>
                <span>
                  {channelBaseline.avgSubsPer1k.toFixed(1)} avg subs/1k
                </span>
                <span>•</span>
                <span>{channelBaseline.countVideos} videos total</span>
              </div>
            )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
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
                avgSubsPerThousand={viewRollups.avgSubsPer1k}
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

      {/* Insights Section - Only patterns and recipe, NO ideas */}
      {!loading && auditData && displayedVideos.length > 0 && (
        <InsightsSection
          analysis={auditData.patternAnalysis}
          onCopy={handleCopy}
          copiedId={copiedId}
        />
      )}

      {/* Demo Badge */}
      {auditData?.demo && (
        <p className={s.demoNote}>Showing demo data for preview purposes.</p>
      )}
    </main>
  );
}

/* ---------- Video Card ---------- */
function VideoCard({
  video,
  rank,
  avgSubsPerThousand,
  insufficientData,
  channelId,
}: {
  video: SubscriberMagnetVideo;
  rank: number;
  avgSubsPerThousand: number;
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

  const delta = video.subsPerThousand - avgSubsPerThousand;
  const deltaPercent =
    avgSubsPerThousand > 0
      ? ((delta / avgSubsPerThousand) * 100).toFixed(0)
      : "0";

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
            {formatDuration(video.durationSec)}
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
                {video.subsPerThousand.toFixed(1)}
              </span>
              <span className={s.heroLabel}>subs/1K</span>
              {delta !== 0 && !insufficientData && (
                <span
                  className={`${s.deltaBadge} ${
                    delta > 0 ? s.deltaUp : s.deltaDown
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {deltaPercent}%
                </span>
              )}
            </div>
            <span className={`${s.tierBadge} ${tierClass}`}>{tierLabel}</span>
          </div>

          {/* Compact Metrics */}
          <div className={s.metricsRow}>
            <span className={s.metricPill}>
              +{formatNumber(video.subscribersGained)} subs
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

/* ---------- Insights Section (patterns + recipe only) ---------- */
type InsightsSectionProps = {
  analysis: SubscriberAuditResponse["patternAnalysis"];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
};

function InsightsSection({ analysis, onCopy, copiedId }: InsightsSectionProps) {
  const insights = analysis?.analysisJson?.structuredInsights;
  const commonPatterns = insights?.commonPatterns ?? [];
  const recipe = insights?.conversionRecipe ?? {
    titleFormulas: [],
    ctaTiming: "",
    structure: "",
  };

  const hasStructuredData =
    commonPatterns.length > 0 || recipe.titleFormulas.length > 0;

  if (
    !hasStructuredData &&
    !analysis?.analysisJson &&
    !analysis?.analysisMarkdownFallback
  ) {
    return null;
  }

  return (
    <section className={s.insightsSection}>
      <h2 className={s.insightsSectionTitle}>Conversion Insights</h2>

      <div className={s.insightsGrid}>
        {/* Card A: Common Patterns */}
        <div className={s.insightCard}>
          <h3 className={s.insightCardTitle}>
            What your top subscriber drivers have in common
          </h3>
          {commonPatterns.length > 0 ? (
            <div className={s.patternList}>
              {commonPatterns.map((p, i) => (
                <div key={i} className={s.patternItem}>
                  <div className={s.patternHeader}>
                    <span className={s.patternTitle}>{p.pattern}</span>
                  </div>
                  <p className={s.patternEvidence}>{p.evidence}</p>
                  <p className={s.patternHow}>
                    <strong>How to use:</strong> {p.howToUse}
                  </p>
                </div>
              ))}
            </div>
          ) : analysis?.analysisJson?.commonPatterns?.length ? (
            <ul className={s.legacyList}>
              {analysis.analysisJson.commonPatterns
                .slice(0, 5)
                .map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
            </ul>
          ) : (
            <p className={s.noData}>Generate more data to see patterns.</p>
          )}
        </div>

        {/* Card B: Conversion Recipe */}
        <div className={s.insightCard}>
          <h3 className={s.insightCardTitle}>
            Conversion recipe you can reuse
          </h3>
          {recipe.titleFormulas.length > 0 ||
          recipe.ctaTiming ||
          recipe.structure ? (
            <div className={s.recipeContent}>
              {recipe.titleFormulas.length > 0 && (
                <div className={s.recipeRow}>
                  <span className={s.recipeLabel}>Title formulas</span>
                  <div className={s.recipeValue}>
                    {recipe.titleFormulas.map((f, i) => (
                      <button
                        key={i}
                        className={s.formulaChip}
                        onClick={() => onCopy(f, `formula-${i}`)}
                        type="button"
                      >
                        {f}
                        {copiedId === `formula-${i}` && (
                          <span className={s.copiedBadge}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recipe.ctaTiming && (
                <div className={s.recipeRow}>
                  <span className={s.recipeLabel}>CTA timing</span>
                  <span className={s.recipeText}>{recipe.ctaTiming}</span>
                </div>
              )}
              {recipe.structure && (
                <div className={s.recipeRow}>
                  <span className={s.recipeLabel}>Structure</span>
                  <span className={s.recipeText}>{recipe.structure}</span>
                </div>
              )}
            </div>
          ) : analysis?.analysisJson?.ctaPatterns?.length ? (
            <ul className={s.legacyList}>
              {analysis.analysisJson.ctaPatterns.slice(0, 4).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className={s.noData}>
              Analyze more videos to build your conversion recipe.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Helpers ---------- */
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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
