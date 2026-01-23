/**
 * Competitor Search Cache Layer
 *
 * Provides caching for competitor search results with:
 * - Stable, canonical cache key generation
 * - TTL-based expiration
 * - Support for both inference cache and search results cache
 */
import "server-only";

import crypto from "crypto";
import { prisma } from "@/prisma";
import type {
  InferredNiche,
  CachedSearchResults,
  CompetitorVideoResult,
} from "./types";

// Re-export cache key utilities from utils for backward compatibility
export { normalizeFilters, makeCacheKey } from "./utils";

// Cache TTLs
const INFERENCE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SEARCH_CACHE_SHORT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours for active searches

/**
 * Create a cache key for niche inference.
 * Separate from search cache since inference can be reused across searches.
 */
export function makeInferenceCacheKey(
  nicheText?: string,
  videoId?: string
): string {
  const keyData = {
    type: "inference",
    nicheText: nicheText?.toLowerCase().trim() || "",
    videoId: videoId || "",
  };

  const jsonStr = JSON.stringify(keyData, Object.keys(keyData).sort());
  return crypto.createHash("sha256").update(jsonStr).digest("hex").slice(0, 32);
}

// ============================================
// INFERENCE CACHE
// ============================================

/**
 * Get cached niche inference result.
 */
export async function getCachedInference(
  nicheText?: string,
  videoId?: string
): Promise<InferredNiche | null> {
  const cacheKey = makeInferenceCacheKey(nicheText, videoId);

  try {
    // Use YouTubeSearchCache table with kind="inference"
    const cached = await prisma.youTubeSearchCache.findUnique({
      where: { kind_query: { kind: "inference", query: cacheKey } },
    });

    if (!cached) return null;

    // Check expiration
    if (cached.cachedUntil <= new Date()) {
      return null;
    }

    return cached.responseJson as unknown as InferredNiche;
  } catch (err) {
    console.warn("[InferenceCache] Get error:", err);
    return null;
  }
}

/**
 * Set cached niche inference result.
 */
export async function setCachedInference(
  nicheText: string | undefined,
  videoId: string | undefined,
  inference: InferredNiche
): Promise<void> {
  const cacheKey = makeInferenceCacheKey(nicheText, videoId);
  const now = new Date();
  const cachedUntil = new Date(now.getTime() + INFERENCE_CACHE_TTL_MS);

  try {
    await prisma.youTubeSearchCache.upsert({
      where: { kind_query: { kind: "inference", query: cacheKey } },
      create: {
        kind: "inference",
        query: cacheKey,
        responseJson: inference as unknown as object,
        cachedUntil,
      },
      update: {
        responseJson: inference as unknown as object,
        cachedUntil,
      },
    });
  } catch (err) {
    console.warn("[InferenceCache] Set error:", err);
    // Cache errors are not fatal
  }
}

// ============================================
// SEARCH RESULTS CACHE
// ============================================

// Use short kind name to fit VarChar(16) column
const SEARCH_CACHE_KIND = "comp_search";

/**
 * Get cached search results.
 */
export async function getCachedSearchResults(
  cacheKey: string
): Promise<CachedSearchResults | null> {
  try {
    const cached = await prisma.youTubeSearchCache.findUnique({
      where: { kind_query: { kind: SEARCH_CACHE_KIND, query: cacheKey } },
    });

    if (!cached) return null;

    // Check expiration
    if (cached.cachedUntil <= new Date()) {
      return null;
    }

    return cached.responseJson as unknown as CachedSearchResults;
  } catch (err) {
    console.warn("[SearchCache] Get error:", err);
    return null;
  }
}

/**
 * Set cached search results.
 */
export async function setCachedSearchResults(
  cacheKey: string,
  results: CompetitorVideoResult[],
  inferredNiche: InferredNiche,
  scannedCount: number,
  exhausted: boolean,
  shortTtl: boolean = false
): Promise<void> {
  const now = new Date();
  const ttl = shortTtl ? SEARCH_CACHE_SHORT_TTL_MS : SEARCH_CACHE_TTL_MS;
  const cachedUntil = new Date(now.getTime() + ttl);

  const cacheData: CachedSearchResults = {
    results,
    inferredNiche,
    scannedCount,
    exhausted,
    cachedAt: now.toISOString(),
    expiresAt: cachedUntil.toISOString(),
  };

  try {
    await prisma.youTubeSearchCache.upsert({
      where: { kind_query: { kind: SEARCH_CACHE_KIND, query: cacheKey } },
      create: {
        kind: SEARCH_CACHE_KIND,
        query: cacheKey,
        responseJson: cacheData as unknown as object,
        cachedUntil,
      },
      update: {
        responseJson: cacheData as unknown as object,
        cachedUntil,
      },
    });
  } catch (err) {
    console.warn("[SearchCache] Set error:", err);
    // Cache errors are not fatal
  }
}

/**
 * Invalidate cached search results for a specific key.
 */
export async function invalidateCachedSearchResults(
  cacheKey: string
): Promise<void> {
  try {
    await prisma.youTubeSearchCache.delete({
      where: { kind_query: { kind: SEARCH_CACHE_KIND, query: cacheKey } },
    });
  } catch {
    // Ignore - may not exist
  }
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Clean up expired cache entries.
 * Call this periodically to keep the cache table tidy.
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const result = await prisma.youTubeSearchCache.deleteMany({
      where: {
        cachedUntil: { lt: new Date() },
        kind: { in: ["inference", "competitor_search"] },
      },
    });
    return result.count;
  } catch (err) {
    console.warn("[Cache] Cleanup error:", err);
    return 0;
  }
}

/**
 * Get cache statistics for monitoring.
 */
export async function getCacheStats(): Promise<{
  inferenceCount: number;
  searchCount: number;
  expiredCount: number;
}> {
  try {
    const now = new Date();

    const [inference, search, expired] = await Promise.all([
      prisma.youTubeSearchCache.count({
        where: { kind: "inference", cachedUntil: { gt: now } },
      }),
      prisma.youTubeSearchCache.count({
        where: { kind: SEARCH_CACHE_KIND, cachedUntil: { gt: now } },
      }),
      prisma.youTubeSearchCache.count({
        where: { kind: { in: ["inference", SEARCH_CACHE_KIND] }, cachedUntil: { lte: now } },
      }),
    ]);

    return {
      inferenceCount: inference,
      searchCount: search,
      expiredCount: expired,
    };
  } catch {
    return { inferenceCount: 0, searchCount: 0, expiredCount: 0 };
  }
}
