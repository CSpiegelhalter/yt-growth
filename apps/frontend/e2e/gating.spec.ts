/**
 * Feature Gating E2E Tests
 *
 * Tests FREE vs PRO tier limits:
 * - Video analysis limits (5/day FREE, 100/day PRO)
 * - Competitor analysis limits
 * - Idea generation limits
 */
import { test, expect } from "@playwright/test";
import {
  signIn,
  setBillingState,
  linkFakeChannel,
  unlinkFakeChannel,
  resetUsage,
  getMe,
  DEMO_USER,
} from "./fixtures/test-helpers";

test.describe("Feature Gating - Free Tier", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as demo user
    await signIn(page, DEMO_USER);

    // Set to FREE plan
    await setBillingState(page, "free");

    // Ensure they have a channel (use bypassLimit for test setup)
    await unlinkFakeChannel(page); // Clear existing
    const result = await linkFakeChannel(page, {
      channelId: "UC_test_gating",
      title: "Gating Test Channel",
      bypassLimit: true, // Bypass limit check for test setup
    });
    expect(result.success).toBe(true);

    // Reset usage counters
    await resetUsage(page);
  });

  test("owned video analysis blocked after limit", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Get initial usage
    const initialMe = await getMe(page);
    const initialUsed = initialMe.usage?.owned_video_analysis?.used ?? 0;
    const limit = initialMe.usage?.owned_video_analysis?.limit ?? 5;

    expect(limit).toBe(5); // FREE limit

    // Make API calls to video insights endpoint until we hit the limit
    const videoIds = [
      "vid_UC_test_gating_0",
      "vid_UC_test_gating_1",
      "vid_UC_test_gating_2",
      "vid_UC_test_gating_3",
      "vid_UC_test_gating_4",
      "vid_UC_test_gating_5", // This should be blocked
    ];

    let blockedResponse: any = null;

    for (let i = 0; i < videoIds.length; i++) {
      const response = await page.request.get(
        `/api/me/channels/UC_test_gating/videos/${videoIds[i]}/insights?range=28d`
      );

      if (i < limit - initialUsed) {
        // Should succeed
        expect(response.status()).toBeLessThan(400);
      } else {
        // Should be blocked with 403
        expect(response.status()).toBe(403);
        blockedResponse = await response.json();
        break;
      }
    }

    // Verify the blocked response structure
    expect(blockedResponse).toBeTruthy();
    expect(blockedResponse.error).toBe("limit_reached");
    expect(blockedResponse.featureKey).toBe("owned_video_analysis");
    expect(blockedResponse.remaining).toBe(0);
    expect(blockedResponse.upgrade).toBe(true);
  });

  test("competitor video analysis blocked after limit", async ({ page }) => {
    await page.goto("/competitors");
    await page.waitForLoadState("networkidle");

    // Get limit info
    const me = await getMe(page);
    const limit = me.usage?.competitor_video_analysis?.limit ?? 5;
    expect(limit).toBe(5);

    // Make API calls until blocked
    const videoIds = ["comp_vid_1", "comp_vid_2", "comp_vid_3", "comp_vid_4", "comp_vid_5", "comp_vid_6"];

    let blockedResponse: any = null;

    for (let i = 0; i < videoIds.length; i++) {
      const response = await page.request.get(
        `/api/competitors/video/${videoIds[i]}?channelId=UC_test_gating`
      );

      if (response.status() === 403) {
        blockedResponse = await response.json();
        break;
      }
    }

    // Should have been blocked
    expect(blockedResponse).toBeTruthy();
    expect(blockedResponse.error).toBe("limit_reached");
    expect(blockedResponse.featureKey).toBe("competitor_video_analysis");
  });

  test("idea generation blocked after limit", async ({ page }) => {
    await page.goto("/ideas");
    await page.waitForLoadState("networkidle");

    // Get limit info
    const me = await getMe(page);
    const limit = me.usage?.idea_generate?.limit ?? 10;
    expect(limit).toBe(10);

    // Make API calls until blocked
    let blockedResponse: any = null;

    for (let i = 0; i < limit + 1; i++) {
      const response = await page.request.post(
        `/api/me/channels/UC_test_gating/ideas/more`,
        {
          data: {
            seed: {
              title: `Test Idea ${i}`,
              keywords: ["test", "youtube"],
              hooks: ["Test hook"],
            },
          },
        }
      );

      if (response.status() === 403) {
        blockedResponse = await response.json();
        break;
      }
    }

    // Should have been blocked
    expect(blockedResponse).toBeTruthy();
    expect(blockedResponse.error).toBe("limit_reached");
    expect(blockedResponse.featureKey).toBe("idea_generate");
  });

  test("usage remaining shown in UI", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should see usage indicators
    const usageSection = page.locator('text=Today');
    await expect(usageSection).toBeVisible({ timeout: 10000 });

    // Should show "left today" text
    await expect(page.locator('text=/\\d+ .* left today/i')).toBeVisible();
  });
});

