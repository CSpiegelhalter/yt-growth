import { z } from "zod";

// ── Route params (/api/me/channels/[channelId]/subscriber-audit) ─

export const SubscriberAuditParamsSchema = z.object({
  channelId: z.string().min(1),
});

// ── Query params ─────────────────────────────────────────────────

export const SubscriberAuditQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(200).default(200),
  sort: z
    .enum(["subs_gained", "views", "newest", "engaged_rate"])
    .default("subs_gained"),
});
