/**
 * Playwright Global Teardown
 *
 * Runs once after all tests for cleanup.
 */
import { test as teardown } from "@playwright/test";

teardown("global teardown", async () => {
  console.log("\n🧹 Running global teardown...\n");
  // Add any cleanup logic here if needed
  console.log("  ✓ Cleanup complete\n");
});

