import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type {
  RateLimitConfig,
  RateLimitPort,
  RateLimitResult,
} from "@/lib/ports/RateLimitPort";
import { createLogger } from "@/lib/shared/logger";

const log = createLogger("upstash-rate-limit");

// Lazy singleton — created on first use
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Memoize limiters by "limit:windowSec" to reuse Ratelimit instances
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.limit}:${config.windowSec}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.fixedWindow(config.limit, `${config.windowSec} s`),
      prefix: "rl",
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

export const upstashRateLimiter: RateLimitPort = {
  isConfigured(): boolean {
    return !!(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    );
  },

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const limiter = getLimiter(config);
      const result = await limiter.limit(key);

      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    } catch (error) {
      log.error("Upstash rate limit check failed, allowing request", { error, key });
      // Fail open: if Redis is down, allow the request
      return {
        success: true,
        remaining: config.limit,
        resetAt: Date.now() + config.windowSec * 1000,
      };
    }
  },
};
