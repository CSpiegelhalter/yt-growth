import "server-only";

import { prisma } from "@/prisma";
import type {
  DiscoverCompetitorsInput,
  DiscoverCompetitorsResult,
  DiscoveredNiche,
  DiscoveryFilters,
  SampleVideo,
} from "../types";
import { assertActiveSubscription } from "../errors";

// ── Internal DB row types ───────────────────────────────────────

type DiscoveredVideoRow = {
  video_id: string;
  title: string;
  channel_id: string;
  channel_title: string;
  thumbnail_url: string | null;
  published_at: Date;
  view_count: bigint;
  views_per_day: number;
  subscriber_count: bigint | null;
  velocity_24h?: bigint | null;
  breakout_by_subs?: number | null;
};

type NicheClusterRow = {
  cluster_id: string;
  label: string;
  keywords: string[];
  median_velocity_24h: number | null;
  median_views_per_day: number | null;
  unique_channels: number | null;
  total_videos: number | null;
  avg_days_old: number | null;
  opportunity_score: number | null;
  avg_channel_subs?: number | null;
};

// ── Helpers ─────────────────────────────────────────────────────

const WINDOW_INTERVALS: Record<string, string> = {
  "24h": "1 day",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

function windowToInterval(window: string): string {
  return WINDOW_INTERVALS[window] ?? "30 days";
}

function buildRationale(metrics: {
  medianViewsPerDay?: number;
  totalVideos?: number;
  uniqueChannels?: number;
  velocity24h?: number;
  opportunityScore?: number;
}): string[] {
  const bullets: string[] = [];

  if (metrics.medianViewsPerDay) {
    bullets.push(
      `${Math.round(metrics.medianViewsPerDay).toLocaleString()} median views/day`,
    );
  }
  if (metrics.velocity24h) {
    bullets.push(
      `${Math.round(metrics.velocity24h).toLocaleString()} views gained in 24h`,
    );
  }
  if (metrics.uniqueChannels && metrics.totalVideos) {
    bullets.push(
      `${metrics.uniqueChannels} channels across ${metrics.totalVideos} videos`,
    );
  }
  if (metrics.opportunityScore) {
    bullets.push(`Opportunity score: ${metrics.opportunityScore.toFixed(1)}`);
  }

  return bullets.slice(0, 2);
}

function mapToSampleVideo(
  v: DiscoveredVideoRow,
  extras?: { includeVelocity?: boolean; includeBreakout?: boolean },
): SampleVideo {
  return {
    videoId: v.video_id,
    title: v.title,
    thumbnailUrl: v.thumbnail_url,
    channelId: v.channel_id,
    channelTitle: v.channel_title,
    channelSubscribers: v.subscriber_count
      ? Number(v.subscriber_count)
      : undefined,
    viewCount: Number(v.view_count),
    viewsPerDay: v.views_per_day,
    publishedAt: v.published_at.toISOString(),
    ...(extras?.includeVelocity && v.velocity_24h != null
      ? { velocity24h: Number(v.velocity_24h) }
      : {}),
    ...(extras?.includeBreakout && v.breakout_by_subs != null
      ? { breakoutScore: v.breakout_by_subs }
      : {}),
  };
}

function buildNicheMetrics(cluster: NicheClusterRow) {
  return {
    medianViewsPerDay: cluster.median_views_per_day ?? 0,
    totalVideos: cluster.total_videos ?? 0,
    uniqueChannels: cluster.unique_channels ?? 0,
    avgDaysOld: cluster.avg_days_old ?? 0,
    opportunityScore: cluster.opportunity_score ?? undefined,
  };
}

// ── DB query functions ──────────────────────────────────────────

async function fetchFastestGrowing(
  window: string,
  limit: number,
): Promise<DiscoveredNiche[]> {
  const videos = await prisma.$queryRaw<DiscoveredVideoRow[]>`
    SELECT 
      dv.video_id,
      dv.title,
      dv.channel_id,
      dv.channel_title,
      dv.thumbnail_url,
      dv.published_at,
      COALESCE(vs.view_count, 0) as view_count,
      COALESCE(vs.views_per_day, 0) as views_per_day,
      vs.velocity_24h,
      cpl.subscriber_count
    FROM discovered_videos dv
    LEFT JOIN video_scores vs ON dv.video_id = vs.video_id AND vs."window" = ${window}
    LEFT JOIN channel_profiles_lite cpl ON dv.channel_id = cpl.channel_id
    WHERE dv.published_at > now() - ${windowToInterval(window)}::interval
    ORDER BY COALESCE(vs.velocity_24h, vs.views_per_day, 0) DESC NULLS LAST
    LIMIT ${limit * 3}
  `;

  if (videos.length === 0) return [];

  const sampleVideos = videos
    .slice(0, 10)
    .map((v) => mapToSampleVideo(v, { includeVelocity: true }));

  const uniqueChannels = new Set(videos.map((v) => v.channel_id)).size;
  const vpdValues = videos.map((v) => v.views_per_day).sort((a, b) => a - b);
  const medianVpd = vpdValues[Math.floor(vpdValues.length / 2)] ?? 0;

  return [
    {
      id: `fastest_growing:${window}:${Date.now()}`,
      nicheLabel: "Fastest Growing",
      rationaleBullets: buildRationale({
        medianViewsPerDay: medianVpd,
        uniqueChannels,
        totalVideos: videos.length,
      }),
      sampleVideos,
      metrics: {
        medianViewsPerDay: medianVpd,
        totalVideos: videos.length,
        uniqueChannels,
        avgDaysOld: 0,
      },
      queryTerms: ["trending", "viral", "growing"],
      tags: ["trending", "viral"],
    },
  ];
}

async function fetchBreakouts(
  window: string,
  limit: number,
): Promise<DiscoveredNiche[]> {
  const videos = await prisma.$queryRaw<DiscoveredVideoRow[]>`
    SELECT 
      dv.video_id,
      dv.title,
      dv.channel_id,
      dv.channel_title,
      dv.thumbnail_url,
      dv.published_at,
      COALESCE(vs.view_count, 0) as view_count,
      COALESCE(vs.views_per_day, 0) as views_per_day,
      vs.velocity_24h,
      vs.breakout_by_subs,
      cpl.subscriber_count
    FROM discovered_videos dv
    LEFT JOIN video_scores vs ON dv.video_id = vs.video_id AND vs."window" = ${window}
    LEFT JOIN channel_profiles_lite cpl ON dv.channel_id = cpl.channel_id
    WHERE dv.published_at > now() - ${windowToInterval(window)}::interval
      AND vs.breakout_by_subs IS NOT NULL
    ORDER BY vs.breakout_by_subs DESC NULLS LAST
    LIMIT ${limit * 3}
  `;

  if (videos.length === 0) return [];

  const sampleVideos = videos
    .slice(0, 10)
    .map((v) =>
      mapToSampleVideo(v, { includeVelocity: true, includeBreakout: true }),
    );

  const uniqueChannels = new Set(videos.map((v) => v.channel_id)).size;

  return [
    {
      id: `breakouts:${window}:${Date.now()}`,
      nicheLabel: "Breakout Videos",
      rationaleBullets: [
        "Videos outperforming their channel size",
        `${uniqueChannels} small/medium creators breaking through`,
      ],
      sampleVideos,
      metrics: {
        medianViewsPerDay: videos[0]?.views_per_day ?? 0,
        totalVideos: videos.length,
        uniqueChannels,
        avgDaysOld: 0,
      },
      queryTerms: ["breakout", "viral", "small creator"],
      tags: ["breakout", "underdog"],
    },
  ];
}

async function fetchClusterSampleVideos(
  clusterId: string,
  window: string,
): Promise<SampleVideo[]> {
  const rows = await prisma.$queryRaw<DiscoveredVideoRow[]>`
    SELECT 
      dv.video_id,
      dv.title,
      dv.channel_id,
      dv.channel_title,
      dv.thumbnail_url,
      dv.published_at,
      COALESCE(vs.view_count, 0) as view_count,
      COALESCE(vs.views_per_day, 0) as views_per_day,
      cpl.subscriber_count
    FROM niche_cluster_videos ncv
    JOIN discovered_videos dv ON ncv.video_id = dv.video_id
    LEFT JOIN video_scores vs ON dv.video_id = vs.video_id AND vs."window" = ${window}
    LEFT JOIN channel_profiles_lite cpl ON dv.channel_id = cpl.channel_id
    WHERE ncv.cluster_id = ${clusterId}::uuid
    ORDER BY ncv.rank_in_cluster ASC
    LIMIT 3
  `;
  return rows.map((v) => mapToSampleVideo(v));
}

async function fetchEmergingNiches(
  window: string,
  limit: number,
): Promise<DiscoveredNiche[]> {
  const clusters = await prisma.$queryRaw<NicheClusterRow[]>`
    SELECT 
      cluster_id, label, keywords,
      median_velocity_24h, median_views_per_day,
      unique_channels, total_videos, avg_days_old, opportunity_score
    FROM niche_clusters
    WHERE "window" = ${window}
    ORDER BY COALESCE(median_velocity_24h, median_views_per_day, 0) DESC NULLS LAST
    LIMIT ${limit}
  `;

  const niches: DiscoveredNiche[] = [];

  for (const cluster of clusters) {
    const sampleVideos = await fetchClusterSampleVideos(
      cluster.cluster_id,
      window,
    );

    niches.push({
      id: cluster.cluster_id,
      nicheLabel: cluster.label,
      rationaleBullets: buildRationale({
        medianViewsPerDay: cluster.median_views_per_day ?? undefined,
        totalVideos: cluster.total_videos ?? undefined,
        uniqueChannels: cluster.unique_channels ?? undefined,
      }),
      sampleVideos,
      metrics: buildNicheMetrics(cluster),
      queryTerms: [cluster.label.toLowerCase()],
      tags: cluster.keywords?.slice(0, 6) ?? [],
    });
  }

  return niches;
}

async function fetchLowCompetition(
  window: string,
  limit: number,
): Promise<DiscoveredNiche[]> {
  const clusters = await prisma.$queryRaw<NicheClusterRow[]>`
    SELECT 
      cluster_id, label, keywords,
      median_velocity_24h, median_views_per_day,
      unique_channels, total_videos, avg_days_old,
      avg_channel_subs, opportunity_score
    FROM niche_clusters
    WHERE "window" = ${window}
      AND opportunity_score IS NOT NULL
    ORDER BY opportunity_score DESC NULLS LAST
    LIMIT ${limit}
  `;

  const niches: DiscoveredNiche[] = [];

  for (const cluster of clusters) {
    const sampleVideos = await fetchClusterSampleVideos(
      cluster.cluster_id,
      window,
    );

    const avgSubs = cluster.avg_channel_subs;
    const competitionLevel = avgSubs
      ? avgSubs < 10000
        ? "low"
        : avgSubs < 100000
          ? "medium"
          : "high"
      : "unknown";

    niches.push({
      id: cluster.cluster_id,
      nicheLabel: cluster.label,
      rationaleBullets: [
        `Opportunity score: ${(cluster.opportunity_score ?? 0).toFixed(1)}`,
        `Competition: ${competitionLevel} (avg ${Math.round(avgSubs ?? 0).toLocaleString()} subs)`,
      ],
      sampleVideos,
      metrics: buildNicheMetrics(cluster),
      queryTerms: [cluster.label.toLowerCase()],
      tags: cluster.keywords?.slice(0, 6) ?? [],
    });
  }

  return niches;
}

// ── Default filters ─────────────────────────────────────────────

const DEFAULT_FILTERS: DiscoveryFilters = {
  channelSize: "any",
  channelAge: "any",
  contentType: "both",
  timeWindow: "30d",
  minViewsPerDay: 50,
  category: "all",
  sortBy: "velocity",
};

// ── List-type resolution ────────────────────────────────────────

function resolveListType(
  listType: string | undefined,
  sortBy: string | undefined,
): string {
  if (listType) return listType;
  switch (sortBy) {
    case "breakout":
      return "breakouts";
    case "opportunity":
      return "low_competition";
    default:
      return "emerging_niches";
  }
}

// ── Main use-case ───────────────────────────────────────────────

/**
 * Discover trending competitor niches and breakout videos.
 *
 * Queries pre-computed discovery data (discovered_videos, video_scores,
 * niche_clusters) and returns niches grouped by list type.
 */
export async function discoverCompetitors(
  input: DiscoverCompetitorsInput,
): Promise<DiscoverCompetitorsResult> {
  await assertActiveSubscription(input.userId);

  const filters: DiscoveryFilters = { ...DEFAULT_FILTERS, ...input.filters };
  const window = filters.timeWindow;
  const limit = input.limit ?? 30;
  const listType = resolveListType(input.listType, filters.sortBy);

  let niches: DiscoveredNiche[];

  switch (listType) {
    case "fastest_growing":
      niches = await fetchFastestGrowing(window, limit);
      break;
    case "breakouts":
      niches = await fetchBreakouts(window, limit);
      break;
    case "low_competition":
      niches = await fetchLowCompetition(window, limit);
      break;
    case "emerging_niches":
    default:
      niches = await fetchEmergingNiches(window, limit);
      break;
  }

  return {
    niches,
    totalFound: niches.length,
    filters,
    listType,
    generatedAt: new Date().toISOString(),
    nextCursor: undefined,
    hasMore: false,
    source: "database",
  };
}
