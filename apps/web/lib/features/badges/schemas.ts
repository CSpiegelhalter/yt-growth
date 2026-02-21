import { z } from "zod";

export const BadgesQuerySchema = z.object({
  channelId: z.string().optional(),
});

export const MarkBadgesSeenBodySchema = z.object({
  badgeIds: z.array(z.string().min(1)).min(1),
  channelId: z.string().optional(),
});
