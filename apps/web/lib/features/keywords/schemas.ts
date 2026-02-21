import { z } from "zod";
import { SUPPORTED_LOCATIONS } from "@/lib/dataforseo/utils";

const locationField = z
  .string()
  .trim()
  .default("us")
  .refine((val) => SUPPORTED_LOCATIONS.includes(val.toLowerCase() as any), {
    message: "Invalid region code",
  });

const keywordField = z
  .string()
  .trim()
  .min(1, "Keyword is required")
  .max(80, "Keyword too long (max 80 characters)");

// ── /api/keywords/research ──────────────────────────────────────

export const ResearchKeywordsBodySchema = z
  .object({
    mode: z.enum(["overview", "related", "combined"]),
    phrase: keywordField.optional(),
    phrases: z
      .array(z.string().trim().min(1).max(80))
      .min(1, "At least one keyword is required")
      .max(10, "Maximum 10 keywords allowed")
      .optional(),
    database: locationField,
    displayLimit: z.number().int().min(1).max(100).optional(),
  })
  .refine((data) => data.phrase || (data.phrases && data.phrases.length > 0), {
    message: "Either phrase or phrases must be provided",
  });

export type ResearchKeywordsBody = z.infer<typeof ResearchKeywordsBodySchema>;

// ── /api/keywords/trends ────────────────────────────────────────

export const KeywordTrendsBodySchema = z.object({
  keyword: keywordField,
  database: locationField,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type KeywordTrendsBody = z.infer<typeof KeywordTrendsBodySchema>;

// ── /api/keywords/youtube-serp ──────────────────────────────────

export const YoutubeSerpBodySchema = z.object({
  keyword: keywordField,
  location: locationField,
  limit: z.number().int().min(1).max(20).optional().default(10),
});

export type YoutubeSerpBody = z.infer<typeof YoutubeSerpBodySchema>;

// ── /api/keywords/ideas ─────────────────────────────────────────

export const KeywordIdeasBodySchema = z.object({
  topicDescription: z
    .string()
    .min(3, "Topic must be at least 3 characters")
    .max(500, "Topic must be under 500 characters"),
  locationCode: z.string().default("us"),
  languageCode: z.string().optional(),
  audienceLevel: z
    .enum(["beginner", "intermediate", "advanced", "all"])
    .default("all"),
  formatPreference: z.enum(["shorts", "longform", "mixed"]).default("mixed"),
});

export type KeywordIdeasBody = z.infer<typeof KeywordIdeasBodySchema>;

// ── /api/keywords/task/:id ─────────────────────────────────────

export const TaskIdParamsSchema = z.object({
  id: z.string().min(10, "Invalid task ID"),
});
