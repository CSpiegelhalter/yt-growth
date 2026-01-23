import { describe, expect, test } from "bun:test";
import {
  computeSectionConfidence,
  isLowDataMode,
  type DerivedMetrics,
} from "@/lib/owned-video-math";

// Helper to create a minimal DerivedMetrics object for testing
function createDerivedMetrics(overrides: Partial<DerivedMetrics> = {}): DerivedMetrics {
  return {
    viewsPerDay: 0,
    totalViews: 0,
    daysInRange: 1,
    subsPer1k: null,
    sharesPer1k: null,
    commentsPer1k: null,
    likesPer1k: null,
    playlistAddsPer1k: null,
    netSubsPer1k: null,
    netSavesPer1k: null,
    likeRatio: null,
    watchTimePerViewSec: null,
    avdRatio: null,
    avgWatchTimeMin: null,
    avgViewDuration: null,
    avgViewPercentage: null,
    engagementPerView: null,
    engagedViewRate: null,
    cardClickRate: null,
    endScreenClickRate: null,
    premiumViewRate: null,
    watchTimePerSub: null,
    rpm: null,
    monetizedPlaybackRate: null,
    adImpressionsPerView: null,
    cpm: null,
    velocity24h: null,
    velocity7d: null,
    acceleration24h: null,
    impressions: null,
    impressionsCtr: null,
    first24hViews: null,
    first48hViews: null,
    trafficSources: null,
    ...overrides,
  };
}

describe("computeSectionConfidence", () => {
  describe("0 views scenarios", () => {
    test("all sections should be Low confidence with 0 views", () => {
      const derived = createDerivedMetrics({ totalViews: 0 });
      const result = computeSectionConfidence(derived, false, false);
      
      expect(result.discovery).toBe("Low");
      expect(result.retention).toBe("Low");
      expect(result.conversion).toBe("Low");
      expect(result.packaging).toBe("Low");
      expect(result.promotion).toBe("Low");
    });

    test("all sections should be Low even with impressions if views = 0", () => {
      const derived = createDerivedMetrics({
        totalViews: 0,
        impressions: 1000,
        avgViewPercentage: 50,
        subsPer1k: 2,
      });
      const result = computeSectionConfidence(derived, true, true);
      
      expect(result.discovery).toBe("Low");
      expect(result.retention).toBe("Low");
      expect(result.conversion).toBe("Low");
      expect(result.packaging).toBe("Low");
    });

    test("very low views (< 10) should be Low confidence", () => {
      const derived = createDerivedMetrics({
        totalViews: 5,
        impressions: 100,
        avgViewPercentage: 45,
        subsPer1k: 1,
      });
      const result = computeSectionConfidence(derived, true, false);
      
      expect(result.discovery).toBe("Low");
      expect(result.retention).toBe("Low");
      expect(result.conversion).toBe("Low");
      expect(result.packaging).toBe("Low");
      expect(result.promotion).toBe("Low");
    });
  });

  describe("discovery confidence", () => {
    test("Low without impressions data", () => {
      const derived = createDerivedMetrics({ totalViews: 1000 });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.discovery).toBe("Low");
    });

    test("Low with impressions < 200", () => {
      const derived = createDerivedMetrics({
        totalViews: 100,
        impressions: 150,
      });
      const result = computeSectionConfidence(derived, true, false);
      expect(result.discovery).toBe("Low");
    });

    test("Medium with impressions >= 200", () => {
      const derived = createDerivedMetrics({
        totalViews: 100,
        impressions: 500,
      });
      const result = computeSectionConfidence(derived, true, false);
      expect(result.discovery).toBe("Medium");
    });

    test("High with impressions >= 10000 and traffic sources", () => {
      const derived = createDerivedMetrics({
        totalViews: 5000,
        impressions: 15000,
      });
      const result = computeSectionConfidence(derived, true, true);
      expect(result.discovery).toBe("High");
    });
  });

  describe("retention confidence", () => {
    test("Low without retention data", () => {
      const derived = createDerivedMetrics({ totalViews: 1000 });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.retention).toBe("Low");
    });

    test("Low with retention data but views < 100", () => {
      const derived = createDerivedMetrics({
        totalViews: 50,
        avgViewPercentage: 45,
      });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.retention).toBe("Low");
    });

    test("Medium with views >= 100", () => {
      const derived = createDerivedMetrics({
        totalViews: 500,
        avgViewPercentage: 45,
      });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.retention).toBe("Medium");
    });

    test("High with views >= 1000", () => {
      const derived = createDerivedMetrics({
        totalViews: 2000,
        avgViewPercentage: 45,
      });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.retention).toBe("High");
    });
  });

  describe("conversion confidence", () => {
    test("Low without conversion data", () => {
      const derived = createDerivedMetrics({ totalViews: 1000 });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.conversion).toBe("Low");
    });

    test("Low with conversion data but views < 500", () => {
      const derived = createDerivedMetrics({
        totalViews: 200,
        subsPer1k: 2,
      });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.conversion).toBe("Low");
    });

    test("Medium with views >= 500", () => {
      const derived = createDerivedMetrics({
        totalViews: 800,
        subsPer1k: 2,
      });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.conversion).toBe("Medium");
    });

    test("High with views >= 1000 and end screen data", () => {
      const derived = createDerivedMetrics({
        totalViews: 2000,
        subsPer1k: 2,
        endScreenClickRate: 5,
      });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.conversion).toBe("High");
    });
  });

  describe("packaging confidence", () => {
    test("Low without impressions", () => {
      const derived = createDerivedMetrics({ totalViews: 1000 });
      const result = computeSectionConfidence(derived, false, false);
      expect(result.packaging).toBe("Low");
    });

    test("Medium with impressions >= 200", () => {
      const derived = createDerivedMetrics({
        totalViews: 100,
        impressions: 300,
      });
      const result = computeSectionConfidence(derived, true, false);
      expect(result.packaging).toBe("Medium");
    });

    test("High with impressions >= 5000", () => {
      const derived = createDerivedMetrics({
        totalViews: 1000,
        impressions: 10000,
      });
      const result = computeSectionConfidence(derived, true, false);
      expect(result.packaging).toBe("High");
    });
  });
});

describe("isLowDataMode", () => {
  test("true for 0 views", () => {
    const derived = createDerivedMetrics({ totalViews: 0 });
    expect(isLowDataMode(derived)).toBe(true);
  });

  test("true for views < 100 and no impressions", () => {
    const derived = createDerivedMetrics({ totalViews: 50 });
    expect(isLowDataMode(derived)).toBe(true);
  });

  test("true for views < 100 and impressions < 500", () => {
    const derived = createDerivedMetrics({
      totalViews: 50,
      impressions: 200,
    });
    expect(isLowDataMode(derived)).toBe(true);
  });

  test("false for views >= 100", () => {
    const derived = createDerivedMetrics({ totalViews: 100 });
    expect(isLowDataMode(derived)).toBe(false);
  });

  test("false for impressions >= 500 (even with low views)", () => {
    const derived = createDerivedMetrics({
      totalViews: 50,
      impressions: 500,
    });
    expect(isLowDataMode(derived)).toBe(false);
  });
});
