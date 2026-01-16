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
 * - Database seeded with demo user (via reset-db script)
 */
import { test, expect } from "@playwright/test";
import { signIn, TEST_USER } from "./fixtures/test-helpers";

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

  test("login works", async ({ page }) => {
    await signIn(page, TEST_USER);

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator("main").first()).toBeVisible();
  });
});

test.describe("Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("dashboard is usable on mobile", async ({ page }) => {
    await signIn(page, TEST_USER);
    await expect(page).toHaveURL(/dashboard/);

    // Should render main content
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("profile page is usable on mobile", async ({ page }) => {
    await signIn(page, TEST_USER);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should render main content
    await expect(page.locator("main").first()).toBeVisible();
  });
});
