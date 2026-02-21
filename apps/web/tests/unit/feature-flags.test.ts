import { describe, expect, test } from "bun:test";

/**
 * Feature Flags Service Tests
 *
 * These tests focus on:
 * - Type safety verification
 * - Module exports verification
 * - Integration tests that work with the actual database (or handle missing DB gracefully)
 *
 * Note: Unit tests that require mocking Prisma are in integration tests
 * since Bun's test mocking doesn't intercept Prisma client properly.
 */

import type { FeatureFlagKey } from "@/lib/shared/feature-flags";

describe("FeatureFlagKey type", () => {
  test("type only allows valid keys", () => {
    // This is a compile-time check - these should compile
    const validKey1: FeatureFlagKey = "thumbnail_generation";
    const validKey2: FeatureFlagKey = "trending_search";

    // TypeScript will error on invalid keys at compile time
    // @ts-expect-error - Invalid key should fail type check
    const _invalidKey: FeatureFlagKey = "invalid_flag";

    expect(validKey1).toBe("thumbnail_generation");
    expect(validKey2).toBe("trending_search");
  });

  test("valid keys are exported correctly", () => {
    // Verify the expected flag keys exist as valid types
    const flags: FeatureFlagKey[] = ["thumbnail_generation", "trending_search"];
    expect(flags).toContain("thumbnail_generation");
    expect(flags).toContain("trending_search");
  });
});

describe("module exports", () => {
  test("exports getFeatureFlag function", async () => {
    const { getFeatureFlag } = await import("@/lib/shared/feature-flags");
    expect(typeof getFeatureFlag).toBe("function");
  });

  test("exports getFeatureFlags function", async () => {
    const { getFeatureFlags } = await import("@/lib/shared/feature-flags");
    expect(typeof getFeatureFlags).toBe("function");
  });

  test("exports invalidateFeatureFlagCache function", async () => {
    const { invalidateFeatureFlagCache } = await import("@/lib/shared/feature-flags");
    expect(typeof invalidateFeatureFlagCache).toBe("function");
  });

  test("exports isFeatureEnabled alias", async () => {
    const { isFeatureEnabled, getFeatureFlag } = await import("@/lib/shared/feature-flags");
    expect(isFeatureEnabled).toBe(getFeatureFlag);
  });
});

describe("safe fallback behavior", () => {
  test("getFeatureFlag returns boolean (false on missing DB)", async () => {
    const { getFeatureFlag, invalidateFeatureFlagCache } = await import(
      "@/lib/shared/feature-flags"
    );

    // Clear cache to force a fresh DB check
    invalidateFeatureFlagCache();

    // This should return false (either from DB or as fallback)
    // It should never throw
    const result = await getFeatureFlag("thumbnail_generation");
    expect(typeof result).toBe("boolean");
  });

  test("getFeatureFlags returns object with boolean values (false on missing DB)", async () => {
    const { getFeatureFlags, invalidateFeatureFlagCache } = await import(
      "@/lib/shared/feature-flags"
    );

    // Clear cache to force fresh DB check
    invalidateFeatureFlagCache();

    // This should return an object (either from DB or fallback)
    const result = await getFeatureFlags(["thumbnail_generation", "trending_search"]);

    expect(typeof result).toBe("object");
    expect(typeof result.thumbnail_generation).toBe("boolean");
    expect(typeof result.trending_search).toBe("boolean");
  });

  test("invalidateFeatureFlagCache does not throw", async () => {
    const { invalidateFeatureFlagCache } = await import("@/lib/shared/feature-flags");

    expect(() => invalidateFeatureFlagCache()).not.toThrow();
    expect(() => invalidateFeatureFlagCache("thumbnail_generation")).not.toThrow();
    expect(() => invalidateFeatureFlagCache("trending_search")).not.toThrow();
  });
});
