/**
 * YouTube Channel Management E2E Tests
 *
 * Tests fake YouTube integration:
 * - Link channel
 * - Unlink channel
 * - Channel appears in dashboard
 * - Videos are accessible
 */
import { test, expect } from "@playwright/test";
import {
  signIn,
  setBillingState,
  linkFakeChannel,
  unlinkFakeChannel,
  DEMO_USER,
} from "./fixtures/test-helpers";

test.describe("YouTube Channel Management", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro"); // Ensure PRO for multiple channels
    await unlinkFakeChannel(page); // Start fresh
  });

  test("link fake channel creates channel record", async ({ page }) => {
    const result = await linkFakeChannel(page, {
      channelId: "UC_youtube_test_1",
      title: "YouTube Test Channel",
    });

    expect(result.success).toBe(true);
    expect(result.channelId).toBe("UC_youtube_test_1");

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Channel should appear
    await expect(page.locator("text=YouTube Test Channel")).toBeVisible({ timeout: 10000 });
  });

  test("unlink channel removes it from dashboard", async ({ page }) => {
    // Link a channel
    const result = await linkFakeChannel(page, {
      channelId: "UC_youtube_test_2",
      title: "Channel To Unlink",
    });
    expect(result.success).toBe(true);

    // Verify it appears
    await page.goto("/dashboard");
    await expect(page.locator("text=Channel To Unlink")).toBeVisible({ timeout: 10000 });

    // Unlink it via API
    await unlinkFakeChannel(page, "UC_youtube_test_2");

    // Refresh and verify it's gone
    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Channel To Unlink")).not.toBeVisible({ timeout: 5000 });
  });

  test("linked channel has videos", async ({ page }) => {
    const result = await linkFakeChannel(page, {
      channelId: "UC_youtube_test_3",
      title: "Channel With Videos",
    });
    expect(result.success).toBe(true);

    // Navigate to videos page
    await page.goto(`/videos`);
    await page.waitForLoadState("networkidle");

    // Should see video thumbnails or titles
    const videoCards = page.locator('[class*="video"], [data-testid*="video"]');
    await expect(videoCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("can link multiple channels on pro", async ({ page }) => {
    // Link first channel
    const first = await linkFakeChannel(page, {
      channelId: "UC_multi_1",
      title: "Multi Channel 1",
    });
    expect(first.success).toBe(true);

    // Link second channel
    const second = await linkFakeChannel(page, {
      channelId: "UC_multi_2",
      title: "Multi Channel 2",
    });
    expect(second.success).toBe(true);

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Both channels should appear
    await expect(page.locator("text=Multi Channel 1")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Multi Channel 2")).toBeVisible({ timeout: 10000 });
  });

  test("channel sync works via API", async ({ page }) => {
    const result = await linkFakeChannel(page, {
      channelId: "UC_sync_test",
      title: "Sync Test Channel",
    });
    expect(result.success).toBe(true);

    // Trigger sync
    const response = await page.request.post(`/api/me/channels/${result.channelId}/sync`);

    // Should succeed (or return usage limit info, which is also valid)
    expect([200, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

  test("unlink all channels works", async ({ page }) => {
    // Link a few channels
    const first = await linkFakeChannel(page, { channelId: "UC_unlink_all_1", title: "Unlink All 1" });
    expect(first.success).toBe(true);
    const second = await linkFakeChannel(page, { channelId: "UC_unlink_all_2", title: "Unlink All 2" });
    expect(second.success).toBe(true);

    // Unlink all (no specific channelId)
    await unlinkFakeChannel(page);

    // Verify all are gone
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Unlink All 1")).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Unlink All 2")).not.toBeVisible({ timeout: 5000 });
  });
});

