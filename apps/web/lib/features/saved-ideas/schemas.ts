import { z } from "zod";

export const SaveIdeaBodySchema = z.object({
  ideaId: z.string().min(1),
  channelId: z.union([z.number(), z.string()]).nullable().optional(),
  title: z.string().min(1).max(500),
  angle: z.string().nullable().optional(),
  format: z.string().min(1),
  difficulty: z.string().min(1),
  ideaJson: z.record(z.unknown()),
  notes: z.string().optional(),
});

export const UpdateIdeaBodySchema = z.object({
  notes: z.string().optional(),
  status: z.enum(["saved", "in_progress", "filmed", "published"]).optional(),
  ideaJson: z.record(z.unknown()).optional(),
});

export const IdeaParamsSchema = z.object({
  ideaId: z.string().min(1),
});

export const MoreIdeasParamsSchema = z.object({
  channelId: z.string().min(1),
});

const MoreIdeasSeedSchema = z.object({
  ideaId: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  keywords: z.array(z.string()),
  hooks: z.array(z.string()),
  inspiredByVideoIds: z.array(z.string()).optional(),
});

export const MoreIdeasBodySchema = z.object({
  seed: MoreIdeasSeedSchema,
});
