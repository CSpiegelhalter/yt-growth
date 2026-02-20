/**
 * Usage Integration Tests
 *
 * Tests the usage tracking module against real database.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from "bun:test";
import {
  prisma,
  createTestUser,
  cleanupTestUser,
  cleanupUsageCounters,
} from "./setup";
import {
  getUsageInfo,
  checkAndIncrement,
  checkUsage,
  resetUserUsage,
  getAllUsage,
} from "@/lib/usage";
import type { FeatureKey } from "@/lib/entitlements";

async function getUsage(userId: number, featureKey: FeatureKey): Promise<number> {
  const info = await getUsageInfo(userId, featureKey, 999999);
  return info.used;
}

const TEST_EMAIL = "usage-test@example.com";

describe("Usage Integration", () => {
  let testUserId: number;

  beforeEach(async () => {
    // Clean up any existing test user
    await cleanupTestUser(TEST_EMAIL);

    // Create fresh test user
    const user = await createTestUser(TEST_EMAIL);
    testUserId = user.id;

    // Clean up any existing usage counters
    await cleanupUsageCounters(testUserId);
  });

  afterEach(async () => {
    await cleanupTestUser(TEST_EMAIL);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getUsage", () => {
    it("returns 0 for fresh user", async () => {
      const count = await getUsage(testUserId, "owned_video_analysis");
      expect(count).toBe(0);
    });

    it("returns correct count after increment", async () => {
      // Increment usage
      await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 10,
        amount: 3,
      });

      const count = await getUsage(testUserId, "owned_video_analysis");
      expect(count).toBe(3);
    });
  });

  describe("getUsageInfo", () => {
    it("returns full usage info with limit context", async () => {
      const info = await getUsageInfo(testUserId, "owned_video_analysis", 5);

      expect(info.used).toBe(0);
      expect(info.limit).toBe(5);
      expect(info.remaining).toBe(5);
      expect(info.allowed).toBe(true);
      expect(info.resetAt).toBeTruthy();
    });

    it("shows correct remaining after usage", async () => {
      // Use 3 of 5
      await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 3,
      });

      const info = await getUsageInfo(testUserId, "owned_video_analysis", 5);

      expect(info.used).toBe(3);
      expect(info.remaining).toBe(2);
      expect(info.allowed).toBe(true);
    });

    it("shows not allowed when at limit", async () => {
      // Use all 5
      await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 5,
      });

      const info = await getUsageInfo(testUserId, "owned_video_analysis", 5);

      expect(info.used).toBe(5);
      expect(info.remaining).toBe(0);
      expect(info.allowed).toBe(false);
    });
  });

  describe("checkAndIncrement", () => {
    it("allows and increments when under limit", async () => {
      const result = await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 1,
      });

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(1);
      expect(result.remaining).toBe(4);
    });

    it("increments atomically with multiple calls", async () => {
      // Make 5 increments
      for (let i = 0; i < 5; i++) {
        await checkAndIncrement({
          userId: testUserId,
          featureKey: "owned_video_analysis",
          limit: 10,
          amount: 1,
        });
      }

      const count = await getUsage(testUserId, "owned_video_analysis");
      expect(count).toBe(5);
    });

    it("blocks when at limit", async () => {
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await checkAndIncrement({
          userId: testUserId,
          featureKey: "owned_video_analysis",
          limit: 5,
          amount: 1,
        });
      }

      // Try one more
      const result = await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 1,
      });

      expect(result.allowed).toBe(false);
      expect(result.used).toBe(5);
      expect(result.remaining).toBe(0);
    });

    it("blocks when amount would exceed limit", async () => {
      // Use 3
      await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 3,
      });

      // Try to use 3 more (would be 6)
      const result = await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 3,
      });

      expect(result.allowed).toBe(false);
      expect(result.used).toBe(3); // Unchanged
      expect(result.remaining).toBe(2);
    });

    it("tracks different features separately", async () => {
      await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 3,
      });

      await checkAndIncrement({
        userId: testUserId,
        featureKey: "competitor_video_analysis",
        limit: 5,
        amount: 2,
      });

      const ownedCount = await getUsage(testUserId, "owned_video_analysis");
      const competitorCount = await getUsage(testUserId, "competitor_video_analysis");

      expect(ownedCount).toBe(3);
      expect(competitorCount).toBe(2);
    });
  });

  describe("checkUsage (peek without increment)", () => {
    it("returns allowed status without changing count", async () => {
      const result = await checkUsage({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 1,
      });

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(0);

      // Verify count wasn't changed
      const count = await getUsage(testUserId, "owned_video_analysis");
      expect(count).toBe(0);
    });

    it("correctly reports when at limit", async () => {
      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        await checkAndIncrement({
          userId: testUserId,
          featureKey: "owned_video_analysis",
          limit: 5,
          amount: 1,
        });
      }

      const result = await checkUsage({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 5,
        amount: 1,
      });

      expect(result.allowed).toBe(false);
      expect(result.used).toBe(5);
    });
  });

  describe("resetUserUsage", () => {
    it("clears all usage for user", async () => {
      // Add some usage
      await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 10,
        amount: 5,
      });

      await checkAndIncrement({
        userId: testUserId,
        featureKey: "competitor_video_analysis",
        limit: 10,
        amount: 3,
      });

      // Reset
      await resetUserUsage(testUserId);

      // Verify all cleared
      const owned = await getUsage(testUserId, "owned_video_analysis");
      const competitor = await getUsage(testUserId, "competitor_video_analysis");

      expect(owned).toBe(0);
      expect(competitor).toBe(0);
    });
  });

  describe("getAllUsage", () => {
    it("returns all feature usage for user", async () => {
      await checkAndIncrement({
        userId: testUserId,
        featureKey: "owned_video_analysis",
        limit: 10,
        amount: 2,
      });

      await checkAndIncrement({
        userId: testUserId,
        featureKey: "idea_generate",
        limit: 10,
        amount: 4,
      });

      const all = await getAllUsage(testUserId);

      expect(all.length).toBe(2);
      expect(all.find((u) => u.featureKey === "owned_video_analysis")?.count).toBe(2);
      expect(all.find((u) => u.featureKey === "idea_generate")?.count).toBe(4);
    });

    it("returns empty array for fresh user", async () => {
      const all = await getAllUsage(testUserId);
      expect(all).toEqual([]);
    });
  });
});
