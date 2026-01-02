/**
 * Unit tests for competitor analysis utilities
 */
import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatDurationBadge,
  getDurationBucket,
  analyzeNumberInTitle,
  analyzeTitleTruncation,
  detectChapters,
  analyzeExternalLinks,
  analyzeHashtags,
  computePublicSignals,
} from "@/lib/competitor-utils";

describe("formatDuration", () => {
  it("formats seconds correctly", () => {
    expect(formatDuration(10)).toBe("10s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats minutes and seconds correctly", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(65)).toBe("1m 5s");
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(120)).toBe("2m");
    expect(formatDuration(125)).toBe("2m 5s");
  });

  it("formats hours correctly", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatDuration(7200)).toBe("2h");
    expect(formatDuration(7320)).toBe("2h 2m");
  });

  it("never returns '0 minutes'", () => {
    // This was a bug in the old implementation
    expect(formatDuration(10)).not.toContain("minute");
    expect(formatDuration(30)).not.toContain("minute");
    expect(formatDuration(59)).not.toContain("minute");
  });

  it("handles edge cases", () => {
    expect(formatDuration(-1)).toBe("—");
    expect(formatDuration(NaN)).toBe("—");
    expect(formatDuration(Infinity)).toBe("—");
  });
});

describe("formatDurationBadge", () => {
  it("formats as timestamp", () => {
    expect(formatDurationBadge(10)).toBe("0:10");
    expect(formatDurationBadge(65)).toBe("1:05");
    expect(formatDurationBadge(3661)).toBe("1:01:01");
  });
});

describe("getDurationBucket", () => {
  it("categorizes durations correctly", () => {
    expect(getDurationBucket(30)).toBe("Shorts");
    expect(getDurationBucket(59)).toBe("Shorts");
    expect(getDurationBucket(60)).toBe("Short");
    expect(getDurationBucket(180)).toBe("Short");
    expect(getDurationBucket(240)).toBe("Medium");
    expect(getDurationBucket(600)).toBe("Medium");
    expect(getDurationBucket(1200)).toBe("Long");
    expect(getDurationBucket(3600)).toBe("Very Long");
  });
});

