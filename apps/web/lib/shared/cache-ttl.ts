/**
 * Shared TTL for every TrendingCache-backed cache surfaced on the dashboard
 * (opportunities, youtube-rising, niche-keywords, hooks). Keeping one number
 * here means refresh windows stay aligned and we never wonder why one cache
 * resets at a different cadence than another.
 *
 * 24 hours is the operational sweet spot:
 *  - cheap enough on lazy caches (DataForSEO + SerpAPI cost stays bounded)
 *  - long enough that cron-driven caches don't churn ahead of TTL
 *  - short enough that data feels current to creators planning a week of uploads
 */
export const TRENDING_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function trendingCacheExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + TRENDING_CACHE_TTL_MS);
}
