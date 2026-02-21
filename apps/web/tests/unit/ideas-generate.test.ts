/**
 * Ideas Generate Entitlement Limits
 *
 * Tests that entitlement limits for idea_generate are configured correctly.
 */
import { describe, it, expect } from "bun:test";

describe("Ideas Generate Entitlement Limits", () => {
  it("FREE plan has idea_generate limit", async () => {
    const { getLimits } = await import(
      "@/lib/features/subscriptions/use-cases/checkEntitlement"
    );
    const limits = getLimits("FREE");
    expect(limits.idea_generate).toBeGreaterThan(0);
    expect(limits.idea_generate).toBe(10);
  });

  it("PRO plan has higher idea_generate limit", async () => {
    const { getLimits } = await import(
      "@/lib/features/subscriptions/use-cases/checkEntitlement"
    );
    const freeLimits = getLimits("FREE");
    const proLimits = getLimits("PRO");
    expect(proLimits.idea_generate).toBeGreaterThan(freeLimits.idea_generate);
    expect(proLimits.idea_generate).toBe(200);
  });
});
