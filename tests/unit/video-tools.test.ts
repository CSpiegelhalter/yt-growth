/**
 * Unit tests for video-tools.ts
 * Tests metric calculations, sorting, and filtering logic
 */

import { describe, it, expect } from "vitest";
import {
  daysSincePublish,
  calcLikeRate,
  calcViewsPerDay,
  calcCommentRate,
  calcEngagementRate,
  calcSubsPerThousandViews,
  determineContentType,
  computeMetrics,
  getAvailableSortOptions,
  filterByTimeRange,
  filterByContentType,
  filterBySearch,
  filterTopPerformers,
  applyFilters,
  sortVideos,
  exportToCSV,
  DashboardVideo,
  VideoWithMetrics,
  VideoFilters,
} from "@/lib/video-tools";

const ONE_DAY_AGO = new Date("2026-01-01T12:00:00Z").toISOString();
const SEVEN_DAYS_AGO = new Date("2025-12-26T12:00:00Z").toISOString();
const THIRTY_DAYS_AGO = new Date("2025-12-03T12:00:00Z").toISOString();

// Helper to create test videos
function createTestVideo(overrides: Partial<DashboardVideo> = {}): DashboardVideo {
  return {
    videoId: "test-video-1",
    title: "Test Video",
    thumbnailUrl: null,
    durationSec: 600, // 10 minutes = long-form
    publishedAt: ONE_DAY_AGO,
    views: 1000,
    likes: 100,
    comments: 10,
    ...overrides,
  };
}

function createEnhancedVideo(overrides: Partial<DashboardVideo> = {}): VideoWithMetrics {
  const video = createTestVideo(overrides);
  return {
    ...video,
    computed: computeMetrics(video),
  };
}

