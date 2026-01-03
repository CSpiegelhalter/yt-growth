/**
 * SVG Safety Utilities
 *
 * Functions for safely escaping user text in SVG contexts.
 * Prevents XSS and injection attacks when rendering user-provided text.
 */

// ============================================
// SVG TEXT ESCAPING
// ============================================

/**
 * Escape special characters for safe inclusion in SVG text elements.
 * Handles XML special chars and potential script injection.
 */
export function svgEscape(text: string): string {
  if (!text) return "";

  return text
    .replace(/&/g, "&amp;") // Must be first
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Escape text for SVG attribute values.
 * More strict than text content escaping.
 */
export function svgAttrEscape(text: string): string {
  if (!text) return "";

  return svgEscape(text)
    // Additional escapes for attribute context
    .replace(/\n/g, "&#10;")
    .replace(/\r/g, "&#13;")
    .replace(/\t/g, "&#9;");
}

/**
 * Sanitize text for safe use as SVG text content.
 * Applies escaping and removes potentially dangerous content.
 */
export function safeText(
  text: string,
  options?: {
    maxLength?: number;
    allowedChars?: RegExp;
  }
): string {
  if (!text) return "";

  let result = text;

  // Apply character whitelist if provided
  if (options?.allowedChars) {
    result = result
      .split("")
      .filter((c) => options.allowedChars!.test(c))
      .join("");
  }

  // Truncate if needed
  if (options?.maxLength && result.length > options.maxLength) {
    result = result.slice(0, options.maxLength);
  }

  // Escape for SVG
  return svgEscape(result);
}

// ============================================
// SVG GENERATION HELPERS
// ============================================

/**
 * Generate an SVG text element with proper escaping.
 */
export function svgText(
  content: string,
  attrs: {
    x: number | string;
    y: number | string;
    fontSize?: number | string;
    fontWeight?: number | string;
    fontFamily?: string;
    fill?: string;
    textAnchor?: "start" | "middle" | "end";
    dominantBaseline?: "auto" | "middle" | "hanging" | "alphabetic";
  }
): string {
  const {
    x,
    y,
    fontSize = 48,
    fontWeight = 700,
    fontFamily = "sans-serif",
    fill = "#FFFFFF",
    textAnchor = "start",
    dominantBaseline = "auto",
  } = attrs;

  return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${svgAttrEscape(fontFamily)}" fill="${svgAttrEscape(fill)}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${svgEscape(content)}</text>`;
}

/**
 * Generate an SVG text element with stroke outline for readability.
 */
export function svgTextWithOutline(
  content: string,
  attrs: {
    x: number | string;
    y: number | string;
    fontSize?: number | string;
    fontWeight?: number | string;
    fontFamily?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    textAnchor?: "start" | "middle" | "end";
    dominantBaseline?: "auto" | "middle" | "hanging" | "alphabetic";
  }
): string {
  const {
    x,
    y,
    fontSize = 48,
    fontWeight = 700,
    fontFamily = "sans-serif",
    fill = "#FFFFFF",
    stroke = "#000000",
    strokeWidth = 3,
    textAnchor = "start",
    dominantBaseline = "auto",
  } = attrs;

  const escaped = svgEscape(content);
  const fontFamilyEscaped = svgAttrEscape(fontFamily);

  // Stroke layer (behind) + fill layer (in front)
  return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${fontFamilyEscaped}" fill="none" stroke="${svgAttrEscape(stroke)}" stroke-width="${strokeWidth * 2}" stroke-linejoin="round" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${escaped}</text><text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${fontFamilyEscaped}" fill="${svgAttrEscape(fill)}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${escaped}</text>`;
}

/**
 * Generate an SVG drop shadow filter.
 */
export function svgDropShadowFilter(
  id: string,
  options?: {
    dx?: number;
    dy?: number;
    blur?: number;
    opacity?: number;
  }
): string {
  const { dx = 2, dy = 4, blur = 6, opacity = 0.5 } = options ?? {};

  return `<filter id="${svgAttrEscape(id)}" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur}" flood-opacity="${opacity}"/>
  </filter>`;
}

// ============================================
// SAFE ZONE HELPERS
// ============================================

/**
 * YouTube thumbnail safe zones to avoid (in 1280x720):
 * - Bottom right: timestamp overlay (last ~180x30 pixels)
 * - Bottom left: duration badge (last ~100x30 pixels in some contexts)
 */
export const SAFE_ZONES = {
  timestamp: {
    x: 1100, // 1280 - 180
    y: 690, // 720 - 30
    width: 180,
    height: 30,
  },
  duration: {
    x: 0,
    y: 690,
    width: 100,
    height: 30,
  },
} as const;

/**
 * Check if a text position would overlap with unsafe zones.
 */
export function isInSafeZone(
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  const { timestamp, duration } = SAFE_ZONES;

  // Check timestamp overlap
  const overlapsTimestamp =
    x + width > timestamp.x &&
    x < timestamp.x + timestamp.width &&
    y + height > timestamp.y &&
    y < timestamp.y + timestamp.height;

  // Check duration overlap
  const overlapsDuration =
    x < duration.width &&
    y + height > duration.y &&
    y < duration.y + duration.height;

  return !overlapsTimestamp && !overlapsDuration;
}
