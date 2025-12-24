import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * Run tests:
 *   bun run test:e2e        # Headless, with orchestration
 *   bun run test:e2e:ui     # Interactive UI mode
 *   bun run test:e2e:headed # Headless with browser visible
 *   bun run test:e2e:stripe # Real Stripe checkout tests
 *
 * Environment:
 *   APP_TEST_MODE=1   - Enables test-only API routes
 *   FAKE_YOUTUBE=1    - Uses fake YouTube data
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Run sequentially for reliability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for predictable state
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
  timeout: 60_000, // 60 seconds per test
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
    // Main test project
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      // Skip stripe checkout tests in normal E2E (they need special setup)
      testIgnore: /stripe-checkout/,
    },
    // Mobile testing
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
      testIgnore: /gating|billing|stripe-checkout/, // Skip complex flows on mobile
    },
    // Stripe checkout tests - separate project, no fake mode
    {
      name: "stripe",
      testMatch: /stripe-checkout\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // Headed mode for Stripe (helps with debugging)
        headless: false,
      },
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
