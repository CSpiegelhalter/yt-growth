/**
 * Marketing CTA Tests
 *
 * Verifies that marketing page CTAs correctly link to /dashboard
 * and that the logged-out dashboard preview is accessible.
 */
import { test, expect } from "@playwright/test";

test.describe("Marketing CTAs - Dashboard Preview Flow", () => {
  test("homepage primary CTA links to /dashboard", async ({ page }) => {
    // Visit the homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find the primary CTA button (should say "Open Dashboard Preview" for logged-out users)
    // Wait for the auth-aware CTAs to load (they fetch /api/me first)
    const primaryCta = page.locator('a[href="/dashboard"]').first();
    await expect(primaryCta).toBeVisible({ timeout: 10000 });

    // Click the primary CTA
    await primaryCta.click();

    // Should land on /dashboard with 200 OK (no redirect to login)
    await expect(page).toHaveURL(/\/dashboard/);

    // Should see the logged-out preview content (H1 with dashboard title)
    await expect(
      page.locator("h1:has-text('Dashboard')")
    ).toBeVisible();

    // Should see the sign-in and sign-up CTAs on the preview page
    await expect(
      page.locator('a[href*="/auth/login"]')
    ).toBeVisible();
    await expect(
      page.locator('a[href*="/auth/signup"]')
    ).toBeVisible();
  });

  test("dashboard returns 200 OK for anonymous users and shows preview", async ({
    page,
  }) => {
    // Direct navigation to /dashboard without auth
    const response = await page.goto("/dashboard");

    // Should return 200 OK, not a redirect
    expect(response?.status()).toBe(200);

    // URL should remain /dashboard (no redirect to login)
    await expect(page).toHaveURL(/\/dashboard/);

    // Should show the logged-out preview page title
    await expect(page).toHaveTitle(/Dashboard.*ChannelBoost/i);

    // Should show preview content with dashboard title
    const heading = page.locator("h1");
    await expect(heading).toContainText(/Dashboard/i);

    // Should have auth CTAs for conversion
    await expect(
      page.locator('a:has-text("Sign in")')
    ).toBeVisible();

    // Should NOT show any error states
    await expect(
      page.locator("text=/error|something went wrong/i")
    ).not.toBeVisible();
  });

  test("static hero CTA on marketing pages links to /dashboard", async ({
    page,
  }) => {
    // Visit homepage
    await page.goto("/");

    // Look for the static CTA that should exist (HeroStaticCTAs component)
    const staticCta = page.locator('a[href="/dashboard"]:has-text("analyzing")');

    // If static CTA exists (some pages use it), verify it links to dashboard
    if (await staticCta.count() > 0) {
      await expect(staticCta.first()).toBeVisible();
      const href = await staticCta.first().getAttribute("href");
      expect(href).toBe("/dashboard");
    }
  });

  test("learn page CTA links to /dashboard", async ({ page }) => {
    // Visit the learn page
    await page.goto("/learn");
    await page.waitForLoadState("networkidle");

    // Find the primary CTA button in the bottom CTA section
    const ctaSection = page.locator('a[href="/dashboard"]:has-text("Get Started")');

    // Verify it exists and links to dashboard
    await expect(ctaSection).toBeVisible();
    const href = await ctaSection.getAttribute("href");
    expect(href).toBe("/dashboard");
  });
});
