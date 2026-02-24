import { z } from "zod";

// ── Audit route schemas (/api/me/channels/[channelId]/audit) ─

export const AuditParamsSchema = z.object({
  channelId: z.string().min(1),
});

export const AuditQuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

// ── Overview route schemas (/api/me/channels/[channelId]/overview)

export const OverviewQuerySchema = z.object({
  range: z.enum(["7d", "28d", "30d", "90d"]).default("28d"),
});

// ── Channel Insights route schemas ──────────────────────────

const TrendSchema = z.object({
  value: z.number().nullable(),
  direction: z.enum(["up", "down", "flat"]),
});

export const ChannelInsightsBodySchema = z.object({
  channelSubscribers: z.number().nullable().default(null),
  videoSummary: z.object({
    count: z.number(),
    avgViews: z.number(),
    avgRetention: z.number().nullable(),
    avgLikeRate: z.number(),
    avgCommentsPer1k: z.number(),
    avgSubsPer1k: z.number().nullable(),
    avgDurationSec: z.number().nullable(),
    shortsCount: z.number(),
    longFormCount: z.number(),
    viewsCoeffOfVariation: z.number().nullable(),
    uploadGapDays: z.number().nullable(),
  }),
  trafficSources: z
    .object({
      browse: z.object({ views: z.number(), percentage: z.number() }).nullable(),
      suggested: z.object({ views: z.number(), percentage: z.number() }).nullable(),
      search: z.object({ views: z.number(), percentage: z.number() }).nullable(),
      external: z.object({ views: z.number(), percentage: z.number() }).nullable(),
      other: z.object({ views: z.number(), percentage: z.number() }).nullable(),
    })
    .nullable(),
  trends: z.object({
    views: TrendSchema,
    watchTime: TrendSchema,
    subscribers: TrendSchema,
  }),
  endScreenCtr: z.number().nullable(),
  totalViews: z.number(),
  netSubscribers: z.number(),
  subscribersGained: z.number(),
  subscribersLost: z.number(),
  channelBaselines: z.object({
    avgCtr: z.number().nullable(),
    avgAvdPct: z.number().nullable(),
    avgSubsPer1kViews: z.number().nullable(),
  }).optional(),
});

// ── Recommendations route schemas ───────────────────────────

const TrafficSourceEntrySchema = z
  .object({
    views: z.number(),
    percentage: z.number(),
  })
  .nullable();

export const RecommendationsBodySchema = z.object({
  metrics: z
    .object({
      totalViews: z.number(),
      totalWatchTimeMin: z.number(),
      avgViewPercentage: z.number().nullable(),
      subscribersGained: z.number(),
      subscribersLost: z.number(),
      netSubscribers: z.number(),
      endScreenCtr: z.number().nullable(),
    })
    .nullable(),
  trafficSources: z
    .object({
      browse: TrafficSourceEntrySchema,
      suggested: TrafficSourceEntrySchema,
      search: TrafficSourceEntrySchema,
      external: TrafficSourceEntrySchema,
      other: TrafficSourceEntrySchema,
    })
    .nullable(),
  trends: z.object({
    views: z.object({
      value: z.number().nullable(),
      direction: z.enum(["up", "down", "flat"]),
    }),
    watchTime: z.object({
      value: z.number().nullable(),
      direction: z.enum(["up", "down", "flat"]),
    }),
    subscribers: z.object({
      value: z.number().nullable(),
      direction: z.enum(["up", "down", "flat"]),
    }),
  }),
});

