/**
 * Competitor Search Utilities
 *
 * Pure functions that can be imported in tests (no server-only import).
 * These are shared between client and server code.
 */

import crypto from "crypto";
import type {
  CompetitorSearchFilters,
  CompetitorVideoResult,
  DerivedMetrics,
  ContentTypeFilter,
  DateRangePreset,
  InferredNiche,
} from "./types";
import { DEFAULT_FILTERS } from "./types";

// ============================================
// NICHE TEXT UTILITIES
// ============================================

// Common stopwords to filter from query generation
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "used",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "and",
  "but",
  "if",
  "or",
  "because",
  "until",
  "while",
  "although",
  "though",
  "this",
  "that",
  "these",
  "those",
  "i",
  "me",
  "my",
  "myself",
  "we",
  "our",
  "ours",
  "ourselves",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "he",
  "him",
  "his",
  "himself",
  "she",
  "her",
  "hers",
  "herself",
  "it",
  "its",
  "itself",
  "they",
  "them",
  "their",
  "theirs",
  "themselves",
  "what",
  "which",
  "who",
  "whom",
  "video",
  "videos",
  "youtube",
  "channel",
  "watch",
  "subscribe",
  "like",
  "comment",
  "share",
]);

/**
 * Sanitize user-provided niche text.
 */
export function sanitizeNicheText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return (
    text
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 500)
      .trim()
  );
}

/**
 * Extract meaningful keywords from text.
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));

  return [...new Set(words)];
}

/**
 * Generate search queries from keywords.
 */
function generateQueryTerms(
  keywords: string[],
  categoryName?: string
): string[] {
  if (keywords.length === 0) return [];

  const queries: string[] = [];
  const topKeywords = keywords.slice(0, 15);

  // Single keyword queries
  for (const kw of topKeywords.slice(0, 5)) {
    if (kw.length >= 3) {
      queries.push(kw);
    }
  }

  // Two-word combinations
  for (let i = 0; i < Math.min(topKeywords.length - 1, 5); i++) {
    for (let j = i + 1; j < Math.min(topKeywords.length, i + 4); j++) {
      queries.push(`${topKeywords[i]} ${topKeywords[j]}`);
    }
  }

  // Category-based queries
  if (categoryName) {
    const catLower = categoryName.toLowerCase();
    queries.push(catLower);
    for (const kw of topKeywords.slice(0, 3)) {
      queries.push(`${catLower} ${kw}`);
    }
  }

  return [...new Set(queries)].slice(0, 15);
}

/**
 * Infer niche from text input only (pure function, no API calls).
 */
export function inferNicheFromText(nicheText: string): InferredNiche {
  const sanitized = sanitizeNicheText(nicheText);
  const keywords = extractKeywords(sanitized);
  const queryTerms = generateQueryTerms(keywords);

  return {
    niche: sanitized || "General content",
    queryTerms: queryTerms.length > 0 ? queryTerms : [sanitized || "youtube"],
    source: "text",
    inferredAt: new Date().toISOString(),
  };
}

/**
 * Validate and extract video ID from a YouTube URL.
 */
