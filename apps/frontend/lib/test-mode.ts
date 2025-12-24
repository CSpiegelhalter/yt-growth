/**
 * Test Mode Configuration
 *
 * Central helpers for detecting test mode and fake integration flags.
 * These are used to enable test-only routes and fake data sources.
 */

/**
 * Check if the app is running in test mode (enables test-only routes)
 */
export function isTestMode(): boolean {
  return process.env.APP_TEST_MODE === "1";
}

/**
 * Check if fake YouTube integration is enabled (no real OAuth/API calls)
 */
export function isFakeYouTube(): boolean {
  return process.env.FAKE_YOUTUBE === "1";
}

/**
 * Check if fake Stripe integration is enabled (no real checkout/webhooks)
 */
export function isFakeStripe(): boolean {
  return process.env.FAKE_STRIPE === "1";
}

/**
 * Check if rate limits should be disabled (faster tests)
 */
export function isRateLimitDisabled(): boolean {
  return process.env.DISABLE_RATE_LIMITS === "1";
}

/**
 * Guard a route handler to only run in test mode.
 * Returns a 404 response if not in test mode.
 */
export function requireTestMode(): Response | null {
  if (!isTestMode()) {
    return Response.json(
      { error: "Not Found" },
      { status: 404 }
    );
  }
  return null;
}

/**
 * Get standard test user credentials
 */
export function getTestUserCredentials() {
  return {
    email: process.env.TEST_USER_EMAIL || "e2e@example.com",
    password: process.env.TEST_USER_PASSWORD || "Password123!",
  };
}

/**
 * Log a test mode action (for debugging)
 */
export function logTestAction(action: string, details?: Record<string, unknown>) {
  if (process.env.DEBUG === "1") {
    console.log(`[TEST MODE] ${action}`, details ?? "");
  }
}

