/**
 * Channel Limits E2E Tests
 *
 * Tests that channel limits are properly enforced:
 * - FREE plan: max 1 channel
 * - PRO plan: max 3 channels
 *
 * Specifically tests that:
 * - FREE users CAN connect their first channel (0 < 1)
 * - FREE users CANNOT connect a second channel (1 >= 1)
 * - PRO users can connect up to 3 channels
 */
import { test, expect } from "@playwright/test";
import {
  signIn,
  setBillingState,
  linkFakeChannel,
  unlinkFakeChannel,
  resetUsage,
  DEMO_USER,
} from "./fixtures/test-helpers";

test.describe("Channel Limits - FREE Plan", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "free"); // Set to FREE plan
    await unlinkFakeChannel(page); // Start with 0 channels
    await resetUsage(page); // Reset any usage counters
  });

  test("FREE user can connect first channel (0 channels -> 1 allowed)", async ({ page }) => {
    // This is the critical test - FREE users MUST be able to add their first channel
    const result = await linkFakeChannel(page, {
      channelId: "UC_free_first_channel",
      title: "My First Channel",
    });

    // Should succeed
    expect(result.success).toBe(true);
    expect(result.channelId).toBe("UC_free_first_channel");

    // Verify channel appears in dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=My First Channel")).toBeVisible({ timeout: 10000 });
  });

  test("FREE user CANNOT connect second channel (1 channel -> blocked)", async ({ page }) => {
    // First, add the first channel (should succeed)
    const first = await linkFakeChannel(page, {
      channelId: "UC_free_channel_1",
      title: "First Channel",
    });
    expect(first.success).toBe(true);

    // Now try to add a second channel - should be blocked
    const response = await page.request.post("/api/test/youtube/link", {
      data: {
        channelId: "UC_free_channel_2",
        title: "Second Channel",
      },
    });

    expect(response.status()).toBe(403);
    const error = await response.json();
    expect(error.error).toBe("channel_limit_reached");
    expect(error.current).toBe(1);
    expect(error.limit).toBe(1);
    expect(error.plan).toBe("FREE");
  });

  test("FREE user upgrading to PRO can add more channels", async ({ page }) => {
    // Start as FREE with 1 channel
    await linkFakeChannel(page, {
      channelId: "UC_upgrade_test_1",
      title: "Original Channel",
    });

    // Try to add second channel - should fail
    const blockedResponse = await page.request.post("/api/test/youtube/link", {
      data: { channelId: "UC_upgrade_test_2", title: "Blocked Channel" },
    });
    expect(blockedResponse.status()).toBe(403);

    // Upgrade to PRO
    await setBillingState(page, "pro");

    // Now adding second channel should succeed
    const secondResult = await linkFakeChannel(page, {
      channelId: "UC_upgrade_test_2",
      title: "Second Channel After Upgrade",
    });
    expect(secondResult.success).toBe(true);

    // Can even add a third
    const thirdResult = await linkFakeChannel(page, {
      channelId: "UC_upgrade_test_3",
      title: "Third Channel",
    });
    expect(thirdResult.success).toBe(true);
  });
});

test.describe("Channel Limits - PRO Plan", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro"); // Set to PRO plan
    await unlinkFakeChannel(page); // Start with 0 channels
  });

  test("PRO user can connect up to 3 channels", async ({ page }) => {
    // Add first channel
    const first = await linkFakeChannel(page, {
      channelId: "UC_pro_channel_1",
      title: "Pro Channel 1",
    });
    expect(first.success).toBe(true);

    // Add second channel
    const second = await linkFakeChannel(page, {
      channelId: "UC_pro_channel_2",
      title: "Pro Channel 2",
    });
    expect(second.success).toBe(true);

    // Add third channel
    const third = await linkFakeChannel(page, {
      channelId: "UC_pro_channel_3",
      title: "Pro Channel 3",
    });
    expect(third.success).toBe(true);

    // Verify all 3 channels appear in dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Pro Channel 1")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Pro Channel 2")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Pro Channel 3")).toBeVisible({ timeout: 10000 });
  });

  test("PRO user CANNOT connect 4th channel (3 channels -> blocked)", async ({ page }) => {
    // Add 3 channels
    for (let i = 1; i <= 3; i++) {
      const result = await linkFakeChannel(page, {
        channelId: `UC_pro_limit_${i}`,
        title: `Pro Limit Channel ${i}`,
      });
      expect(result.success).toBe(true);
    }

    // Try to add 4th channel - should be blocked
    const response = await page.request.post("/api/test/youtube/link", {
      data: {
        channelId: "UC_pro_limit_4",
        title: "Fourth Channel (Blocked)",
      },
    });

    expect(response.status()).toBe(403);
    const error = await response.json();
    expect(error.error).toBe("channel_limit_reached");
    expect(error.current).toBe(3);
    expect(error.limit).toBe(3);
    expect(error.plan).toBe("PRO");
  });

  test("PRO user can unlink and re-link within limit", async ({ page }) => {
    // Add 3 channels
    for (let i = 1; i <= 3; i++) {
      await linkFakeChannel(page, {
        channelId: `UC_relink_${i}`,
        title: `Relink Channel ${i}`,
      });
    }

    // Unlink one
    await unlinkFakeChannel(page, "UC_relink_2");

    // Should be able to add a new one
    const result = await linkFakeChannel(page, {
      channelId: "UC_relink_new",
      title: "New Replacement Channel",
    });
    expect(result.success).toBe(true);
  });
});

test.describe("Channel Limits - Downgrade Scenario", () => {
  test("PRO user with 3 channels downgrading to FREE keeps channels but cannot add more", async ({
    page,
  }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro");
    await unlinkFakeChannel(page);

    // Add 3 channels as PRO
    for (let i = 1; i <= 3; i++) {
      await linkFakeChannel(page, {
        channelId: `UC_downgrade_${i}`,
        title: `Downgrade Channel ${i}`,
        bypassLimit: true, // Use bypass for test setup
      });
    }

    // Downgrade to FREE
    await setBillingState(page, "free");

    // Try to add another channel - should be blocked
    const response = await page.request.post("/api/test/youtube/link", {
      data: {
        channelId: "UC_downgrade_4",
        title: "Post-Downgrade Channel",
      },
    });

    expect(response.status()).toBe(403);
    const error = await response.json();
    expect(error.error).toBe("channel_limit_reached");
    expect(error.current).toBe(3); // Still has 3 from before
    expect(error.limit).toBe(1); // FREE limit is 1

    // Existing channels should still be accessible
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Downgrade Channel 1")).toBeVisible({ timeout: 10000 });
  });
});

