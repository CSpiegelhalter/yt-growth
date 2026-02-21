/**
 * Domain types for the tags feature.
 *
 * Covers LLM-based tag generation and tag extraction from existing videos.
 */

// ── Shared ──────────────────────────────────────────────────

export type ReferenceVideoContext = {
  title: string;
  description: string;
  tags: string[];
  channelTitle: string;
};

/**
 * Minimal video snippet returned by the YouTube dependency.
 * Kept narrow so routes can satisfy it from any data source
 * (API-key fetch, OAuth fetch, cache, etc.).
 */
export type VideoSnippetForTags = {
  title: string;
  description: string;
  tags: string[];
  channelTitle: string;
  thumbnailUrl: string | null;
};

// ── Tag Generation (LLM-based) ─────────────────────────────

export type GenerateTagsInput = {
  title: string;
  description?: string;
  referenceYoutubeUrl?: string;
  userId?: number;
  isPro: boolean;
  ip: string;
};

export type GenerateTagsResult = {
  tags: string[];
  notes: string[];
  copyComma: string;
  copyLines: string;
  remaining: number;
  resetAt: string;
};

// ── Tag Extraction (from existing video) ────────────────────

export type ExtractTagsInput = {
  url: string;
};

export type ExtractTagsResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  tags: string[];
  hasTags: boolean;
};
