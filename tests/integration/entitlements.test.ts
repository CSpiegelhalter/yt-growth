/**
 * Entitlements Integration Tests
 *
 * Tests the entitlements module against real database data.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from "bun:test";
import {
  prisma,
  createTestUser,
  createTestSubscription,
  cleanupTestUser,
} from "./setup";
import {
  getPlanFromSubscription,
  getLimits,
  featureLocked,
} from "@/lib/entitlements";
import { LIMITS } from "@/lib/product";

const TEST_EMAIL = "entitlements-test@example.com";

describe("Entitlements Integration", () => {
  let testUserId: number;

  beforeEach(async () => {
    // Clean up any existing test user
    await cleanupTestUser(TEST_EMAIL);

    // Create fresh test user
    const user = await createTestUser(TEST_EMAIL);
    testUserId = user.id;
  });

  afterEach(async () => {
    await cleanupTestUser(TEST_EMAIL);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getPlanFromSubscription", () => {
    it("returns FREE when subscription is null", () => {
      const plan = getPlanFromSubscription(null);
      expect(plan).toBe("FREE");
    });

    it("returns FREE for inactive subscription", async () => {
      const subscription = await createTestSubscription(testUserId, "free");

      const plan = getPlanFromSubscription({
        isActive: subscription.status === "active",
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });

      expect(plan).toBe("FREE");
    });

    it("returns PRO for active pro subscription", async () => {
      const subscription = await createTestSubscription(testUserId, "pro");

      const plan = getPlanFromSubscription({
        isActive: subscription.status === "active",
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });

      expect(plan).toBe("PRO");
    });

    it("returns FREE for expired pro subscription", async () => {
      // Create subscription with past end date
      const subscription = await prisma.subscription.upsert({
        where: { userId: testUserId },
        update: {
          status: "active", // Still marked active but expired
          plan: "pro",
          currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        },
        create: {
          userId: testUserId,
          status: "active",
          plan: "pro",
          currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
          stripeCustomerId: `cus_test_${testUserId}`,
        },
      });

      const plan = getPlanFromSubscription({
        isActive: true, // Marked active
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });

      // Expired subscription should return FREE
      expect(plan).toBe("FREE");
    });

    it("returns PRO for subscription with future end date", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const subscription = await prisma.subscription.upsert({
        where: { userId: testUserId },
        update: {
          status: "active",
          plan: "pro",
          currentPeriodEnd: futureDate,
        },
        create: {
          userId: testUserId,
          status: "active",
          plan: "pro",
          currentPeriodEnd: futureDate,
          stripeCustomerId: `cus_test_${testUserId}`,
        },
      });

      const plan = getPlanFromSubscription({
        isActive: true,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });

      expect(plan).toBe("PRO");
    });
  });

  describe("getLimits", () => {
    it("returns correct FREE limits", () => {
      const limits = getLimits("FREE");

      expect(limits.channels_connected).toBe(1);
      expect(limits.owned_video_analysis).toBe(5);
      expect(limits.competitor_video_analysis).toBe(5);
      expect(limits.idea_generate).toBe(10);
      expect(limits.channel_sync).toBe(3);
      expect(limits.keyword_research).toBe(0);
    });

    it("returns correct PRO limits", () => {
      const limits = getLimits("PRO");

      expect(limits.channels_connected).toBe(LIMITS.PRO_MAX_CONNECTED_CHANNELS);
      expect(limits.owned_video_analysis).toBe(100);
      expect(limits.competitor_video_analysis).toBe(100);
      expect(limits.idea_generate).toBe(200);
      expect(limits.channel_sync).toBe(50);
      expect(limits.keyword_research).toBe(0); // Still locked
    });
  });

  describe("featureLocked", () => {
    it("keyword_research is locked for FREE", () => {
      expect(featureLocked("FREE", "keyword_research")).toBe(true);
    });

    it("keyword_research is still locked for PRO", () => {
      // Per spec, keyword research is disabled for all plans
      expect(featureLocked("PRO", "keyword_research")).toBe(true);
    });

    it("owned_video_analysis is not locked for FREE", () => {
      expect(featureLocked("FREE", "owned_video_analysis")).toBe(false);
    });

    it("owned_video_analysis is not locked for PRO", () => {
      expect(featureLocked("PRO", "owned_video_analysis")).toBe(false);
    });
  });
});
