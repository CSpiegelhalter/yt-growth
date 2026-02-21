import { z } from "zod";

// ── Channel profile input (user-submitted form data) ────────────

export const ChannelProfileInputSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  categories: z
    .array(z.string())
    .min(1, "Select at least one category")
    .max(5),
  customCategory: z.string().max(100).optional(),
  formats: z.array(z.string()).optional(),
  audience: z.string().max(500).optional(),
  tone: z.array(z.string()).optional(),
  examples: z.array(z.string().max(200)).max(3).optional(),
  goals: z.array(z.string()).optional(),
});

export type ChannelProfileInput = z.infer<typeof ChannelProfileInputSchema>;

// ── AI-generated structured profile ─────────────────────────────

export const ChannelProfileAISchema = z.object({
  nicheLabel: z.string(),
  nicheDescription: z.string(),
  primaryCategories: z.array(z.string()),
  contentPillars: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  targetAudience: z.string(),
  channelValueProposition: z.string(),
  keywords: z.array(z.string()),
  competitorSearchHints: z.array(z.string()),
  videoIdeaAngles: z.array(z.string()),
  toneAndStyle: z.array(z.string()),
});

export type ChannelProfileAI = z.infer<typeof ChannelProfileAISchema>;

// ── Route body schemas ───────────────────────────────────────

export const UpdateProfileBodySchema = z.object({
  input: ChannelProfileInputSchema,
});

export const GenerateProfileBodySchema = z.object({
  force: z.boolean().optional().default(false),
});
