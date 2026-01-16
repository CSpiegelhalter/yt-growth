/**
 * YouTube API Cache Layer
 *
 * Best-effort wrapper over prisma youTubeSearchCache model.
 * Never throws - returns miss/noop if model is missing.
 */
import "server-only";

import { prisma } from "@/prisma";
import { CACHE_TTL_MS } from "./constants";

type CacheHit = { hit: true; value: unknown };
type CacheMiss = { hit: false };
type CacheResult = CacheHit | CacheMiss;

/**
 * Attempt to read from cache.
 * Returns { hit: true, value } if found and not expired.
 * Returns { hit: false } if not found, expired, or error.
 */
export async function getCache(
  kind: string,
  query: string
): Promise<CacheResult> {
  try {
    const cacheModel = (prisma as any).youTubeSearchCache;
    if (!cacheModel?.findUnique) {
      return { hit: false };
    }

    const cached = await cacheModel.findUnique({
      where: { kind_query: { kind, query } },
    });

    if (!cached) {
      return { hit: false };
    }

    const now = new Date();
    if (cached.cachedUntil <= now) {
      return { hit: false };
    }

    return { hit: true, value: cached.responseJson };
  } catch {
    // Cache read errors are ignored
    return { hit: false };
  }
}

/**
 * Attempt to write to cache.
 * Fails silently if model is missing or write fails.
 */
export async function setCache(
  kind: string,
  query: string,
  value: unknown,
  ttlMs: number = CACHE_TTL_MS
): Promise<void> {
  try {
    const cacheModel = (prisma as any).youTubeSearchCache;
    if (!cacheModel?.upsert) {
      return;
    }

    const now = new Date();
    const cachedUntil = new Date(now.getTime() + ttlMs);

    await cacheModel.upsert({
      where: { kind_query: { kind, query } },
      create: {
        kind,
        query,
        responseJson: value as object,
        cachedUntil,
      },
      update: {
        responseJson: value as object,
        cachedUntil,
      },
    });
  } catch {
    // Cache write errors are ignored
  }
}
