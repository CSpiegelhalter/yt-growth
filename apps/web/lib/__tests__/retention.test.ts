/**
 * Unit tests for retention cliff algorithm
 */
import { describe, it, expect } from "vitest";
import { calcSubsPerThousandViews } from "../retention";

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
