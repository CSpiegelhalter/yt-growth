/**
 * Rate Limit Port — contract for distributed rate limiting.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 *
 * Imported by:
 *   - lib/shared/rate-limit.ts (to delegate when configured)
 *   - lib/adapters/upstash/ (to implement)
 */

export type RateLimitConfig = {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSec: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export type RateLimitPort = {
  /** Check (and consume) a rate limit token for the given key */
  check(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
  /** Whether the distributed backend is configured and available */
  isConfigured(): boolean;
};
