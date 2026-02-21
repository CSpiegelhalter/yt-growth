/**
 * Competitor Search Cache Layer
 *
 * Provides caching for competitor search results with:
 * - Stable, canonical cache key generation
 * - TTL-based expiration
 * - Support for both inference cache and search results cache
 */
import "server-only";

import { prisma } from "@/prisma";
import type {
  InferredNiche,
  CachedSearchResults,
  CompetitorVideoResult,
} from "./types";

// Cache TTLs
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SEARCH_CACHE_SHORT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours for active searches

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

    if (!cached) {return null;}

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

// ============================================
// CACHE UTILITIES
// ============================================

