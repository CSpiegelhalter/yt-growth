/**
 * Unit tests for Competitor Search Engine
 *
 * Tests for:
 * - Cache key stability (same inputs -> same key; reordered keys -> same key)
 * - Filter application
 * - viewsPerDay calculation edge cases
 * - Niche inference
 */
import { describe, it, expect } from "vitest";

// Import pure functions from utils (no server-only dependency)
import {
  makeCacheKey,
  normalizeFilters,
  calculateDerivedMetrics,
  passesFilters,
  sortVideos,
  sanitizeNicheText,
  inferNicheFromText,
} from "@/lib/competitor-search/utils";
import { parseYouTubeVideoId } from "@/lib/shared/youtube-video-id";
import type {
  CompetitorSearchFilters,
  CompetitorVideoResult,
} from "@/lib/competitor-search/types";

describe("Competitor Search - Cache Key Stability", () => {
  describe("makeCacheKey", () => {
    it("produces the same key for identical inputs", () => {
      const filters: CompetitorSearchFilters = {
        contentType: "both",
        dateRangePreset: "90d",
        minViewsPerDay: 10,
        sortBy: "viewsPerDay",
      };

      const key1 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["espresso", "coffee"],
        filters
      );
      const key2 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["espresso", "coffee"],
        filters
      );

      expect(key1).toBe(key2);
    });

    it("produces the same key when query terms are reordered", () => {
      const filters: CompetitorSearchFilters = {
        contentType: "both",
        minViewsPerDay: 10,
      };

      const key1 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["coffee", "espresso", "beans"],
        filters
      );
      const key2 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["espresso", "beans", "coffee"],
        filters
      );

      expect(key1).toBe(key2);
    });

    it("produces different keys for different niches", () => {
      const filters: CompetitorSearchFilters = {};

      const key1 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["espresso"],
        filters
      );
      const key2 = makeCacheKey(
        "competitor_search",
        "react tutorials",
        ["espresso"],
        filters
      );

      expect(key1).not.toBe(key2);
    });

    it("produces different keys for different modes", () => {
      const filters: CompetitorSearchFilters = {};

      const key1 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["espresso"],
        filters
      );
      const key2 = makeCacheKey(
        "search_my_niche",
        "diy espresso",
        ["espresso"],
        filters
      );

      expect(key1).not.toBe(key2);
    });

    it("produces different keys for different filters", () => {
      // Use non-default values to ensure they differ
      const key1 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["espresso"],
        { minViewsPerDay: 50 }
      );
      const key2 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["espresso"],
        { minViewsPerDay: 100 }
      );

      expect(key1).not.toBe(key2);
    });

    it("normalizes niche to lowercase", () => {
      const filters: CompetitorSearchFilters = {};

      const key1 = makeCacheKey(
        "competitor_search",
        "DIY Espresso",
        ["espresso"],
        filters
      );
      const key2 = makeCacheKey(
        "competitor_search",
        "diy espresso",
        ["espresso"],
        filters
      );

      expect(key1).toBe(key2);
    });
  });

  describe("normalizeFilters", () => {
    it("applies default values for missing filters", () => {
      const normalized = normalizeFilters({});

      expect(normalized.contentType).toBe("both");
      expect(normalized.minViewsPerDay).toBe(10);
      expect(normalized.sortBy).toBe("viewsPerDay");
    });

    it("converts date presets to absolute dates", () => {
      const normalized = normalizeFilters({ dateRangePreset: "30d" });

      expect(normalized.postedAfter).toBeDefined();
      // Should be a date string in YYYY-MM-DD format
      expect(normalized.postedAfter).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("rounds numeric values to integers", () => {
      const normalized = normalizeFilters({
        minViewsPerDay: 10.5,
        maxViewsPerDay: 100.7,
      });

      expect(normalized.minViewsPerDay).toBe(11);
      expect(normalized.maxViewsPerDay).toBe(101);
    });

    it("strips time portion from date strings", () => {
      const normalized = normalizeFilters({
        dateRangePreset: "custom",
        postedAfter: "2024-01-15T12:30:00Z",
      });

      expect(normalized.postedAfter).toBe("2024-01-15");
    });
  });
});

describe("Competitor Search - viewsPerDay Calculation", () => {
  describe("calculateDerivedMetrics", () => {
    it("calculates viewsPerDay correctly for a video 7 days old", () => {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const result = calculateDerivedMetrics(7000, sevenDaysAgo);

      expect(result.viewsPerDay).toBe(1000);
      expect(result.daysSincePublished).toBe(7);
    });

    it("uses minimum 1 day to prevent division by zero", () => {
      const justNow = new Date().toISOString();

      const result = calculateDerivedMetrics(100, justNow);

      expect(result.daysSincePublished).toBe(1);
      expect(result.viewsPerDay).toBeGreaterThan(0);
    });

    it("caps viewsPerDay for very new videos (< 1 day old)", () => {
      // Video published 6 hours ago
      const sixHoursAgo = new Date(
        Date.now() - 6 * 60 * 60 * 1000
      ).toISOString();

      const result = calculateDerivedMetrics(1000, sixHoursAgo);

      // With 0.5 day minimum, viewsPerDay should be capped at 2000
      expect(result.viewsPerDay).toBeLessThanOrEqual(2000);
    });

    it("handles zero views without NaN", () => {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const result = calculateDerivedMetrics(0, yesterday);

      expect(result.viewsPerDay).toBe(0);
      expect(Number.isNaN(result.viewsPerDay)).toBe(false);
    });

    it("calculates engagement per view when likes and comments are provided", () => {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const result = calculateDerivedMetrics(10000, yesterday, 500, 100);

      expect(result.engagementPerView).toBe(0.06); // (500 + 100) / 10000
    });

    it("returns undefined engagement when likes/comments missing", () => {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const result = calculateDerivedMetrics(10000, yesterday);

      expect(result.engagementPerView).toBeUndefined();
    });
  });
});

