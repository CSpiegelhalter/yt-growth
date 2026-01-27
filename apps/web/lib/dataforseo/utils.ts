/**
 * DataForSEO Utilities
 *
 * Pure utility functions for DataForSEO API client.
 * These are testable without server-only restrictions.
 */

import { createHash } from "crypto";

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

export type DataForSEOErrorCode =
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

// Emoji regex pattern to detect emojis and other unsupported Unicode
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
  // Trim and normalize whitespace
  let cleaned = phrase.trim().replace(/\s+/g, " ");

  // Check for empty
  if (cleaned.length === 0) {
    throw new DataForSEOError("Keyword phrase is required", "VALIDATION_ERROR");
  }

  // Block emojis
  if (EMOJI_PATTERN.test(cleaned)) {
    throw new DataForSEOError(
      "Keywords cannot contain emojis or special symbols",
      "VALIDATION_ERROR"
    );
  }

  // Stricter length limit (80 chars for Standard API)
  if (cleaned.length > 80) {
    throw new DataForSEOError(
      "Keyword too long (max 80 characters)",
      "VALIDATION_ERROR"
    );
  }

  // Max 10 words
  const wordCount = cleaned.split(" ").length;
  if (wordCount > 10) {
    throw new DataForSEOError(
      "Keyword has too many words (max 10 words)",
      "VALIDATION_ERROR"
    );
  }

  // Only allow alphanumeric, spaces, hyphens, and common punctuation
  // More restrictive pattern that blocks most special characters
  const allowedPattern = /^[\w\s\-.,&'"+?!]+$/i;
  if (!allowedPattern.test(cleaned)) {
    throw new DataForSEOError(
      "Keyword contains invalid characters",
      "VALIDATION_ERROR"
    );
  }

  // Lowercase for consistency with DataForSEO
  return cleaned.toLowerCase();
}

/**
 * Validate an array of keywords for bulk operations.
 * Returns array of { keyword, valid, error? }
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
 *
 * For Standard API, includes:
 * - mode (overview/related/search_volume/video-ideas)
 * - keywords array (sorted, normalized)
 * - location_code, language_code
 * - search_partners setting
 * - date_from/date_to if set
 */
