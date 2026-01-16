/**
 * Playwright Global Setup
 *
 * Runs once before all tests to ensure a clean state.
 */
import { test as setup } from "@playwright/test";

setup("global setup", async () => {
  console.log("\n🔧 Running global setup...\n");
});