describe("Competitor Search - Filter Application", () => {
  describe("passesFilters", () => {
    const baseVideo = {
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 10000,
      derived: {
        viewsPerDay: 333,
        daysSincePublished: 30,
      },
    };

    it("passes when no filters are applied", () => {
      expect(passesFilters(baseVideo, {})).toBe(true);
    });

    it("filters by minViewsPerDay", () => {
      expect(passesFilters(baseVideo, { minViewsPerDay: 100 })).toBe(true);
      expect(passesFilters(baseVideo, { minViewsPerDay: 500 })).toBe(false);
    });

    it("filters by maxViewsPerDay", () => {
      expect(passesFilters(baseVideo, { maxViewsPerDay: 500 })).toBe(true);
      expect(passesFilters(baseVideo, { maxViewsPerDay: 100 })).toBe(false);
    });

    it("filters by minTotalViews", () => {
      expect(passesFilters(baseVideo, { minTotalViews: 5000 })).toBe(true);
      expect(passesFilters(baseVideo, { minTotalViews: 20000 })).toBe(false);
    });

    it("filters by maxTotalViews", () => {
      expect(passesFilters(baseVideo, { maxTotalViews: 20000 })).toBe(true);
      expect(passesFilters(baseVideo, { maxTotalViews: 5000 })).toBe(false);
    });

    it("filters Shorts by content type", () => {
      const shortsVideo = { ...baseVideo, durationSec: 30 };

      expect(passesFilters(shortsVideo, { contentType: "shorts" })).toBe(true);
      expect(passesFilters(shortsVideo, { contentType: "long" })).toBe(false);
      expect(passesFilters(shortsVideo, { contentType: "both" })).toBe(true);
    });

    it("filters long-form by content type", () => {
      const longVideo = { ...baseVideo, durationSec: 600 };

      expect(passesFilters(longVideo, { contentType: "shorts" })).toBe(false);
      expect(passesFilters(longVideo, { contentType: "long" })).toBe(true);
      expect(passesFilters(longVideo, { contentType: "both" })).toBe(true);
    });

    it("filters by postedAfter", () => {
      // baseVideo is 30 days old
      // A filter of "postedAfter 45 days ago" should pass (video is newer)
      const fortyFiveDaysAgo = new Date(
        Date.now() - 45 * 24 * 60 * 60 * 1000
      ).toISOString();

      expect(passesFilters(baseVideo, { postedAfter: fortyFiveDaysAgo })).toBe(
        true
      );

      // A filter of "postedAfter 15 days ago" should fail (video is older)
      const fifteenDaysAgo = new Date(
        Date.now() - 15 * 24 * 60 * 60 * 1000
      ).toISOString();

      expect(passesFilters(baseVideo, { postedAfter: fifteenDaysAgo })).toBe(
        false
      );
    });

    it("applies multiple filters together", () => {
      const filters: CompetitorSearchFilters = {
        minViewsPerDay: 100,
        maxViewsPerDay: 500,
        minTotalViews: 1000,
        contentType: "both",
      };

      expect(passesFilters(baseVideo, filters)).toBe(true);

      // Fails minViewsPerDay
      expect(
        passesFilters(
          { ...baseVideo, derived: { ...baseVideo.derived, viewsPerDay: 50 } },
          filters
        )
      ).toBe(false);
    });
  });

  describe("sortVideos", () => {
    const videos: CompetitorVideoResult[] = [
      {
        videoId: "a",
        title: "Video A",
        channelId: "ch1",
        channelTitle: "Channel 1",
        channelThumbnailUrl: null,
        thumbnailUrl: null,
        publishedAt: "2024-01-10T00:00:00Z",
        stats: { viewCount: 5000 },
        derived: { viewsPerDay: 100, daysSincePublished: 50, engagementPerView: 0.02 },
      },
      {
        videoId: "b",
        title: "Video B",
        channelId: "ch2",
        channelTitle: "Channel 2",
        channelThumbnailUrl: null,
        thumbnailUrl: null,
        publishedAt: "2024-01-15T00:00:00Z",
        stats: { viewCount: 10000 },
        derived: { viewsPerDay: 500, daysSincePublished: 20, engagementPerView: 0.01 },
      },
      {
        videoId: "c",
        title: "Video C",
        channelId: "ch3",
        channelTitle: "Channel 3",
        channelThumbnailUrl: null,
        thumbnailUrl: null,
        publishedAt: "2024-01-20T00:00:00Z",
        stats: { viewCount: 2000 },
        derived: { viewsPerDay: 200, daysSincePublished: 10, engagementPerView: 0.05 },
      },
    ];

    it("sorts by viewsPerDay descending", () => {
      const sorted = sortVideos(videos, "viewsPerDay");
      expect(sorted[0].videoId).toBe("b"); // 500 views/day
      expect(sorted[1].videoId).toBe("c"); // 200 views/day
      expect(sorted[2].videoId).toBe("a"); // 100 views/day
    });

    it("sorts by totalViews descending", () => {
      const sorted = sortVideos(videos, "totalViews");
      expect(sorted[0].videoId).toBe("b"); // 10000 views
      expect(sorted[1].videoId).toBe("a"); // 5000 views
      expect(sorted[2].videoId).toBe("c"); // 2000 views
    });

    it("sorts by newest first", () => {
      const sorted = sortVideos(videos, "newest");
      expect(sorted[0].videoId).toBe("c"); // Jan 20
      expect(sorted[1].videoId).toBe("b"); // Jan 15
      expect(sorted[2].videoId).toBe("a"); // Jan 10
    });

    it("sorts by engagement descending", () => {
      const sorted = sortVideos(videos, "engagement");
      expect(sorted[0].videoId).toBe("c"); // 0.05 engagement
      expect(sorted[1].videoId).toBe("a"); // 0.02 engagement
      expect(sorted[2].videoId).toBe("b"); // 0.01 engagement
    });

    it("does not mutate original array", () => {
      const original = [...videos];
      sortVideos(videos, "viewsPerDay");
      expect(videos).toEqual(original);
    });
  });
});

