import { z } from "zod";

export const FullReportParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const VALID_SECTION_KEYS = [
  "videoAudit",
  "discoverability",
  "promotionPlaybook",
  "retention",
  "hookAnalysis",
] as const;

export const FullReportBodySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
  sections: z
    .array(z.enum(VALID_SECTION_KEYS))
    .optional(),
});
