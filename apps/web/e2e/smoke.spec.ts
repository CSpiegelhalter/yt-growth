/**
 * Smoke Tests
 *
 * Quick regression tests that verify main pages load without errors.
 * These tests should be fast and catch obvious breakage.
 */
import { test, expect } from "@playwright/test";
import {
  signIn,
  TEST_USER,
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

  test("dashboard returns 200 OK for anonymous users (no redirect)", async ({
    page,
  }) => {
    // Navigate to dashboard without being logged in
    const response = await page.goto("/dashboard");

    // Should return 200 OK, not a redirect (302/307)
    expect(response?.status()).toBe(200);

    // URL should remain /dashboard (no redirect to login)
    await expect(page).toHaveURL(/\/dashboard/);

    // Should show the logged-out preview page with CTAs
    await expect(
      page.locator('a[href*="/auth/login?redirect=/dashboard"]')
    ).toBeVisible();
    await expect(
      page.locator('a[href*="/auth/signup?redirect=/dashboard"]')
    ).toBeVisible();

    // Should have appropriate page title
    await expect(page).toHaveTitle(/Dashboard.*ChannelBoost/i);

    // Should NOT show any error states
    await expect(
      page.locator("text=/error|something went wrong/i")
    ).not.toBeVisible();
  });

  test("ideas page is publicly accessible (no auth required)", async ({
    page,
  }) => {
    // Navigate to ideas page without being logged in
    const response = await page.goto("/ideas");

    // Should return 200 OK, not a redirect
    expect(response?.status()).toBe(200);

    // URL should remain /ideas
    await expect(page).toHaveURL(/\/ideas/);

    // Should show the page content
    await expect(page.locator("h1")).toContainText(/video ideas/i);

    // Should show the generate button
    await expect(page.locator("button")).toContainText(/generate/i);

    // Should show sign-in hint for anonymous users
    await expect(page.locator("text=/sign in/i")).toBeVisible();

    // Should NOT show any error states
    await expect(
      page.locator("text=/error|something went wrong/i")
    ).not.toBeVisible();
  });
});

test.describe("Smoke Tests - Protected Pages", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_USER);
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
    await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
  });

  test("ideas page loads with full experience when authenticated", async ({ page }) => {
    await page.goto("/ideas");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main").first()).toBeVisible();
    await expect(page).toHaveURL(/ideas/);
    
    // Should show generate button without sign-in hint
    await expect(page.locator("button")).toContainText(/generate/i);
  });

  test("competitors page loads without error", async ({ page }) => {
    await page.goto("/competitors");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main").first()).toBeVisible();
    await expect(page).toHaveURL(/competitors/);
  });
});

test.describe("Smoke Tests - API Endpoints", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_USER);
  });

  test("GET /api/me returns user data", async ({ page }) => {
    const response = await page.request.get("/api/me");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.email).toBe(TEST_USER.email);
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
    await signIn(page, TEST_USER);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Main content should be visible (use .first() for strict mode)
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("profile page is responsive on mobile", async ({ page }) => {
    await signIn(page, TEST_USER);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Check for proper rendering
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
  });
});
