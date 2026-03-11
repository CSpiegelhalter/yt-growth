import { z } from "zod";

export const IdeaParamsSchema = z.object({
  channelId: z.string().min(1),
});

export const IdeaDetailParamsSchema = z.object({
  channelId: z.string().min(1),
  ideaId: z.string().uuid(),
});

export const CreateIdeaBodySchema = z.object({
  summary: z.string().min(1).max(150),
  title: z.string().max(500).optional(),
  script: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  postDate: z.string().date().optional(),
});

export const UpdateIdeaBodySchema = z.object({
  summary: z.string().min(1).max(150).optional(),
  title: z.string().max(500).nullable().optional(),
  script: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  postDate: z.string().date().nullable().optional(),
  status: z.enum(["draft", "planned"]).optional(),
});

export const SuggestFieldBodySchema = z.object({
  field: z.enum(["title", "script", "description", "tags", "postDate"]),
  currentIdea: z.object({
    summary: z.string().optional(),
    title: z.string().nullable().optional(),
    script: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    postDate: z.string().nullable().optional(),
  }),
});
