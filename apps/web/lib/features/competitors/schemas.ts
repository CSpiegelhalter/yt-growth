import { z } from "zod";

// ── Discovery route schemas (/api/competitors/discover) ─────────

const DiscoveryFiltersSchema = z.object({
  channelSize: z
    .enum(["micro", "small", "medium", "large", "any"])
    .default("any"),
  channelAge: z
    .enum(["new", "growing", "established", "any"])
    .default("any"),
  contentType: z.enum(["both", "shorts", "long"]).default("both"),
  timeWindow: z.enum(["24h", "7d", "30d", "90d"]).default("30d"),
  minViewsPerDay: z.number().min(0).default(50),
  category: z
    .enum([
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
    ])
    .default("all"),
  sortBy: z
    .enum(["velocity", "breakout", "recent", "engagement", "opportunity"])
    .default("velocity"),
});

export const DiscoverBodySchema = z.object({
  listType: z
    .enum([
      "fastest_growing",
      "breakouts",
      "emerging_niches",
      "low_competition",
    ])
    .optional(),
  filters: DiscoveryFiltersSchema.optional(),
  queryText: z.string().max(200).optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().min(1).max(50).default(30),
});

export type DiscoverBody = z.infer<typeof DiscoverBodySchema>;

// ── Search route schemas (/api/competitors/search) ──────────────

const SearchFiltersSchema = z.object({
  contentType: z.enum(["shorts", "long", "both"]).optional(),
  dateRangePreset: z
    .enum(["7d", "30d", "90d", "365d", "custom"])
    .optional(),
  postedAfter: z.string().optional(),
  postedBefore: z.string().optional(),
  channelCreatedAfter: z.string().optional(),
  channelCreatedBefore: z.string().optional(),
  minViewsPerDay: z.number().min(0).optional(),
  maxViewsPerDay: z.number().min(0).optional(),
  minTotalViews: z.number().min(0).optional(),
  maxTotalViews: z.number().min(0).optional(),
  sortBy: z
    .enum(["viewsPerDay", "totalViews", "newest", "engagement"])
    .optional(),
  targetResultCount: z.number().min(1).max(100).optional(),
});

const SearchCursorSchema = z.object({
  queryIndex: z.number().min(0),
  pageToken: z.string().optional(),
  seenIds: z.array(z.string()),
  scannedCount: z.number().min(0),
});

export const SearchBodySchema = z.object({
  mode: z.enum(["competitor_search", "search_my_niche"]),
  nicheText: z.string().max(500).optional(),
  referenceVideoUrl: z.string().max(200).optional(),
  channelId: z.string().optional(),
  filters: SearchFiltersSchema.optional(),
  cursor: SearchCursorSchema.optional(),
});

export type SearchBody = z.infer<typeof SearchBodySchema>;

// ── Video detail route schemas (/api/competitors/video/[videoId]) ─

export const VideoParamsSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
});

export type VideoParams = z.infer<typeof VideoParamsSchema>;

export const VideoQuerySchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  includeMoreFromChannel: z
    .union([z.literal("0"), z.literal("1")])
    .optional()
    .default("1"),
});

export type VideoQuery = z.infer<typeof VideoQuerySchema>;

// ── More from channel route schemas ─────────────────────────────

export const MoreFromChannelParamsSchema = z.object({
  videoId: z.string().min(1),
});

export type MoreFromChannelParams = z.infer<
  typeof MoreFromChannelParamsSchema
>;

export const MoreFromChannelQuerySchema = z.object({
  channelId: z.string().min(1),
});

export type MoreFromChannelQuery = z.infer<
  typeof MoreFromChannelQuerySchema
>;
