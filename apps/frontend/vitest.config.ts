import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest Unit Tests Configuration
 *
 * Unit tests are fast, pure tests that don't require database or network.
 * They test individual functions and components in isolation.
 *
 * Run: bun run test:unit
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "lib/__tests__/**/*.test.ts",
      "lib/__tests__/**/*.test.tsx",
    ],
    exclude: ["node_modules", ".next", "e2e", "tests/integration"],
    // Use forks pool with single fork to prevent hanging
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/**/*.ts"],
      exclude: ["node_modules", ".next", "e2e", "tests"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
