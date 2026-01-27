/**
 * Ideas Generate API Tests
 *
 * Tests for the public Video Ideas Generator validation and request handling.
 * These are unit tests for the validation logic and schema.
 */
import { describe, it, expect } from "bun:test";
import { z } from "zod";

// Recreate the request schema for testing
const RequestSchema = z.object({
  topic: z
    .string()
    .max(500, "Topic must be 500 characters or less")
    .optional(),
  referenceVideoId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid video ID format")
    .nullable()
    .optional(),
  isShort: z.boolean().default(false),
});

describe("Ideas Generate Request Validation", () => {
  describe("referenceVideoId validation", () => {
    it("accepts valid 11-character video ID", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: "dQw4w9WgXcQ",
        isShort: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.referenceVideoId).toBe("dQw4w9WgXcQ");
      }
    });

    it("accepts video IDs with underscores", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: "abc_def_123",
        isShort: false,
      });
      expect(result.success).toBe(true);
    });

    it("accepts video IDs with hyphens", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: "abc-def-123",
        isShort: false,
      });
      expect(result.success).toBe(true);
    });

    it("accepts null referenceVideoId (optional field)", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: null,
        isShort: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.referenceVideoId).toBeNull();
      }
    });

    it("accepts undefined referenceVideoId (optional field)", () => {
      const result = RequestSchema.safeParse({
        isShort: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.referenceVideoId).toBeUndefined();
      }
    });

    it("rejects video ID that is too short", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: "dQw4w9",
        isShort: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects video ID that is too long", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: "dQw4w9WgXcQabc",
        isShort: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects video ID with invalid characters", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: "dQw4w9WgX$Q",
        isShort: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects full YouTube URL (expects parsed video ID)", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        isShort: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("isShort validation", () => {
    it("accepts true for Shorts", () => {
      const result = RequestSchema.safeParse({
        isShort: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isShort).toBe(true);
      }
    });

    it("accepts false for long-form", () => {
      const result = RequestSchema.safeParse({
        isShort: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isShort).toBe(false);
      }
    });

    it("defaults to false when not provided", () => {
      const result = RequestSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isShort).toBe(false);
      }
    });

    it("rejects non-boolean values", () => {
      const result = RequestSchema.safeParse({
        isShort: "true",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("topic validation", () => {
    it("accepts topic string", () => {
      const result = RequestSchema.safeParse({
        topic: "Tech reviews for budget smartphones",
        isShort: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.topic).toBe("Tech reviews for budget smartphones");
      }
    });

    it("accepts empty topic (optional)", () => {
      const result = RequestSchema.safeParse({
        isShort: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.topic).toBeUndefined();
      }
    });

    it("rejects topic over 500 characters", () => {
      const result = RequestSchema.safeParse({
        topic: "a".repeat(501),
        isShort: false,
      });
      expect(result.success).toBe(false);
    });

    it("accepts topic at exactly 500 characters", () => {
      const result = RequestSchema.safeParse({
        topic: "a".repeat(500),
        isShort: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("combined validation", () => {
    it("accepts valid complete request with all fields", () => {
      const result = RequestSchema.safeParse({
        topic: "Fitness tips for busy professionals",
        referenceVideoId: "dQw4w9WgXcQ",
        isShort: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.topic).toBe("Fitness tips for busy professionals");
        expect(result.data.referenceVideoId).toBe("dQw4w9WgXcQ");
        expect(result.data.isShort).toBe(true);
      }
    });

    it("accepts minimal request (empty object)", () => {
      const result = RequestSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.topic).toBeUndefined();
        expect(result.data.referenceVideoId).toBeUndefined();
        expect(result.data.isShort).toBe(false);
      }
    });

    it("accepts request with only topic", () => {
      const result = RequestSchema.safeParse({
        topic: "Cooking tutorials for college students",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.topic).toBe("Cooking tutorials for college students");
        expect(result.data.isShort).toBe(false);
      }
    });

    it("accepts request with only isShort", () => {
      const result = RequestSchema.safeParse({
        isShort: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isShort).toBe(true);
      }
    });

    it("accepts request with only referenceVideoId", () => {
      const result = RequestSchema.safeParse({
        referenceVideoId: "dQw4w9WgXcQ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.referenceVideoId).toBe("dQw4w9WgXcQ");
        expect(result.data.isShort).toBe(false);
      }
    });
  });
});

describe("Ideas Generate Entitlement Limits", () => {
  // Import the limits to verify they're configured correctly
  const { getLimits } = require("@/lib/entitlements");

  it("FREE plan has idea_generate limit", () => {
    const limits = getLimits("FREE");
    expect(limits.idea_generate).toBeGreaterThan(0);
    expect(limits.idea_generate).toBe(10); // Current value
  });

  it("PRO plan has higher idea_generate limit", () => {
    const freeLimits = getLimits("FREE");
    const proLimits = getLimits("PRO");
    expect(proLimits.idea_generate).toBeGreaterThan(freeLimits.idea_generate);
    expect(proLimits.idea_generate).toBe(200); // Current value
  });
});
