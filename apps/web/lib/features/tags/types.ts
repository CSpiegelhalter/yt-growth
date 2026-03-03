/**
 * Domain types for the tags feature.
 *
 * Covers tag extraction from existing videos.
 */

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
