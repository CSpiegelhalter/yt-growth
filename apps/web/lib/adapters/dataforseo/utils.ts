/**
 * DataForSEO Utilities
 *
 * Pure utility functions for DataForSEO API client.
 * These are testable without server-only restrictions.
 */

import { stableHash } from "@/lib/shared/stable-hash";

// ============================================
// LOCATION & LANGUAGE MAPPINGS
// ============================================

/**
 * Location codes for DataForSEO
 * Maps our simplified region codes to DataForSEO location_code + language_code
 *
 * Docs: https://api.dataforseo.com/v3/keywords_data/google_ads/locations
 */
export const LOCATION_MAP = {
  us: { location_code: 2840, language_code: "en", name: "United States" },
  uk: { location_code: 2826, language_code: "en", name: "United Kingdom" },
  ca: { location_code: 2124, language_code: "en", name: "Canada" },
  au: { location_code: 2036, language_code: "en", name: "Australia" },
  de: { location_code: 2276, language_code: "de", name: "Germany" },
  fr: { location_code: 2250, language_code: "fr", name: "France" },
  es: { location_code: 2724, language_code: "es", name: "Spain" },
  it: { location_code: 2380, language_code: "it", name: "Italy" },
  br: { location_code: 2076, language_code: "pt", name: "Brazil" },
  mx: { location_code: 2484, language_code: "es", name: "Mexico" },
  in: { location_code: 2356, language_code: "en", name: "India" },
  jp: { location_code: 2392, language_code: "ja", name: "Japan" },
  nl: { location_code: 2528, language_code: "nl", name: "Netherlands" },
  be: { location_code: 2056, language_code: "nl", name: "Belgium" },
  se: { location_code: 2752, language_code: "sv", name: "Sweden" },
  no: { location_code: 2578, language_code: "no", name: "Norway" },
  dk: { location_code: 2208, language_code: "da", name: "Denmark" },
  fi: { location_code: 2246, language_code: "fi", name: "Finland" },
  pl: { location_code: 2616, language_code: "pl", name: "Poland" },
  tr: { location_code: 2792, language_code: "tr", name: "Turkey" },
  sg: { location_code: 2702, language_code: "en", name: "Singapore" },
  hk: { location_code: 2344, language_code: "zh-TW", name: "Hong Kong" },
  tw: { location_code: 2158, language_code: "zh-TW", name: "Taiwan" },
  kr: { location_code: 2410, language_code: "ko", name: "South Korea" },
  ar: { location_code: 2032, language_code: "es", name: "Argentina" },
  cl: { location_code: 2152, language_code: "es", name: "Chile" },
  co: { location_code: 2170, language_code: "es", name: "Colombia" },
  za: { location_code: 2710, language_code: "en", name: "South Africa" },
  ie: { location_code: 2372, language_code: "en", name: "Ireland" },
  at: { location_code: 2040, language_code: "de", name: "Austria" },
  ch: { location_code: 2756, language_code: "de", name: "Switzerland" },
  pt: { location_code: 2620, language_code: "pt", name: "Portugal" },
  nz: { location_code: 2554, language_code: "en", name: "New Zealand" },
  ph: { location_code: 2608, language_code: "en", name: "Philippines" },
  my: { location_code: 2458, language_code: "en", name: "Malaysia" },
  th: { location_code: 2764, language_code: "th", name: "Thailand" },
  vn: { location_code: 2704, language_code: "vi", name: "Vietnam" },
  id: { location_code: 2360, language_code: "id", name: "Indonesia" },
  ng: { location_code: 2566, language_code: "en", name: "Nigeria" },
  ru: { location_code: 2643, language_code: "ru", name: "Russia" },
} as const;

export type LocationCode = keyof typeof LOCATION_MAP;

export const SUPPORTED_LOCATIONS = Object.keys(LOCATION_MAP) as LocationCode[];

// ============================================
// ERROR HANDLING
// ============================================

type DataForSEOErrorCode =
  | "CONFIG_ERROR"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "API_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "AUTH_ERROR"
  | "TASK_PENDING"
  | "RESTRICTED_CATEGORY";

export class DataForSEOError extends Error {
  code: DataForSEOErrorCode;
  taskId?: string;

  constructor(message: string, code: DataForSEOErrorCode, taskId?: string) {
    super(message);
    this.name = "DataForSEOError";
    this.code = code;
    this.taskId = taskId;
  }
}

// ============================================
// VALIDATION
// ============================================

const EMOJI_PATTERN = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu;

/**
 * Validate and sanitize keyword phrase for DataForSEO Standard API.
 *
 * Enforces stricter limits for Standard task-based workflow:
 * - Max 80 characters per keyword
 * - Max 10 words per keyword
 * - No emojis or unsupported Unicode
 * - Lowercased and normalized
 */
