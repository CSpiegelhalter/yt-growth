/**
 * Unit tests for Channel Profile feature
 */

import { describe, it, expect } from "vitest";
import {
  ChannelProfileInputSchema,
  ChannelProfileAISchema,
  createFallbackAIProfile,
  DEFAULT_PROFILE_INPUT,
  PROFILE_CATEGORIES,
  CONTENT_FORMATS,
} from "@/lib/features/channels";
import {
  computeProfileInputHash,
  isProfileCacheValid,
  sanitizeUserText,
  sanitizeProfileInput,
  formatInputForLLM,
} from "@/lib/features/channels/utils";

describe("Channel Profile Types", () => {
  describe("ChannelProfileInputSchema", () => {
    it("accepts valid input with required fields", () => {
      const input = {
        description: "I create tech tutorials for beginners",
        categories: ["Tech", "Education"],
      };

      const result = ChannelProfileInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects input with empty description", () => {
      const input = {
        description: "",
        categories: ["Tech"],
      };

      const result = ChannelProfileInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects input with description too short", () => {
      const input = {
        description: "short",
        categories: ["Tech"],
      };

      const result = ChannelProfileInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects input with no categories", () => {
      const input = {
        description: "I create tech tutorials for beginners",
        categories: [],
      };

      const result = ChannelProfileInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("accepts input with all optional fields", () => {
      const input = {
        description: "I create tech tutorials for beginners learning to code",
        categories: ["Tech", "Education"],
        formats: ["Long-form", "Tutorials"],
        audience: "Aspiring developers aged 18-35",
      };

      const result = ChannelProfileInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts input with customCategory when Other is selected", () => {
      const input = {
        description: "I create content about sustainable fashion",
        categories: ["Other"],
        customCategory: "Sustainable Fashion",
      };

      const result = ChannelProfileInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("limits categories to 5", () => {
      const input = {
        description: "I create diverse content across many categories",
        categories: ["Tech", "Education", "Gaming", "Finance", "Business", "DIY"],
      };

      const result = ChannelProfileInputSchema.safeParse(input);
      // Should fail because max is 5 categories
      expect(result.success).toBe(false);
    });
  });

  describe("ChannelProfileAISchema", () => {
    it("validates a complete AI profile", () => {
      const aiProfile = {
        nicheLabel: "Tech Education for Beginners",
        nicheDescription: "Educational technology content for newcomers",
        primaryCategories: ["Tech", "Education"],
        contentPillars: [
          { name: "Tutorials", description: "Step-by-step guides" },
          { name: "Reviews", description: "Software reviews" },
        ],
        targetAudience: "Aspiring developers",
        channelValueProposition: "Learn tech from scratch",
        keywords: ["coding", "programming", "tutorials"],
        competitorSearchHints: ["coding tutorials", "learn programming"],
        videoIdeaAngles: ["Beginner guides", "Tool comparisons"],
        toneAndStyle: ["Calm", "Analytical"],
      };

      const result = ChannelProfileAISchema.safeParse(aiProfile);
      expect(result.success).toBe(true);
    });
  });

  describe("createFallbackAIProfile", () => {
    it("creates a valid fallback profile from input", () => {
      const input = {
        description: "I make cooking videos for busy families",
        categories: ["Cooking", "Parenting"],
        audience: "Busy parents",
        tone: ["Calm", "Inspirational"],
      };

      const fallback = createFallbackAIProfile(input);

      expect(fallback.nicheLabel).toContain("Cooking");
      expect(fallback.primaryCategories).toContain("Cooking");
      expect(fallback.targetAudience).toContain("Busy parents");

      // Validate with schema
      const result = ChannelProfileAISchema.safeParse(fallback);
      expect(result.success).toBe(true);
    });

    it("handles minimal input gracefully", () => {
      const input = {
        description: "A channel about things",
        categories: [],
      };

      const fallback = createFallbackAIProfile(input);

      expect(fallback.nicheLabel).toBe("Content Creator");
      expect(fallback.primaryCategories).toEqual([]);

      // Should still be valid
      const result = ChannelProfileAISchema.safeParse(fallback);
      expect(result.success).toBe(true);
    });
  });
});

describe("Channel Profile Utils", () => {
  describe("computeProfileInputHash", () => {
    it("produces consistent hash for same input", () => {
      const input = {
        description: "Tech tutorials for beginners",
        categories: ["Tech", "Education"],
      };

      const hash1 = computeProfileInputHash(input);
      const hash2 = computeProfileInputHash(input);

      expect(hash1).toBe(hash2);
    });

    it("produces different hash for different input", () => {
      const input1 = {
        description: "Tech tutorials for beginners",
        categories: ["Tech", "Education"],
      };

      const input2 = {
        description: "Tech tutorials for advanced users",
        categories: ["Tech", "Education"],
      };

      const hash1 = computeProfileInputHash(input1);
      const hash2 = computeProfileInputHash(input2);

      expect(hash1).not.toBe(hash2);
    });

    it("is case-insensitive", () => {
      const input1 = {
        description: "Tech tutorials",
        categories: ["Tech"],
      };

      const input2 = {
        description: "TECH TUTORIALS",
        categories: ["Tech"],
      };

      const hash1 = computeProfileInputHash(input1);
      const hash2 = computeProfileInputHash(input2);

      expect(hash1).toBe(hash2);
    });

    it("handles optional fields consistently", () => {
      const input1 = {
        description: "Tech tutorials",
        categories: ["Tech"],
        formats: undefined,
        audience: undefined,
      };

      const input2 = {
        description: "Tech tutorials",
        categories: ["Tech"],
      };

      const hash1 = computeProfileInputHash(input1);
      const hash2 = computeProfileInputHash(input2);

      expect(hash1).toBe(hash2);
    });
  });

  describe("isProfileCacheValid", () => {
    it("returns false when hashes don't match", () => {
      const result = isProfileCacheValid(
        new Date(),
        "hash1",
        "hash2"
      );

      expect(result).toBe(false);
    });

    it("returns false when lastGeneratedAt is null", () => {
      const result = isProfileCacheValid(
        null,
        "hash1",
        "hash1"
      );

      expect(result).toBe(false);
    });

    it("returns false when cache is expired (>3 days)", () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const result = isProfileCacheValid(
        fourDaysAgo,
        "hash1",
        "hash1"
      );

      expect(result).toBe(false);
    });

    it("returns true when cache is valid", () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = isProfileCacheValid(
        oneDayAgo,
        "hash1",
        "hash1"
      );

      expect(result).toBe(true);
    });
  });

  describe("sanitizeUserText", () => {
    it("removes script tags", () => {
      const text = "Hello <script>alert('xss')</script> World";
      const sanitized = sanitizeUserText(text);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert");
    });

    it("removes event handlers", () => {
      const text = 'Click <img onerror="alert(1)" src="x"> here';
      const sanitized = sanitizeUserText(text);

      expect(sanitized).not.toContain("onerror");
    });

    it("removes javascript: URLs", () => {
      const text = "Click javascript:alert(1) here";
      const sanitized = sanitizeUserText(text);

      expect(sanitized).not.toContain("javascript:");
    });

    it("encodes HTML entities", () => {
      const text = "a < b && c > d";
      const sanitized = sanitizeUserText(text);

      expect(sanitized).toContain("&lt;");
      expect(sanitized).toContain("&gt;");
      expect(sanitized).toContain("&amp;");
    });

    it("preserves normal text", () => {
      const text = "I create tech tutorials for beginners";
      const sanitized = sanitizeUserText(text);

      expect(sanitized).toBe(text);
    });
  });

  describe("sanitizeProfileInput", () => {
    it("sanitizes all string fields", () => {
      const input = {
        description: "Hello <script>alert('xss')</script>",
        categories: ["Tech<script>", "Education"],
        audience: "onclick='hack()'",
      };

      const sanitized = sanitizeProfileInput(input);

      expect(sanitized.description).not.toContain("<script>");
      expect(sanitized.categories[0]).not.toContain("<script>");
      expect(sanitized.audience).not.toContain("onclick");
    });

    it("sanitizes customCategory field", () => {
      const input = {
        description: "Content about fashion",
        categories: ["Other"],
        customCategory: "Fashion<script>alert('xss')</script>",
      };

      const sanitized = sanitizeProfileInput(input);

      expect(sanitized.customCategory).not.toContain("<script>");
      expect(sanitized.customCategory).toContain("Fashion");
    });
  });

  describe("formatInputForLLM", () => {
    it("formats input as human-readable string", () => {
      const input = {
        description: "Tech tutorials for beginners",
        categories: ["Tech", "Education"],
        formats: ["Long-form", "Tutorials"],
        audience: "Aspiring developers",
      };

      const formatted = formatInputForLLM(input);

      expect(formatted).toContain("CHANNEL DESCRIPTION");
      expect(formatted).toContain("Tech tutorials for beginners");
      expect(formatted).toContain("PRIMARY CATEGORIES");
      expect(formatted).toContain("Tech, Education");
      expect(formatted).toContain("CONTENT FORMATS");
      expect(formatted).toContain("TARGET AUDIENCE");
    });

    it("omits empty optional fields", () => {
      const input = {
        description: "Tech tutorials",
        categories: ["Tech"],
      };

      const formatted = formatInputForLLM(input);

      expect(formatted).toContain("CHANNEL DESCRIPTION");
      expect(formatted).toContain("PRIMARY CATEGORIES");
      expect(formatted).not.toContain("CONTENT FORMATS");
      expect(formatted).not.toContain("TARGET AUDIENCE");
    });

    it("includes customCategory when present", () => {
      const input = {
        description: "Sustainable fashion content",
        categories: ["Other"],
        customCategory: "Sustainable Fashion",
      };

      const formatted = formatInputForLLM(input);

      expect(formatted).toContain("CUSTOM CATEGORY");
      expect(formatted).toContain("Sustainable Fashion");
    });
  });
});

describe("Constants", () => {
  it("has valid profile categories", () => {
    expect(PROFILE_CATEGORIES.length).toBeGreaterThan(10);
    expect(PROFILE_CATEGORIES).toContain("Tech");
    expect(PROFILE_CATEGORIES).toContain("Gaming");
    expect(PROFILE_CATEGORIES).toContain("Education");
    expect(PROFILE_CATEGORIES).toContain("Other");
  });

  it("has valid content formats", () => {
    expect(CONTENT_FORMATS.length).toBeGreaterThan(5);
    expect(CONTENT_FORMATS).toContain("Long-form");
    expect(CONTENT_FORMATS).toContain("Shorts");
    expect(CONTENT_FORMATS).toContain("Tutorials");
  });

  it("has valid default profile input", () => {
    expect(DEFAULT_PROFILE_INPUT.description).toBe("");
    expect(DEFAULT_PROFILE_INPUT.categories).toEqual([]);
  });
});
