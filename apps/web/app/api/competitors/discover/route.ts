/**
 * Niche Discovery API Route (DB-backed)
 *
 * Serves 4 canonical lists from pre-computed data:
 * - fastest_growing: Highest velocity (views/day)
 * - breakouts: Small creator winners (velocity/subs)
 * - emerging_niches: Semantic clusters ranked by momentum
 * - low_competition: Clusters with high opportunity scores
 *
 * POST /api/competitors/discover
 * Body: { listType?, filters?, cursor? }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/prisma";

// ============================================
// REQUEST VALIDATION
// ============================================

const FiltersSchema = z.object({
  channelSize: z.enum(["micro", "small", "medium", "large", "any"]).default("any"),
  channelAge: z.enum(["new", "growing", "established", "any"]).default("any"),
  contentType: z.enum(["both", "shorts", "long"]).default("both"),
  timeWindow: z.enum(["24h", "7d", "30d", "90d"]).default("30d"),
  minViewsPerDay: z.number().min(0).default(50),
  category: z.enum([
    "all", "howto", "entertainment", "education", "gaming",
    "tech", "lifestyle", "business", "creative", "sports", "news",
  ]).default("all"),
  sortBy: z.enum(["velocity", "breakout", "recent", "engagement", "opportunity"]).default("velocity"),
});

const RequestSchema = z.object({
  // New: explicit list type for the 4 canonical lists
  listType: z.enum(["fastest_growing", "breakouts", "emerging_niches", "low_competition"]).optional(),
  filters: FiltersSchema.optional(),
  queryText: z.string().max(200).optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().min(1).max(50).default(30),
});

type DiscoveryFilters = z.infer<typeof FiltersSchema>;

// ============================================
// TYPES
// ============================================

type SampleVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelId: string;
  channelTitle: string;
  channelSubscribers?: number;
  viewCount: number;
  viewsPerDay: number;
  publishedAt: string;
  velocity24h?: number;
  breakoutScore?: number;
};

type DiscoveredNiche = {
  id: string;
  nicheLabel: string;
  rationaleBullets: string[];
  sampleVideos: SampleVideo[];
  metrics: {
    medianViewsPerDay: number;
    totalVideos: number;
    uniqueChannels: number;
    avgDaysOld: number;
    opportunityScore?: number;
  };
  queryTerms: string[];
  tags: string[];
};

// ============================================
// HELPERS
// ============================================

function windowToInterval(window: string): string {
  const mapping: Record<string, string> = {
    "24h": "1 day",
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
  };
  return mapping[window] ?? "30 days";
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
    bullets.push(`${Math.round(metrics.medianViewsPerDay).toLocaleString()} median views/day`);
  }
  if (metrics.velocity24h) {
    bullets.push(`${Math.round(metrics.velocity24h).toLocaleString()} views gained in 24h`);
  }
  if (metrics.uniqueChannels && metrics.totalVideos) {
    bullets.push(`${metrics.uniqueChannels} channels across ${metrics.totalVideos} videos`);
  }
  if (metrics.opportunityScore) {
    bullets.push(`Opportunity score: ${metrics.opportunityScore.toFixed(1)}`);
  }
  
  return bullets.slice(0, 2);
}

// ============================================
// DB QUERY FUNCTIONS
// ============================================

async function fetchFastestGrowing(window: string, limit: number): Promise<DiscoveredNiche[]> {
  // Query videos with highest velocity, group into ad-hoc clusters
  const videos = await prisma.$queryRaw<Array<{
    video_id: string;
    title: string;
    channel_id: string;
    channel_title: string;
    thumbnail_url: string | null;
    published_at: Date;
    view_count: bigint;
    views_per_day: number;
    velocity_24h: bigint | null;
    subscriber_count: bigint | null;
  }>>`
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

  // Group top videos into a single "Fastest Growing" pseudo-cluster
  if (videos.length === 0) return [];

  const sampleVideos: SampleVideo[] = videos.slice(0, 10).map(v => ({
    videoId: v.video_id,
    title: v.title,
    thumbnailUrl: v.thumbnail_url,
    channelId: v.channel_id,
    channelTitle: v.channel_title,
    channelSubscribers: v.subscriber_count ? Number(v.subscriber_count) : undefined,
    viewCount: Number(v.view_count),
    viewsPerDay: v.views_per_day,
    velocity24h: v.velocity_24h ? Number(v.velocity_24h) : undefined,
    publishedAt: v.published_at.toISOString(),
  }));

  const uniqueChannels = new Set(videos.map(v => v.channel_id)).size;
  const vpdValues = videos.map(v => v.views_per_day).sort((a, b) => a - b);
  const medianVpd = vpdValues[Math.floor(vpdValues.length / 2)] ?? 0;

  return [{
    id: `fastest_growing:${window}:${Date.now()}`,
    nicheLabel: "Fastest Growing",
    rationaleBullets: buildRationale({ medianViewsPerDay: medianVpd, uniqueChannels, totalVideos: videos.length }),
    sampleVideos,
    metrics: {
      medianViewsPerDay: medianVpd,
      totalVideos: videos.length,
      uniqueChannels,
      avgDaysOld: 0,
    },
    queryTerms: ["trending", "viral", "growing"],
    tags: ["trending", "viral"],
  }];
}

async function fetchBreakouts(window: string, limit: number): Promise<DiscoveredNiche[]> {
  // Query videos with highest breakout scores (velocity / subs)
  const videos = await prisma.$queryRaw<Array<{
    video_id: string;
    title: string;
    channel_id: string;
    channel_title: string;
    thumbnail_url: string | null;
    published_at: Date;
    view_count: bigint;
    views_per_day: number;
    velocity_24h: bigint | null;
    breakout_by_subs: number | null;
    subscriber_count: bigint | null;
  }>>`
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

  const sampleVideos: SampleVideo[] = videos.slice(0, 10).map(v => ({
    videoId: v.video_id,
    title: v.title,
    thumbnailUrl: v.thumbnail_url,
    channelId: v.channel_id,
    channelTitle: v.channel_title,
    channelSubscribers: v.subscriber_count ? Number(v.subscriber_count) : undefined,
    viewCount: Number(v.view_count),
    viewsPerDay: v.views_per_day,
    velocity24h: v.velocity_24h ? Number(v.velocity_24h) : undefined,
    breakoutScore: v.breakout_by_subs ?? undefined,
    publishedAt: v.published_at.toISOString(),
  }));

  const uniqueChannels = new Set(videos.map(v => v.channel_id)).size;

  return [{
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
  }];
}

async function fetchEmergingNiches(window: string, limit: number): Promise<DiscoveredNiche[]> {
  // Query pre-computed clusters from niche_clusters
  const clusters = await prisma.$queryRaw<Array<{
    cluster_id: string;
    label: string;
    keywords: string[];
    median_velocity_24h: number | null;
    median_views_per_day: number | null;
    unique_channels: number | null;
    total_videos: number | null;
    avg_days_old: number | null;
    opportunity_score: number | null;
  }>>`
    SELECT 
      cluster_id,
      label,
      keywords,
      median_velocity_24h,
      median_views_per_day,
      unique_channels,
      total_videos,
      avg_days_old,
      opportunity_score
    FROM niche_clusters
    WHERE "window" = ${window}
    ORDER BY COALESCE(median_velocity_24h, median_views_per_day, 0) DESC NULLS LAST
    LIMIT ${limit}
  `;

  const niches: DiscoveredNiche[] = [];

  for (const cluster of clusters) {
    // Fetch sample videos for this cluster
    const videos = await prisma.$queryRaw<Array<{
      video_id: string;
      title: string;
      channel_id: string;
      channel_title: string;
      thumbnail_url: string | null;
      published_at: Date;
      view_count: bigint;
      views_per_day: number;
      subscriber_count: bigint | null;
    }>>`
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
      WHERE ncv.cluster_id = ${cluster.cluster_id}::uuid
      ORDER BY ncv.rank_in_cluster ASC
      LIMIT 3
    `;

    const sampleVideos: SampleVideo[] = videos.map(v => ({
      videoId: v.video_id,
      title: v.title,
      thumbnailUrl: v.thumbnail_url,
      channelId: v.channel_id,
      channelTitle: v.channel_title,
      channelSubscribers: v.subscriber_count ? Number(v.subscriber_count) : undefined,
      viewCount: Number(v.view_count),
      viewsPerDay: v.views_per_day,
      publishedAt: v.published_at.toISOString(),
    }));

    niches.push({
      id: cluster.cluster_id,
      nicheLabel: cluster.label,
      rationaleBullets: buildRationale({
        medianViewsPerDay: cluster.median_views_per_day ?? undefined,
        totalVideos: cluster.total_videos ?? undefined,
        uniqueChannels: cluster.unique_channels ?? undefined,
      }),
      sampleVideos,
      metrics: {
        medianViewsPerDay: cluster.median_views_per_day ?? 0,
        totalVideos: cluster.total_videos ?? 0,
        uniqueChannels: cluster.unique_channels ?? 0,
        avgDaysOld: cluster.avg_days_old ?? 0,
        opportunityScore: cluster.opportunity_score ?? undefined,
      },
      queryTerms: [cluster.label.toLowerCase()],
      tags: cluster.keywords?.slice(0, 6) ?? [],
    });
  }

  return niches;
}

async function fetchLowCompetition(window: string, limit: number): Promise<DiscoveredNiche[]> {
  // Query clusters with highest opportunity scores
  const clusters = await prisma.$queryRaw<Array<{
    cluster_id: string;
    label: string;
    keywords: string[];
    median_velocity_24h: number | null;
    median_views_per_day: number | null;
    unique_channels: number | null;
    total_videos: number | null;
    avg_days_old: number | null;
    avg_channel_subs: number | null;
    opportunity_score: number | null;
  }>>`
    SELECT 
      cluster_id,
      label,
      keywords,
      median_velocity_24h,
      median_views_per_day,
      unique_channels,
      total_videos,
      avg_days_old,
      avg_channel_subs,
      opportunity_score
    FROM niche_clusters
    WHERE "window" = ${window}
      AND opportunity_score IS NOT NULL
    ORDER BY opportunity_score DESC NULLS LAST
    LIMIT ${limit}
  `;

  const niches: DiscoveredNiche[] = [];

  for (const cluster of clusters) {
    // Fetch sample videos
    const videos = await prisma.$queryRaw<Array<{
      video_id: string;
      title: string;
      channel_id: string;
      channel_title: string;
      thumbnail_url: string | null;
      published_at: Date;
      view_count: bigint;
      views_per_day: number;
      subscriber_count: bigint | null;
    }>>`
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
      WHERE ncv.cluster_id = ${cluster.cluster_id}::uuid
      ORDER BY ncv.rank_in_cluster ASC
      LIMIT 3
    `;

    const sampleVideos: SampleVideo[] = videos.map(v => ({
      videoId: v.video_id,
      title: v.title,
      thumbnailUrl: v.thumbnail_url,
      channelId: v.channel_id,
      channelTitle: v.channel_title,
      channelSubscribers: v.subscriber_count ? Number(v.subscriber_count) : undefined,
      viewCount: Number(v.view_count),
      viewsPerDay: v.views_per_day,
      publishedAt: v.published_at.toISOString(),
    }));

    const avgSubs = cluster.avg_channel_subs;
    const competitionLevel = avgSubs ? (avgSubs < 10000 ? "low" : avgSubs < 100000 ? "medium" : "high") : "unknown";

    niches.push({
      id: cluster.cluster_id,
      nicheLabel: cluster.label,
      rationaleBullets: [
        `Opportunity score: ${(cluster.opportunity_score ?? 0).toFixed(1)}`,
        `Competition: ${competitionLevel} (avg ${Math.round(avgSubs ?? 0).toLocaleString()} subs)`,
      ],
      sampleVideos,
      metrics: {
        medianViewsPerDay: cluster.median_views_per_day ?? 0,
        totalVideos: cluster.total_videos ?? 0,
        uniqueChannels: cluster.unique_channels ?? 0,
        avgDaysOld: cluster.avg_days_old ?? 0,
        opportunityScore: cluster.opportunity_score ?? undefined,
      },
      queryTerms: [cluster.label.toLowerCase()],
      tags: cluster.keywords?.slice(0, 6) ?? [],
    });
  }

  return niches;
}

// ============================================
// MAIN HANDLER
// ============================================

async function POSTHandler(req: NextRequest) {
  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rlKey = rateLimitKey("competitorFeed", user.id);
    const rlResult = checkRateLimit(rlKey, RATE_LIMITS.competitorFeed);
    if (!rlResult.success) {
      return Response.json(
        { error: "Rate limit exceeded", resetAt: new Date(rlResult.resetAt).toISOString() },
        { status: 429 }
      );
    }

    if (!hasActiveSubscription(user.subscription)) {
      return Response.json({ error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" }, { status: 403 });
    }

    let body;
    try {
      body = RequestSchema.parse(await req.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return Response.json({ error: "Invalid request", details: err.errors }, { status: 400 });
      }
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const filters: DiscoveryFilters = body.filters ?? FiltersSchema.parse({});
    const window = filters.timeWindow;
    const limit = body.limit;

    // Determine list type from explicit param or sortBy filter
    let listType = body.listType;
    if (!listType) {
      // Map sortBy to list type for backward compatibility
      switch (filters.sortBy) {
        case "breakout":
          listType = "breakouts";
          break;
        case "opportunity":
          listType = "low_competition";
          break;
        case "velocity":
        default:
          listType = "emerging_niches"; // Default to clusters view
          break;
      }
    }

    // Fetch from DB based on list type
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

    // Apply additional filters if needed (channel size, etc.)
    // For now, these filters are best-effort since we may not have complete channel data
    // TODO: Add channel size/age filtering when channel_profiles_lite is fully populated

    return Response.json({
      niches,
      totalFound: niches.length,
      filters,
      listType,
      generatedAt: new Date().toISOString(),
      nextCursor: undefined, // DB queries return complete results
      hasMore: false,
      source: "database", // Indicate this is from cached data
    });
  } catch (err) {
    console.error("[Discovery] Error:", err);
    return Response.json(
      { error: "Discovery failed", detail: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute({ route: "/api/competitors/discover" }, POSTHandler);
