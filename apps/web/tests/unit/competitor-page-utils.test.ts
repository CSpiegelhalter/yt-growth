/**
 * Tests for Competitor Search Page Utilities
 *
 * - URL validation
 * - Filter state serialization/deserialization
 * - Niche text validation
 */

import { describe, it, expect } from "vitest";
import {
  validateYouTubeUrl,
  validateNicheText,
  serializeFilters,
  deserializeFilters,
} from "@/app/(app)/competitors/utils";
import type { FilterState } from "@/app/(app)/competitors/CompetitorFilters";

// ============================================
// URL VALIDATION TESTS
// ============================================

describe("validateYouTubeUrl", () => {
  describe("valid URLs", () => {
    it("accepts standard youtube.com/watch URLs", () => {
      const result = validateYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
      expect(result.error).toBeNull();
    });

    it("accepts youtube.com without www", () => {
      const result = validateYouTubeUrl("https://youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
    });

    it("accepts mobile youtube URLs (m.youtube.com)", () => {
      const result = validateYouTubeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
    });

    it("accepts youtu.be short URLs", () => {
      const result = validateYouTubeUrl("https://youtu.be/dQw4w9WgXcQ");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
    });

    it("accepts youtube.com/shorts/ URLs", () => {
      const result = validateYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
    });

    it("accepts youtube.com/embed/ URLs", () => {
      const result = validateYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
    });

    it("accepts URLs with extra query params", () => {
      const result = validateYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
    });

    it("handles video IDs with hyphens and underscores", () => {
      const result = validateYouTubeUrl("https://youtu.be/abc-123_XYZ");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("abc-123_XYZ");
    });
  });

  describe("empty/null inputs", () => {
    it("treats empty string as valid (optional field)", () => {
      const result = validateYouTubeUrl("");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBeNull();
      expect(result.error).toBeNull();
    });

    it("treats whitespace-only string as valid", () => {
      const result = validateYouTubeUrl("   ");
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBeNull();
    });
  });

  describe("invalid URLs", () => {
    it("rejects non-YouTube domains", () => {
      const result = validateYouTubeUrl("https://vimeo.com/123456789");
      expect(result.isValid).toBe(false);
      expect(result.videoId).toBeNull();
      expect(result.error).toContain("valid YouTube URL");
    });

    it("rejects YouTube channel URLs", () => {
      const result = validateYouTubeUrl("https://www.youtube.com/channel/UCxxxxxx");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Unrecognized");
    });

    it("rejects YouTube playlist URLs", () => {
      const result = validateYouTubeUrl("https://www.youtube.com/playlist?list=PLxxxxx");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Unrecognized");
    });

    it("rejects malformed URLs", () => {
      const result = validateYouTubeUrl("not-a-url");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid URL");
    });

    it("rejects youtube.com with no video ID", () => {
      const result = validateYouTubeUrl("https://www.youtube.com/watch");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("video ID");
    });

    it("rejects youtu.be with invalid video ID length", () => {
      const result = validateYouTubeUrl("https://youtu.be/short");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("video ID");
    });

    it("rejects video IDs with invalid characters", () => {
      const result = validateYouTubeUrl("https://youtu.be/abc!@#$%^&*()");
      expect(result.isValid).toBe(false);
    });
  });
});

// ============================================
// NICHE TEXT VALIDATION TESTS
// ============================================

describe("validateNicheText", () => {
  it("accepts empty string (optional when URL is provided)", () => {
    const result = validateNicheText("");
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("accepts valid niche descriptions", () => {
    const result = validateNicheText("DIY home espresso tutorials");
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("rejects text shorter than 3 characters", () => {
    const result = validateNicheText("ab");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("at least 3 characters");
  });

  it("accepts exactly 3 characters", () => {
    const result = validateNicheText("abc");
    expect(result.isValid).toBe(true);
  });

  it("trims whitespace when checking length", () => {
    const result = validateNicheText("  ab  ");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("at least 3 characters");
  });
});

// ============================================
// FILTER SERIALIZATION TESTS
// ============================================

describe("serializeFilters", () => {
  const defaultFilters: FilterState = {
    contentType: "both",
    dateRange: "90d",
    minViewsPerDay: 10,
    sortBy: "viewsPerDay",
  };

  it("returns empty params for default filters", () => {
    const params = serializeFilters(defaultFilters);
    expect(params.toString()).toBe("");
  });

  it("serializes contentType when not default", () => {
    const params = serializeFilters({ ...defaultFilters, contentType: "shorts" });
    expect(params.get("type")).toBe("shorts");
  });

  it("serializes dateRange when not default", () => {
    const params = serializeFilters({ ...defaultFilters, dateRange: "7d" });
    expect(params.get("range")).toBe("7d");
  });

  it("serializes minViewsPerDay when not default", () => {
    const params = serializeFilters({ ...defaultFilters, minViewsPerDay: 100 });
    expect(params.get("minVpd")).toBe("100");
  });

  it("serializes sortBy when not default", () => {
    const params = serializeFilters({ ...defaultFilters, sortBy: "newest" });
    expect(params.get("sort")).toBe("newest");
  });

  it("serializes multiple non-default values", () => {
    const params = serializeFilters({
      contentType: "long",
      dateRange: "30d",
      minViewsPerDay: 500,
      sortBy: "engagement",
    });
    expect(params.get("type")).toBe("long");
    expect(params.get("range")).toBe("30d");
    expect(params.get("minVpd")).toBe("500");
    expect(params.get("sort")).toBe("engagement");
  });
});

describe("deserializeFilters", () => {
  it("returns empty object for empty params", () => {
    const params = new URLSearchParams("");
    const filters = deserializeFilters(params);
    expect(Object.keys(filters).length).toBe(0);
  });

  it("deserializes contentType", () => {
    const params = new URLSearchParams("type=shorts");
    const filters = deserializeFilters(params);
    expect(filters.contentType).toBe("shorts");
  });

  it("deserializes dateRange", () => {
    const params = new URLSearchParams("range=7d");
    const filters = deserializeFilters(params);
    expect(filters.dateRange).toBe("7d");
  });

  it("deserializes minViewsPerDay", () => {
    const params = new URLSearchParams("minVpd=100");
    const filters = deserializeFilters(params);
    expect(filters.minViewsPerDay).toBe(100);
  });

  it("deserializes sortBy", () => {
    const params = new URLSearchParams("sort=newest");
    const filters = deserializeFilters(params);
    expect(filters.sortBy).toBe("newest");
  });

  it("ignores invalid values", () => {
    const params = new URLSearchParams("type=invalid&range=invalid&minVpd=notanumber&sort=invalid");
    const filters = deserializeFilters(params);
    expect(filters.contentType).toBeUndefined();
    expect(filters.dateRange).toBeUndefined();
    expect(filters.minViewsPerDay).toBeUndefined();
    expect(filters.sortBy).toBeUndefined();
  });

  it("roundtrips correctly", () => {
    const original: FilterState = {
      contentType: "long",
      dateRange: "30d",
      minViewsPerDay: 500,
      sortBy: "engagement",
    };
    const serialized = serializeFilters(original);
    const deserialized = deserializeFilters(serialized);
    
    expect(deserialized.contentType).toBe(original.contentType);
    expect(deserialized.dateRange).toBe(original.dateRange);
    expect(deserialized.minViewsPerDay).toBe(original.minViewsPerDay);
    expect(deserialized.sortBy).toBe(original.sortBy);
  });
});
