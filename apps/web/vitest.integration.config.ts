import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest Integration Tests Configuration
 *
 * Integration tests run against a real database and may call route handlers.
 * They are slower than unit tests but test real interactions.
 *
 * Run: npm run test:integration
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["node_modules", ".next", "e2e"],
    setupFiles: ["./tests/integration/setup.ts"],
    testTimeout: 30000, // 30 seconds for DB operations
    hookTimeout: 30000,
    // Run tests serially to avoid DB conflicts
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "app/api/**/*.ts"],
      exclude: ["node_modules", ".next", "e2e", "tests"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});

