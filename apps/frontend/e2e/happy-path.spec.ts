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
import { signIn, DEMO_USER, linkFakeChannel, setBillingState } from "./fixtures/test-helpers";

test.describe("Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // Start at landing page
    await page.goto("/");
  });

  test("landing page loads", async ({ page }) => {
    await expect(page).toHaveTitle(/YouTube|ChannelBoost|Growth/i);
    await expect(page.getByRole("link", { name: /log in|sign in/i })).toBeVisible();
  });

  test("login with demo credentials", async ({ page }) => {
    await signIn(page, DEMO_USER);

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("dashboard shows channels", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro"); // Ensure PRO to allow channel linking

    // Ensure demo channel exists
    const result = await linkFakeChannel(page, {
      channelId: "UC_happy_path_demo",
      title: "Happy Path Demo Channel",
    });
    expect(result.success).toBe(true);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should show the demo channel
    await expect(page.locator("text=/Happy Path Demo Channel|Demo/i")).toBeVisible({ timeout: 10000 });
  });

  test("audit page loads", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await setBillingState(page, "pro"); // Ensure PRO to allow channel linking

    // Link a channel for audit
    const result = await linkFakeChannel(page, {
      channelId: "UC_happy_audit",
      title: "Audit Demo Channel",
    });
    expect(result.success).toBe(true);

    // Navigate to audit page for channel
    await page.goto("/audit/UC_happy_audit");
    await page.waitForLoadState("networkidle");

    // Page should load without error
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator('text=/audit|analysis/i').first()).toBeVisible({ timeout: 15000 });
  });

  test("profile page shows subscription status", async ({ page }) => {
    await signIn(page, DEMO_USER);

    // Set to PRO for this test
    await setBillingState(page, "pro");

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should show profile info
    await expect(page.locator('text=/profile|account/i').first()).toBeVisible();

    // Should show PRO status
    await expect(page.locator('text=/pro/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("dashboard is usable on mobile", async ({ page }) => {
    await signIn(page, DEMO_USER);

    await expect(page).toHaveURL(/dashboard/);

    // Should show content without horizontal scrolling
    const body = await page.locator("body").boundingBox();
    expect(body?.width).toBeLessThanOrEqual(375);
  });

  test("profile page is usable on mobile", async ({ page }) => {
    await signIn(page, DEMO_USER);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should render without errors
    await expect(page.locator("main")).toBeVisible();
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
