import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * Run tests:
 *   bun run test:e2e        # All tests (headless)
 *   bun run test:e2e:ui     # Interactive UI mode
 *   bun run test:e2e:headed # With browser visible
 *
 * Test order (alphabetical by file):
 *   1. channel-limits.spec.ts - Channel limit enforcement
 *   2. gating.spec.ts - Feature gating & usage limits
 *   3. happy-path.spec.ts - Core user journeys
 *   4. smoke.spec.ts - Basic app functionality
 *   5. youtube.spec.ts - Fake YouTube integration
 *   6. z-stripe-checkout.spec.ts - Stripe checkout (runs last)
 *
 * Requirements for Stripe tests:
 *   - Stripe CLI running: stripe listen --forward-to localhost:3000/api/integrations/stripe/webhook
 *
 * Environment:
 *   APP_TEST_MODE=1   - Enables test-only API routes
 *   FAKE_YOUTUBE=1    - Uses fake YouTube data
 */
export default defineConfig({
  testDir: "./e2e",
  // Run tests sequentially to avoid state conflicts (all tests share the same user)
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Single worker to prevent billing state conflicts between tests
  workers: 1,
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
  timeout: 60_000, // 1 minute per test
  expect: {
    timeout: 10_000, // 10 seconds for assertions
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Slow down actions slightly for stability
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // Setup project - runs before tests
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
      teardown: "cleanup",
    },
    // Cleanup project - runs after tests
    {
      name: "cleanup",
      testMatch: /global-teardown\.ts/,
    },
    // Main test project - chromium only (mobile disabled to prevent state conflicts)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Headed mode helps with Stripe checkout debugging
        headless: process.env.CI ? true : false,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "bun run dev:test",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // 2 minutes to start
    env: {
      APP_TEST_MODE: "1",
      FAKE_YOUTUBE: "1",
      DISABLE_RATE_LIMITS: "1",
    },
  },
});
