import { z } from "zod";

import type { RelatedKeyword, YouTubeRanking } from "./types";

export type KeywordTaskResponse = {
  pending?: boolean;
  taskId?: string;
  rows?: unknown;
  [key: string]: unknown;
};

export type KeywordResearchResponse = {
  needsAuth?: boolean;
  pending?: boolean;
  taskId?: string;
  rows?: unknown;
  [key: string]: unknown;
};

export type KeywordTrendsResponse = {
  pending?: boolean;
  taskId?: string;
  [key: string]: unknown;
};

export type YoutubeSerpResponse = {
  needsAuth?: boolean;
  results?: unknown[];
  [key: string]: unknown;
};

const MonthlySearchSchema = z.object({
  year: z.number(),
  month: z.number(),
  searchVolume: z.number(),
});

const KeywordMetricsResponseSchema = z.object({
  keyword: z.string(),
  searchVolume: z.number().default(0),
  keywordDifficulty: z.number().default(0),
  trend: z.array(z.number()).default([]),
  monthlySearches: z.array(MonthlySearchSchema).optional(),
  intent: z.string().nullable().optional(),
  cpc: z.number().nullable().optional(),
  competition: z.number().nullable().optional(),
  competitionIndex: z.number().nullable().optional(),
  competitionLevel: z.string().nullable().optional(),
  lowTopOfPageBid: z.number().nullable().optional(),
  highTopOfPageBid: z.number().nullable().optional(),
  difficultyIsEstimate: z.boolean().optional().default(true),
});

const RelatedKeywordResponseSchema = KeywordMetricsResponseSchema.extend({
  relevance: z.number().nullable().optional(),
});

const YouTubeRankingResponseSchema = z.object({
  position: z.number(),
  title: z.string(),
  channelName: z.string(),
  channelUrl: z.string(),
  videoUrl: z.string(),
  videoId: z.string(),
  views: z.number().nullable(),
  publishedDate: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  duration: z.string().nullable(),
});

const GoogleTrendsTimePointSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  timestamp: z.number(),
  value: z.number(),
  missingData: z.boolean(),
});

const GoogleTrendsRisingQuerySchema = z.object({
  query: z.string(),
  value: z.number(),
});

const GoogleTrendsRegionSchema = z.object({
  geoId: z.string(),
  geoName: z.string(),
  value: z.number(),
});

export const GoogleTrendsResponseSchema = z.object({
  keyword: z.string(),
  interestOverTime: z.array(GoogleTrendsTimePointSchema).default([]),
  risingQueries: z.array(GoogleTrendsRisingQuerySchema).default([]),
  topQueries: z
    .array(z.object({ query: z.string(), value: z.number() }))
    .default([]),
  regionBreakdown: z.array(GoogleTrendsRegionSchema).default([]),
  averageInterest: z.number().default(0),
});

function parseRelatedKeyword(data: unknown): RelatedKeyword | null {
  try {
    const parsed = RelatedKeywordResponseSchema.parse(data);
    return {
      ...parsed,
      intent: parsed.intent ?? null,
      cpc: parsed.cpc ?? null,
      competition: parsed.competition ?? null,
      competitionIndex: parsed.competitionIndex ?? null,
      competitionLevel: parsed.competitionLevel ?? null,
      relevance: parsed.relevance ?? undefined,
    };
  } catch (error) {
    console.warn("Failed to parse related keyword:", error);
    return null;
  }
}

function parseYouTubeRanking(data: unknown): YouTubeRanking | null {
  try {
    return YouTubeRankingResponseSchema.parse(data);
  } catch (error) {
    console.warn("Failed to parse YouTube ranking:", error);
    return null;
  }
}

export function parseRelatedKeywordRows(rows: unknown): RelatedKeyword[] {
  if (!Array.isArray(rows)) {return [];}
  return (rows as unknown[])
    .map((row) => parseRelatedKeyword(row))
    .filter((row): row is RelatedKeyword => row !== null);
}

export function parseYouTubeRankingResults(
  results: unknown[],
): YouTubeRanking[] {
  return results
    .map((item) => parseYouTubeRanking(item))
    .filter((item): item is YouTubeRanking => item !== null);
}
