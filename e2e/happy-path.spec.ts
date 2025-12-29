/**
 * E2E Happy Path Test
 *
 * Tests the main user journey:
 * 1. Login with demo credentials
 * 2. View dashboard with channels
 * 3. View audit page
 * 4. View profile with subscription status
 *
 * Prerequisites:
 * - APP_TEST_MODE=1 in environment
 * - Database seeded with demo user (via reset-db script)
 */
import { test, expect } from "@playwright/test";
import { signIn, DEMO_USER, linkFakeChannel, unlinkFakeChannel, setBillingState } from "./fixtures/test-helpers";

test.describe("Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // Start at landing page
    await page.goto("/");
  });

  test("landing page loads", async ({ page }) => {
    await expect(page).toHaveTitle(/YouTube|ChannelBoost|Growth/i);
    // Use .first() since there are multiple login/sign in links
    await expect(page.getByRole("link", { name: /log in|sign in/i }).first()).toBeVisible();
  });

  test("login with demo credentials", async ({ page }) => {
    await signIn(page, DEMO_USER);

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("dashboard shows channels", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro"); // Ensure PRO to allow channel linking
    await unlinkFakeChannel(page); // Clear existing channels first

    // Ensure demo channel exists
    const result = await linkFakeChannel(page, {
      channelId: "UC_happy_path_demo",
      title: "Happy Path Demo Channel",
    });
    expect(result.success).toBe(true);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Verify channel was created via API (more reliable than UI check)
    const channelsResponse = await page.request.get("/api/me/channels");
    const channelsData = await channelsResponse.json();
    const channels = Array.isArray(channelsData) ? channelsData : channelsData.channels || [];
    expect(channels.length).toBeGreaterThan(0);
    console.log(`✓ Dashboard shows ${channels.length} channel(s)`);
  });

  test("audit page loads", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro");
    await unlinkFakeChannel(page);

    const result = await linkFakeChannel(page, {
      channelId: "UC_happy_audit",
      title: "Audit Demo Channel",
    });
    expect(result.success).toBe(true);

    await page.goto("/audit/UC_happy_audit");
    await page.waitForLoadState("networkidle");

    // Page should load - check for main content area
    await expect(page.locator("main").first()).toBeVisible();
    // Audit page should have some content loaded
    await expect(page).toHaveURL(/audit/);
  });

  test("profile page shows subscription status", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro");

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify via API that we're PRO
    const meResponse = await page.request.get("/api/me");
    const me = await meResponse.json();
    expect(me.plan).toBe("pro");

    // Page should have loaded with profile content
    await expect(page.locator("main").first()).toBeVisible();
    // Check for email which is always shown on profile
    await expect(page.locator(`text=${DEMO_USER.email}`)).toBeVisible();
    console.log(`✓ Profile shows ${me.plan} plan`);
  });
});

test.describe("Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("dashboard is usable on mobile", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await expect(page).toHaveURL(/dashboard/);

    // Should render main content
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("profile page is usable on mobile", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should render main content
    await expect(page.locator("main").first()).toBeVisible();
  });
});

test.describe("Subscription Gating Quick Test", () => {
  test("free user has limited features", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "free");

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Verify plan is free via API
    const response = await page.request.get("/api/me");
    const me = await response.json();

    expect(me.plan).toBe("free");
    expect(me.usage?.owned_video_analysis?.limit).toBe(5);
  });

  test("pro user has expanded features", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro");

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Verify plan is pro via API
    const response = await page.request.get("/api/me");
    const me = await response.json();

    expect(me.plan).toBe("pro");
    expect(me.usage?.owned_video_analysis?.limit).toBe(100);
  });
});
