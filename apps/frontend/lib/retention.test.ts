import { describe, expect, it } from "vitest";
import { computeRetentionCliff } from "./retention";

describe("computeRetentionCliff", () => {
  it("returns first crossing below 50%", () => {
    const result = computeRetentionCliff(200, [
      { elapsedRatio: 0.1, audienceWatchRatio: 0.9 },
      { elapsedRatio: 0.3, audienceWatchRatio: 0.75 },
      { elapsedRatio: 0.5, audienceWatchRatio: 0.52 },
      { elapsedRatio: 0.6, audienceWatchRatio: 0.48 },
    ]);
    expect(result?.cliffReason).toBe("crossed_50");
    expect(result?.cliffTimeSec).toBeGreaterThanOrEqual(100);
    expect(result?.cliffTimeSec).toBeLessThanOrEqual(130);
  });

  it("falls back to steepest drop when no crossing", () => {
    // Use data that stays above 50% even after smoothing
    // With 3-point moving average, we need all smoothed values > 0.5
    const result = computeRetentionCliff(180, [
      { elapsedRatio: 0, audienceWatchRatio: 0.95 },
      { elapsedRatio: 0.25, audienceWatchRatio: 0.85 },
      { elapsedRatio: 0.5, audienceWatchRatio: 0.75 },
      { elapsedRatio: 0.75, audienceWatchRatio: 0.65 },
      { elapsedRatio: 1, audienceWatchRatio: 0.55 },
    ]);
    expect(result?.cliffReason).toBe("steepest_drop");
    expect(result?.cliffTimeSec).toBeGreaterThan(0);
  });
});
