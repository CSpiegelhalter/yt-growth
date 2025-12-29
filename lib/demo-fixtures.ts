/**
 * Demo/Fixture data loader for development and fallback scenarios.
 *
 * Usage:
 * - Set NEXT_PUBLIC_DEMO_MODE=1 to always use demo data
 * - Set TEST_MODE=1 for testing with fixtures
 * - Or use getDemoData as a fallback when real data is unavailable
 */

import retentionFixture from "@/test/fixtures/retention.json";
import subscriberAuditFixture from "@/test/fixtures/subscriber-audit.json";
import ideaBoardFixture from "@/test/fixtures/idea-board.json";

export type DemoDataType = "retention" | "subscriber-audit" | "idea-board";

/**
 * Check if the app is running in demo/test mode
 */
export function isDemoMode(): boolean {
  // Demo mode is opt-in via an env var.
  // Support both DEMO_MODE (server-only) and NEXT_PUBLIC_DEMO_MODE (legacy/dev convenience).
  const isDemo =
    process.env.DEMO_MODE === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  if (isDemo) {
    console.log("[Demo] DEMO MODE ACTIVE");
  }
  return isDemo;
}

/**
 * YouTube mock mode runs the REAL codepaths but mocks the underlying YouTube APIs.
 * This is ideal when quota is exhausted and you still want realistic, high-volume data.
 */
export function isYouTubeMockMode(): boolean {
  // Check both env vars for backwards compatibility
  const isMock = process.env.YT_MOCK_MODE === "1" || process.env.FAKE_YOUTUBE === "1";
  return isMock;
}

/**
 * Get demo fixture data by type
 */
export function getDemoData(type: DemoDataType): unknown {
  const fixtures: Record<DemoDataType, unknown> = {
    retention: retentionFixture,
    "subscriber-audit": subscriberAuditFixture,
    "idea-board": ideaBoardFixture,
  };
  return fixtures[type] ?? null;
}

/**
 * Mark data as demo/fixture data
 */
export function markAsDemoData<T extends object>(data: T): T & { demo: true } {
  return { ...data, demo: true as const };
}

/**
 * Wrap an API response with demo fallback
 * If the main fetch fails, returns demo data instead
 */
export async function withDemoFallback<T extends object>(
  fetchFn: () => Promise<T>,
  demoType: DemoDataType
): Promise<T & { demo?: boolean }> {
  // If demo mode is enabled, always return fixture data
  if (isDemoMode()) {
    const demoData = getDemoData(demoType) as T;
    return { ...demoData, demo: true };
  }

  try {
    const result = await fetchFn();
    return result;
  } catch (error) {
    // In live mode, do not silently swap to fixtures — propagate the real error.
    throw error;
  }
}