export function validateAndExtractVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    const validHosts = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
    ];
    if (!validHosts.includes(host)) {
      return null;
    }

    // youtu.be format
    if (host === "youtu.be") {
      const videoId = parsed.pathname.slice(1).split("/")[0];
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
      return null;
    }

    // youtube.com/watch?v=
    if (parsed.pathname === "/watch") {
      const videoId = parsed.searchParams.get("v");
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }

    // youtube.com/shorts/, /embed/, /v/
    const pathMatch = parsed.pathname.match(
      /^\/(?:shorts|embed|v)\/([a-zA-Z0-9_-]{11})/
    );
    if (pathMatch) {
      return pathMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a hash of niche data for logging (privacy-preserving).
 */
export function hashNicheForLogging(niche: InferredNiche): string {
  const data = `${niche.source}:${niche.queryTerms.slice(0, 3).join(",")}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

// ============================================
// CACHE KEY UTILITIES
// ============================================

/**
 * Normalize filters for stable cache keys.
 */
export function normalizeFilters(
  filters: CompetitorSearchFilters
): Record<string, unknown> {
  const now = new Date();
  const normalized: Record<string, unknown> = {};

  normalized.contentType = filters.contentType ?? DEFAULT_FILTERS.contentType;

  const dateRangePreset =
    filters.dateRangePreset ?? DEFAULT_FILTERS.dateRangePreset;
  if (dateRangePreset !== "custom") {
    const daysMap: Record<DateRangePreset, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "365d": 365,
      custom: 0,
    };
    const days = daysMap[dateRangePreset] || 90;
    const postedAfter = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    normalized.postedAfter = postedAfter.toISOString().split("T")[0];
  } else {
    if (filters.postedAfter) {
      normalized.postedAfter = filters.postedAfter.split("T")[0];
    }
    if (filters.postedBefore) {
      normalized.postedBefore = filters.postedBefore.split("T")[0];
    }
  }

  if (filters.channelCreatedAfter) {
    normalized.channelCreatedAfter = filters.channelCreatedAfter.split("T")[0];
  }
  if (filters.channelCreatedBefore) {
    normalized.channelCreatedBefore = filters.channelCreatedBefore.split("T")[0];
  }

  const minVpd = filters.minViewsPerDay ?? DEFAULT_FILTERS.minViewsPerDay;
  normalized.minViewsPerDay = Math.round(minVpd);
  if (filters.maxViewsPerDay !== undefined) {
    normalized.maxViewsPerDay = Math.round(filters.maxViewsPerDay);
  }

  if (filters.minTotalViews !== undefined) {
    normalized.minTotalViews = Math.round(filters.minTotalViews);
  }
  if (filters.maxTotalViews !== undefined) {
    normalized.maxTotalViews = Math.round(filters.maxTotalViews);
  }

  normalized.sortBy = filters.sortBy ?? DEFAULT_FILTERS.sortBy;
  normalized.targetResultCount =
    filters.targetResultCount ?? DEFAULT_FILTERS.targetResultCount;

  return normalized;
}

/**
 * Recursively sort object keys for stable JSON stringification.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Create a stable cache key from search parameters.
 */
export function makeCacheKey(
  mode: "competitor_search" | "search_my_niche",
  niche: string,
  queryTerms: string[],
  filters: CompetitorSearchFilters
): string {
  const normalized = normalizeFilters(filters);

  const keyData = {
    mode,
    niche: niche.toLowerCase().trim(),
    queryTerms: [...queryTerms].sort(),
    filters: normalized,
  };

  // Recursively sort all keys for stable stringification
  const sortedData = sortObjectKeys(keyData);
  const jsonStr = JSON.stringify(sortedData);
  return crypto.createHash("sha256").update(jsonStr).digest("hex").slice(0, 32);
}

// ============================================
// DERIVED METRICS
// ============================================

/**
 * Calculate derived metrics for a video.
 */
export function calculateDerivedMetrics(
  viewCount: number,
  publishedAt: string,
  likeCount?: number,
  commentCount?: number
): DerivedMetrics {
  const now = Date.now();
  const publishedMs = new Date(publishedAt).getTime();
  const daysSincePublished = Math.max(
    1,
    Math.floor((now - publishedMs) / (1000 * 60 * 60 * 24))
  );

  const effectiveDays = Math.max(0.5, daysSincePublished);
  const viewsPerDay = Math.round(viewCount / effectiveDays);

  let engagementPerView: number | undefined;
  if (likeCount !== undefined && commentCount !== undefined && viewCount > 0) {
    engagementPerView = (likeCount + commentCount) / viewCount;
  }

  return {
    viewsPerDay,
    daysSincePublished,
    engagementPerView,
  };
}

// ============================================
// FILTER APPLICATION
// ============================================

/**
 * Check if video passes content type filter.
 */
function passesContentTypeFilter(
  durationSec: number | undefined,
  filter: ContentTypeFilter
): boolean {
  if (filter === "both") return true;
  if (durationSec === undefined) return true;

  const isShort = durationSec < 60;
  if (filter === "shorts") return isShort;
  if (filter === "long") return !isShort;
  return true;
}

/**
 * Check if a video passes all filters.
 */
export function passesFilters(
  video: {
    publishedAt: string;
    durationSec?: number;
    viewCount: number;
    derived: DerivedMetrics;
  },
  filters: CompetitorSearchFilters
): boolean {
  const contentType = filters.contentType ?? DEFAULT_FILTERS.contentType;
  if (!passesContentTypeFilter(video.durationSec, contentType)) {
    return false;
  }

  if (filters.postedAfter) {
    const postedAfterMs = new Date(filters.postedAfter).getTime();
    const videoMs = new Date(video.publishedAt).getTime();
    if (videoMs < postedAfterMs) return false;
  }
  if (filters.postedBefore) {
    const postedBeforeMs = new Date(filters.postedBefore).getTime();
    const videoMs = new Date(video.publishedAt).getTime();
    if (videoMs > postedBeforeMs) return false;
  }

  const minVpd = filters.minViewsPerDay ?? DEFAULT_FILTERS.minViewsPerDay;
  if (video.derived.viewsPerDay < minVpd) return false;

  if (
    filters.maxViewsPerDay !== undefined &&
    video.derived.viewsPerDay > filters.maxViewsPerDay
  ) {
    return false;
  }

  if (
    filters.minTotalViews !== undefined &&
    video.viewCount < filters.minTotalViews
  ) {
    return false;
  }
  if (
    filters.maxTotalViews !== undefined &&
    video.viewCount > filters.maxTotalViews
  ) {
    return false;
  }

  return true;
}

/**
 * Sort videos by the specified option.
 */
export function sortVideos(
  videos: CompetitorVideoResult[],
  sortBy: CompetitorSearchFilters["sortBy"]
): CompetitorVideoResult[] {
  const sorted = [...videos];

  switch (sortBy ?? DEFAULT_FILTERS.sortBy) {
    case "viewsPerDay":
      sorted.sort((a, b) => b.derived.viewsPerDay - a.derived.viewsPerDay);
      break;
    case "totalViews":
      sorted.sort((a, b) => b.stats.viewCount - a.stats.viewCount);
      break;
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      break;
    case "engagement":
      sorted.sort((a, b) => {
        const engA = a.derived.engagementPerView ?? 0;
        const engB = b.derived.engagementPerView ?? 0;
        return engB - engA;
      });
      break;
  }

  return sorted;
}
