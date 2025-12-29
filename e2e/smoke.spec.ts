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

    // Main content should be visible (use .first() for strict mode)
    await expect(page.locator("main").first()).toBeVisible();

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test("profile page loads without error", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main").first()).toBeVisible();

    // Should show email (specific, always present)
    await expect(page.locator(`text=${DEMO_USER.email}`)).toBeVisible();
  });

  test("ideas page loads without error", async ({ page }) => {
    await page.goto("/ideas");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main").first()).toBeVisible();
    await expect(page).toHaveURL(/ideas/);
  });

  test("competitors page loads without error", async ({ page }) => {
    await page.goto("/competitors");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main").first()).toBeVisible();
    await expect(page).toHaveURL(/competitors/);
  });

  test("audit page loads for channel", async ({ page }) => {
    await page.goto("/audit/UC_smoke_test");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main").first()).toBeVisible();
    await expect(page).toHaveURL(/audit/);
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
});

test.describe("Smoke Tests - Mobile Viewport", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("dashboard is responsive on mobile", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Main content should be visible (use .first() for strict mode)
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("profile page is responsive on mobile", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Check for proper rendering
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator(`text=${DEMO_USER.email}`)).toBeVisible();
  });
});
