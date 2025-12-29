/**
 * E2E Test Helpers
 *
 * Shared utilities for Playwright tests including:
 * - Test user management
 * - API helpers for test-only routes
 * - Common page interactions
 */
import { Page, expect } from "@playwright/test";

// Standard test user credentials
export const TEST_USER = {
  email: "e2e@example.com",
  password: "Password123!",
  name: "E2E Test User",
};

// Demo user (seeded by reset-db)
export const DEMO_USER = {
  email: "demo@example.com",
  password: "demo123",
  name: "Demo User",
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
 * First tries the test API (faster), then falls back to UI login
 */
export async function signIn(
  page: Page,
  user: { email: string; password: string } = TEST_USER
): Promise<void> {
  // Try test API first (faster and more reliable)
  const response = await page.request.post("/api/test/auth/signin", {
    data: { email: user.email, password: user.password },
  });

  if (response.ok()) {
    const data = await response.json();
    console.log(`Signed in via test API: ${data.user?.email}`);
    // Navigate to dashboard to verify session works
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    return;
  }

  // Fall back to UI login
  console.log("Test auth API not available, using UI login...");
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
  // Try to find and click sign out link
  const signOutLink = page.getByRole("link", { name: /sign out|logout/i });
  if (await signOutLink.isVisible()) {
    await signOutLink.click();
    await page.waitForURL(/login|\/$/);
    return;
  }

  // Fallback: navigate directly
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
 * Set billing state via test API
 *
 * @returns true if successful, false if test routes are not available
 */
export async function setBillingState(
  page: Page,
  state: "pro" | "free" | "canceled",
  options?: { endsAt?: string }
): Promise<boolean> {
  const endpoint =
    state === "canceled"
      ? `/api/test/billing/set-canceled${options?.endsAt ? `?endsAt=${options.endsAt}` : ""}`
      : `/api/test/billing/set-${state}`;

  const response = await page.request.post(endpoint);

  if (!response.ok()) {
    // Test routes may not be available (APP_TEST_MODE not set)
    console.log(`setBillingState failed: ${response.status()} - Test mode may not be enabled`);
    return false;
  }

  return true;
}

/**
 * Link a fake YouTube channel via test API
 *
 * @param bypassLimit - If true, bypasses channel limit check (for test setup)
 * @returns Object with success status, channelId, and optional error info
 */
export async function linkFakeChannel(
  page: Page,
  options?: { channelId?: string; title?: string; bypassLimit?: boolean }
): Promise<{ success: boolean; channelId: string; error?: string; current?: number; limit?: number; plan?: string }> {
  const response = await page.request.post("/api/test/youtube/link", {
    data: options || {},
  });

  const data = await response.json();

  if (!response.ok()) {
    return {
      success: false,
      channelId: options?.channelId || "",
      error: data.error,
      current: data.current,
      limit: data.limit,
      plan: data.plan,
    };
  }

  return {
    success: true,
    channelId: data.channelId,
  };
}

/**
 * Unlink a YouTube channel via test API
 */
export async function unlinkFakeChannel(
  page: Page,
  channelId?: string
): Promise<void> {
  const response = await page.request.post("/api/test/youtube/unlink", {
    data: channelId ? { channelId } : {},
  });
  expect(response.ok()).toBeTruthy();
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
  user: { email: string; password: string } = DEMO_USER
): Promise<void> {
  await page.goto(path);

  // If redirected to login, sign in
  if (page.url().includes("/auth/login")) {
    await signIn(page, user);
    await page.goto(path);
  }

  await page.waitForLoadState("networkidle");
}

/**
 * Link a fake YouTube channel WITHOUT any videos
 * Use this to test the "no videos → upload → see videos" flow
 */
export async function linkEmptyChannel(
  page: Page,
  options?: { channelId?: string; title?: string; bypassLimit?: boolean }
): Promise<{
  success: boolean;
  channelId: string;
  error?: string;
  current?: number;
  limit?: number;
  plan?: string;
}> {
  const response = await page.request.post("/api/test/youtube/link-empty", {
    data: options || {},
  });

  const data = await response.json();

  if (!response.ok()) {
    return {
      success: false,
      channelId: options?.channelId || "",
      error: data.error,
      current: data.current,
      limit: data.limit,
      plan: data.plan,
    };
  }

  return {
    success: true,
    channelId: data.channelId,
  };
}

/**
 * Add a fake video to an existing channel
 * Simulates a user uploading a new video to YouTube
 */
export async function addFakeVideo(
  page: Page,
  channelId: string,
  options?: { videoId?: string; title?: string }
): Promise<{
  success: boolean;
  videoId: string;
  error?: string;
}> {
  const response = await page.request.post("/api/test/youtube/add-video", {
    data: {
      channelId,
      ...options,
    },
  });

  const data = await response.json();

  if (!response.ok()) {
    return {
      success: false,
      videoId: options?.videoId || "",
      error: data.error,
    };
  }

  return {
    success: true,
    videoId: data.videoId,
  };
}

