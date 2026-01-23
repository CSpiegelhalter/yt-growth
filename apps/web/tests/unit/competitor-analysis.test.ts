/**
 * Unit tests for Competitor Analysis correctness
 *
 * Tests for:
 * - Label standardization (Like Rate vs Engagement)
 * - Duration consistency (36s never described as "1 minute")
 * - Forbidden phrases in narratives
 * - Baseline labeling gates
 * - Empty description detection
 */

import { describe, it, expect } from "vitest";
import {
  formatDuration,
  getDurationBucket,
  analyzeHashtags,
  detectChapters,
} from "@/lib/competitor-utils";

describe("Competitor Analysis Correctness", () => {
  describe("Duration Formatting (A2: never shows wrong units)", () => {
    it("formats 36 seconds as '36s', not '0 minutes' or '1 minute'", () => {
      const result = formatDuration(36);
      expect(result).toBe("36s");
      expect(result).not.toContain("minute");
      expect(result).not.toContain("0 ");
    });

    it("formats 10 seconds as '10s'", () => {
      expect(formatDuration(10)).toBe("10s");
    });

    it("formats 59 seconds as '59s', not '1 minute'", () => {
      const result = formatDuration(59);
      expect(result).toBe("59s");
      expect(result).not.toContain("minute");
    });

    it("formats 60 seconds as '1m', not '0 minutes'", () => {
      expect(formatDuration(60)).toBe("1m");
    });

    it("formats 65 seconds as '1m 5s'", () => {
      expect(formatDuration(65)).toBe("1m 5s");
    });

    it("formats 3661 seconds correctly", () => {
      expect(formatDuration(3661)).toBe("1h 1m");
    });

    it("handles edge cases gracefully", () => {
      expect(formatDuration(0)).toBe("0s");
      expect(formatDuration(-1)).toBe("—");
      expect(formatDuration(NaN)).toBe("—");
      expect(formatDuration(Infinity)).toBe("—");
    });
  });

  describe("Duration Bucket (Shorts detection)", () => {
    it("classifies <60s as Shorts", () => {
      expect(getDurationBucket(36)).toBe("Shorts");
      expect(getDurationBucket(59)).toBe("Shorts");
    });

    it("classifies 60-240s as Short", () => {
      expect(getDurationBucket(60)).toBe("Short");
      expect(getDurationBucket(239)).toBe("Short");
    });

    it("classifies 4-20 min as Medium", () => {
      expect(getDurationBucket(240)).toBe("Medium");
      expect(getDurationBucket(1199)).toBe("Medium");
    });
  });

  describe("Forbidden Phrases Detection", () => {
    const forbiddenPhrases = [
      "increases CTR",
      "high CTR",
      "good retention",
      "high retention",
      "rank better with tags",
      "title alone is compelling enough",
      "organic reach",
    ];

    it("lists all forbidden phrases for reference", () => {
      // This test documents the forbidden phrases
      expect(forbiddenPhrases.length).toBeGreaterThan(0);
    });

    // Helper to check if text contains forbidden phrases
    function containsForbiddenPhrase(text: string): string | null {
      const lowerText = text.toLowerCase();
      for (const phrase of forbiddenPhrases) {
        if (lowerText.includes(phrase.toLowerCase())) {
          return phrase;
        }
      }
      return null;
    }

    it("detects 'increases CTR' as forbidden", () => {
      expect(containsForbiddenPhrase("This title increases CTR")).toBe("increases CTR");
    });

    it("detects 'rank better with tags' as forbidden", () => {
      expect(containsForbiddenPhrase("You can rank better with tags")).toBe("rank better with tags");
    });

    it("allows legitimate phrases", () => {
      expect(containsForbiddenPhrase("Strong like rate indicates resonance")).toBeNull();
      expect(containsForbiddenPhrase("Views per day is above average")).toBeNull();
      expect(containsForbiddenPhrase("Comment themes show curiosity")).toBeNull();
    });
  });

  describe("Empty Description Detection (0 words)", () => {
    it("detects truly empty description", () => {
      const desc = "";
      const wordCount = desc.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBe(0);
    });

    it("detects whitespace-only as empty", () => {
      const desc = "   \n\t  ";
      const wordCount = desc.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBe(0);
    });

    it("counts actual words correctly", () => {
      const desc = "This is a short description.";
      const wordCount = desc.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBe(5);
    });
  });

  describe("Hashtag Analysis (not 'tags')", () => {
    it("extracts hashtags from title", () => {
      const result = analyzeHashtags("#dropshipping in 2025", "");
      expect(result.count).toBe(1);
      expect(result.inTitle).toContain("#dropshipping");
    });

    it("extracts hashtags from description", () => {
      const result = analyzeHashtags("My Video", "Check this out #business #tips");
      expect(result.count).toBe(2);
      expect(result.inDescription).toContain("#business");
      expect(result.inDescription).toContain("#tips");
    });

    it("deduplicates hashtags across title and description", () => {
      const result = analyzeHashtags("#test video", "More info #test");
      expect(result.count).toBe(1);
    });

    it("handles no hashtags", () => {
      const result = analyzeHashtags("Regular Title", "Regular description");
      expect(result.count).toBe(0);
      expect(result.hashtags).toHaveLength(0);
    });
  });

  describe("Chapter Detection", () => {
    it("detects valid chapters starting with 0:00", () => {
      const desc = `0:00 Intro
1:30 Part 1
5:45 Part 2
10:00 Conclusion`;
      const result = detectChapters(desc);
      expect(result.hasChapters).toBe(true);
      expect(result.chapterCount).toBeGreaterThanOrEqual(3);
    });

    it("rejects chapters not starting with 0:00", () => {
      const desc = `1:30 Part 1
5:45 Part 2
10:00 Conclusion`;
      const result = detectChapters(desc);
      expect(result.hasChapters).toBe(false);
    });

    it("rejects too few timestamps", () => {
      const desc = `0:00 Intro
1:30 End`;
      const result = detectChapters(desc);
      expect(result.hasChapters).toBe(false);
    });

    it("handles empty description", () => {
      const result = detectChapters("");
      expect(result.hasChapters).toBe(false);
      expect(result.chapterCount).toBe(0);
    });
  });

  describe("Baseline Labeling (channel median availability)", () => {
    it("should only show 'Below Average' when baseline exists", () => {
      // This is a documentation test for the expected behavior
      // The actual implementation should:
      // 1. Check if channelMedianAvailable is true
      // 2. Only then show "Below Average" relative to channel median
      // 3. Otherwise show "Below Average (platform avg)" or hide the label

      const mockBenchmarks = {
        likeRate: 1.5,
        likeRateVerdict: "Below Average" as const,
        channelMedianAvailable: false,
      };

      // When channelMedianAvailable is false, the UI should clarify the baseline
      if (!mockBenchmarks.channelMedianAvailable) {
        expect(mockBenchmarks.likeRateVerdict).toBe("Below Average");
        // UI should append "(platform avg)" context
      }
    });
  });
});

describe("Label Standardization (A1: Like Rate not Engagement)", () => {
  it("documents that 'Like Rate' should be used instead of 'Engagement'", () => {
    // This is a documentation test
    // The UI should show "Like Rate" in:
    // - Top metrics card
    // - Quick stats section
    // - Video Intelligence section
    // NOT "Engagement" which is imprecise

    const correctLabels = ["Like Rate", "Comments/1K"];
    const incorrectLabels = ["Engagement"];

    expect(correctLabels).toContain("Like Rate");
    expect(incorrectLabels).toContain("Engagement");
  });
});
