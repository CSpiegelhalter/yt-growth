/**
 * Competitor Search Page Utilities
 * 
 * Client-safe utilities for validation and formatting.
 */

import { parseYouTubeVideoId } from "@/lib/youtube-video-id";

// ============================================
// URL VALIDATION
// ============================================

type UrlValidationResult = {
  isValid: boolean;
  videoId: string | null;
  error: string | null;
};

/**
 * Validate a YouTube video URL and extract the video ID.
 * Returns validation result with video ID or error message.
 * Delegates parsing to the canonical parseYouTubeVideoId.
 */
export function validateYouTubeUrl(url: string): UrlValidationResult {
  if (!url || typeof url !== "string") {
    return { isValid: true, videoId: null, error: null };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { isValid: true, videoId: null, error: null };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, videoId: null, error: "Invalid URL format" };
  }

  const host = parsed.hostname.toLowerCase();
  const validHosts = [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtu.be",
  ];

  if (!validHosts.includes(host)) {
    return {
      isValid: false,
      videoId: null,
      error: "Please enter a valid YouTube URL (youtube.com or youtu.be)",
    };
  }

  const videoId = parseYouTubeVideoId(trimmed);
  if (videoId) {
    return { isValid: true, videoId, error: null };
  }

  if (host === "youtu.be" || host === "www.youtu.be") {
    return {
      isValid: false,
      videoId: null,
      error: "Could not extract video ID from youtu.be URL",
    };
  }
  if (parsed.pathname === "/watch") {
    return {
      isValid: false,
      videoId: null,
      error: "Missing or invalid video ID in URL",
    };
  }
  return {
    isValid: false,
    videoId: null,
    error: "Unrecognized YouTube URL format. Try a video or Shorts URL.",
  };
}

/**
 * Check if niche text meets minimum requirements.
 */
export function validateNicheText(text: string): {
  isValid: boolean;
  error: string | null;
} {
  const trimmed = (text || "").trim();
  
  if (!trimmed) {
    return { isValid: true, error: null }; // Empty is valid if URL is provided
  }
  
  if (trimmed.length < 3) {
    return { isValid: false, error: "Please enter at least 3 characters" };
  }
  
  return { isValid: true, error: null };
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format a date string for display.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// ============================================
// FILTER STATE SERIALIZATION
// ============================================

import type { FilterState } from "./CompetitorFilters";

/**
 * Serialize filter state to URL search params.
 */
export function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.contentType !== "both") {
    params.set("type", filters.contentType);
  }
  if (filters.dateRange !== "90d") {
    params.set("range", filters.dateRange);
  }
  if (filters.minViewsPerDay !== 10) {
    params.set("minVpd", String(filters.minViewsPerDay));
  }
  if (filters.sortBy !== "viewsPerDay") {
    params.set("sort", filters.sortBy);
  }
  
  return params;
}

/**
 * Deserialize filter state from URL search params.
 */
export function deserializeFilters(params: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};
  
  const type = params.get("type");
  if (type === "shorts" || type === "long" || type === "both") {
    filters.contentType = type;
  }
  
  const range = params.get("range");
  if (range === "7d" || range === "30d" || range === "90d" || range === "365d") {
    filters.dateRange = range;
  }
  
  const minVpd = params.get("minVpd");
  if (minVpd) {
    const parsed = parseInt(minVpd, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      filters.minViewsPerDay = parsed;
    }
  }
  
  const sort = params.get("sort");
  if (sort === "viewsPerDay" || sort === "totalViews" || sort === "newest" || sort === "engagement") {
    filters.sortBy = sort;
  }
  
  return filters;
}
