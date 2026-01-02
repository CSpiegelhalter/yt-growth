/**
 * UTM Parameter Sanitizer
 * Validates and normalizes UTM parameters for tracking links
 */

export const UTM_MEDIUM_OPTIONS = [
  "social",
  "email",
  "community",
  "referral",
  "paid",
  "organic",
  "other",
] as const;

export type UtmMedium = (typeof UTM_MEDIUM_OPTIONS)[number];

/**
 * Sanitize a UTM parameter value
 * - Converts to lowercase
 * - Replaces spaces with underscores
 * - Removes invalid characters (only allows a-z, 0-9, _)
 * - Trims to max length
 */
export function sanitizeUtmParam(value: string, maxLength = 50): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, maxLength);
}

/**
 * Validate a UTM parameter value
 * Returns an error message if invalid, or null if valid
 */
export function validateUtmParam(value: string): string | null {
  if (!value) return null; // Empty is allowed
  
  if (value.length > 50) {
    return "Maximum 50 characters";
  }
  
  if (!/^[a-z0-9_]+$/.test(value.toLowerCase())) {
    return "Only letters, numbers, and underscores allowed";
  }
  
  return null;
}

/**
 * Check if a medium value matches the allowed options
 * Common typos are auto-corrected
 */
export function normalizeUtmMedium(value: string): UtmMedium | string {
  const normalized = sanitizeUtmParam(value);
  
  // Auto-correct common typos
  const typoMap: Record<string, UtmMedium> = {
    socail: "social",
    soical: "social",
    socal: "social",
    emial: "email",
    emal: "email",
    emaill: "email",
    comunity: "community",
    communtiy: "community",
    referal: "referral",
    referall: "referral",
    refferal: "referral",
    payed: "paid",
    payd: "paid",
    organc: "organic",
    orgainc: "organic",
  };
  
  if (typoMap[normalized]) {
    return typoMap[normalized];
  }
  
  // Check if it's a valid option
  if (UTM_MEDIUM_OPTIONS.includes(normalized as UtmMedium)) {
    return normalized as UtmMedium;
  }
  
  return normalized;
}

/**
 * Generate a default campaign slug from video title or date
 */
export function generateDefaultCampaign(videoTitle: string): string {
  if (!videoTitle) {
    return `video_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
  }
  
  return sanitizeUtmParam(
    videoTitle
      .slice(0, 40)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  );
}

/**
 * Build a complete UTM URL
 */
export function buildUtmUrl(
  baseUrl: string,
  params: { source?: string; medium?: string; campaign?: string }
): string {
  const url = new URL(baseUrl);
  
  if (params.source) {
    url.searchParams.set("utm_source", sanitizeUtmParam(params.source));
  }
  if (params.medium) {
    url.searchParams.set("utm_medium", sanitizeUtmParam(params.medium));
  }
  if (params.campaign) {
    url.searchParams.set("utm_campaign", sanitizeUtmParam(params.campaign));
  }
  
  return url.toString();
}
