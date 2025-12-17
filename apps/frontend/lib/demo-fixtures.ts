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
import similarChannelsFixture from "@/test/fixtures/similar-channels.json";

export type DemoDataType = "retention" | "subscriber-audit" | "similar-channels";

/**
 * Check if the app is running in demo/test mode
 */
export function isDemoMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
    process.env.TEST_MODE === "1"
  );
}

/**
 * Get demo fixture data by type
 */
export function getDemoData(type: DemoDataType): unknown {
  const fixtures: Record<DemoDataType, unknown> = {
    "retention": retentionFixture,
    "subscriber-audit": subscriberAuditFixture,
    "similar-channels": similarChannelsFixture,
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
    console.warn(`Falling back to demo data for ${demoType}:`, error);
    const demoData = getDemoData(demoType) as T;
    return { ...demoData, demo: true };
  }
}

