/**
 * Niche Discovery API Route
 *
 * Goal: return dozens of niche candidates per request, with useful filters:
 * - channel size (micro/small/medium/large)
 * - channel age (new/growing/established)
 * - content type (shorts/long)
 * - time window
 * - min views/day
 * - category + sort
 *
 * POST /api/competitors/discover
 * Body: { filters, cursor? }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/prisma";
import { getGoogleAccount, searchNicheVideos } from "@/lib/youtube";
import { fetchVideosStatsBatch, fetchChannelsDetailsBatch } from "@/lib/youtube/data-api";
import { calculateDerivedMetrics } from "@/lib/competitor-search";

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
    "all",
    "howto",
    "entertainment",
    "education",
    "gaming",
    "tech",
    "lifestyle",
    "business",
    "creative",
    "sports",
    "news",
  ]).default("all"),
  sortBy: z.enum(["velocity", "breakout", "recent", "engagement", "opportunity"]).default("velocity"),
});

const RequestSchema = z.object({
  filters: FiltersSchema.optional(),
  queryText: z.string().max(200).optional(),
  cursor: z.string().nullable().optional(),
});

type DiscoveryFilters = z.infer<typeof FiltersSchema>;
type RequestBody = z.infer<typeof RequestSchema>;

// ============================================
// DISCOVERY LOGIC
// ============================================

const CATEGORY_SEEDS: Record<DiscoveryFilters["category"], string[]> = {
  all: [
    "tutorial",
    "tips",
    "beginner guide",
    "explained",
    "review",
    "challenge",
    "routine",
    "recipes",
    "workout",
    "budget",
    "productivity",
    "make money",
    "side hustle",
    "react tutorial",
    "ai tools",
    "travel tips",
    "home gym",
    "meal prep",
    "photography",
    "music production",
  ],
  howto: ["how to", "tutorial", "DIY", "beginner guide", "tips and tricks", "setup"],
  entertainment: ["reaction", "challenge", "storytime", "vlog", "comedy", "highlights"],
  education: ["explained", "learn", "lesson", "science", "history", "math"],
  gaming: ["walkthrough", "gameplay", "tips", "ranked", "build", "settings"],
  tech: ["review", "unboxing", "setup", "best", "comparison", "tutorial"],
  lifestyle: ["routine", "day in the life", "recipes", "fitness", "home", "travel"],
  business: ["side hustle", "make money", "investing", "business", "entrepreneur", "marketing"],
  creative: ["art", "design", "music", "photography", "editing", "animation"],
  sports: ["workout", "training", "highlights", "skills", "fitness", "gym"],
  news: ["news", "update", "analysis", "breakdown", "explained", "commentary"],
};

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "how",
  "what",
  "why",
  "when",
  "where",
  "this",
  "that",
  "these",
  "those",
  "you",
  "your",
  "my",
  "we",
  "they",
  "i",
  "it",
  "as",
  "vs",
  "best",
  "top",
  "new",
]);

function normalizeWord(w: string) {
  return w.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractKeywords(title: string): string[] {
  const parts = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));

  // Prefer the first few meaningful tokens (keeps grouping diverse)
  return parts.slice(0, 4);
}

function inferNicheLabel(titles: string[]): string {
  const freq = new Map<string, number>();
  for (const t of titles) {
    for (const w of extractKeywords(t)) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  if (top.length === 0) return "General";
  return top.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getChannelSizeBucket(subscriberCount: number | null): DiscoveryFilters["channelSize"] | "unknown" {
  if (subscriberCount === null) return "unknown";
  if (subscriberCount < 1_000) return "micro";
  if (subscriberCount < 10_000) return "small";
  if (subscriberCount < 100_000) return "medium";
  return "large";
}

function getChannelAgeBucket(publishedAt: string | null): DiscoveryFilters["channelAge"] | "unknown" {
  if (!publishedAt) return "unknown";
  const created = new Date(publishedAt).getTime();
  if (!Number.isFinite(created)) return "unknown";
  const years = (Date.now() - created) / (365 * 24 * 60 * 60 * 1000);
  if (years <= 1) return "new";
  if (years <= 3) return "growing";
  return "established";
}

function passesChannelFilters(
  filters: DiscoveryFilters,
  channelSize: ReturnType<typeof getChannelSizeBucket>,
  channelAge: ReturnType<typeof getChannelAgeBucket>
) {
  if (filters.channelSize !== "any" && channelSize !== filters.channelSize) return false;
  if (filters.channelAge !== "any" && channelAge !== filters.channelAge) return false;
  return true;
}

function buildRationale(metrics: { medianViewsPerDay: number; totalVideos: number; uniqueChannels: number }) {
  const bullets: string[] = [];
  bullets.push(`${Math.round(metrics.medianViewsPerDay).toLocaleString()} median views/day`);
  bullets.push(`${metrics.uniqueChannels} channels across ${metrics.totalVideos} videos`);
  return bullets.slice(0, 2);
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

    let body: RequestBody;
    try {
      body = RequestSchema.parse(await req.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return Response.json({ error: "Invalid request", details: err.errors }, { status: 400 });
      }
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const filters: DiscoveryFilters = body.filters ?? FiltersSchema.parse({});

    const userChannel = await prisma.channel.findFirst({
      where: { userId: user.id },
      select: { youtubeChannelId: true },
    });
    if (!userChannel) return Response.json({ error: "Please connect a YouTube channel first" }, { status: 400 });

    const ga = await getGoogleAccount(user.id, userChannel.youtubeChannelId);
    if (!ga) return Response.json({ error: "Google account not connected" }, { status: 400 });

    const windowDays = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 }[filters.timeWindow];
    const videoDuration: "short" | "medium" | "long" | "any" =
      filters.contentType === "shorts" ? "short" : filters.contentType === "long" ? "medium" : "any";

    const seeds = CATEGORY_SEEDS[filters.category];
    const queryText = (body.queryText ?? "").trim();
    // Cursor controls which seed slice we use (keeps requests cheap but diverse)
    const seedOffset = body.cursor ? Math.max(0, parseInt(body.cursor, 10) || 0) : 0;
    const SEEDS_PER_REQUEST = 6;
    const seedSlice = [
      ...(queryText ? [queryText] : []),
      ...seeds.slice(seedOffset, seedOffset + SEEDS_PER_REQUEST),
    ];

    const nextCursor = seedOffset + SEEDS_PER_REQUEST < seeds.length ? String(seedOffset + SEEDS_PER_REQUEST) : undefined;

    // Pull a broad set of videos from a small seed slice, then cluster locally into many niches.
    const rawVideos: Array<{
      videoId: string;
      title: string;
      channelId: string;
      channelTitle: string;
      thumbnailUrl: string | null;
      publishedAt: string;
      seed: string;
    }> = [];

    for (const seed of seedSlice) {
      try {
        const res = await searchNicheVideos(ga, seed, 25, undefined, videoDuration, windowDays);
        for (const v of res.videos) {
          rawVideos.push({ ...v, seed });
        }
      } catch (err) {
        console.warn(`[Discovery] Seed "${seed}" failed:`, err);
      }
    }

    // Dedupe videos
    const seen = new Set<string>();
    const videos = rawVideos.filter((v) => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });

    // Enrich stats
    const statsMap = await fetchVideosStatsBatch(ga, videos.map((v) => v.videoId));

    // Enrich channel details
    const uniqueChannelIds = [...new Set(videos.map((v) => v.channelId))];
    const channelDetails = await fetchChannelsDetailsBatch(ga, uniqueChannelIds);
    const channelMap = new Map(channelDetails.map((c) => [c.channelId, c]));

    // Filter + derive
    const eligible = videos
      .map((v) => {
        const stats = statsMap.get(v.videoId);
        const viewCount = stats?.viewCount ?? 0;
        const derived = calculateDerivedMetrics(viewCount, v.publishedAt, stats?.likeCount, stats?.commentCount);
        const channel = channelMap.get(v.channelId);
        const channelSize = getChannelSizeBucket(channel?.subscriberCount ?? null);
        const channelAge = getChannelAgeBucket(channel?.publishedAt ?? null);
        return {
          ...v,
          viewCount,
          derived,
          channelSubscribers: channel?.subscriberCount ?? null,
          channelSize,
          channelAge,
        };
      })
      .filter((v) => v.derived.viewsPerDay >= filters.minViewsPerDay)
      .filter((v) => passesChannelFilters(filters, v.channelSize, v.channelAge));

    // Group into niches by keyword keys (produce many niches from one batch)
    const groups = new Map<string, typeof eligible>();
    for (const v of eligible) {
      const keywords = extractKeywords(v.title);
      const key = keywords[0] ?? normalizeWord(v.seed) ?? "general";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(v);
    }

    const niches: Array<{
      id: string;
      nicheLabel: string;
      rationaleBullets: string[];
      sampleVideos: Array<{
        videoId: string;
        title: string;
        thumbnailUrl: string | null;
        channelId: string;
        channelTitle: string;
        channelSubscribers?: number;
        viewCount: number;
        viewsPerDay: number;
        publishedAt: string;
      }>;
      metrics: {
        medianViewsPerDay: number;
        totalVideos: number;
        uniqueChannels: number;
        avgDaysOld: number;
      };
      queryTerms: string[];
      tags: string[];
    }> = [];

    for (const [key, items] of groups) {
      if (items.length < 2) continue;

      const titles = items.map((i) => i.title);
      const nicheLabel = inferNicheLabel(titles);
      const vpdSorted = items.map((i) => i.derived.viewsPerDay).sort((a, b) => a - b);
      const medianViewsPerDay = vpdSorted[Math.floor(vpdSorted.length / 2)] ?? 0;
      const uniqueChannels = new Set(items.map((i) => i.channelId)).size;
      const avgDaysOld =
        items.reduce((sum, i) => sum + i.derived.daysSincePublished, 0) / Math.max(1, items.length);

      const metrics = {
        medianViewsPerDay,
        totalVideos: items.length,
        uniqueChannels,
        avgDaysOld: Math.round(avgDaysOld),
      };

      const tags = [...new Set(items.flatMap((i) => extractKeywords(i.title)).slice(0, 12))].slice(0, 6);

      niches.push({
        id: `niche:${key}:${seedOffset}:${Date.now()}`,
        nicheLabel,
        rationaleBullets: buildRationale(metrics),
        sampleVideos: items
          .sort((a, b) => b.derived.viewsPerDay - a.derived.viewsPerDay)
          .slice(0, 3)
          .map((i) => ({
            videoId: i.videoId,
            title: i.title,
            thumbnailUrl: i.thumbnailUrl,
            channelId: i.channelId,
            channelTitle: i.channelTitle,
            channelSubscribers: i.channelSubscribers ?? undefined,
            viewCount: i.viewCount,
            viewsPerDay: i.derived.viewsPerDay,
            publishedAt: i.publishedAt,
          })),
        metrics,
        queryTerms: [nicheLabel.toLowerCase()],
        tags,
      });
    }

    // Sort niches
    niches.sort((a, b) => {
      switch (filters.sortBy) {
        case "recent":
          return (a.metrics.avgDaysOld ?? 9999) - (b.metrics.avgDaysOld ?? 9999);
        case "engagement":
        case "opportunity":
          // Placeholder: fall back to velocity until we compute richer scores
          return b.metrics.medianViewsPerDay - a.metrics.medianViewsPerDay;
        case "breakout":
        case "velocity":
        default:
          return b.metrics.medianViewsPerDay - a.metrics.medianViewsPerDay;
      }
    });

    // Limit response size (keeps UI fast and avoids overwhelming)
    const limited = niches.slice(0, 30);

    return Response.json({
      niches: limited,
      totalFound: niches.length,
      filters,
      generatedAt: new Date().toISOString(),
      nextCursor,
      hasMore: !!nextCursor,
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
