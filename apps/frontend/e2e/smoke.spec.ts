/**
 * Smoke Tests
 *
 * Quick regression tests that verify main pages load without errors.
 * These tests should be fast and catch obvious breakage.
 */
import { test, expect } from "@playwright/test";
import {
  signIn,
  setBillingState,
  linkFakeChannel,
  unlinkFakeChannel,
  DEMO_USER,
} from "./fixtures/test-helpers";

test.describe("Smoke Tests - Public Pages", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/YouTube|ChannelBoost|Growth/i);

    // Should have login/signup links
    const authLinks = page.locator('a[href*="login"], a[href*="signup"]');
    await expect(authLinks.first()).toBeVisible();

    // No unhandled error banners
    await expect(
      page.locator("text=/error|something went wrong/i")
    ).not.toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe("Smoke Tests - Protected Pages", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro");

    // Ensure a channel exists for pages that need it
    await unlinkFakeChannel(page);
    const result = await linkFakeChannel(page, {
      channelId: "UC_smoke_test",
      title: "Smoke Test Channel",
    });
    expect(result.success).toBe(true);
  });

  test("dashboard loads without error", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Main content should be visible
    await expect(page.locator("main")).toBeVisible();

    // Should see dashboard heading or channel
    const dashboardContent = page.locator(
      "text=/dashboard|channel|smoke test/i"
    );
    await expect(dashboardContent.first()).toBeVisible({ timeout: 10000 });

    // No error banners
    await expect(
      page.locator('[role="alert"][class*="error"], text=/unhandled error/i')
    ).not.toBeVisible();
  });

  test("videos page loads without error", async ({ page }) => {
    await page.goto("/videos");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();

    // Should see video-related content
    const videoContent = page.locator("text=/video|watch|analyze/i");
    await expect(videoContent.first()).toBeVisible({ timeout: 10000 });
  });

  test("competitors page loads without error", async ({ page }) => {
    await page.goto("/competitors");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();

    // Should see competitor-related content
    const competitorContent = page.locator("text=/competitor|channel|track/i");
    await expect(competitorContent.first()).toBeVisible({ timeout: 10000 });
  });

  test("ideas page loads without error", async ({ page }) => {
    await page.goto("/ideas");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();

    // Should see ideas-related content
    const ideasContent = page.locator("text=/idea|generate|content/i");
    await expect(ideasContent.first()).toBeVisible({ timeout: 10000 });
  });

  test("trending page loads without error", async ({ page }) => {
    await page.goto("/trending");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();

    // Should see trending-related content
    const trendingContent = page.locator("text=/trending|popular|discover/i");
    await expect(trendingContent.first()).toBeVisible({ timeout: 10000 });
  });

  test("profile page loads without error", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();

    // Should see profile-related content
    await expect(
      page.locator("text=/profile|account|email/i").first()
    ).toBeVisible({ timeout: 10000 });

    // Should show email
    await expect(page.locator(`text=${DEMO_USER.email}`)).toBeVisible();
  });

  test("audit page loads for channel", async ({ page }) => {
    await page.goto("/audit/UC_smoke_test");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();

    // Should see audit-related content
    const auditContent = page.locator("text=/audit|analysis|performance/i");
    await expect(auditContent.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Smoke Tests - API Endpoints", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USER);
  });

  test("GET /api/me returns user data", async ({ page }) => {
    const response = await page.request.get("/api/me");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.email).toBe(DEMO_USER.email);
    expect(data.plan).toBeDefined();
  });

  test("GET /api/me/channels returns channels array", async ({ page }) => {
    const response = await page.request.get("/api/me/channels");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data.channels || data)).toBeTruthy();
  });

  test("protected routes require authentication", async ({ page }) => {
    // Sign out first
    await page.goto("/api/auth/signout");
    await page.waitForLoadState("networkidle");

    // Try to access protected endpoint without auth
    const response = await page.request.get("/api/me");
    expect(response.status()).toBe(401);
  });
});

test.describe("Smoke Tests - Mobile Viewport", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("dashboard is responsive on mobile", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should render without horizontal scrolling
    const body = page.locator("body");
    const box = await body.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);

    // Main content should be visible
    await expect(page.locator("main")).toBeVisible();
  });

  test("profile page is responsive on mobile", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Check for proper rendering
    await expect(page.locator("main")).toBeVisible();

    // Email should be visible
    await expect(page.locator(`text=${DEMO_USER.email}`)).toBeVisible();
  });
});