describe("analyzeNumberInTitle", () => {
  describe("proper noun detection - should NOT be performance drivers", () => {
    it("detects game titles with numbers", () => {
      const result = analyzeNumberInTitle("Black Ops 7 is BROKEN");
      expect(result.hasNumber).toBe(true);
      expect(result.type).toBe("proper_noun");
      expect(result.isPerformanceDriver).toBe(false);
    });

    it("detects GTA 6", () => {
      const result = analyzeNumberInTitle("GTA 6 Trailer Breakdown");
      expect(result.type).toBe("proper_noun");
      expect(result.isPerformanceDriver).toBe(false);
    });

    it("detects iPhone models", () => {
      const result = analyzeNumberInTitle("iPhone 15 Pro Review");
      expect(result.type).toBe("proper_noun");
      expect(result.isPerformanceDriver).toBe(false);
    });

    it("detects FIFA games", () => {
      const result = analyzeNumberInTitle("FIFA 25 Career Mode Tips");
      expect(result.type).toBe("proper_noun");
      expect(result.isPerformanceDriver).toBe(false);
    });
  });

  describe("ranking detection - ARE performance drivers", () => {
    it("detects #1 rankings", () => {
      const result = analyzeNumberInTitle("Ranked #1 on LeetCode");
      expect(result.hasNumber).toBe(true);
      expect(result.type).toBe("ranking");
      expect(result.isPerformanceDriver).toBe(true);
    });

    it("detects Top X patterns", () => {
      const result = analyzeNumberInTitle("Top 10 Mistakes Beginners Make");
      expect(result.type).toBe("ranking");
      expect(result.isPerformanceDriver).toBe(true);
    });

    it("detects Best X patterns", () => {
      const result = analyzeNumberInTitle("Best 5 Tools for Productivity");
      expect(result.type).toBe("ranking");
      expect(result.isPerformanceDriver).toBe(true);
    });
  });

  describe("list count detection", () => {
    it("detects X tips patterns", () => {
      const result = analyzeNumberInTitle("5 Tips to Improve Your Game");
      expect(result.type).toBe("list_count");
      expect(result.value).toBe("5");
      expect(result.isPerformanceDriver).toBe(true);
    });

    it("detects X ways patterns", () => {
      const result = analyzeNumberInTitle("10 Ways to Save Money");
      expect(result.type).toBe("list_count");
      expect(result.isPerformanceDriver).toBe(true);
    });

    it("detects X mistakes patterns", () => {
      const result = analyzeNumberInTitle("7 Mistakes That Are Killing Your Channel");
      expect(result.type).toBe("list_count");
      expect(result.isPerformanceDriver).toBe(true);
    });
  });

  describe("episode/part detection", () => {
    it("detects Part X", () => {
      const result = analyzeNumberInTitle("Building a Startup Part 2");
      expect(result.type).toBe("episode");
      expect(result.value).toBe("2");
      expect(result.isPerformanceDriver).toBe(true);
    });

    it("detects Episode X", () => {
      const result = analyzeNumberInTitle("The Series Episode 51");
      expect(result.type).toBe("episode");
      expect(result.isPerformanceDriver).toBe(true);
    });

    it("detects Day X", () => {
      const result = analyzeNumberInTitle("Day 30 of Learning Python");
      expect(result.type).toBe("episode");
      expect(result.isPerformanceDriver).toBe(true);
    });
  });

  describe("time constraint detection", () => {
    it("detects X hours", () => {
      const result = analyzeNumberInTitle("I Tried This for 24 Hours");
      expect(result.type).toBe("time_constraint");
      expect(result.isPerformanceDriver).toBe(true);
    });

    it("detects X days", () => {
      const result = analyzeNumberInTitle("30 Days of No Sugar Challenge");
      expect(result.type).toBe("time_constraint");
      expect(result.isPerformanceDriver).toBe(true);
    });
  });

  describe("year detection", () => {
    it("detects year references", () => {
      const result = analyzeNumberInTitle("Best Strategy in 2025");
      expect(result.type).toBe("year");
      expect(result.value).toBe("2025");
      expect(result.isPerformanceDriver).toBe(true);
    });
  });

  describe("no number", () => {
    it("returns false for titles without numbers", () => {
      const result = analyzeNumberInTitle("How to Build a Business");
      expect(result.hasNumber).toBe(false);
      expect(result.type).toBe("none");
      expect(result.isPerformanceDriver).toBe(false);
    });
  });
});

describe("analyzeTitleTruncation", () => {
  it("detects short titles that don't truncate", () => {
    const result = analyzeTitleTruncation("Short Title");
    expect(result.truncatesOnMobile).toBe(false);
    expect(result.truncatesOnDesktop).toBe(false);
  });

  it("detects titles that truncate on mobile", () => {
    const title = "This is a title that is definitely going to truncate on mobile devices";
    const result = analyzeTitleTruncation(title);
    expect(result.truncatesOnMobile).toBe(true);
    expect(result.mobileVisibleText.endsWith("...")).toBe(true);
  });

  it("provides correct character count", () => {
    const title = "Test Title";
    const result = analyzeTitleTruncation(title);
    expect(result.totalChars).toBe(10);
    expect(result.confidence).toBe("Measured");
  });
});

describe("detectChapters", () => {
  it("detects valid chapter timestamps", () => {
    const description = `
0:00 Intro
1:30 First Topic
5:45 Second Topic
10:00 Conclusion
    `;
    const result = detectChapters(description);
    expect(result.hasChapters).toBe(true);
    expect(result.chapterCount).toBe(4);
    expect(result.confidence).toBe("Measured");
  });

  it("rejects descriptions without 0:00 start", () => {
    const description = `
1:30 First Topic
5:45 Second Topic
    `;
    const result = detectChapters(description);
    expect(result.hasChapters).toBe(false);
  });

  it("rejects too few timestamps", () => {
    const description = `
0:00 Intro
5:00 Main Content
    `;
    const result = detectChapters(description);
    expect(result.hasChapters).toBe(false);
  });

  it("handles empty description", () => {
    const result = detectChapters("");
    expect(result.hasChapters).toBe(false);
    expect(result.chapterCount).toBe(0);
  });
});

