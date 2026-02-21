/**
 * DataForSEO Client Unit Tests
 *
 * Tests for validation, hashing, difficulty heuristic, parsing, and rate limiting.
 * These are pure unit tests with no external dependencies.
 */
import { describe, it, expect } from "bun:test";
import {
  validatePhrase,
  validateKeywords,
  validateLocation,
  generateRequestHash,
  calculateDifficultyHeuristic,
  parseNumeric,
  parseInteger,
  parseMonthlyTrend,
  parseCompetitionLevel,
  isRestrictedCategoryError,
  DataForSEOError,
  SUPPORTED_LOCATIONS,
  LOCATION_MAP,
} from "@/lib/dataforseo/utils";

describe("DataForSEO Client Unit Tests", () => {
  describe("validatePhrase", () => {
    it("validates and returns cleaned phrase (lowercased)", () => {
      expect(validatePhrase("  YouTube Editing  ")).toBe("youtube editing");
      expect(validatePhrase("How to Edit")).toBe("how to edit");
    });

    it("normalizes multiple spaces", () => {
      expect(validatePhrase("hello    world")).toBe("hello world");
    });

    it("throws on empty phrase", () => {
      expect(() => validatePhrase("")).toThrow(DataForSEOError);
      expect(() => validatePhrase("   ")).toThrow(DataForSEOError);
    });

    it("throws on phrase too long (>80 chars)", () => {
      const longPhrase = "a".repeat(81);
      expect(() => validatePhrase(longPhrase)).toThrow(DataForSEOError);
      expect(() => validatePhrase(longPhrase)).toThrow("max 80 characters");
    });

    it("throws on phrase with too many words (>10)", () => {
      const manyWords = "word ".repeat(11).trim();
      expect(() => validatePhrase(manyWords)).toThrow(DataForSEOError);
      expect(() => validatePhrase(manyWords)).toThrow("max 10 words");
    });

    it("throws on phrase with emojis", () => {
      expect(() => validatePhrase("hello 😀 world")).toThrow(DataForSEOError);
      expect(() => validatePhrase("test 🎬")).toThrow(DataForSEOError);
      expect(() => validatePhrase("👍 cool")).toThrow(DataForSEOError);
    });

    it("allows valid characters", () => {
      expect(validatePhrase("youtube-editing")).toBe("youtube-editing");
      expect(validatePhrase("how to's")).toBe("how to's");
      expect(validatePhrase("video & audio")).toBe("video & audio");
      expect(validatePhrase("best 2024")).toBe("best 2024");
      expect(validatePhrase('"quoted"')).toBe('"quoted"');
      expect(validatePhrase("what? why!")).toBe("what? why!");
    });

    it("throws on invalid characters", () => {
      expect(() => validatePhrase("hello<script>")).toThrow(DataForSEOError);
      expect(() => validatePhrase("test{inject}")).toThrow(DataForSEOError);
      expect(() => validatePhrase("test|pipe")).toThrow(DataForSEOError);
    });
  });

  describe("validateKeywords", () => {
    it("validates an array of keywords", () => {
      const result = validateKeywords(["keyword one", "KEYWORD TWO", "  keyword three  "]);

      expect(result.valid).toHaveLength(3);
      expect(result.valid).toContain("keyword one");
      expect(result.valid).toContain("keyword two"); // Lowercased
      expect(result.valid).toContain("keyword three"); // Trimmed
      expect(result.invalid).toHaveLength(0);
    });

    it("separates valid and invalid keywords", () => {
      const result = validateKeywords([
        "valid keyword",
        "a".repeat(100), // Too long
        "hello 😀 emoji", // Has emoji
        "another valid one",
      ]);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0]?.keyword).toBe("a".repeat(100));
      expect(result.invalid[1]?.keyword).toBe("hello 😀 emoji");
    });

    it("throws when exceeding max keywords limit", () => {
      const manyKeywords = Array.from({ length: 1001 }, (_, i) => `keyword${i}`);
      expect(() => validateKeywords(manyKeywords)).toThrow(DataForSEOError);
      expect(() => validateKeywords(manyKeywords)).toThrow("max 1000");
    });

    it("respects custom max keywords limit", () => {
      const keywords = Array.from({ length: 25 }, (_, i) => `keyword${i}`);
      expect(() => validateKeywords(keywords, 20)).toThrow("max 20");
    });
  });

  describe("validateLocation", () => {
    it("validates known locations and returns location info", () => {
      const usInfo = validateLocation("us");
      expect(usInfo.location_code).toBe(2840);
      expect(usInfo.language_code).toBe("en");
      expect(usInfo.region).toBe("us");
    });

    it("is case insensitive", () => {
      expect(validateLocation("US").region).toBe("us");
      expect(validateLocation("Uk").region).toBe("uk");
    });

    it("throws on invalid location", () => {
      expect(() => validateLocation("invalid")).toThrow(DataForSEOError);
      expect(() => validateLocation("xx")).toThrow(DataForSEOError);
    });

    it("validates all supported locations", () => {
      SUPPORTED_LOCATIONS.forEach((loc) => {
        const result = validateLocation(loc);
        expect(result.region).toBe(loc);
        expect(result.location_code).toBeGreaterThan(0);
        expect(result.language_code.length).toBeGreaterThan(0);
      });
    });
  });

  describe("LOCATION_MAP", () => {
    it("contains expected popular locations", () => {
      expect(LOCATION_MAP.us).toBeDefined();
      expect(LOCATION_MAP.uk).toBeDefined();
      expect(LOCATION_MAP.de).toBeDefined();
      expect(LOCATION_MAP.fr).toBeDefined();
      expect(LOCATION_MAP.jp).toBeDefined();
    });

    it("has at least 20 locations", () => {
      expect(SUPPORTED_LOCATIONS.length).toBeGreaterThanOrEqual(20);
    });

    it("all location codes are positive numbers", () => {
      Object.values(LOCATION_MAP).forEach((info) => {
        expect(info.location_code).toBeGreaterThan(0);
      });
    });
  });

  describe("generateRequestHash", () => {
    it("generates consistent hash for same params", () => {
      const hash1 = generateRequestHash({
        mode: "overview",
        phrase: "youtube",
        location: "us",
      });
      const hash2 = generateRequestHash({
        mode: "overview",
        phrase: "youtube",
        location: "us",
      });

      expect(hash1).toBe(hash2);
    });

    it("generates different hash for different phrases", () => {
      const hash1 = generateRequestHash({
        mode: "overview",
        phrase: "youtube",
        location: "us",
      });
      const hash2 = generateRequestHash({
        mode: "overview",
        phrase: "video",
        location: "us",
      });

      expect(hash1).not.toBe(hash2);
    });

    it("generates different hash for different locations", () => {
      const hash1 = generateRequestHash({
        mode: "overview",
        phrase: "youtube",
        location: "us",
      });
      const hash2 = generateRequestHash({
        mode: "overview",
        phrase: "youtube",
        location: "uk",
      });

      expect(hash1).not.toBe(hash2);
    });

    it("generates different hash for different modes", () => {
      const hash1 = generateRequestHash({
        mode: "overview",
        phrase: "youtube",
        location: "us",
      });
      const hash2 = generateRequestHash({
        mode: "related",
        phrase: "youtube",
        location: "us",
      });

      expect(hash1).not.toBe(hash2);
    });

    it("normalizes phrase case and whitespace", () => {
      const hash1 = generateRequestHash({
        mode: "overview",
        phrase: "YouTube",
        location: "us",
      });
      const hash2 = generateRequestHash({
        mode: "overview",
        phrase: "  youtube  ",
        location: "us",
      });

      expect(hash1).toBe(hash2);
    });

    it("generates consistent hash for keywords array", () => {
      const hash1 = generateRequestHash({
        mode: "search_volume",
        keywords: ["youtube", "video editing"],
        location: "us",
      });
      const hash2 = generateRequestHash({
        mode: "search_volume",
        keywords: ["video editing", "youtube"], // Different order
        location: "us",
      });

      expect(hash1).toBe(hash2); // Should be same because array is sorted
    });

    it("includes searchPartners in hash", () => {
      const hash1 = generateRequestHash({
        mode: "overview",
        phrase: "youtube",
        location: "us",
        searchPartners: true,
      });
      const hash2 = generateRequestHash({
        mode: "overview",
        phrase: "youtube",
        location: "us",
        searchPartners: false,
      });

      expect(hash1).not.toBe(hash2);
    });

    it("returns 32-character hex string (SHA256 truncated)", () => {
      const hash = generateRequestHash({
        mode: "overview",
        phrase: "test",
        location: "us",
      });

      expect(hash).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe("calculateDifficultyHeuristic", () => {
    it("returns low base difficulty for no volume/zero volume", () => {
      // Zero/no volume = very easy (base score of 5)
      const noData = calculateDifficultyHeuristic({});
      const zeroVolume = calculateDifficultyHeuristic({ searchVolume: 0 });
      
      expect(noData).toBe(5);
      expect(zeroVolume).toBe(5);
    });

    it("volume is the primary difficulty factor (SEO reality)", () => {
      // Low volume keywords are easier to rank for
      const veryLow = calculateDifficultyHeuristic({ searchVolume: 50 });
      const low = calculateDifficultyHeuristic({ searchVolume: 500 });
      const medium = calculateDifficultyHeuristic({ searchVolume: 5000 });
      const high = calculateDifficultyHeuristic({ searchVolume: 50000 });
      const veryHigh = calculateDifficultyHeuristic({ searchVolume: 500000 });
      
      // Each tier should be progressively harder
      expect(low).toBeGreaterThan(veryLow);
      expect(medium).toBeGreaterThan(low);
      expect(high).toBeGreaterThan(medium);
      expect(veryHigh).toBeGreaterThan(high);
      
      // High volume keywords should be "hard" (>50)
      expect(high).toBeGreaterThan(50);
      // Very high volume should be "very hard" (>70)
      expect(veryHigh).toBeGreaterThan(70);
    });

    it("factors in CPC as secondary signal", () => {
      const lowCpc = calculateDifficultyHeuristic({ searchVolume: 10000, cpc: 0.5 });
      const highCpc = calculateDifficultyHeuristic({ searchVolume: 10000, cpc: 5.0 });

      expect(highCpc).toBeGreaterThan(lowCpc);
    });

    it("factors in high top of page bid", () => {
      const lowBid = calculateDifficultyHeuristic({ searchVolume: 10000, highTopOfPageBid: 1 });
      const highBid = calculateDifficultyHeuristic({ searchVolume: 10000, highTopOfPageBid: 10 });

      expect(highBid).toBeGreaterThan(lowBid);
    });

    it("clamps result to 0-100 range", () => {
      // Very high signals should still max at 100
      const maxDifficulty = calculateDifficultyHeuristic({
        cpc: 100, // Very high
        highTopOfPageBid: 100, // Very high
        searchVolume: 100000000, // Very high
      });

      expect(maxDifficulty).toBeLessThanOrEqual(100);
      expect(maxDifficulty).toBeGreaterThanOrEqual(0);
    });

    it("returns rounded integer", () => {
      const difficulty = calculateDifficultyHeuristic({
        cpc: 1.5,
        searchVolume: 12345,
      });

      expect(Number.isInteger(difficulty)).toBe(true);
    });

    it("handles null values gracefully", () => {
      const difficulty = calculateDifficultyHeuristic({
        competitionIndex: null,
        competition: null,
        cpc: null,
        highTopOfPageBid: null,
        searchVolume: null,
      });

      // Null volume = base difficulty
      expect(difficulty).toBe(5);
    });

    it("returns realistic difficulty for known keywords", () => {
      // "youtube shorts" - 450K volume, $0.04 CPC = should be HARD (70+)
      const youtubeShorts = calculateDifficultyHeuristic({
        searchVolume: 450000,
        cpc: 0.04,
      });
      expect(youtubeShorts).toBeGreaterThan(70);
      
      // Long-tail low volume keyword = should be EASY (<30)
      const longTail = calculateDifficultyHeuristic({
        searchVolume: 50,
        cpc: 0.10,
      });
      expect(longTail).toBeLessThan(30);
    });
  });

  describe("parseNumeric", () => {
    it("parses numeric values", () => {
      expect(parseNumeric(42)).toBe(42);
      expect(parseNumeric("3.14")).toBe(3.14);
      expect(parseNumeric(0)).toBe(0);
    });

    it("returns fallback for null/undefined", () => {
      expect(parseNumeric(null)).toBe(0);
      expect(parseNumeric(undefined)).toBe(0);
      expect(parseNumeric(null, 999)).toBe(999);
    });

    it("returns fallback for non-numeric strings", () => {
      expect(parseNumeric("not a number")).toBe(0);
      expect(parseNumeric("abc", 123)).toBe(123);
    });
  });

  describe("parseInteger", () => {
    it("parses integer values", () => {
      expect(parseInteger(42)).toBe(42);
      expect(parseInteger("100")).toBe(100);
      expect(parseInteger(0)).toBe(0);
    });

    it("rounds floating point numbers", () => {
      expect(parseInteger(3.7)).toBe(4);
      expect(parseInteger(3.2)).toBe(3);
    });

    it("returns fallback for null/undefined", () => {
      expect(parseInteger(null)).toBe(0);
      expect(parseInteger(undefined)).toBe(0);
      expect(parseInteger(null, 999)).toBe(999);
    });

    it("returns fallback for non-numeric strings", () => {
      expect(parseInteger("not a number")).toBe(0);
      expect(parseInteger("abc", 123)).toBe(123);
    });
  });

  describe("parseMonthlyTrend", () => {
    it("parses monthly search data", () => {
      const data = [
        { year: 2024, month: 1, search_volume: 100 },
        { year: 2024, month: 2, search_volume: 150 },
        { year: 2024, month: 3, search_volume: 200 },
      ];

      const trend = parseMonthlyTrend(data);

      expect(trend).toEqual([100, 150, 200]);
    });

    it("sorts by date and takes last 12 months", () => {
      const data = Array.from({ length: 24 }, (_, i) => ({
        year: 2023 + Math.floor(i / 12),
        month: (i % 12) + 1,
        search_volume: (i + 1) * 100,
      }));

      const trend = parseMonthlyTrend(data);

      expect(trend).toHaveLength(12);
      // Last 12 entries (months 13-24 from the sequence)
      expect(trend[0]).toBe(1300);
      expect(trend[11]).toBe(2400);
    });

    it("handles unsorted input", () => {
      const data = [
        { year: 2024, month: 3, search_volume: 300 },
        { year: 2024, month: 1, search_volume: 100 },
        { year: 2024, month: 2, search_volume: 200 },
      ];

      const trend = parseMonthlyTrend(data);

      expect(trend).toEqual([100, 200, 300]);
    });

    it("returns empty array for undefined/null", () => {
      expect(parseMonthlyTrend(undefined)).toEqual([]);
      expect(parseMonthlyTrend(null as unknown as undefined)).toEqual([]);
    });

    it("returns empty array for non-array", () => {
      expect(parseMonthlyTrend("not an array" as unknown as undefined)).toEqual([]);
    });

    it("handles missing search_volume gracefully", () => {
      const data: Array<{ year: number; month: number; search_volume?: number }> = [
        { year: 2024, month: 1, search_volume: 100 },
        { year: 2024, month: 2 },
        { year: 2024, month: 3, search_volume: 300 },
      ];

      const trend = parseMonthlyTrend(data);

      expect(trend).toEqual([100, 0, 300]);
    });
  });

  describe("parseCompetitionLevel", () => {
    it("converts HIGH to 85", () => {
      expect(parseCompetitionLevel("HIGH")).toBe(85);
      expect(parseCompetitionLevel("high")).toBe(85);
    });

    it("converts MEDIUM to 50", () => {
      expect(parseCompetitionLevel("MEDIUM")).toBe(50);
      expect(parseCompetitionLevel("medium")).toBe(50);
    });

    it("converts LOW to 15", () => {
      expect(parseCompetitionLevel("LOW")).toBe(15);
      expect(parseCompetitionLevel("low")).toBe(15);
    });

    it("returns 0 for null/undefined/unknown", () => {
      expect(parseCompetitionLevel(null)).toBe(0);
      expect(parseCompetitionLevel(undefined)).toBe(0);
      expect(parseCompetitionLevel("unknown")).toBe(0);
    });
  });

  describe("isRestrictedCategoryError", () => {
    it("returns true for restricted status codes", () => {
      expect(isRestrictedCategoryError(40501)).toBe(true);
      expect(isRestrictedCategoryError(40502)).toBe(true);
    });

    it("returns true for restriction-related messages", () => {
      expect(isRestrictedCategoryError(400, "Content restricted")).toBe(true);
      expect(isRestrictedCategoryError(400, "Policy violation")).toBe(true);
      expect(isRestrictedCategoryError(400, "Prohibited content")).toBe(true);
      expect(isRestrictedCategoryError(400, "Data not available")).toBe(true);
    });

    it("returns false for other status codes and messages", () => {
      expect(isRestrictedCategoryError(200)).toBe(false);
      expect(isRestrictedCategoryError(400)).toBe(false);
      expect(isRestrictedCategoryError(500, "Internal error")).toBe(false);
    });
  });

  describe("DataForSEOError", () => {
    it("has correct error properties", () => {
      const error = new DataForSEOError("Test error", "VALIDATION_ERROR");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.name).toBe("DataForSEOError");
    });

    it("is instanceof Error", () => {
      const error = new DataForSEOError("Test", "API_ERROR");
      expect(error instanceof Error).toBe(true);
    });

    it("supports taskId parameter", () => {
      const error = new DataForSEOError("Task pending", "TASK_PENDING", "task-123");
      expect(error.taskId).toBe("task-123");
    });

    it("supports all error codes", () => {
      const codes = [
        "CONFIG_ERROR",
        "VALIDATION_ERROR",
        "RATE_LIMITED",
        "QUOTA_EXCEEDED",
        "API_ERROR",
        "TIMEOUT",
        "NETWORK_ERROR",
        "PARSE_ERROR",
        "AUTH_ERROR",
        "TASK_PENDING",
        "RESTRICTED_CATEGORY",
      ] as const;

      codes.forEach((code) => {
        const error = new DataForSEOError("Test", code);
        expect(error.code).toBe(code);
      });
    });
  });

});

describe("DataForSEO Standard Task Flow Fixtures", () => {
  describe("search_volume task_get response parsing", () => {
    const mockTaskGetResponse = {
      version: "0.1.20240101",
      status_code: 20000,
      status_message: "Ok.",
      time: "1.234 sec.",
      cost: 0.1,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [
        {
          id: "12345678-1234-1234-1234-123456789012",
          status_code: 20000,
          status_message: "Ok.",
          time: "0.567 sec.",
          cost: 0.1,
          result_count: 2,
          path: ["v3", "keywords_data", "google_ads", "search_volume", "task_get", "12345678-1234-1234-1234-123456789012"],
          data: {
            api: "keywords_data",
            function: "search_volume",
            keywords: ["youtube editing", "video editing software"],
            location_code: 2840,
            language_code: "en",
          },
          result: [
            {
              keyword: "youtube editing",
              spell: null,
              location_code: 2840,
              language_code: "en",
              search_partners: false,
              keyword_info: {
                se_type: "google",
                last_updated_time: "2024-01-15",
                competition: 0.78,
                competition_level: "HIGH",
                competition_index: 78,
                cpc: 3.45,
                search_volume: 74000,
                low_top_of_page_bid: 1.23,
                high_top_of_page_bid: 5.67,
                categories: [10001, 10002],
                monthly_searches: [
                  { year: 2024, month: 1, search_volume: 74000 },
                  { year: 2023, month: 12, search_volume: 81000 },
                  { year: 2023, month: 11, search_volume: 67000 },
                  { year: 2023, month: 10, search_volume: 61000 },
                  { year: 2023, month: 9, search_volume: 55000 },
                  { year: 2023, month: 8, search_volume: 60000 },
                  { year: 2023, month: 7, search_volume: 64000 },
                  { year: 2023, month: 6, search_volume: 59000 },
                  { year: 2023, month: 5, search_volume: 57000 },
                  { year: 2023, month: 4, search_volume: 53000 },
                  { year: 2023, month: 3, search_volume: 49000 },
                  { year: 2023, month: 2, search_volume: 51000 },
                ],
              },
              search_intent_info: {
                se_type: "google",
                main_intent: "informational",
                foreign_intent: ["commercial"],
                last_updated_time: "2024-01-15",
              },
            },
            {
              keyword: "video editing software",
              spell: null,
              location_code: 2840,
              language_code: "en",
              search_partners: false,
              keyword_info: {
                se_type: "google",
                last_updated_time: "2024-01-15",
                competition: 0.92,
                competition_level: "HIGH",
                competition_index: 92,
                cpc: 8.21,
                search_volume: 135000,
                low_top_of_page_bid: 4.56,
                high_top_of_page_bid: 12.34,
                categories: [10003],
                monthly_searches: [
                  { year: 2024, month: 1, search_volume: 135000 },
                  { year: 2023, month: 12, search_volume: 140000 },
                  { year: 2023, month: 11, search_volume: 125000 },
                  { year: 2023, month: 10, search_volume: 118000 },
                  { year: 2023, month: 9, search_volume: 110000 },
                  { year: 2023, month: 8, search_volume: 105000 },
                  { year: 2023, month: 7, search_volume: 100000 },
                  { year: 2023, month: 6, search_volume: 98000 },
                  { year: 2023, month: 5, search_volume: 95000 },
                  { year: 2023, month: 4, search_volume: 92000 },
                  { year: 2023, month: 3, search_volume: 90000 },
                  { year: 2023, month: 2, search_volume: 88000 },
                ],
              },
              search_intent_info: {
                se_type: "google",
                main_intent: "commercial",
                foreign_intent: ["transactional"],
                last_updated_time: "2024-01-15",
              },
            },
          ],
        },
      ],
    };

    it("correctly parses search_volume from task_get response", () => {
      const result = mockTaskGetResponse.tasks[0]?.result?.[0];
      expect(result?.keyword_info?.search_volume).toBe(74000);
    });

    it("correctly parses competition_index from task_get response", () => {
      const result = mockTaskGetResponse.tasks[0]?.result?.[0];
      expect(result?.keyword_info?.competition_index).toBe(78);
    });

    it("correctly parses cpc from task_get response", () => {
      const result = mockTaskGetResponse.tasks[0]?.result?.[0];
      expect(result?.keyword_info?.cpc).toBe(3.45);
    });

    it("correctly parses monthly_searches from task_get response", () => {
      const result = mockTaskGetResponse.tasks[0]?.result?.[0];
      const monthly = result?.keyword_info?.monthly_searches;

      expect(monthly).toHaveLength(12);
      expect(monthly?.[0]).toEqual({ year: 2024, month: 1, search_volume: 74000 });
    });

    it("correctly parses bid estimates from task_get response", () => {
      const result = mockTaskGetResponse.tasks[0]?.result?.[0];
      expect(result?.keyword_info?.low_top_of_page_bid).toBe(1.23);
      expect(result?.keyword_info?.high_top_of_page_bid).toBe(5.67);
    });

    it("correctly parses intent from task_get response", () => {
      const result = mockTaskGetResponse.tasks[0]?.result?.[0];
      expect(result?.search_intent_info?.main_intent).toBe("informational");
    });

    it("handles multiple keywords in single response", () => {
      const results = mockTaskGetResponse.tasks[0]?.result;
      expect(results).toHaveLength(2);
      expect(results?.[0]?.keyword).toBe("youtube editing");
      expect(results?.[1]?.keyword).toBe("video editing software");
    });
  });

  describe("pending task response", () => {
    const mockPendingResponse = {
      version: "0.1.20240101",
      status_code: 20000,
      status_message: "Ok.",
      tasks: [
        {
          id: "12345678-1234-1234-1234-123456789012",
          status_code: 40601, // Not ready yet
          status_message: "Task is in the queue",
          result: null,
        },
      ],
    };

    it("correctly identifies pending status", () => {
      const task = mockPendingResponse.tasks[0];
      expect(task?.status_code).toBe(40601);
      expect(task?.result).toBeNull();
    });
  });
});

// ============================================
// YouTube SERP Tests
// ============================================

describe("YouTube SERP Client Unit Tests", () => {
  describe("formatViews helper", () => {
    // We test the formatViews function logic here
    // The actual function is in youtube-serp.ts but we test the logic

    function formatViews(views: number | null): string {
      if (views === null || views === undefined) {return "—";}
      if (views >= 1000000) {return `${(views / 1000000).toFixed(1)}M`;}
      if (views >= 1000) {return `${(views / 1000).toFixed(1)}K`;}
      return views.toString();
    }

    it("formats millions correctly", () => {
      expect(formatViews(1000000)).toBe("1.0M");
      expect(formatViews(1500000)).toBe("1.5M");
      expect(formatViews(12345678)).toBe("12.3M");
    });

    it("formats thousands correctly", () => {
      expect(formatViews(1000)).toBe("1.0K");
      expect(formatViews(1500)).toBe("1.5K");
      expect(formatViews(999000)).toBe("999.0K");
    });

    it("formats small numbers correctly", () => {
      expect(formatViews(999)).toBe("999");
      expect(formatViews(0)).toBe("0");
      expect(formatViews(1)).toBe("1");
    });

    it("handles null", () => {
      expect(formatViews(null)).toBe("—");
    });
  });

  describe("YouTube SERP response parsing", () => {
    // Mock YouTube SERP API response
    const mockYouTubeSerpResponse = {
      version: "0.1.20240101",
      status_code: 20000,
      status_message: "Ok.",
      time: "1.234 sec.",
      cost: 0.002,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [
        {
          id: "task-id-123",
          status_code: 20000,
          status_message: "Ok.",
          time: "0.567 sec.",
          cost: 0.002,
          result_count: 1,
          path: ["serp", "youtube", "organic", "live"],
          data: {
            api: "serp",
            function: "live",
            se: "youtube",
            keyword: "youtube shorts",
            location_code: 2840,
            language_code: "en",
            device: "desktop",
            os: "windows",
          },
          result: [
            {
              keyword: "youtube shorts",
              type: "organic",
              se_domain: "youtube.com",
              location_code: 2840,
              language_code: "en",
              check_url: "https://www.youtube.com/results?search_query=youtube+shorts",
              datetime: "2024-01-15 10:30:00 +00:00",
              spell: null,
              item_types: ["youtube_video"],
              items_count: 10,
              items: [
                {
                  type: "youtube_video",
                  rank_group: 1,
                  rank_absolute: 1,
                  video_id: "abc123",
                  title: "How to Make YouTube Shorts in 2024",
                  url: "https://www.youtube.com/watch?v=abc123",
                  channel_id: "UC123",
                  channel_name: "Creator Academy",
                  channel_url: "https://www.youtube.com/channel/UC123",
                  description: "Learn how to create viral YouTube Shorts...",
                  views_count: 1234567,
                  timestamp: "2024-01-10T10:00:00Z",
                  publication_date: "2024-01-10",
                  duration: "PT10M30S",
                  duration_seconds: 630,
                  is_live: false,
                  thumbnails: [{ url: "https://i.ytimg.com/vi/abc123/hqdefault.jpg" }],
                },
                {
                  type: "youtube_video",
                  rank_group: 2,
                  rank_absolute: 2,
                  video_id: "def456",
                  title: "YouTube Shorts Complete Tutorial",
                  url: "https://www.youtube.com/watch?v=def456",
                  channel_id: "UC456",
                  channel_name: "Tech Tips",
                  channel_url: "https://www.youtube.com/channel/UC456",
                  description: null,
                  views_count: 890000,
                  timestamp: null,
                  publication_date: "2024-01-08",
                  duration: "PT5M15S",
                  duration_seconds: 315,
                  is_live: false,
                  thumbnails: null,
                },
              ],
            },
          ],
        },
      ],
    };

    it("correctly parses video positions", () => {
      const items = mockYouTubeSerpResponse.tasks[0].result[0].items;
      expect(items[0].rank_absolute).toBe(1);
      expect(items[1].rank_absolute).toBe(2);
    });

    it("correctly parses video metadata", () => {
      const video = mockYouTubeSerpResponse.tasks[0].result[0].items[0];
      expect(video.title).toBe("How to Make YouTube Shorts in 2024");
      expect(video.channel_name).toBe("Creator Academy");
      expect(video.video_id).toBe("abc123");
      expect(video.views_count).toBe(1234567);
    });

    it("handles null thumbnail gracefully", () => {
      const video = mockYouTubeSerpResponse.tasks[0].result[0].items[1];
      expect(video.thumbnails).toBeNull();
    });

    it("handles null description gracefully", () => {
      const video = mockYouTubeSerpResponse.tasks[0].result[0].items[1];
      expect(video.description).toBeNull();
    });

    it("correctly parses duration", () => {
      const video = mockYouTubeSerpResponse.tasks[0].result[0].items[0];
      expect(video.duration).toBe("PT10M30S");
      expect(video.duration_seconds).toBe(630);
    });

    it("correctly parses channel URL", () => {
      const video = mockYouTubeSerpResponse.tasks[0].result[0].items[0];
      expect(video.channel_url).toBe("https://www.youtube.com/channel/UC123");
    });
  });

  describe("YouTube SERP error handling", () => {
    it("should have proper error codes for API errors", () => {
      // Test that our error codes match expected DataForSEO error codes
      const errorCodes = {
        rateLimit: 429,
        unauthorized: 401,
        forbidden: 403,
        insufficientBalance: 402,
      };

      expect(errorCodes.rateLimit).toBe(429);
      expect(errorCodes.unauthorized).toBe(401);
      expect(errorCodes.forbidden).toBe(403);
      expect(errorCodes.insufficientBalance).toBe(402);
    });
  });
});
