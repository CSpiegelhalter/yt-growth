/**
 * Test Mode Configuration
 *
 * Central helpers for detecting test mode and fake integration flags.
 */

/**
 * Check if rate limits should be disabled (faster tests)
 */
export function isRateLimitDisabled(): boolean {
  return process.env.DISABLE_RATE_LIMITS === "1";
}

/**
 * Log a test mode action (for debugging)
 */
export function logTestAction(action: string, details?: Record<string, unknown>) {
  if (process.env.DEBUG === "1") {
    console.log(`[TEST MODE] ${action}`, details ?? "");
  }
}

