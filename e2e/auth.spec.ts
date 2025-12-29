/**
 * Authentication E2E Tests
 *
 * Tests:
 * 1. Signup succeeds
 * 2. Duplicate signup prevented
 * 3. Sign in works
 * 4. Sign out works
 */
import { test, expect } from "@playwright/test";
import {
  TEST_USER,
  signUp,
  signIn,
  signOut,
  isSignedIn,
} from "./fixtures/test-helpers";

test.describe("Authentication", () => {
  // Use a unique email for signup tests to avoid conflicts
  const uniqueUser = {
    email: `e2e_${Date.now()}@example.com`,
    password: "Password123!",
    name: "E2E Test User",
  };

  test("signup succeeds", async ({ page }) => {
    await page.goto("/");

    // Navigate to signup
    await page.click('a[href="/auth/signup"]');
    await expect(page).toHaveURL(/signup/);

    // Fill signup form
    await page.fill(
      'input[name="email"], input[type="email"]',
      uniqueUser.email
    );
    await page.fill(
      'input[name="password"], input[type="password"]',
      uniqueUser.password
    );

    // Fill name if the field exists
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill(uniqueUser.name);
    }

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show success
    // (might go to login first if email verification is required)
    await expect(page).toHaveURL(/dashboard|login/, { timeout: 15000 });

    // If redirected to login, sign in
    if (page.url().includes("/login")) {
      await signIn(page, uniqueUser);
    }

    // Verify we're signed in - login button should not be visible
    const loginBtn = page.getByRole("link", { name: /log in/i });
    await expect(loginBtn).not.toBeVisible({ timeout: 5000 });
  });

  test("duplicate signup prevented", async ({ page }) => {
    // First, ensure the user exists by signing up
    await page.goto("/auth/signup");

    // Try to sign up with the same email as demo user (which is seeded)
    await page.fill(
      'input[name="email"], input[type="email"]',
      "demo@example.com"
    );
    await page.fill(
      'input[name="password"], input[type="password"]',
      "Password123!"
    );

    await page.click('button[type="submit"]');

    // Should show an error message
    await expect(
      page.locator('[role="alert"], [class*="error"], [class*="Error"]').first()
    ).toBeVisible({ timeout: 10000 });

    // Should NOT redirect to dashboard
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test("sign in works", async ({ page }) => {
    // Use the demo user that's seeded
    await page.goto("/auth/login");

    await page.fill(
      'input[name="email"], input[type="email"]',
      "demo@example.com"
    );
    await page.fill(
      'input[name="password"], input[type="password"]',
      "demo123"
    );

    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

    // Verify dashboard content loads (use .first() since there may be nested mains)
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("sign out works", async ({ page }) => {
    // Sign in first
    await signIn(page, { email: "demo@example.com", password: "demo123" });

    // Verify we're on dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Find and click sign out (might be in a dropdown menu)
    const userMenu = page.locator(
      '[aria-label="User menu"], [class*="userMenu"]'
    );
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }

    // Click sign out link
    await page.click('a[href*="signout"], button:has-text("Sign out")');

    // Wait for navigation (may stay on signout page with confirmation)
    await page.waitForTimeout(3000);

    // If on signout confirmation page, click confirm button
    const confirmButton = page.locator(
      'button:has-text("Sign out"), input[type="submit"]'
    );
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify we're signed out by trying to access dashboard
    await page.goto("/dashboard");
    // Should redirect to login (or stay on dashboard with login prompt)
    await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
  });

  test("invalid credentials shows error", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill(
      'input[name="email"], input[type="email"]',
      "nonexistent@example.com"
    );
    await page.fill(
      'input[name="password"], input[type="password"]',
      "wrongpassword"
    );

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('[role="alert"], [class*="error"], [class*="Error"]').first()
    ).toBeVisible({ timeout: 10000 });

    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });
});