export function validatePhrase(phrase: string): string {
  const cleaned = phrase.trim().replace(/\s+/g, " ");

  if (cleaned.length === 0) {
    throw new DataForSEOError("Keyword phrase is required", "VALIDATION_ERROR");
  }

  if (EMOJI_PATTERN.test(cleaned)) {
    throw new DataForSEOError(
      "Keywords cannot contain emojis or special symbols",
      "VALIDATION_ERROR"
    );
  }

  if (cleaned.length > 80) {
    throw new DataForSEOError(
      "Keyword too long (max 80 characters)",
      "VALIDATION_ERROR"
    );
  }

  const wordCount = cleaned.split(" ").length;
  if (wordCount > 10) {
    throw new DataForSEOError(
      "Keyword has too many words (max 10 words)",
      "VALIDATION_ERROR"
    );
  }

  const allowedPattern = /^[\w\s\-.,&'"+?!]+$/i;
  if (!allowedPattern.test(cleaned)) {
    throw new DataForSEOError(
      "Keyword contains invalid characters",
      "VALIDATION_ERROR"
    );
  }

  return cleaned.toLowerCase();
}

/**
 * Validate an array of keywords for bulk operations.
 */
export function validateKeywords(
  keywords: string[],
  maxKeywords: number = 1000
): { valid: string[]; invalid: { keyword: string; error: string }[] } {
  if (keywords.length > maxKeywords) {
    throw new DataForSEOError(
      `Too many keywords (max ${maxKeywords} per request)`,
      "VALIDATION_ERROR"
    );
  }

  const valid: string[] = [];
  const invalid: { keyword: string; error: string }[] = [];

  for (const kw of keywords) {
    try {
      const cleaned = validatePhrase(kw);
      valid.push(cleaned);
    } catch (err) {
      invalid.push({
        keyword: kw,
        error: err instanceof DataForSEOError ? err.message : "Invalid keyword",
      });
    }
  }

  return { valid, invalid };
}

/**
 * Validate location code and return DataForSEO location info
 */
export function validateLocation(location: string): {
  location_code: number;
  language_code: string;
  region: LocationCode;
} {
  const lower = location.toLowerCase() as LocationCode;
  const info = LOCATION_MAP[lower];

  if (!info) {
    throw new DataForSEOError(`Invalid location: ${location}`, "VALIDATION_ERROR");
  }

  return {
    location_code: info.location_code,
    language_code: info.language_code,
    region: lower,
  };
}

// ============================================
// HASHING
// ============================================

/**
 * Generate a stable cache key hash for a request.
 */
export function generateRequestHash(params: {
  mode: string;
  phrase?: string;
  keywords?: string[];
  location: string;
  limit?: number;
  searchPartners?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): string {
  const normalizedKeywords = params.keywords
    ? [...params.keywords].map((k) => k.toLowerCase().trim()).sort()
    : params.phrase
      ? [params.phrase.toLowerCase().trim()]
      : [];

  return stableHash({
    mode: params.mode,
    keywords: normalizedKeywords,
    location: params.location.toLowerCase(),
    limit: params.limit ?? 100,
    searchPartners: params.searchPartners ?? false,
    dateFrom: params.dateFrom ?? null,
    dateTo: params.dateTo ?? null,
  });
}

// ============================================
// DIFFICULTY HEURISTIC
// ============================================

/**
 * Calculate estimated keyword difficulty from available Google Ads signals.
 *
 * NOTE: This is an ESTIMATE. True difficulty would require SERP analysis.
 * Search volume is the PRIMARY indicator — more searches = more competition.
 */
export function calculateDifficultyHeuristic(params: {
  competitionIndex?: number | null;
  competition?: number | null;
  cpc?: number | null;
  highTopOfPageBid?: number | null;
  searchVolume?: number | null;
}): number {
  const searchVolume = params.searchVolume ?? 0;
  const cpc = params.cpc ?? 0;
  const highBid = params.highTopOfPageBid ?? 0;
  
  let volumeScore = 0;
  if (searchVolume <= 0) {
    volumeScore = 5;
  } else if (searchVolume < 100) {
    volumeScore = 10 + (searchVolume / 100) * 10;
  } else if (searchVolume < 1000) {
    volumeScore = 20 + ((searchVolume - 100) / 900) * 15;
  } else if (searchVolume < 10000) {
    volumeScore = 35 + ((searchVolume - 1000) / 9000) * 20;
  } else if (searchVolume < 100000) {
    volumeScore = 55 + ((searchVolume - 10000) / 90000) * 20;
  } else if (searchVolume < 1000000) {
    volumeScore = 75 + ((searchVolume - 100000) / 900000) * 15;
  } else {
    volumeScore = 90 + Math.min((searchVolume - 1000000) / 10000000, 1) * 10;
  }
  
  const cpcScore = Math.min(cpc / 5, 1) * 15;
  const bidScore = Math.min(highBid / 10, 1) * 5;
  
  const rawScore = volumeScore + cpcScore + bidScore;
  return Math.round(Math.min(Math.max(rawScore, 0), 100));
}

// ============================================
// NUMERIC PARSING HELPERS
// ============================================

export function parseNumeric(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) {return fallback;}
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return isNaN(num) ? fallback : num;
}

export function parseInteger(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) {return fallback;}
  const num = typeof value === "number" ? Math.round(value) : parseInt(String(value), 10);
  return isNaN(num) ? fallback : num;
}

/**
 * Parse monthly search trend data from DataForSEO format
 */
export function parseMonthlyTrend(
  monthlySearches: Array<{ year: number; month: number; search_volume: number }> | undefined
): number[] {
  if (!monthlySearches || !Array.isArray(monthlySearches)) {
    return [];
  }

  const sorted = [...monthlySearches]
    .sort((a, b) => {
      if (a.year !== b.year) {return a.year - b.year;}
      return a.month - b.month;
    })
    .slice(-12);

  return sorted.map((m) => m.search_volume ?? 0);
}

/**
 * Parse competition level string to competition index value.
 */
export function parseCompetitionLevel(level: string | null | undefined): number {
  if (!level) {return 0;}

  switch (level.toUpperCase()) {
    case "HIGH":
      return 85;
    case "MEDIUM":
      return 50;
    case "LOW":
      return 15;
    default:
      return 0;
  }
}

/**
 * Check if a keyword error indicates a restricted category.
 */
export function isRestrictedCategoryError(statusCode: number, message?: string): boolean {
  if (statusCode === 40501 || statusCode === 40502) {
    return true;
  }

  if (message) {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes("restricted") ||
      lowerMessage.includes("prohibited") ||
      lowerMessage.includes("policy") ||
      lowerMessage.includes("not available")
    );
  }

  return false;
}
