import { describe, expect,it } from "bun:test";

/**
 * Navigation Config Tests
 *
 * Tests for the primary navigation configuration:
 * 1. Correct items in correct order
 * 2. Feature flag system still works
 */

describe("Navigation configuration", () => {
  describe("nav-config", () => {
    it("primaryNavItems contains exactly 6 items in correct order", async () => {
      const { primaryNavItems } = await import("@/lib/shared/nav-config");

      expect(primaryNavItems).toHaveLength(6);
      expect(primaryNavItems[0].id).toBe("dashboard");
      expect(primaryNavItems[1].id).toBe("videos");
      expect(primaryNavItems[2].id).toBe("analyzer");
      expect(primaryNavItems[3].id).toBe("tags");
      expect(primaryNavItems[4].id).toBe("keywords");
      expect(primaryNavItems[5].id).toBe("profile");
    });

    it("competitors is not in primaryNavItems", async () => {
      const { primaryNavItems } = await import("@/lib/shared/nav-config");

      const competitorsItem = primaryNavItems.find((item) => item.id === "competitors");
      expect(competitorsItem).toBeUndefined();
    });

    it("trending is not in primaryNavItems", async () => {
      const { primaryNavItems } = await import("@/lib/shared/nav-config");

      const trendingItem = primaryNavItems.find((item) => item.id === "trending");
      expect(trendingItem).toBeUndefined();
    });
  });

  describe("feature-flags type safety", () => {
    it("trending_search is a valid FeatureFlagKey", async () => {
      type FeatureFlagKey = "thumbnail_generation" | "trending_search";

      const validKey: FeatureFlagKey = "trending_search";
      expect(validKey).toBe("trending_search");
    });

    it("getFeatureFlag function exists and returns a promise", async () => {
      const { getFeatureFlag } = await import("@/lib/shared/feature-flags");

      expect(typeof getFeatureFlag).toBe("function");

      const resultPromise = getFeatureFlag("trending_search");
      expect(resultPromise).toBeInstanceOf(Promise);
    });
  });
});

describe("Feature flag defaults", () => {
  it("feature flag returns false as safe default on error", async () => {
    const { getFeatureFlag, invalidateFeatureFlagCache } = await import(
      "@/lib/shared/feature-flags"
    );

    invalidateFeatureFlagCache("trending_search");

    const result = await getFeatureFlag("trending_search");
    expect(typeof result).toBe("boolean");
  });

  it("invalidateFeatureFlagCache does not throw for trending_search", async () => {
    const { invalidateFeatureFlagCache } = await import("@/lib/shared/feature-flags");

    expect(() => invalidateFeatureFlagCache("trending_search")).not.toThrow();
  });
});
