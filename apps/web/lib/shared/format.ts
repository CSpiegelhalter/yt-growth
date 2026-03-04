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
  if (num >= 1_000_000) {return `${(num / 1_000_000).toFixed(1)}M`;}
  if (num >= 1000) {return `${(num / 1000).toFixed(1)}K`;}
  return String(num);
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
  if (num >= 1000) {
    const scaled = num / 1000;
    const floored = Math.floor(scaled * 10) / 10;
    return `${floored.toFixed(1)}K`;
  }
  return Math.floor(num).toFixed(0);
}

/** Null-safe compact formatter, defaults to "0". */
export function formatCompactSafe(num: number | null | undefined): string {
  if (num == null) {return "0";}
  return formatCompact(num);
}

/** Short date format: "Jan 5", "Mar 22". */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