describe("Competitor Search - Niche Inference", () => {
  describe("parseYouTubeVideoId (canonical, was validateAndExtractVideoId)", () => {
    it("extracts video ID from standard youtube.com URL", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID from youtu.be short URL", () => {
      expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ"
      );
    });

    it("extracts video ID from mobile URL", () => {
      expect(
        parseYouTubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("rejects non-YouTube URLs", () => {
      expect(parseYouTubeVideoId("https://vimeo.com/123456")).toBeNull();
      expect(parseYouTubeVideoId("https://example.com/video")).toBeNull();
    });

    it("rejects invalid URLs", () => {
      expect(parseYouTubeVideoId("not a url")).toBeNull();
      expect(parseYouTubeVideoId("")).toBeNull();
    });

    it("handles null/undefined gracefully", () => {
      expect(parseYouTubeVideoId(null as any)).toBeNull();
      expect(parseYouTubeVideoId(undefined as any)).toBeNull();
    });
  });

  describe("sanitizeNicheText", () => {
    it("trims whitespace", () => {
      expect(sanitizeNicheText("  diy espresso  ")).toBe("diy espresso");
    });

    it("collapses multiple spaces", () => {
      expect(sanitizeNicheText("diy   espresso   tips")).toBe(
        "diy espresso tips"
      );
    });

    it("removes control characters", () => {
      expect(sanitizeNicheText("diy\x00espresso\x1F")).toBe("diy espresso");
    });

    it("limits length to 500 characters", () => {
      const longText = "a".repeat(600);
      expect(sanitizeNicheText(longText).length).toBeLessThanOrEqual(500);
    });

    it("handles empty input", () => {
      expect(sanitizeNicheText("")).toBe("");
      expect(sanitizeNicheText("   ")).toBe("");
    });

    it("handles null/undefined gracefully", () => {
      expect(sanitizeNicheText(null as any)).toBe("");
      expect(sanitizeNicheText(undefined as any)).toBe("");
    });
  });

  describe("inferNicheFromText", () => {
    it("extracts keywords from niche text", () => {
      const result = inferNicheFromText("DIY home espresso machine tutorials");

      expect(result.niche).toBe("DIY home espresso machine tutorials");
      expect(result.source).toBe("text");
      expect(result.queryTerms.length).toBeGreaterThan(0);
    });

    it("generates multiple query terms", () => {
      const result = inferNicheFromText("React TypeScript tutorials for beginners");

      expect(result.queryTerms.length).toBeGreaterThan(1);
      // Should include single keywords and combinations
      expect(result.queryTerms.some((q) => q.includes(" "))).toBe(true);
    });

    it("filters out common stopwords", () => {
      const result = inferNicheFromText("the best tips for making coffee");

      // Should not include "the", "for", "and" as standalone terms
      const hasStopword = result.queryTerms.some((q) =>
        ["the", "for", "and"].includes(q.toLowerCase())
      );
      expect(hasStopword).toBe(false);
    });

    it("handles empty text", () => {
      const result = inferNicheFromText("");

      expect(result.niche).toBe("General content");
      expect(result.queryTerms.length).toBeGreaterThan(0);
    });

    it("includes inferredAt timestamp", () => {
      const result = inferNicheFromText("test niche");

      expect(result.inferredAt).toBeDefined();
      expect(new Date(result.inferredAt).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });
  });
});