export function generateRequestHash(params: {
  mode: string; // flexible to support: overview, related, combined, trends:*, youtube_serp, etc.
  phrase?: string;
  keywords?: string[];
  location: string;
  limit?: number;
  searchPartners?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): string {
  // Normalize keywords array or single phrase
  const normalizedKeywords = params.keywords
    ? [...params.keywords].map((k) => k.toLowerCase().trim()).sort()
    : params.phrase
      ? [params.phrase.toLowerCase().trim()]
      : [];

  const normalized = JSON.stringify({
    mode: params.mode,
    keywords: normalizedKeywords,
    location: params.location.toLowerCase(),
    limit: params.limit ?? 100,
    searchPartners: params.searchPartners ?? false,
    dateFrom: params.dateFrom ?? null,
    dateTo: params.dateTo ?? null,
  });
  return createHash("sha256").update(normalized).digest("hex");
}

// ============================================
// DIFFICULTY HEURISTIC
// ============================================

/**
 * Calculate estimated keyword difficulty from available Google Ads signals.
 *
 * Google Ads data does NOT provide an SEO "keyword difficulty" score.
 * We compute a HEURISTIC estimate based on:
 *   - competition_index (0-100): Google Ads competition index
 *   - cpc: Higher CPC often indicates commercial competition
 *   - high_top_of_page_bid: Premium bid levels suggest competition
 *   - search_volume: Very high volume keywords tend to be competitive
 *
 * Formula:
 *   base = competition_index * 0.6  (0-60 range from competition_index)
 *   cpc_factor = min(cpc / 8, 1) * 20  (0-20 range, caps at $8)
 *   bid_factor = min(high_bid / 15, 1) * 10  (0-10 range, caps at $15)
 *   volume_factor = min(log10(volume) / 7, 1) * 10  (0-10 range)
 *
 * Result is clamped to 0-100.
 *
 * NOTE: This is an ESTIMATE based on ads competition, NOT SEO difficulty.
 * Real keyword difficulty requires analyzing SERP competition, domain authority, etc.
 *
 * @param params.competitionIndex - Google Ads competition_index (0-100)
 * @param params.competition - Legacy competition value (0-1), converted to 0-100 if competitionIndex not provided
 * @param params.cpc - Cost per click
 * @param params.highTopOfPageBid - High top-of-page bid estimate
 * @param params.searchVolume - Monthly search volume
 */
export function calculateDifficultyHeuristic(params: {
  competitionIndex?: number | null; // 0-100 from DataForSEO (Google Ads competition)
  competition?: number | null; // 0-1 from DataForSEO (legacy)
  cpc?: number | null;
  highTopOfPageBid?: number | null;
  searchVolume?: number | null;
}): number {
  /**
   * SEO Difficulty Estimation
   * 
   * NOTE: This is an ESTIMATE. We don't have true SEO difficulty data from the 
   * Standard search_volume endpoint. True difficulty would require SERP analysis.
   * 
   * Key insight: Search volume is the PRIMARY indicator of SEO difficulty.
   * More searches = more content competing = harder to rank.
   * Google Ads competition only tells us about advertisers, not organic competition.
   * 
   * Volume-based difficulty tiers:
   * - 0-100 searches: Very easy (10-20)
   * - 100-1K: Easy (20-35)
   * - 1K-10K: Medium (35-55)
   * - 10K-100K: Hard (55-75)
   * - 100K-1M: Very hard (75-90)
   * - 1M+: Extremely hard (90-100)
   */
  
  const searchVolume = params.searchVolume ?? 0;
  const cpc = params.cpc ?? 0;
  const highBid = params.highTopOfPageBid ?? 0;
  
  // Primary factor: Search volume (0-80 points)
  // This is the main driver of SEO difficulty
  let volumeScore = 0;
  if (searchVolume <= 0) {
    volumeScore = 5; // No data = assume very easy
  } else if (searchVolume < 100) {
    volumeScore = 10 + (searchVolume / 100) * 10; // 10-20
  } else if (searchVolume < 1000) {
    volumeScore = 20 + ((searchVolume - 100) / 900) * 15; // 20-35
  } else if (searchVolume < 10000) {
    volumeScore = 35 + ((searchVolume - 1000) / 9000) * 20; // 35-55
  } else if (searchVolume < 100000) {
    volumeScore = 55 + ((searchVolume - 10000) / 90000) * 20; // 55-75
  } else if (searchVolume < 1000000) {
    volumeScore = 75 + ((searchVolume - 100000) / 900000) * 15; // 75-90
  } else {
    volumeScore = 90 + Math.min((searchVolume - 1000000) / 10000000, 1) * 10; // 90-100
  }
  
  // Secondary factor: CPC indicates commercial value and competition (0-15 points)
  // High CPC = businesses competing = more content = harder
  const cpcScore = Math.min(cpc / 5, 1) * 15;
  
  // Tertiary factor: High bid as additional commercial signal (0-5 points)
  const bidScore = Math.min(highBid / 10, 1) * 5;
  
  // Sum and clamp to 0-100
  const rawScore = volumeScore + cpcScore + bidScore;
  return Math.round(Math.min(Math.max(rawScore, 0), 100));
}

// ============================================
// NUMERIC PARSING HELPERS
// ============================================

/**
 * Parse numeric value with fallback
 */
export function parseNumeric(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return isNaN(num) ? fallback : num;
}

/**
 * Parse integer value with fallback
 */
export function parseInteger(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === "number" ? Math.round(value) : parseInt(String(value), 10);
  return isNaN(num) ? fallback : num;
}

/**
 * Parse monthly search trend data from DataForSEO format
 * DataForSEO returns monthly_searches as array of { year, month, search_volume }
 */
export function parseMonthlyTrend(
  monthlySearches: Array<{ year: number; month: number; search_volume: number }> | undefined
): number[] {
  if (!monthlySearches || !Array.isArray(monthlySearches)) {
    return [];
  }

  // Sort by date (oldest first) and take last 12 months
  const sorted = [...monthlySearches]
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .slice(-12);

  return sorted.map((m) => m.search_volume ?? 0);
}

/**
 * Parse competition level string to competition index value.
 * DataForSEO returns competition_level as "HIGH" | "MEDIUM" | "LOW" | null
 * We convert to approximate 0-100 scale.
 */
export function parseCompetitionLevel(level: string | null | undefined): number {
  if (!level) return 0;

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
 * Google Ads restricts certain categories (gambling, adult, etc.)
 */
export function isRestrictedCategoryError(statusCode: number, message?: string): boolean {
  // Status codes that indicate restricted content
  if (statusCode === 40501 || statusCode === 40502) {
    return true;
  }

  // Check message for restriction indicators
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

// ============================================
// RATE LIMITING HELPERS
// ============================================

/**
 * In-memory rate limiter for DataForSEO API calls.
 * Used to respect tasks_ready max 20 calls/min limit.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if we can make a request without exceeding rate limit.
   */
  canRequest(): boolean {
    this.cleanup();
    return this.timestamps.length < this.maxRequests;
  }

  /**
   * Record a request timestamp.
   */
  recordRequest(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Get time in ms until next request is allowed.
   * Returns 0 if request is allowed now.
   */
  getWaitTime(): number {
    this.cleanup();
    if (this.timestamps.length < this.maxRequests) {
      return 0;
    }
    // Oldest timestamp determines when we can make the next request
    const oldest = this.timestamps[0];
    if (!oldest) return 0;
    const waitUntil = oldest + this.windowMs;
    return Math.max(0, waitUntil - Date.now());
  }

  /**
   * Remove timestamps outside the current window.
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }
}

// Global rate limiter for tasks_ready endpoint (max 20/min per DataForSEO docs)
export const tasksReadyRateLimiter = new RateLimiter(20, 60 * 1000);
