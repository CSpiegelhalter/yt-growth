/**
 * Feature Flags Service
 *
 * Provides centralized feature flag management with:
 * - In-process caching (TTL-based)
 * - Safe fallback on DB errors (defaults to disabled)
 * - Type-safe flag keys
 *
 * Usage:
 *   import { getFeatureFlag, getFeatureFlags } from "@/lib/shared/feature-flags";
 *
 *   // Single flag
 *   const enabled = await getFeatureFlag("thumbnail_generation");
 *
 *   // Multiple flags
 *   const flags = await getFeatureFlags(["thumbnail_generation", "trending_search"]);
 *
 * Adding new flags:
 *   1. Add the key to FeatureFlagKey type below
 *   2. Add migration to insert the flag row (with enabled=false default)
 *   3. Update seed.ts FEATURE_FLAGS array
 *
 * Default behavior on DB failure: Returns false (disabled) for safety.
 */

import { prisma } from "@/prisma";

// ============================================
// TYPES
// ============================================

/**
 * Valid feature flag keys.
 * Add new flags here as you create them.
 */
export type FeatureFlagKey = "thumbnail_generation" | "trending_search";

// ============================================
// CACHE CONFIGURATION
// ============================================

const CACHE_TTL_MS = 60_000; // 60 seconds

type CacheEntry = {
  value: boolean;
  expiresAt: number;
};

// In-process cache (survives across requests in same server instance)
const cache = new Map<FeatureFlagKey, CacheEntry>();

// Track last error time to throttle logging
let lastErrorLogTime = 0;
const ERROR_LOG_THROTTLE_MS = 60_000; // Log errors at most once per minute

// ============================================
// PRIVATE HELPERS
// ============================================

function isCacheValid(entry: CacheEntry | undefined): entry is CacheEntry {
  return entry !== undefined && Date.now() < entry.expiresAt;
}

function setCache(key: FeatureFlagKey, value: boolean): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function logErrorThrottled(message: string, error: unknown): void {
  const now = Date.now();
  if (now - lastErrorLogTime > ERROR_LOG_THROTTLE_MS) {
    lastErrorLogTime = now;
    console.error(`[feature-flags] ${message}:`, error);
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get a single feature flag's enabled status.
 *
 * Returns false if:
 * - The flag doesn't exist in the database
 * - The database query fails
 * - Any other error occurs
 *
 * This ensures safe defaults where disabled is the fallback.
 */
export async function getFeatureFlag(key: FeatureFlagKey): Promise<boolean> {
  // Check cache first
  const cached = cache.get(key);
  if (isCacheValid(cached)) {
    return cached.value;
  }

  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
      select: { enabled: true },
    });

    const value = flag?.enabled ?? false;
    setCache(key, value);
    return value;
  } catch (error) {
    logErrorThrottled(`Failed to fetch flag "${key}"`, error);
    // Safe default: return false (disabled) on error
    return false;
  }
}

/**
 * Get multiple feature flags at once.
 *
 * If keys is undefined, returns all known flags.
 * Returns false for any flag that doesn't exist or on error.
 */
export async function getFeatureFlags(
  keys?: FeatureFlagKey[]
): Promise<Record<FeatureFlagKey, boolean>> {
  const targetKeys: FeatureFlagKey[] = keys ?? [
    "thumbnail_generation",
    "trending_search",
  ];

  // Check which keys need fetching
  const result: Record<string, boolean> = {};
  const keysToFetch: FeatureFlagKey[] = [];

  for (const key of targetKeys) {
    const cached = cache.get(key);
    if (isCacheValid(cached)) {
      result[key] = cached.value;
    } else {
      keysToFetch.push(key);
    }
  }

  // Fetch uncached keys
  if (keysToFetch.length > 0) {
    try {
      const flags = await prisma.featureFlag.findMany({
        where: { key: { in: keysToFetch } },
        select: { key: true, enabled: true },
      });

      // Build lookup from fetched flags
      const flagMap = new Map(flags.map((f) => [f.key, f.enabled]));

      // Populate result and cache
      for (const key of keysToFetch) {
        const value = flagMap.get(key) ?? false;
        result[key] = value;
        setCache(key, value);
      }
    } catch (error) {
      logErrorThrottled("Failed to fetch flags", error);
      // Safe default: all uncached flags are disabled
      for (const key of keysToFetch) {
        result[key] = false;
      }
    }
  }

  return result as Record<FeatureFlagKey, boolean>;
}

/**
 * Invalidate the cache for a specific flag or all flags.
 * Useful for testing or after admin updates.
 */
export function invalidateFeatureFlagCache(key?: FeatureFlagKey): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Check if a feature is enabled (convenience wrapper).
 * Alias for getFeatureFlag that reads more naturally in conditionals.
 */
export const isFeatureEnabled = getFeatureFlag;
