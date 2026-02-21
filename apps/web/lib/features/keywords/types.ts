/**
 * Domain types for the keywords feature.
 *
 * These are the input/output DTOs used by use-cases. They decouple route
 * handlers from the DataForSEO-specific types so domain logic stays portable.
 */

// ── Shared sub-types ────────────────────────────────────────────

export type UsageInfo = {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string | Date;
};

// ── researchKeywords ────────────────────────────────────────────

export type ResearchMode = "overview" | "related" | "combined";

export type ResearchKeywordsInput = {
  userId: number;
  mode: ResearchMode;
  phrase?: string;
  phrases?: string[];
  database: string;
  displayLimit?: number;
  isPro: boolean;
};

export type ResearchKeywordsResult =
  | { type: "success"; overview: Record<string, unknown> | null; rows: Record<string, unknown>[]; meta: Record<string, unknown>; usage: UsageInfo }
  | { type: "pending"; body: Record<string, unknown> }
  | { type: "quota_exceeded"; usage: UsageInfo & { plan: string } };

// ── getKeywordTrends ────────────────────────────────────────────

export type GetKeywordTrendsInput = {
  userId: number;
  keyword: string;
  database: string;
  dateFrom?: string;
  dateTo?: string;
  isPro: boolean;
};

export type GetKeywordTrendsResult =
  | { type: "success"; body: Record<string, unknown> }
  | { type: "pending"; body: Record<string, unknown> }
  | { type: "quota_exceeded"; usage: UsageInfo & { plan: string } };

// ── getYoutubeSerp ──────────────────────────────────────────────

export type GetYoutubeSerpInput = {
  userId: number;
  keyword: string;
  location: string;
  limit: number;
};

export type GetYoutubeSerpResult = {
  type: "success";
  body: Record<string, unknown>;
};

// ── generateKeywordIdeas ────────────────────────────────────────

export type AudienceLevel = "beginner" | "intermediate" | "advanced" | "all";
export type FormatPreference = "shorts" | "longform" | "mixed";

export type GenerateKeywordIdeasInput = {
  topicDescription: string;
  locationCode: string;
  audienceLevel: AudienceLevel;
  formatPreference: FormatPreference;
};

export type GenerateKeywordIdeasResult =
  | { type: "success"; body: Record<string, unknown> }
  | { type: "needs_upgrade"; body: Record<string, unknown> };

// ── pollKeywordTask ────────────────────────────────────────────

export type PollKeywordTaskInput = {
  userId: number;
  taskId: string;
};

export type PollKeywordTaskResult =
  | { type: "pending"; body: Record<string, unknown> }
  | { type: "completed"; body: Record<string, unknown> };
