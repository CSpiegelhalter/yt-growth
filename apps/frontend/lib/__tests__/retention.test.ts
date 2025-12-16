/**
 * Unit tests for retention cliff algorithm
 */
import { describe, it, expect } from "vitest";
import {
  computeRetentionCliff,
  formatTimestamp,
  calcSubsPerThousandViews,
  RetentionPoint,
} from "../retention";

describe("computeRetentionCliff", () => {
  it("should return null for empty points", () => {
    const result = computeRetentionCliff(100, []);
    expect(result).toBeNull();
  });

  it("should return null for single point", () => {
    const result = computeRetentionCliff(100, [{ elapsedRatio: 0, audienceWatchRatio: 1 }]);
    expect(result).toBeNull();
  });

  it("should return null for zero duration", () => {
    const points: RetentionPoint[] = [
      { elapsedRatio: 0, audienceWatchRatio: 1 },
      { elapsedRatio: 0.5, audienceWatchRatio: 0.5 },
    ];
    const result = computeRetentionCliff(0, points);
    expect(result).toBeNull();
  });

  it("should detect crossed_50 cliff", () => {
    const points: RetentionPoint[] = [
      { elapsedRatio: 0, audienceWatchRatio: 1.0 },
      { elapsedRatio: 0.1, audienceWatchRatio: 0.8 },
      { elapsedRatio: 0.2, audienceWatchRatio: 0.6 },
      { elapsedRatio: 0.3, audienceWatchRatio: 0.45 }, // Crosses below 50%
      { elapsedRatio: 0.4, audienceWatchRatio: 0.4 },
      { elapsedRatio: 0.5, audienceWatchRatio: 0.35 },
    ];
    const result = computeRetentionCliff(100, points);
    
    expect(result).not.toBeNull();
    expect(result!.cliffReason).toBe("crossed_50");
    expect(result!.cliffTimeSec).toBe(30); // 0.3 * 100 = 30 seconds
  });

  it("should detect steepest_drop cliff when retention never crosses 50%", () => {
    const points: RetentionPoint[] = [
      { elapsedRatio: 0, audienceWatchRatio: 1.0 },
      { elapsedRatio: 0.1, audienceWatchRatio: 0.95 },
      { elapsedRatio: 0.2, audienceWatchRatio: 0.7 }, // Steepest drop here
      { elapsedRatio: 0.3, audienceWatchRatio: 0.65 },
      { elapsedRatio: 0.4, audienceWatchRatio: 0.6 },
    ];
    const result = computeRetentionCliff(100, points);
    
    expect(result).not.toBeNull();
    expect(result!.cliffReason).toBe("steepest_drop");
    expect(result!.cliffTimeSec).toBe(20);
  });

  it("should handle unsorted points", () => {
    const points: RetentionPoint[] = [
      { elapsedRatio: 0.3, audienceWatchRatio: 0.4 },
      { elapsedRatio: 0, audienceWatchRatio: 1.0 },
      { elapsedRatio: 0.2, audienceWatchRatio: 0.6 },
      { elapsedRatio: 0.1, audienceWatchRatio: 0.8 },
    ];
    const result = computeRetentionCliff(100, points);
    
    expect(result).not.toBeNull();
    expect(result!.cliffReason).toBe("crossed_50");
  });

  it("should include context window", () => {
    const points: RetentionPoint[] = Array.from({ length: 10 }, (_, i) => ({
      elapsedRatio: i / 10,
      audienceWatchRatio: Math.max(0.1, 1 - i * 0.1),
    }));
    const result = computeRetentionCliff(100, points);
    
    expect(result).not.toBeNull();
    expect(result!.contextWindow).toBeDefined();
    expect(result!.contextWindow.startSec).toBeLessThanOrEqual(result!.contextWindow.endSec);
  });

  it("should calculate correct timestamp for long videos", () => {
    const points: RetentionPoint[] = [
      { elapsedRatio: 0, audienceWatchRatio: 1.0 },
      { elapsedRatio: 0.25, audienceWatchRatio: 0.4 },
      { elapsedRatio: 0.5, audienceWatchRatio: 0.3 },
    ];
    const result = computeRetentionCliff(3600, points); // 1 hour video
    
    expect(result).not.toBeNull();
    expect(result!.cliffTimeSec).toBe(900); // 15 minutes = 0.25 * 3600
  });
});

describe("formatTimestamp", () => {
  it("should format seconds correctly", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(30)).toBe("0:30");
    expect(formatTimestamp(60)).toBe("1:00");
    expect(formatTimestamp(90)).toBe("1:30");
    expect(formatTimestamp(125)).toBe("2:05");
    expect(formatTimestamp(3661)).toBe("61:01");
  });

  it("should pad seconds with leading zero", () => {
    expect(formatTimestamp(5)).toBe("0:05");
    expect(formatTimestamp(65)).toBe("1:05");
  });
});

describe("calcSubsPerThousandViews", () => {
  it("should return 0 for zero views", () => {
    expect(calcSubsPerThousandViews(100, 0)).toBe(0);
    expect(calcSubsPerThousandViews(100, -1)).toBe(0);
  });

  it("should calculate correctly", () => {
    expect(calcSubsPerThousandViews(10, 1000)).toBe(10);
    expect(calcSubsPerThousandViews(5, 1000)).toBe(5);
    expect(calcSubsPerThousandViews(50, 10000)).toBe(5);
  });

  it("should round to 2 decimal places", () => {
    expect(calcSubsPerThousandViews(33, 10000)).toBe(3.3);
    expect(calcSubsPerThousandViews(1, 300)).toBe(3.33);
  });

  it("should handle zero subscribers", () => {
    expect(calcSubsPerThousandViews(0, 1000)).toBe(0);
  });
});

