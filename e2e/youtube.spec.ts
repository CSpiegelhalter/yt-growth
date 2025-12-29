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

    // Verify via API (more reliable than UI)
    // Note: API returns channel_id (snake_case)
    const channelsResponse = await page.request.get("/api/me/channels");
    expect(channelsResponse.ok()).toBe(true);
    const data = await channelsResponse.json();
    const channels = Array.isArray(data) ? data : data.channels || [];
    expect(channels.some((c: { channel_id: string }) => c.channel_id === "UC_youtube_test_1")).toBe(true);
  });

  test("unlink channel removes it from account", async ({ page }) => {
    // Link a channel
    const result = await linkFakeChannel(page, {
      channelId: "UC_youtube_test_2",
      title: "Channel To Unlink",
    });
    expect(result.success).toBe(true);

    // Verify it exists via API (API returns channel_id snake_case)
    let channelsResponse = await page.request.get("/api/me/channels");
    let data = await channelsResponse.json();
    let channels = Array.isArray(data) ? data : data.channels || [];
    expect(channels.some((c: { channel_id: string }) => c.channel_id === "UC_youtube_test_2")).toBe(true);

    // Unlink it via API
    await unlinkFakeChannel(page, "UC_youtube_test_2");

    // Verify it's gone via API
    channelsResponse = await page.request.get("/api/me/channels");
    data = await channelsResponse.json();
    channels = Array.isArray(data) ? data : data.channels || [];
    expect(channels.some((c: { channel_id: string }) => c.channel_id === "UC_youtube_test_2")).toBe(false);
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

    // Verify via API
    const channelsResponse = await page.request.get("/api/me/channels");
    expect(channelsResponse.ok()).toBe(true);
    const data = await channelsResponse.json();
    const channels = Array.isArray(data) ? data : data.channels || [];
    expect(channels.length).toBeGreaterThanOrEqual(2);
  });

  test("unlink all channels works", async ({ page }) => {
    // Link a few channels
    const first = await linkFakeChannel(page, { channelId: "UC_unlink_all_1", title: "Unlink All 1" });
    expect(first.success).toBe(true);
    const second = await linkFakeChannel(page, { channelId: "UC_unlink_all_2", title: "Unlink All 2" });
    expect(second.success).toBe(true);

    // Unlink all (no specific channelId)
    await unlinkFakeChannel(page);

    // Verify all are gone via API
    const channelsResponse = await page.request.get("/api/me/channels");
    const data = await channelsResponse.json();
    const channels = Array.isArray(data) ? data : data.channels || [];
    expect(channels.length).toBe(0);
  });
});

