import { z } from "zod";

export const InsightParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

export const InsightQuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});
