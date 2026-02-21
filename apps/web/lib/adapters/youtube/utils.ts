/**
 * YouTube API Utilities
 *
 * Pure helper functions for parsing, encoding, and batching.
 */

/**
 * Decode HTML entities in strings from YouTube API responses.
 * YouTube returns titles/descriptions with encoded entities like &#39; &amp; etc.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Parse ISO 8601 duration (PT4M13S) to seconds.
 */
export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Split an array into chunks of a given size.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

/**
 * Map over items with limited concurrency.
 * Processes items in batches, waiting for each batch to complete before starting the next.
 * Preserves input order in the output.
 *
 * @param items - Array of items to process
 * @param limit - Maximum concurrent operations (default: 2)
 * @param fn - Async function to apply to each item
 * @returns Array of results in the same order as input
 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  if (limit <= 0) limit = 1;

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  }

  // Start `limit` workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(limit, items.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

/**
 * Format a Date to YYYY-MM-DD string.
 */
export function yyyyMmDd(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Calculate days since a given ISO date string.
 * Returns 0 for null/missing dates, otherwise at least 1 to avoid division by zero.
 */
export function daysSince(isoDate: string | null, nowMs: number = Date.now()): number {
  if (!isoDate) return 0;
  const publishedMs = new Date(isoDate).getTime();
  const daysDiff = Math.floor((nowMs - publishedMs) / (1000 * 60 * 60 * 24));
  return Math.max(1, daysDiff);
}