test.describe("Feature Gating - Pro Tier", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro");
    await unlinkFakeChannel(page);
    const result = await linkFakeChannel(page, {
      channelId: "UC_test_gating_pro",
      title: "Pro Gating Test Channel",
    });
    expect(result.success).toBe(true);
    await resetUsage(page);
  });

  test("pro user has higher limits", async ({ page }) => {
    const me = await getMe(page);

    // PRO limits should be much higher
    expect(me.usage?.owned_video_analysis?.limit).toBe(100);
    expect(me.usage?.competitor_video_analysis?.limit).toBe(100);
    expect(me.usage?.idea_generate?.limit).toBe(200);
    expect(me.usage?.channel_sync?.limit).toBe(50);
  });

  test("pro user can exceed free limits", async ({ page }) => {
    await page.goto("/dashboard");

    // Make 6 video analysis calls (exceeds FREE limit of 5)
    for (let i = 0; i < 6; i++) {
      const response = await page.request.get(
        `/api/me/channels/UC_test_gating_pro/videos/vid_UC_test_gating_pro_${i}/insights?range=28d`
      );

      // All should succeed
      expect(response.status()).toBeLessThan(400);
    }

    // Verify usage was tracked
    const me = await getMe(page);
    expect(me.usage?.owned_video_analysis?.used).toBeGreaterThanOrEqual(6);
  });

  test("no upgrade prompts for pro features", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should not see upgrade prompts
    const upgradeCallout = page.locator('[class*="upgrade"], [data-testid="upgrade-callout"]');
    await expect(upgradeCallout).not.toBeVisible();
  });
});

test.describe("Channel Limits", () => {
  test("free user can add first channel", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "free");

    // Clear existing channels
    await unlinkFakeChannel(page);

    // Link first channel - should succeed (0 < 1 limit)
    const result = await linkFakeChannel(page, {
      channelId: "UC_free_first",
      title: "First Channel (FREE)",
    });

    expect(result.success).toBe(true);
    expect(result.channelId).toBe("UC_free_first");
  });

  test("free user blocked from second channel", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "free");

    // Clear existing channels
    await unlinkFakeChannel(page);

    // Link first channel - should succeed
    const first = await linkFakeChannel(page, {
      channelId: "UC_channel_1",
      title: "Channel 1",
    });
    expect(first.success).toBe(true);

    // Try to link second channel - should be blocked
    const second = await linkFakeChannel(page, {
      channelId: "UC_channel_2",
      title: "Channel 2",
    });

    expect(second.success).toBe(false);
    expect(second.error).toBe("channel_limit_reached");
    expect(second.current).toBe(1);
    expect(second.limit).toBe(1);
    expect(second.plan).toBe("FREE");
  });

  test("pro user allowed multiple channels", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro");
    await unlinkFakeChannel(page);

    // Link three channels - should all succeed
    for (let i = 1; i <= 3; i++) {
      const result = await linkFakeChannel(page, {
        channelId: `UC_pro_channel_${i}`,
        title: `Pro Channel ${i}`,
      });
      expect(result.success).toBe(true);
      expect(result.channelId).toBe(`UC_pro_channel_${i}`);
    }

    // Verify all channels exist
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should see all 3 channels
    await expect(page.locator('text=Pro Channel 1')).toBeVisible();
    await expect(page.locator('text=Pro Channel 2')).toBeVisible();
    await expect(page.locator('text=Pro Channel 3')).toBeVisible();
  });

  test("pro user blocked from 4th channel", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro");
    await unlinkFakeChannel(page);

    // Link three channels - should all succeed
    for (let i = 1; i <= 3; i++) {
      const result = await linkFakeChannel(page, {
        channelId: `UC_pro_limit_${i}`,
        title: `Pro Limit ${i}`,
      });
      expect(result.success).toBe(true);
    }

    // Try 4th - should be blocked
    const fourth = await linkFakeChannel(page, {
      channelId: "UC_pro_limit_4",
      title: "Pro Limit 4 (Blocked)",
    });

    expect(fourth.success).toBe(false);
    expect(fourth.error).toBe("channel_limit_reached");
    expect(fourth.current).toBe(3);
    expect(fourth.limit).toBe(3);
    expect(fourth.plan).toBe("PRO");
  });
});