describe("Metric Calculations", () => {
  describe("daysSincePublish", () => {
    it("returns 0 for null date", () => {
      expect(daysSincePublish(null)).toBe(0);
    });

    it("returns minimum of 1 day", () => {
      // Even for today, we return 1 to avoid division by zero
      const today = new Date().toISOString();
      expect(daysSincePublish(today)).toBeGreaterThanOrEqual(1);
    });
  });

  describe("calcLikeRate", () => {
    it("returns 0 for 0 views", () => {
      expect(calcLikeRate(100, 0)).toBe(0);
    });

    it("calculates correctly", () => {
      expect(calcLikeRate(100, 1000)).toBe(0.1);
      expect(calcLikeRate(50, 500)).toBe(0.1);
      expect(calcLikeRate(0, 1000)).toBe(0);
    });
  });

  describe("calcViewsPerDay", () => {
    it("returns 0 for null date", () => {
      expect(calcViewsPerDay(1000, null)).toBe(0);
    });

    it("calculates correctly", () => {
      // Video with 1000 views published 1 day ago = 1000 views/day
      const result = calcViewsPerDay(1000, ONE_DAY_AGO);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("calcCommentRate", () => {
    it("returns 0 for 0 views", () => {
      expect(calcCommentRate(10, 0)).toBe(0);
    });

    it("calculates per 1k views", () => {
      expect(calcCommentRate(10, 1000)).toBe(10); // 10 comments per 1k views
      expect(calcCommentRate(5, 500)).toBe(10); // Same rate
    });
  });

  describe("calcEngagementRate", () => {
    it("returns 0 for 0 views", () => {
      expect(calcEngagementRate(100, 10, 0)).toBe(0);
    });

    it("calculates (likes + comments) / views", () => {
      expect(calcEngagementRate(100, 10, 1000)).toBe(0.11);
    });
  });

  describe("calcSubsPerThousandViews", () => {
    it("returns null for null subs", () => {
      expect(calcSubsPerThousandViews(null, 1000)).toBeNull();
      expect(calcSubsPerThousandViews(undefined, 1000)).toBeNull();
    });

    it("returns null for 0 views", () => {
      expect(calcSubsPerThousandViews(10, 0)).toBeNull();
    });

    it("calculates per 1k views", () => {
      expect(calcSubsPerThousandViews(10, 1000)).toBe(10);
      expect(calcSubsPerThousandViews(5, 500)).toBe(10);
    });
  });

  describe("determineContentType", () => {
    it("returns unknown for null duration", () => {
      expect(determineContentType(null)).toBe("unknown");
    });

    it("returns short for <= 60 seconds", () => {
      expect(determineContentType(60)).toBe("short");
      expect(determineContentType(30)).toBe("short");
    });

    it("returns long for > 60 seconds", () => {
      expect(determineContentType(61)).toBe("long");
      expect(determineContentType(600)).toBe("long");
    });
  });

  describe("computeMetrics", () => {
    it("computes all metrics correctly", () => {
      const video = createTestVideo({
        views: 1000,
        likes: 100,
        comments: 10,
        durationSec: 30, // Short
        subscribersGained: 5,
        avgViewPercentage: 50,
        estimatedMinutesWatched: 100,
      });

      const metrics = computeMetrics(video);

      expect(metrics.likeRate).toBe(0.1);
      expect(metrics.commentRate).toBe(10);
      expect(metrics.engagementRate).toBe(0.11);
      expect(metrics.contentType).toBe("short");
      expect(metrics.subsPerThousandViews).toBe(5);
      expect(metrics.retentionPercent).toBe(50);
      expect(metrics.watchTimeMinutes).toBe(100);
    });
  });
});

describe("Capability Detection", () => {
  describe("getAvailableSortOptions", () => {
    it("returns all basic options for minimal data", () => {
      const videos = [createTestVideo()];
      const options = getAvailableSortOptions(videos);

      // Should include options that don't require metrics
      const basicOptions = options.filter((o) => !o.requiresMetric);
      expect(basicOptions.length).toBeGreaterThan(0);
    });

    it("includes CTR option when CTR data exists", () => {
      const videos = [createTestVideo({ ctr: 5 })];
      const options = getAvailableSortOptions(videos);

      const ctrOption = options.find((o) => o.key === "ctr_desc");
      expect(ctrOption).toBeDefined();
    });

    it("excludes CTR option when no CTR data", () => {
      const videos = [createTestVideo()];
      const options = getAvailableSortOptions(videos);

      const ctrOption = options.find((o) => o.key === "ctr_desc");
      expect(ctrOption).toBeUndefined();
    });
  });
});

describe("Filtering", () => {
  describe("filterByTimeRange", () => {
    it("returns all videos for lifetime", () => {
      const videos = [
        createEnhancedVideo({ publishedAt: ONE_DAY_AGO }),
        createEnhancedVideo({ publishedAt: THIRTY_DAYS_AGO }),
      ];

      const filtered = filterByTimeRange(videos, "lifetime");
      expect(filtered.length).toBe(2);
    });

    it("filters by 7 days", () => {
      const videos = [
        createEnhancedVideo({ videoId: "recent", publishedAt: ONE_DAY_AGO }),
        createEnhancedVideo({ videoId: "old", publishedAt: THIRTY_DAYS_AGO }),
      ];

      const filtered = filterByTimeRange(videos, "7d");
      expect(filtered.length).toBe(1);
      expect(filtered[0].videoId).toBe("recent");
    });
  });

  describe("filterByContentType", () => {
    it("returns all for 'all' type", () => {
      const videos = [
        createEnhancedVideo({ durationSec: 30 }), // Short
        createEnhancedVideo({ durationSec: 600 }), // Long
      ];

      const filtered = filterByContentType(videos, "all");
      expect(filtered.length).toBe(2);
    });

    it("filters shorts correctly", () => {
      const videos = [
        createEnhancedVideo({ videoId: "short", durationSec: 30 }),
        createEnhancedVideo({ videoId: "long", durationSec: 600 }),
      ];

      const filtered = filterByContentType(videos, "short");
      expect(filtered.length).toBe(1);
      expect(filtered[0].videoId).toBe("short");
    });

    it("filters long-form correctly", () => {
      const videos = [
        createEnhancedVideo({ videoId: "short", durationSec: 30 }),
        createEnhancedVideo({ videoId: "long", durationSec: 600 }),
      ];

      const filtered = filterByContentType(videos, "long");
      expect(filtered.length).toBe(1);
      expect(filtered[0].videoId).toBe("long");
    });
  });

  describe("filterBySearch", () => {
    it("returns all for empty query", () => {
      const videos = [
        createEnhancedVideo({ title: "Video One" }),
        createEnhancedVideo({ title: "Video Two" }),
      ];

      const filtered = filterBySearch(videos, "");
      expect(filtered.length).toBe(2);
    });

    it("filters by title (case insensitive)", () => {
      const videos = [
        createEnhancedVideo({ videoId: "one", title: "How to Cook Pasta" }),
        createEnhancedVideo({ videoId: "two", title: "Gaming Highlights" }),
      ];

      const filtered = filterBySearch(videos, "pasta");
      expect(filtered.length).toBe(1);
      expect(filtered[0].videoId).toBe("one");
    });
  });

  describe("filterTopPerformers", () => {
    it("returns top 20% by total views", () => {
      // Create 10 videos with varying views
      const videos = Array.from({ length: 10 }, (_, i) =>
        createEnhancedVideo({
          videoId: `video-${i}`,
          views: (i + 1) * 1000, // 1k to 10k views
          publishedAt: ONE_DAY_AGO,
        })
      );

      const filtered = filterTopPerformers(videos);

      // Top 20% of 10 videos = 2 videos (min 3)
      expect(filtered.length).toBe(3); // Minimum 3 videos
      expect(filtered[0].videoId).toBe("video-9"); // Highest views
      expect(filtered[1].videoId).toBe("video-8"); // Second highest
      expect(filtered[2].videoId).toBe("video-7"); // Third highest
    });

    it("returns at least 3 videos when enough exist", () => {
      const videos = Array.from({ length: 5 }, (_, i) =>
        createEnhancedVideo({ videoId: `video-${i}`, views: (i + 1) * 100 })
      );
      const filtered = filterTopPerformers(videos);
      expect(filtered.length).toBe(3);
    });
  });

  describe("applyFilters", () => {
    it("applies multiple filters", () => {
      const videos = [
        createEnhancedVideo({ videoId: "match", title: "Cooking Tutorial", durationSec: 600, publishedAt: ONE_DAY_AGO }),
        createEnhancedVideo({ videoId: "wrong-type", title: "Cooking Short", durationSec: 30, publishedAt: ONE_DAY_AGO }),
        createEnhancedVideo({ videoId: "wrong-time", title: "Cooking Old", durationSec: 600, publishedAt: THIRTY_DAYS_AGO }),
        createEnhancedVideo({ videoId: "wrong-title", title: "Gaming Video", durationSec: 600, publishedAt: ONE_DAY_AGO }),
      ];

      const filters: VideoFilters = {
        timeRange: "7d",
        contentType: "long",
        status: "all",
        preset: "none",
        searchQuery: "cooking",
      };

      const filtered = applyFilters(videos, filters);
      expect(filtered.length).toBe(1);
      expect(filtered[0].videoId).toBe("match");
    });
  });
});

describe("Sorting", () => {
  describe("sortVideos", () => {
    it("sorts by views descending", () => {
      const videos = [
        createEnhancedVideo({ videoId: "low", views: 100 }),
        createEnhancedVideo({ videoId: "high", views: 1000 }),
        createEnhancedVideo({ videoId: "mid", views: 500 }),
      ];

      const sorted = sortVideos(videos, "views_desc");
      expect(sorted[0].videoId).toBe("high");
      expect(sorted[1].videoId).toBe("mid");
      expect(sorted[2].videoId).toBe("low");
    });

    it("sorts by views ascending", () => {
      const videos = [
        createEnhancedVideo({ videoId: "low", views: 100 }),
        createEnhancedVideo({ videoId: "high", views: 1000 }),
      ];

      const sorted = sortVideos(videos, "views_asc");
      expect(sorted[0].videoId).toBe("low");
      expect(sorted[1].videoId).toBe("high");
    });

    it("sorts by newest", () => {
      const videos = [
        createEnhancedVideo({ videoId: "old", publishedAt: SEVEN_DAYS_AGO }),
        createEnhancedVideo({ videoId: "new", publishedAt: ONE_DAY_AGO }),
      ];

      const sorted = sortVideos(videos, "newest");
      expect(sorted[0].videoId).toBe("new");
      expect(sorted[1].videoId).toBe("old");
    });

    it("sorts by oldest", () => {
      const videos = [
        createEnhancedVideo({ videoId: "old", publishedAt: SEVEN_DAYS_AGO }),
        createEnhancedVideo({ videoId: "new", publishedAt: ONE_DAY_AGO }),
      ];

      const sorted = sortVideos(videos, "oldest");
      expect(sorted[0].videoId).toBe("old");
      expect(sorted[1].videoId).toBe("new");
    });

    it("sorts by like rate descending", () => {
      const videos = [
        createEnhancedVideo({ videoId: "low", views: 1000, likes: 10 }), // 1%
        createEnhancedVideo({ videoId: "high", views: 1000, likes: 100 }), // 10%
      ];

      const sorted = sortVideos(videos, "like_rate_desc");
      expect(sorted[0].videoId).toBe("high");
      expect(sorted[1].videoId).toBe("low");
    });

    it("sorts by velocity descending", () => {
      // Same age, different views = different velocity
      const videos = [
        createEnhancedVideo({ videoId: "slow", views: 100, publishedAt: ONE_DAY_AGO }),
        createEnhancedVideo({ videoId: "fast", views: 1000, publishedAt: ONE_DAY_AGO }),
      ];

      const sorted = sortVideos(videos, "velocity_desc");
      expect(sorted[0].videoId).toBe("fast");
      expect(sorted[1].videoId).toBe("slow");
    });

    it("sorts by retention ascending (worst first)", () => {
      const videos = [
        createEnhancedVideo({ videoId: "good", avgViewPercentage: 50 }),
        createEnhancedVideo({ videoId: "bad", avgViewPercentage: 20 }),
      ];

      const sorted = sortVideos(videos, "retention_asc");
      expect(sorted[0].videoId).toBe("bad"); // Worst retention first
      expect(sorted[1].videoId).toBe("good");
    });

    it("sorts by subscriber conversion descending", () => {
      const videos = [
        createEnhancedVideo({ videoId: "low", views: 1000, subscribersGained: 1 }),
        createEnhancedVideo({ videoId: "high", views: 1000, subscribersGained: 10 }),
      ];

      const sorted = sortVideos(videos, "sub_conversion_desc");
      expect(sorted[0].videoId).toBe("high");
      expect(sorted[1].videoId).toBe("low");
    });
  });
});

describe("CSV Export", () => {
  describe("exportToCSV", () => {
    it("generates valid CSV with headers", () => {
      const videos = [
        createEnhancedVideo({
          videoId: "test-1",
          title: "Test Video",
          views: 1000,
          likes: 100,
          comments: 10,
        }),
      ];

      const csv = exportToCSV(videos, "views_desc");
      const lines = csv.split("\n");

      // Should have header + 1 data row
      expect(lines.length).toBe(2);

      // Header should contain expected columns
      expect(lines[0]).toContain("Title");
      expect(lines[0]).toContain("Video ID");
      expect(lines[0]).toContain("Views");
      expect(lines[0]).toContain("Likes");
    });

    it("escapes commas in titles", () => {
      const videos = [
        createEnhancedVideo({
          title: "Test, Video, With, Commas",
        }),
      ];

      const csv = exportToCSV(videos, "views_desc");

      // Commas should be replaced with semicolons to avoid breaking CSV
      expect(csv).not.toContain("Test, Video");
      expect(csv).toContain("Test; Video");
    });
  });
});
