/**
 * Headline Utilities
 *
 * Functions for shortening, transforming, and validating headline text
 * for YouTube thumbnails. Optimized for readability at small sizes.
 */

// ============================================
// HEADLINE LENGTH LIMITS
// ============================================

export const HEADLINE_MAX_LENGTH = 32;
export const SUBHEAD_MAX_LENGTH = 48;
export const BADGE_MAX_LENGTH = 20;

// ============================================
// HEADLINE SHORTENING
// ============================================

/**
 * Shorten a headline to fit within max length while preserving meaning.
 * Uses smart truncation to avoid cutting words mid-stream.
 */
export function shortenHeadline(
  text: string,
  maxLength: number = HEADLINE_MAX_LENGTH
): string {
  if (!text) return "";

  // Trim and normalize whitespace
  const cleaned = text.trim().replace(/\s+/g, " ");

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Try to find a natural break point
  const words = cleaned.split(" ");
  let result = "";

  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length <= maxLength - 3) {
      // Leave room for "..."
      result = candidate;
    } else {
      break;
    }
  }

  // If we couldn't fit any words, hard truncate
  if (!result) {
    return cleaned.slice(0, maxLength - 3) + "...";
  }

  // Add ellipsis if we truncated
  if (result.length < cleaned.length) {
    return result + "...";
  }

  return result;
}

/**
 * Shorten to exact character limit without ellipsis.
 * Useful for badge text where ellipsis isn't appropriate.
 */
export function truncateExact(text: string, maxLength: number): string {
  if (!text) return "";
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned.slice(0, maxLength);
}

// ============================================
// HEADLINE TRANSFORMATIONS
// ============================================

/**
 * Common headline transformations for variety.
 */
export type HeadlineTransform =
  | "uppercase"
  | "titlecase"
  | "question"
  | "exclaim"
  | "ellipsis";

/**
 * Apply a transformation to create headline variety.
 */
export function transformHeadline(
  text: string,
  transform: HeadlineTransform
): string {
  if (!text) return "";

  const cleaned = text.trim();

  switch (transform) {
    case "uppercase":
      return cleaned.toUpperCase();

    case "titlecase":
      return cleaned
        .toLowerCase()
        .split(" ")
        .map((word) =>
          word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word
        )
        .join(" ");

    case "question":
      // Add "?" if not already present
      return cleaned.endsWith("?") ? cleaned : `${cleaned}?`;

    case "exclaim":
      // Add "!" if no punctuation
      return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}!`;

    case "ellipsis":
      // Add "..." for intrigue
      return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}...`;

    default:
      return cleaned;
  }
}

// ============================================
// HEADLINE VARIANTS
// ============================================

/**
 * Generate multiple headline variants from a base headline.
 * Useful for creating variety in thumbnail sets.
 */
export function generateHeadlineVariants(
  baseHeadline: string,
  count: number = 4
): string[] {
  const variants: string[] = [baseHeadline];
  const transforms: HeadlineTransform[] = [
    "uppercase",
    "question",
    "exclaim",
    "ellipsis",
  ];

  for (let i = 0; i < Math.min(count - 1, transforms.length); i++) {
    const transformed = transformHeadline(baseHeadline, transforms[i]);
    if (transformed !== baseHeadline && !variants.includes(transformed)) {
      variants.push(transformed);
    }
  }

  // If we need more variants, create shortened versions
  while (variants.length < count) {
    const shortened = shortenHeadline(baseHeadline, HEADLINE_MAX_LENGTH - 5);
    if (!variants.includes(shortened)) {
      variants.push(shortened);
    } else {
      // Can't generate more unique variants
      break;
    }
  }

  return variants.slice(0, count);
}

// ============================================
// PUNCH-UP HELPERS
// ============================================

/**
 * Words/phrases that add urgency or intrigue.
 * Used sparingly to punch up flat headlines.
 */
const PUNCH_WORDS = [
  "NOW",
  "TODAY",
  "FINALLY",
  "SHOCKING",
  "EXPOSED",
  "REVEALED",
  "SECRET",
  "MUST SEE",
  "DON'T MISS",
  "GAME CHANGER",
];

/**
 * Punch up a headline with an attention-grabbing prefix.
 * Only use if the headline needs more energy.
 */
export function punchUpHeadline(text: string): string {
  if (!text) return "";

  // Pick a random punch word
  const punch = PUNCH_WORDS[Math.floor(Math.random() * PUNCH_WORDS.length)];

  // Combine and ensure it fits
  const combined = `${punch}: ${text}`;
  return shortenHeadline(combined);
}

/**
 * Generate punched-up variants of a headline.
 */
export function punchUpVariants(
  baseHeadline: string,
  count: number = 3
): string[] {
  const variants: string[] = [];
  const usedPunches = new Set<string>();

  while (variants.length < count && usedPunches.size < PUNCH_WORDS.length) {
    const punch = PUNCH_WORDS[Math.floor(Math.random() * PUNCH_WORDS.length)];
    if (usedPunches.has(punch)) continue;
    usedPunches.add(punch);

    const combined = shortenHeadline(`${punch}: ${baseHeadline}`);
    if (!variants.includes(combined)) {
      variants.push(combined);
    }
  }

  return variants;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if headline contains potentially problematic content.
 * Returns list of concerns (empty if safe).
 */
export function validateHeadlineContent(text: string): string[] {
  const concerns: string[] = [];

  if (!text) return concerns;

  // Check for excessive caps (might look spammy)
  const capsRatio =
    text.replace(/[^A-Z]/g, "").length / text.replace(/\s/g, "").length;
  if (capsRatio > 0.8 && text.length > 5) {
    concerns.push("Excessive capitalization may appear spammy");
  }

  // Check for excessive punctuation
  if (/[!?]{3,}/.test(text)) {
    concerns.push("Excessive punctuation may appear unprofessional");
  }

  // Check for common clickbait patterns (warn but don't block)
  const clickbaitPatterns = [
    /you won't believe/i,
    /doctors hate/i,
    /one weird trick/i,
    /gone wrong/i,
    /gone sexual/i,
  ];

  for (const pattern of clickbaitPatterns) {
    if (pattern.test(text)) {
      concerns.push("Contains common clickbait phrase");
      break;
    }
  }

  return concerns;
}

/**
 * Estimate headline readability at thumbnail size.
 * Returns score 0-100 (higher is better).
 */
export function estimateReadability(text: string): number {
  if (!text) return 0;

  let score = 100;

  // Penalize length
  if (text.length > 20) score -= (text.length - 20) * 2;
  if (text.length > 30) score -= (text.length - 30) * 3;

  // Penalize too many words
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 4) score -= (wordCount - 4) * 5;

  // Reward short, punchy text
  if (text.length <= 15 && wordCount <= 3) score += 10;

  // Penalize all lowercase (harder to read at small size)
  if (text === text.toLowerCase()) score -= 10;

  return Math.max(0, Math.min(100, score));
}
