/**
 * Shared formatting helpers used across client and server code.
 *
 * Keep these small + dependency-free to avoid bloating client bundles.
 */

/**
 * Format a number with K/M suffix.
 *
 * Note: for values < 1000 we intentionally preserve the original string form
 * (some call sites pass fractional "per day" metrics).
 */
export function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

/**
 * Compact formatter for "count-like" metrics where values < 1000 should display
 * as whole numbers.
 */
export function formatCompactRounded(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}

/**
 * Compact formatter that always rounds DOWN at the displayed precision.
 *
 * - < 1000: whole numbers (floor)
 * - >= 1000: 1 decimal K/M, floored (e.g. 1.09K -> 1.0K)
 */
export function formatCompactFloored(num: number): string {
  if (num >= 1_000_000) {
    const scaled = num / 1_000_000;
    const floored = Math.floor(scaled * 10) / 10;
    return `${floored.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const scaled = num / 1_000;
    const floored = Math.floor(scaled * 10) / 10;
    return `${floored.toFixed(1)}K`;
  }
  return Math.floor(num).toFixed(0);
}


