/**
 * E2E Test Runner
 *
 * This script orchestrates the complete E2E test flow:
 * 1. Ensures test database exists and is reset
 * 2. Starts the Next.js app in test mode
 * 3. Runs Playwright tests
 * 4. Cleans up
 *
 * Usage:
 *   bun scripts/test/run-e2e.ts
 *
 * Or via bun:
 *   bun run test:e2e
 */

import { spawn, execSync, ChildProcess } from "child_process";

const PORT = process.env.TEST_PORT || "3000";
const BASE_URL = `http://localhost:${PORT}`;
const MAX_STARTUP_WAIT_MS = 120_000; // 2 minutes
const POLL_INTERVAL_MS = 1000;

let serverProcess: ChildProcess | null = null;

async function main() {
  console.log("\n🧪 E2E Test Runner\n");
  console.log("=====================================\n");

  try {
    // Step 1: Reset test database
    console.log("Step 1: Resetting test database...\n");
    execSync("bun scripts/test/reset-db.ts", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ||
          "postgresql://yt_growth:yt_growth_dev@localhost:5432/channelboost_test?schema=public",
      },
    });

    // Step 2: Start the Next.js app in test mode
    console.log("\nStep 2: Starting Next.js app in test mode...\n");
    serverProcess = await startServer();

    // Step 3: Wait for server to be ready
    console.log("Step 3: Waiting for server to be ready...\n");
    await waitForServer();
    console.log(`  ✓ Server is ready at ${BASE_URL}\n`);

    // Step 4: Run Playwright tests
    console.log("Step 4: Running Playwright tests...\n");
    console.log("=====================================\n");

    execSync("bunx playwright test --reporter=list", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        APP_TEST_MODE: "1",
        FAKE_YOUTUBE: "1",
        DISABLE_RATE_LIMITS: "1",
        PLAYWRIGHT_BASE_URL: BASE_URL,
      },
    });

    console.log("\n=====================================");
    console.log("✅ E2E tests completed successfully!\n");
  } catch {
    console.error("\n❌ E2E tests failed\n");
    process.exitCode = 1;
  } finally {
    // Cleanup
    await cleanup();
  }
}

async function startServer(): Promise<ChildProcess> {
  return new Promise((resolve) => {
    const server = spawn("bun", ["run", "dev"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT,
        APP_TEST_MODE: "1",
        FAKE_YOUTUBE: "1",
        DISABLE_RATE_LIMITS: "1",
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ||
          "postgresql://yt_growth:yt_growth_dev@localhost:5432/channelboost_test?schema=public",
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    server.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      if (process.env.DEBUG === "1") {
        console.log(output);
      }
    });

    server.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();
      if (process.env.DEBUG === "1") {
        console.error(output);
      }
    });

    server.on("error", (error) => {
      console.error("Server process error:", error);
    });

    // Give it a moment to start
    setTimeout(() => resolve(server), 1000);
  });
}

async function waitForServer(): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_STARTUP_WAIT_MS) {
    try {
      const response = await fetch(BASE_URL, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok || response.status === 200 || response.status === 307) {
        return;
      }
    } catch {
      // Server not ready yet
    }

    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Server did not start within ${MAX_STARTUP_WAIT_MS / 1000} seconds`
  );
}

async function cleanup(): Promise<void> {
  console.log("\nCleaning up...");

  if (serverProcess && !serverProcess.killed) {
    console.log("  Stopping server...");

    // Kill the process group (in case it spawned children)
    try {
      if (serverProcess.pid) {
        process.kill(-serverProcess.pid, "SIGTERM");
      }
    } catch {
      // Process might already be dead
    }

    // Also try direct kill
    serverProcess.kill("SIGTERM");

    // Wait a moment for graceful shutdown
    await new Promise((r) => setTimeout(r, 2000));

    // Force kill if still running
    if (!serverProcess.killed) {
      serverProcess.kill("SIGKILL");
    }

    console.log("  ✓ Server stopped");
  }

  console.log("  ✓ Cleanup complete\n");
}

// Handle signals
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, cleaning up...");
  await cleanup();
  process.exit(130);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, cleaning up...");
  await cleanup();
  process.exit(143);
});

// Run
main();
