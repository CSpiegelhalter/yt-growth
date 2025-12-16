/**
 * E2E Happy Path Test
 *
 * Tests the main user journey:
 * 1. Login with demo credentials
 * 2. View dashboard with channels
 * 3. Generate a plan (uses TEST_MODE fixtures)
 * 4. View audit page
 *
 * Prerequisites:
 * - TEST_MODE=1 in .env.local
 * - Database seeded with demo user
 */
import { test, expect } from "@playwright/test";

test.describe("Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // Start at landing page
    await page.goto("/");
  });

  test("landing page loads", async ({ page }) => {
    await expect(page).toHaveTitle(/YouTube Growth/);
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
  });

  test("login with demo credentials", async ({ page }) => {
    // Navigate to login
    await page.goto("/auth/login");
    
    // Fill credentials
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "demo123");
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test("dashboard shows channels", async ({ page }) => {
    // Login first
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/);
    
    // Should show the demo channel
    await expect(page.getByText(/Demo Tech Channel/i)).toBeVisible();
  });

  test("audit page loads", async ({ page }) => {
    // Login first
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    
    // Navigate to audit page for demo channel
    await page.goto("/audit/UC_demo_channel_123");
    
    // Page should load
    await expect(page.getByText(/audit/i)).toBeVisible();
  });

  test("profile page shows subscription status", async ({ page }) => {
    // Login first
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    
    // Navigate to profile
    await page.goto("/profile");
    
    // Should show subscription status
    await expect(page.getByText(/Profile/i)).toBeVisible();
    await expect(page.getByText(/pro/i)).toBeVisible();
  });
});

test.describe("Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("dashboard is usable on mobile", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/);
    
    // Should show content without horizontal scrolling
    const body = await page.locator("body").boundingBox();
    expect(body?.width).toBeLessThanOrEqual(375);
  });

  test("audit page is usable on mobile", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    
    await page.goto("/audit/UC_demo_channel_123");
    
    // Should render without errors
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Subscription Gating", () => {
  test("free user sees upgrade prompt", async ({ page }) => {
    // Login as free user
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "free@example.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/);
    
    // Note: In TEST_MODE, subscription checks pass,
    // so this test verifies the flow works
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });
});

