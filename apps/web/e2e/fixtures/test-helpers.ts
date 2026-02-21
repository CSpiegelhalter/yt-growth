/**
 * E2E Test Helpers
 *
 * Shared utilities for Playwright tests including:
 * - Test user management
 * - API helpers for test-only routes
 * - Common page interactions
 */
import { type Page, expect } from "@playwright/test";

// Standard test user credentials
export const TEST_USER = {
  email: "e2e@example.com",
  password: "Password123!",
  name: "E2E Test User",
};

/**
 * Sign up a new user via the UI
 */
export async function signUp(
  page: Page,
  user: { email: string; password: string; name?: string } = TEST_USER
): Promise<void> {
  await page.goto("/auth/signup");
  await page.waitForLoadState("networkidle");

  // Fill the signup form
  await page.fill('input[name="email"], input[type="email"]', user.email);
  await page.fill('input[name="password"], input[type="password"]', user.password);

  if (user.name) {
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill(user.name);
    }
  }

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard or success state
  await expect(page).toHaveURL(/dashboard|login/, { timeout: 15000 });
}

/**
 * Sign in an existing user
 * 
 * Uses UI login
 */
export async function signIn(
  page: Page,
  user: { email: string; password: string } = TEST_USER
): Promise<void> {
  // Uses UI login
  await page.goto("/auth/login");
  await page.waitForLoadState("networkidle");

  // Wait for form to be visible
  const emailInput = page.locator('input#email, input[name="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 10000 });

  // Fill login form
  await emailInput.fill(user.email);
  await page.locator('input#password, input[name="password"]').first().fill(user.password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard (or check for error)
  try {
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  } catch {
    // Check if there's a login error
    const errorAlert = page.locator('[role="alert"], [class*="error"]');
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      throw new Error(`Login failed: ${errorText}`);
    }
    throw new Error(`Login failed - not redirected to dashboard. Current URL: ${page.url()}`);
  }
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page): Promise<void> {
  // Try to find and click sign out control (may be a link or button)
  const signOutControl = page
    .getByRole("link", { name: /sign out|logout/i })
    .or(page.getByRole("button", { name: /sign out|logout/i }));

  if (await signOutControl.isVisible().catch(() => false)) {
    await signOutControl.click();
    await page.waitForURL(/\/($|\?)|login|auth/i, { timeout: 15000 });
    return;
  }

  // Fallback: attempt the auth endpoint (may show confirmation in some configs)
  await page.goto("/api/auth/signout");
  await page.waitForLoadState("networkidle");
}

/**
 * Check if user is currently signed in
 */
export async function isSignedIn(page: Page): Promise<boolean> {
  const loginButton = page.getByRole("link", { name: /log in|sign in/i });
  const isLoginVisible = await loginButton.isVisible().catch(() => false);
  return !isLoginVisible;
}

/**
 * Get current user info from /api/me
 */
export async function getMe(page: Page): Promise<{
  id: number;
  email: string;
  plan: string;
  usage?: Record<string, { used: number; limit: number }>;
  subscription?: {
    isActive: boolean;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    cancelAt: string | null;
    canceledAt: string | null;
  };
}> {
  const response = await page.request.get("/api/me");
  
  // Check if response is OK
  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`/api/me failed with status ${response.status()}: ${text.slice(0, 200)}`);
  }
  
  // Check if response is JSON (not HTML login page)
  const contentType = response.headers()["content-type"] || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      throw new Error("Not authenticated - /api/me returned HTML (likely login page). Make sure signIn() completed successfully.");
    }
    throw new Error(`/api/me returned non-JSON: ${text.slice(0, 200)}`);
  }
  
  return response.json();
}

/**
 * Wait for a toast/notification to appear and optionally dismiss it
 */
export async function waitForToast(
  page: Page,
  textPattern: RegExp | string
): Promise<void> {
  const toast = page.locator('[role="alert"], [class*="toast"], [class*="notification"]');
  await expect(toast.filter({ hasText: textPattern })).toBeVisible({ timeout: 10000 });
}

/**
 * Reset usage counters via test API (if user is signed in)
 */
export async function resetUsage(page: Page): Promise<void> {
  try {
    const response = await page.request.post("/api/private/dev/reset-usage");
    // This might fail if not in dev mode, which is fine
    if (!response.ok()) {
      console.log("Usage reset skipped (may not be available in this environment)");
    }
  } catch {
    // Ignore
  }
}

/**
 * Navigate to a protected page, signing in if necessary
 */
export async function navigateAuthenticated(
  page: Page,
  path: string,
  user: { email: string; password: string } = TEST_USER
): Promise<void> {
  await page.goto(path);

  // If redirected to login, sign in
  if (page.url().includes("/auth/login")) {
    await signIn(page, user);
    await page.goto(path);
  }

  await page.waitForLoadState("networkidle");
}

