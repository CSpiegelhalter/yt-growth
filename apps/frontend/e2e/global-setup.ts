/**
 * Playwright Global Setup
 *
 * Runs once before all tests to ensure a clean state.
 */
import { test as setup } from "@playwright/test";

setup("global setup", async ({ page }) => {
  console.log("\n🔧 Running global setup...\n");

  // Verify test mode is enabled by checking a test-only endpoint
  const response = await page.request.post("/api/test/billing/set-free");

  if (response.status() === 404) {
    throw new Error(
      "Test mode is not enabled! Set APP_TEST_MODE=1 in your environment."
    );
  }

  console.log("  ✓ Test mode verified\n");
});

