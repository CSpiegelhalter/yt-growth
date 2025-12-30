/**
 * Entitlements Unit Tests
 *
 * Pure unit tests for entitlements logic - no database required.
 */
import { describe, it, expect } from "bun:test";
import {
  getPlanFromMe,
  getPlanFromSubscription,
  getLimits,
  getLimit,
  getMaxChannels,
  featureLocked,
  isUsageLimited,
  getResetAt,
  getTodayDateKey,
  getFeatureDisplayName,
  getPlanDisplayName,
} from "@/lib/entitlements";
import { LIMITS } from "@/lib/product";
import type { Me } from "@/types/api";

describe("Entitlements Unit Tests", () => {
  describe("getPlanFromMe", () => {
    it("returns FREE when me is null", () => {
      expect(getPlanFromMe(null)).toBe("FREE");
    });

    it("returns FREE when me is undefined", () => {
      expect(getPlanFromMe(undefined)).toBe("FREE");
    });

    it("returns FREE when subscription is not active", () => {
      const me: Me = {
        id: 1,
        email: "test@test.com",
        name: "Test",
        plan: "pro",
        status: "inactive",
        channel_limit: 1,
        subscription: {
          isActive: false,
          currentPeriodEnd: null,
        },
      };
      expect(getPlanFromMe(me)).toBe("FREE");
    });

    it("returns FREE when plan is free", () => {
      const me: Me = {
        id: 1,
        email: "test@test.com",
        name: "Test",
        plan: "free",
        status: "active",
        channel_limit: 1,
        subscription: {
          isActive: true,
          currentPeriodEnd: null,
        },
      };
      expect(getPlanFromMe(me)).toBe("FREE");
    });

    it("returns PRO when subscription is active and plan is pro", () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const me: Me = {
        id: 1,
        email: "test@test.com",
        name: "Test",
        plan: "pro",
        status: "active",
        channel_limit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
        subscription: {
          isActive: true,
          currentPeriodEnd: futureDate,
        },
      };
      expect(getPlanFromMe(me)).toBe("PRO");
    });

    it("returns FREE when period end date is in the past", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const me: Me = {
        id: 1,
        email: "test@test.com",
        name: "Test",
        plan: "pro",
        status: "active",
        channel_limit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
        subscription: {
          isActive: true,
          currentPeriodEnd: pastDate,
        },
      };
      expect(getPlanFromMe(me)).toBe("FREE");
    });
  });

  describe("getPlanFromSubscription", () => {
    it("returns FREE when subscription is null", () => {
      expect(getPlanFromSubscription(null)).toBe("FREE");
    });

    it("returns FREE when not active", () => {
      expect(
        getPlanFromSubscription({
          isActive: false,
          plan: "pro",
          currentPeriodEnd: null,
        })
      ).toBe("FREE");
    });

    it("returns FREE when plan is free", () => {
      expect(
        getPlanFromSubscription({
          isActive: true,
          plan: "free",
          currentPeriodEnd: null,
        })
      ).toBe("FREE");
    });

    it("returns PRO when active with pro plan", () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      expect(
        getPlanFromSubscription({
          isActive: true,
          plan: "pro",
          currentPeriodEnd: futureDate,
        })
      ).toBe("PRO");
    });

    it("handles string dates", () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(
        getPlanFromSubscription({
          isActive: true,
          plan: "pro",
          currentPeriodEnd: futureDate,
        })
      ).toBe("PRO");
    });
  });

  describe("getLimits", () => {
    it("returns FREE limits", () => {
      const limits = getLimits("FREE");
      expect(limits).toEqual({
        channels_connected: 1,
        owned_video_analysis: 5,
        competitor_video_analysis: 5,
        idea_generate: 10,
        channel_sync: 3,
        keyword_research: 0,
      });
    });

    it("returns PRO limits", () => {
      const limits = getLimits("PRO");
      expect(limits).toEqual({
        channels_connected: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
        owned_video_analysis: 100,
        competitor_video_analysis: 100,
        idea_generate: 200,
        channel_sync: 50,
        keyword_research: 0,
      });
    });
  });

  describe("getLimit", () => {
    it("returns specific limit for feature", () => {
      expect(getLimit("FREE", "owned_video_analysis")).toBe(5);
      expect(getLimit("PRO", "owned_video_analysis")).toBe(100);
      expect(getLimit("FREE", "channels_connected")).toBe(1);
      expect(getLimit("PRO", "channels_connected")).toBe(LIMITS.PRO_MAX_CONNECTED_CHANNELS);
    });
  });

  describe("getMaxChannels", () => {
    it("returns 1 for FREE", () => {
      expect(getMaxChannels("FREE")).toBe(1);
    });

    it("returns 3 for PRO", () => {
      expect(getMaxChannels("PRO")).toBe(LIMITS.PRO_MAX_CONNECTED_CHANNELS);
    });
  });

  describe("featureLocked", () => {
    it("keyword_research is locked for both plans", () => {
      expect(featureLocked("FREE", "keyword_research")).toBe(true);
      expect(featureLocked("PRO", "keyword_research")).toBe(true);
    });

    it("other features are not locked", () => {
      const features = [
        "channels_connected",
        "owned_video_analysis",
        "competitor_video_analysis",
        "idea_generate",
        "channel_sync",
      ] as const;

      features.forEach((feature) => {
        expect(featureLocked("FREE", feature)).toBe(false);
        expect(featureLocked("PRO", feature)).toBe(false);
      });
    });
  });

  describe("isUsageLimited", () => {
    it("returns true for usage-limited features", () => {
      expect(isUsageLimited("owned_video_analysis")).toBe(true);
      expect(isUsageLimited("competitor_video_analysis")).toBe(true);
      expect(isUsageLimited("idea_generate")).toBe(true);
      expect(isUsageLimited("channel_sync")).toBe(true);
    });

    it("returns false for non-usage-limited features", () => {
      expect(isUsageLimited("channels_connected")).toBe(false);
      expect(isUsageLimited("keyword_research")).toBe(false);
    });
  });

  describe("getResetAt", () => {
    it("returns a future date", () => {
      const resetAt = getResetAt();
      expect(resetAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("returns a valid Date object", () => {
      const resetAt = getResetAt();
      expect(resetAt).toBeInstanceOf(Date);
      expect(isNaN(resetAt.getTime())).toBe(false);
    });
  });

  describe("getTodayDateKey", () => {
    it("returns date in YYYY-MM-DD format", () => {
      const key = getTodayDateKey();
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns a valid date", () => {
      const key = getTodayDateKey();
      const date = new Date(key);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });

  describe("getFeatureDisplayName", () => {
    it("returns human-readable names", () => {
      expect(getFeatureDisplayName("channels_connected")).toBe("Connected Channels");
      expect(getFeatureDisplayName("owned_video_analysis")).toBe("Video Analysis");
      expect(getFeatureDisplayName("competitor_video_analysis")).toBe("Competitor Analysis");
      expect(getFeatureDisplayName("idea_generate")).toBe("Idea Generation");
      expect(getFeatureDisplayName("channel_sync")).toBe("Channel Sync");
      expect(getFeatureDisplayName("keyword_research")).toBe("Keyword Research");
    });
  });

  describe("getPlanDisplayName", () => {
    it("returns display names", () => {
      expect(getPlanDisplayName("FREE")).toBe("Free");
      expect(getPlanDisplayName("PRO")).toBe("Pro");
    });
  });
});
