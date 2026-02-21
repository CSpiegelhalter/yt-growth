import { z } from "zod";

// ── Audit route schemas (/api/me/channels/[channelId]/audit) ─

export const AuditParamsSchema = z.object({
  channelId: z.string().min(1),
});

export const AuditQuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
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

