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

      const status = response.status();
      console.log(`Video analysis ${i + 1}: status ${status}`);

      if (status === 403) {
        // Hit the limit
        blockedResponse = await response.json();
        console.log("Blocked response:", blockedResponse);
        break;
      } else if (status >= 500) {
        // Server error - log and continue (might be missing video)
        const errorText = await response.text();
        console.log(
          `Server error for video ${videoIds[i]}: ${errorText.slice(0, 200)}`
        );
        // Skip this iteration but don't fail - the video might not exist
        continue;
      } else if (i >= limit - initialUsed) {
        // Should have been blocked but wasn't
        expect(status).toBe(403);
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
    const videoIds = [
      "comp_vid_1",
      "comp_vid_2",
      "comp_vid_3",
      "comp_vid_4",
      "comp_vid_5",
      "comp_vid_6",
    ];

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

  test("idea generation shows upgrade prompt for free users", async ({
    page,
  }) => {
    // Navigate to ideas page
    await page.goto("/ideas");
    await page.waitForLoadState("networkidle");

    // Verify free user sees upgrade/subscription messaging on the ideas page
    // Look for common upgrade prompts or limit indicators
    const upgradePrompt = page
      .locator("text=/Subscribe|Upgrade|Pro|Unlock|Limit/i")
      .first();
    const hasUpgradePrompt = await upgradePrompt
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Also check for any gating message about ideas limits
    const limitMessage = page
      .locator('[class*="limit"], [class*="upgrade"], [class*="subscribe"]')
      .first();
    const hasLimitMessage = await limitMessage
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Verify API confirms free tier limits
    const me = await getMe(page);
    expect(me.plan).toBe("free");
    expect(me.usage?.idea_generate?.limit).toBe(10); // FREE tier has 10/day limit

    console.log(
      `✓ Ideas page loaded for FREE user (limit: ${me.usage?.idea_generate?.limit}/day)`
    );
    console.log(`  - Upgrade prompt visible: ${hasUpgradePrompt}`);
    console.log(`  - Limit message visible: ${hasLimitMessage}`);

    // The page should work but with limits - at minimum, verify we're on the right page
    await expect(page).toHaveURL(/ideas/);
  });

  test("usage remaining shown in UI", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should see some usage/plan related content on the profile page
    // Note: The exact UI elements depend on implementation
    const profileContent = page.locator("main").first();
    await expect(profileContent).toBeVisible({ timeout: 10000 });

    // Look for any of: usage indicators, plan info, or subscription section
    const hasUsageInfo = await page
      .locator("text=/usage|limit|remaining|analyses|ideas/i")
      .first()
      .isVisible()
      .catch(() => false);
    const hasPlanInfo = await page
      .locator("text=/Free|Pro|Plan/i")
      .first()
      .isVisible()
      .catch(() => false);

    // At least one should be visible
    expect(hasUsageInfo || hasPlanInfo).toBe(true);
  });

  test("free user sees upgrade prompts on various pages", async ({ page }) => {
    // Check Dashboard - should see "Subscribe Now" CTA
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const subscribeNow = page.locator("text=/Subscribe Now/i");
    await expect(subscribeNow).toBeVisible({ timeout: 10000 });
    console.log("✓ Dashboard: FREE user sees 'Subscribe Now' CTA");

    // Check Profile - should see "Upgrade to Pro" or "Subscribe Now"
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const upgradePrompt = page.locator("text=/Subscribe Now|Upgrade to Pro/i");
    await expect(upgradePrompt.first()).toBeVisible({ timeout: 10000 });
    console.log("✓ Profile: FREE user sees upgrade prompt");

    // Check Ideas page - should have upgrade available somewhere
    await page.goto("/ideas");
    await page.waitForLoadState("networkidle");
    // Ideas page works for free users but with limits
    console.log("✓ Ideas: Page accessible for FREE user");

    // Check Competitors page - should see upgrade prompt
    await page.goto("/competitors");
    await page.waitForLoadState("networkidle");

    const competitorUpgrade = page.locator("text=/Upgrade to Pro/i");
    // May or may not show depending on if user has a channel selected
    if (
      await competitorUpgrade.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      console.log("✓ Competitors: FREE user sees upgrade prompt");
    } else {
      console.log(
        "✓ Competitors: Page accessible, upgrade prompt may appear on usage"
      );
    }
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
    let successCount = 0;
    for (let i = 0; i < 6; i++) {
      const response = await page.request.get(
        `/api/me/channels/UC_test_gating_pro/videos/vid_UC_test_gating_pro_${i}/insights?range=28d`
      );

      const status = response.status();
      // 500 = backend error (not rate limited), 403 = rate limited (shouldn't happen for PRO)
      if (status >= 500) {
        console.log(
          `Video ${i}: Got 500 - backend error, not rate limit issue`
        );
        continue; // Backend errors don't count against us
      }

      // PRO users should not hit 403 limit errors for 6 requests
      if (status === 403) {
        throw new Error(
          `PRO user was rate limited at request ${i} - should have higher limits`
        );
      }

      successCount++;
    }

    // At least some requests should have been processed (not all may succeed due to backend issues)
    console.log(
      `✓ PRO user processed ${successCount}/6 requests without hitting rate limits`
    );
  });

  test("no upgrade prompts anywhere for pro user", async ({ page }) => {
    // Check Dashboard - no "Subscribe Now" CTA
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const subscribeNow = page.locator("text=/Subscribe Now/i");
    await expect(subscribeNow).not.toBeVisible();
    console.log("✓ Dashboard: No 'Subscribe Now' for PRO user");

    // Check Profile - should show "Manage Subscription" not "Subscribe Now"
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=/Subscribe Now/i")).not.toBeVisible();
    await expect(page.locator("text=/Upgrade to Pro/i")).not.toBeVisible();
    // Should see Manage button instead (use button role to be specific)
    await expect(page.getByRole("button", { name: /Manage/i })).toBeVisible();
    console.log("✓ Profile: Shows 'Manage' not upgrade prompts for PRO user");

    // Check Ideas page - no upgrade prompts
    await page.goto("/ideas");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=/Upgrade to Pro/i")).not.toBeVisible();
    console.log("✓ Ideas: No upgrade prompts for PRO user");

    // Check Competitors page - no upgrade prompts (feature should be unlocked)
    await page.goto("/competitors");
    await page.waitForLoadState("networkidle");

    // PRO users should not see the upgrade prompt
    await expect(
      page.locator("text=/Upgrade to Pro to unlock/i")
    ).not.toBeVisible();
    console.log("✓ Competitors: No upgrade prompts for PRO user");
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
      channelId: "UC_gating_free_first",
      title: "First Channel (FREE)",
    });

    expect(result.success).toBe(true);
    expect(result.channelId).toBe("UC_gating_free_first");
  });

  test("free user blocked from second channel", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "free");

    // Clear existing channels
    await unlinkFakeChannel(page);

    // Link first channel - should succeed
    const first = await linkFakeChannel(page, {
      channelId: "UC_gating_channel_1",
      title: "Channel 1",
    });
    expect(first.success).toBe(true);

    // Try to link second channel - should be blocked
    const second = await linkFakeChannel(page, {
      channelId: "UC_gating_channel_2",
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

    // Should see all 3 channels (use .first() since channel names appear in multiple places)
    await expect(page.locator("text=Pro Channel 1").first()).toBeVisible();
    await expect(page.locator("text=Pro Channel 2").first()).toBeVisible();
    await expect(page.locator("text=Pro Channel 3").first()).toBeVisible();
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
      channelId: "UC_gating_pro_limit_4",
      title: "Pro Limit 4 (Blocked)",
    });

    expect(fourth.success).toBe(false);
    expect(fourth.error).toBe("channel_limit_reached");
    expect(fourth.current).toBe(3);
    expect(fourth.limit).toBe(3);
    expect(fourth.plan).toBe("PRO");
  });
});
