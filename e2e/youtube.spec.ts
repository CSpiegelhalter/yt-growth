/**
 * YouTube Channel Management E2E Tests
 *
 * Tests fake YouTube integration:
 * - Link channel
 * - Unlink channel
 * - Channel appears in dashboard
 * - Videos are accessible
 * - Free users can see videos
 */
import { test, expect } from "@playwright/test";
import {
  signIn,
  setBillingState,
  linkFakeChannel,
  unlinkFakeChannel,
  linkEmptyChannel,
  addFakeVideo,
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

test.describe("Free User Video Access", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "free"); // Set to FREE plan
    await unlinkFakeChannel(page); // Start fresh
  });

  test("free user can see videos on dashboard after linking channel", async ({
    page,
  }) => {
    // Link a channel (this creates videos automatically)
    const result = await linkFakeChannel(page, {
      channelId: "UC_free_videos_test",
      title: "Free User Video Test",
    });
    expect(result.success).toBe(true);

    // Verify /videos API returns videos for free user
    const videosResponse = await page.request.get(
      "/api/me/channels/UC_free_videos_test/videos"
    );
    expect(videosResponse.ok()).toBe(true);

    const videosData = await videosResponse.json();
    expect(videosData.videos).toBeDefined();
    expect(videosData.videos.length).toBeGreaterThan(0);
    console.log(`✓ /videos API returned ${videosData.videos.length} videos`);

    // Navigate to dashboard and verify videos are displayed
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Wait for video cards to appear
    const videoCards = page.locator(
      '[class*="videoCard"], [class*="video-card"], a[href^="/video/"]'
    );
    await expect(videoCards.first()).toBeVisible({ timeout: 15000 });

    const videoCount = await videoCards.count();
    expect(videoCount).toBeGreaterThan(0);
    console.log(`✓ FREE user sees ${videoCount} videos on dashboard`);
  });

  test("free user: no videos -> upload -> refresh -> see videos", async ({
    page,
  }) => {
    // Step 1: Link an EMPTY channel (no videos)
    const linkResult = await linkEmptyChannel(page, {
      channelId: "UC_free_upload_test",
      title: "Upload Flow Test",
    });
    expect(linkResult.success).toBe(true);
    console.log("✓ Linked empty channel");

    // Step 2: Verify /videos API returns empty array
    let videosResponse = await page.request.get(
      "/api/me/channels/UC_free_upload_test/videos"
    );
    expect(videosResponse.ok()).toBe(true);
    let videosData = await videosResponse.json();
    expect(videosData.videos).toBeDefined();
    expect(videosData.videos.length).toBe(0);
    console.log("✓ /videos API returns 0 videos initially");

    // Step 3: Navigate to dashboard - should show "no videos" state
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Check for empty state or "no videos" message
    const emptyState = page.locator(
      'text=/No videos|Refresh|sync/i, [class*="empty"]'
    );
    const hasEmptyState = await emptyState
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    console.log(`✓ Dashboard shows empty state: ${hasEmptyState}`);

    // Step 4: "Upload" a video (simulate by adding to database)
    const addResult = await addFakeVideo(page, "UC_free_upload_test", {
      videoId: "vid_new_upload_1",
      title: "My First Upload!",
    });
    expect(addResult.success).toBe(true);
    console.log(`✓ Added fake video: ${addResult.videoId}`);

    // Step 5: Verify /videos API now returns the video
    videosResponse = await page.request.get(
      "/api/me/channels/UC_free_upload_test/videos"
    );
    expect(videosResponse.ok()).toBe(true);
    videosData = await videosResponse.json();
    expect(videosData.videos.length).toBe(1);
    expect(videosData.videos[0].title).toBe("My First Upload!");
    console.log("✓ /videos API returns 1 video after upload");

    // Step 6: Refresh dashboard and verify video appears
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for video to appear
    const videoCard = page.locator(
      '[class*="videoCard"], [class*="video-card"], a[href^="/video/"]'
    );
    await expect(videoCard.first()).toBeVisible({ timeout: 15000 });

    // Verify the video title is visible
    const videoTitle = page.locator('text="My First Upload!"');
    await expect(videoTitle).toBeVisible({ timeout: 5000 });
    console.log("✓ FREE user can see newly uploaded video on dashboard");
  });

  test("free user /videos API does not require subscription", async ({
    page,
  }) => {
    // Link a channel
    const result = await linkFakeChannel(page, {
      channelId: "UC_free_api_test",
      title: "API Test Channel",
    });
    expect(result.success).toBe(true);

    // Call /videos endpoint (should NOT require subscription)
    const videosResponse = await page.request.get(
      "/api/me/channels/UC_free_api_test/videos"
    );

    // Should return 200, not 403
    expect(videosResponse.status()).toBe(200);

    const data = await videosResponse.json();
    expect(data.error).toBeUndefined();
    expect(data.videos).toBeDefined();
    console.log(
      `✓ /videos API returns 200 for FREE user (not subscription-gated)`
    );

    // Also verify we're actually on free plan
    const meResponse = await page.request.get("/api/me");
    const me = await meResponse.json();
    expect(me.plan).toBe("free");
    console.log("✓ Confirmed user is on FREE plan");
  });
});

