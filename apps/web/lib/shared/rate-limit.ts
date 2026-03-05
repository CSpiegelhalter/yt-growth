/**
 * Rate limiter with distributed (Upstash Redis) and in-memory fallback.
 *
 * - When UPSTASH_REDIS_REST_URL + TOKEN are set, uses distributed Redis.
 * - Otherwise falls back to in-memory (suitable for local dev / single instance).
 * - When DISABLE_RATE_LIMITS=1, all checks pass immediately (for tests).
 */

import type { RateLimitPort } from "@/lib/ports/RateLimitPort";

// ---------------------------------------------------------------------------
// In-memory fallback (local dev / single instance)
// ---------------------------------------------------------------------------

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
}, 60_000);

export type RateLimitConfig = {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSec: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

function checkInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;

  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  store.set(key, entry);

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ---------------------------------------------------------------------------
// Distributed backend (lazy-loaded to avoid importing server-only in client)
// ---------------------------------------------------------------------------

let distributedLimiter: RateLimitPort | null = null;
let distributedResolved = false;

async function getDistributedLimiter(): Promise<RateLimitPort | null> {
  if (!distributedResolved) {
    distributedResolved = true;
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      try {
        const mod = await import("@/lib/adapters/upstash/client");
        distributedLimiter = mod.upstashRateLimiter as RateLimitPort;
      } catch {
        // Adapter not available (e.g. client-side bundle) — fall through
      }
    }
  }
  return distributedLimiter;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check and consume a rate limit token for a key.
 * Delegates to Upstash when configured, otherwise uses in-memory.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  // Bypass for tests
  if (process.env.DISABLE_RATE_LIMITS === "1") {
    return { success: true, remaining: config.limit, resetAt: Date.now() + config.windowSec * 1000 };
  }

  const distributed = await getDistributedLimiter();
  if (distributed?.isConfigured()) {
    return distributed.check(key, config);
  }

  return checkInMemory(key, config);
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
  // Competitor feed: 10 per hour per user (tightened from 30)
  competitorFeed: { limit: 10, windowSec: 3600 },
  // Competitor video detail: 20 per hour per user (tightened from 60)
  competitorDetail: { limit: 20, windowSec: 3600 },
  // Competitor comments fetch: 10 per hour per user (tightened from 20)
  competitorComments: { limit: 10, windowSec: 3600 },
  // Owned video insights: 150 per hour per user
  videoInsights: { limit: 150, windowSec: 3600 },
  // Owned video remixes generation: 20 per hour per user
  videoRemixes: { limit: 20, windowSec: 3600 },
  // Contact form: 5 per hour per IP
  contactForm: { limit: 5, windowSec: 3600 },
  // Thumbnail job creation: 10 per 10 min per user
  thumbnailJob: { limit: 10, windowSec: 600 },
  // Thumbnail regenerate base: 5 per 10 min per user
  thumbnailRegenerate: { limit: 5, windowSec: 600 },
  // Identity training asset uploads: 40 per day per user
  identityUpload: { limit: 40, windowSec: 86_400 },
  // Identity training commits: 3 per day per user
  identityCommit: { limit: 3, windowSec: 86_400 },
  // Identity model reset: 5 per day per user
  identityReset: { limit: 5, windowSec: 86_400 },
  // Thumbnail workflow v2 generation: 30 per day per user
  thumbnailGenerateV2: { limit: 30, windowSec: 86_400 },
  // Thumbnail img2img variations: 20 per day per user
  thumbnailImg2Img: { limit: 20, windowSec: 86_400 },
} as const;

/**
 * Create a rate limit key
 */
export function rateLimitKey(
  operation: keyof typeof RATE_LIMITS,
  identifier: string | number,
): string {
  return `${operation}:${identifier}`;
}