describe("analyzeExternalLinks", () => {
  it("detects and counts links", () => {
    const description = `
Check out https://example.com/page
Follow me on https://twitter.com/user
Buy here: https://amazon.com/product
    `;
    const result = analyzeExternalLinks(description);
    expect(result.hasLinks).toBe(true);
    expect(result.linkCount).toBe(3);
    expect(result.domains).toContain("example.com");
  });

  it("identifies social links", () => {
    const description = "Follow me https://twitter.com/user";
    const result = analyzeExternalLinks(description);
    expect(result.hasSocialLinks).toBe(true);
  });

  it("identifies affiliate links", () => {
    const description = "Buy here https://amzn.to/abc123";
    const result = analyzeExternalLinks(description);
    expect(result.hasAffiliateLinks).toBe(true);
  });

  it("handles empty description", () => {
    const result = analyzeExternalLinks("");
    expect(result.hasLinks).toBe(false);
    expect(result.linkCount).toBe(0);
  });
});

describe("analyzeHashtags", () => {
  it("extracts hashtags from title and description", () => {
    const result = analyzeHashtags(
      "My Video #tutorial",
      "Check this out #coding #programming"
    );
    expect(result.count).toBe(3);
    expect(result.inTitle).toContain("#tutorial");
    expect(result.inDescription).toContain("#coding");
  });

  it("deduplicates hashtags", () => {
    const result = analyzeHashtags("#test", "#test #test");
    expect(result.count).toBe(1);
    expect(result.hashtags).toEqual(["#test"]);
  });
});

describe("computePublicSignals", () => {
  it("computes all signals correctly", () => {
    const result = computePublicSignals({
      title: "5 Tips to Improve #tutorial",
      description: "0:00 Intro\n1:00 Tip 1\n2:00 Tip 2\n3:00 Conclusion\n\nMore at https://example.com",
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      durationSec: 600,
      viewCount: 10000,
      likeCount: 500,
      commentCount: 50,
    });

    // Core metrics
    expect(result.videoAgeDays).toBe(7);
    expect(result.viewsPerDay).toBeCloseTo(10000 / 7, 0);
    expect(result.likeRate).toBe(5); // 500/10000 * 100 = 5%
    expect(result.commentsPer1k).toBe(5); // 50/10000 * 1000 = 5

    // Analysis results
    expect(result.numberAnalysis.type).toBe("list_count");
    expect(result.numberAnalysis.isPerformanceDriver).toBe(true);
    expect(result.hashtagCount).toBe(1);
    expect(result.chapterDetection.hasChapters).toBe(true);
    expect(result.externalLinks.hasLinks).toBe(true);
    expect(result.durationBucket).toBe("Medium");
  });

  it("handles missing likes/comments", () => {
    const result = computePublicSignals({
      title: "Test Video",
      description: "Description",
      publishedAt: new Date().toISOString(),
      durationSec: 300,
      viewCount: 1000,
      likeCount: null,
      commentCount: null,
    });

    expect(result.likeRate).toBeNull();
    expect(result.commentsPer1k).toBeNull();
    expect(result.engagementRate).toBeNull();
  });

  it("never produces NaN", () => {
    const result = computePublicSignals({
      title: "Test",
      description: "",
      publishedAt: new Date().toISOString(),
      durationSec: 0,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    });

    expect(Number.isNaN(result.viewsPerDay)).toBe(false);
    // With 0 views, rates should be null, not NaN
    // (division by zero protection)
    expect(result.likeRate).toBeNull();
  });
});
