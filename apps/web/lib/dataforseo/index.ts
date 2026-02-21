import { ApiError } from "@/lib/api/errors";
import {
  validatePhrase,
  validateLocation,
  DataForSEOError,
  type LocationCode,
} from "@/lib/adapters/dataforseo/utils";

// ============================================
// CENTRALIZED VALIDATION + ERROR MAPPING
// ============================================

/**
 * Validate and normalize phrase(s) + location for any DataForSEO call.
 * Throws ApiError (400/VALIDATION_ERROR) on invalid input so routes
 * never need to catch DataForSEOError from validation.
 */
export function prepareDataForSeoRequest(input: {
  phrase?: string;
  phrases?: string[];
  location?: string;
}): {
  cleanPhrases: string[];
  locationInfo: { location_code: number; language_code: string; region: LocationCode };
} {
  try {
    const cleanPhrases: string[] = [];
    if (input.phrases) {
      cleanPhrases.push(...input.phrases.map((p) => validatePhrase(p)));
    } else if (input.phrase) {
      cleanPhrases.push(validatePhrase(input.phrase));
    }
    const locationInfo = validateLocation(input.location ?? "us");
    return { cleanPhrases, locationInfo };
  } catch (err) {
    if (err instanceof DataForSEOError) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: err.message,
      });
    }
    throw err;
  }
}

/**
 * Map a DataForSEOError to the canonical ApiError used by the API layer.
 */
export function mapDataForSEOError(err: DataForSEOError): ApiError {
  switch (err.code) {
    case "RATE_LIMITED":
      return new ApiError({
        code: "RATE_LIMITED",
        status: 429,
        message: "Service is busy. Please try again in a moment.",
      });
    case "QUOTA_EXCEEDED":
      return new ApiError({
        code: "SERVICE_UNAVAILABLE",
        status: 503,
        message: "Keyword service is temporarily unavailable.",
      });
    case "TIMEOUT":
      return new ApiError({
        code: "TIMEOUT",
        status: 504,
        message: "Request timed out. Please try again.",
      });
    case "VALIDATION_ERROR":
      return new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: err.message,
      });
    case "AUTH_ERROR":
      return new ApiError({
        code: "SERVICE_UNAVAILABLE",
        status: 503,
        message: "Keyword service is temporarily unavailable.",
      });
    case "RESTRICTED_CATEGORY":
      return new ApiError({
        code: "RESTRICTED_CONTENT",
        status: 400,
        message: "Some keywords can't return data due to Google Ads restrictions.",
      });
    default:
      return new ApiError({
        code: "INTERNAL",
        status: 500,
        message: err.message,
      });
  }
}

// Re-export from adapter (server-only)
export {
  fetchKeywordOverview,
  fetchRelatedKeywords,
  fetchCombinedKeywordData,
  fetchGoogleTrends,
  getSearchVolumeTask,
  getKeywordsForKeywordsTask,
  getGoogleTrendsTask,
  parseGoogleTrendsResult,
  type KeywordMetrics,
  type RelatedKeywordRow,
  type KeywordOverviewResponse,
  type KeywordRelatedResponse,
  type KeywordCombinedResponse,
} from "@/lib/adapters/dataforseo/client";

// Re-export YouTube SERP client (server-only)
export {
  fetchYouTubeSerp,
  type YouTubeSerpResponse,
} from "@/lib/adapters/dataforseo/youtube-serp";

// Re-export competitive context — barrel delegates to lib/features/video-insights/
export {
  fetchCompetitiveContext,
  type CompetitiveContext,
} from "./competitive-context";

// Re-export utilities
export {
  DataForSEOError,
} from "@/lib/adapters/dataforseo/utils";
