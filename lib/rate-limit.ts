/**
 * Simple in-memory rate limiter for expensive operations
 *
 * Note: In production, use Redis for distributed rate limiting.
 * This in-memory implementation is suitable for single-instance deployments.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000); // Clean every minute

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

/**
 * Check and update rate limit for a key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;

  let entry = store.get(key);

  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Check limit
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  store.set(key, entry);

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  // Plan generation: 5 per hour per user
  planGeneration: { limit: 5, windowSec: 3600 },
  // Video sync: 10 per hour per channel
  videoSync: { limit: 10, windowSec: 3600 },
  // Checkout: 3 per minute per user
  checkout: { limit: 3, windowSec: 60 },
  // Competitor feed: 30 per hour per user
  competitorFeed: { limit: 30, windowSec: 3600 },
  // Competitor video detail: 60 per hour per user
  competitorDetail: { limit: 60, windowSec: 3600 },
  // Competitor comments fetch: 20 per hour per user
  competitorComments: { limit: 20, windowSec: 3600 },
  // Owned video insights: 30 per hour per user
  videoInsights: { limit: 30, windowSec: 3600 },
  // Owned video remixes generation: 20 per hour per user
  videoRemixes: { limit: 20, windowSec: 3600 },
  // Contact form: 5 per hour per IP
  contactForm: { limit: 5, windowSec: 3600 },
} as const;

/**
 * Create a rate limit key
 */
export function rateLimitKey(
  operation: keyof typeof RATE_LIMITS,
  identifier: string | number
): string {
  return `${operation}:${identifier}`;
}
