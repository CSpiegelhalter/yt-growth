/**
 * Unit tests for channel limit logic
 *
 * Ensures FREE users CAN add their first channel even when
 * subscription.isActive is false (which is normal for FREE users)
 */
import { describe, it, expect } from "vitest";

// Replicate the logic from DashboardClient.tsx
function canAddAnotherChannel(
  channelsLength: number,
  channelLimit: number | undefined | null
): boolean {
  // Channel limit already accounts for plan (FREE=1, PRO=3)
  // No need to check isActive - FREE users can still add up to their limit
  return channelsLength < (channelLimit ?? 1);
}

describe("canAddAnotherChannel", () => {
  describe("FREE plan (limit: 1)", () => {
    it("allows adding first channel when user has 0 channels", () => {
      expect(canAddAnotherChannel(0, 1)).toBe(true);
    });

    it("blocks adding when user already has 1 channel", () => {
      expect(canAddAnotherChannel(1, 1)).toBe(false);
    });

    it("handles undefined channel_limit by defaulting to 1", () => {
      expect(canAddAnotherChannel(0, undefined)).toBe(true);
      expect(canAddAnotherChannel(1, undefined)).toBe(false);
    });

    it("handles null channel_limit by defaulting to 1", () => {
      expect(canAddAnotherChannel(0, null)).toBe(true);
      expect(canAddAnotherChannel(1, null)).toBe(false);
    });
  });

  describe("PRO plan (limit: 3)", () => {
    it("allows adding channels up to limit", () => {
      expect(canAddAnotherChannel(0, 3)).toBe(true);
      expect(canAddAnotherChannel(1, 3)).toBe(true);
      expect(canAddAnotherChannel(2, 3)).toBe(true);
    });

    it("blocks adding when at limit", () => {
      expect(canAddAnotherChannel(3, 3)).toBe(false);
    });

    it("blocks adding when over limit (edge case)", () => {
      expect(canAddAnotherChannel(4, 3)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles 0 limit (should never happen but be safe)", () => {
      expect(canAddAnotherChannel(0, 0)).toBe(false);
    });

    it("handles negative channels (should never happen)", () => {
      expect(canAddAnotherChannel(-1, 1)).toBe(true);
    });
  });
});

// Test the OLD buggy logic to document why it was wrong
function canAddAnotherChannel_OLD_BUGGY(
  channelsLength: number,
  channelLimit: number | undefined | null,
  isActive: boolean | undefined
): boolean {
  return (
    channelsLength < (channelLimit ?? 1) &&
    isActive !== false // BUG: This blocks FREE users!
  );
}

describe("OLD buggy canAddAnotherChannel (documenting the bug)", () => {
  it("INCORRECTLY blocks FREE user with 0 channels when isActive=false", () => {
    // This was the bug! FREE users have isActive=false but should still add 1 channel
    const result = canAddAnotherChannel_OLD_BUGGY(0, 1, false);
    expect(result).toBe(false); // Wrong! Should be true
  });

  it("only worked when isActive was undefined (new users without subscription record)", () => {
    const result = canAddAnotherChannel_OLD_BUGGY(0, 1, undefined);
    expect(result).toBe(true); // This worked by accident
  });
});

