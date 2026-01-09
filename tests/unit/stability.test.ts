/**
 * Unit tests for lib/stability.ts
 *
 * Tests:
 * - Zod validators for generateBase and refineFinalize inputs
 * - Image size validation (rejects oversized payloads)
 * - Base64 size calculation
 */

import { describe, it, expect } from "vitest";
import {
  generateBaseInputSchema,
  refineFinalizeInputSchema,
  validateImageSize,
  getBase64DecodedSize,
} from "@/lib/stability";

describe("stability module", () => {
  describe("generateBaseInputSchema", () => {
    it("accepts valid input with required fields", () => {
      const result = generateBaseInputSchema.safeParse({
        videoTopic: "How to learn React",
        description: "A comprehensive tutorial on learning React from scratch",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.videoTopic).toBe("How to learn React");
        expect(result.data.aspectRatio).toBe("16:9"); // default
      }
    });

    it("accepts valid input with all optional fields", () => {
      const result = generateBaseInputSchema.safeParse({
        videoTopic: "Cooking tutorial",
        description: "Learn to make delicious pasta in 10 minutes",
        stylePreset: "cinematic",
        aspectRatio: "16:9",
        negativePrompt: "blurry, low quality",
        seed: 12345,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stylePreset).toBe("cinematic");
        expect(result.data.seed).toBe(12345);
      }
    });

    it("rejects empty videoTopic", () => {
      const result = generateBaseInputSchema.safeParse({
        videoTopic: "",
        description: "This is a valid description",
      });

      expect(result.success).toBe(false);
    });

    it("rejects description shorter than 10 characters", () => {
      const result = generateBaseInputSchema.safeParse({
        videoTopic: "Valid topic",
        description: "Too short",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid stylePreset", () => {
      const result = generateBaseInputSchema.safeParse({
        videoTopic: "Valid topic",
        description: "Valid description here",
        stylePreset: "invalid-preset",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid aspectRatio", () => {
      const result = generateBaseInputSchema.safeParse({
        videoTopic: "Valid topic",
        description: "Valid description here",
        aspectRatio: "4:3", // not in allowed list
      });

      expect(result.success).toBe(false);
    });

    it("accepts all valid stylePresets", () => {
      const presets = ["cinematic", "digital-art", "photographic", "anime", "neon-punk"];

      for (const preset of presets) {
        const result = generateBaseInputSchema.safeParse({
          videoTopic: "Test topic",
          description: "Test description here",
          stylePreset: preset,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid aspectRatios", () => {
      const ratios = ["16:9", "1:1", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"];

      for (const ratio of ratios) {
        const result = generateBaseInputSchema.safeParse({
          videoTopic: "Test topic",
          description: "Test description here",
          aspectRatio: ratio,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects seed outside valid range", () => {
      const result = generateBaseInputSchema.safeParse({
        videoTopic: "Valid topic",
        description: "Valid description here",
        seed: -1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("refineFinalizeInputSchema", () => {
    it("accepts valid input with required fields", () => {
      const result = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        prompt: "Blend the overlay naturally",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strength).toBe(0.45); // default
      }
    });

    it("clamps strength to valid range (0.25-0.65)", () => {
      // Test lower bound
      const resultLow = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "dGVzdA==",
        prompt: "Test prompt",
        strength: 0.2, // below minimum (0.25)
      });
      expect(resultLow.success).toBe(false);

      // Test upper bound
      const resultHigh = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "dGVzdA==",
        prompt: "Test prompt",
        strength: 0.7, // above maximum (0.65)
      });
      expect(resultHigh.success).toBe(false);

      // Test valid in range
      const resultValid = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "dGVzdA==",
        prompt: "Test prompt",
        strength: 0.45,
      });
      expect(resultValid.success).toBe(true);
    });

    it("accepts valid strength at boundaries", () => {
      // Test minimum boundary
      const resultMin = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "dGVzdA==",
        prompt: "Test prompt",
        strength: 0.25,
      });
      expect(resultMin.success).toBe(true);

      // Test maximum boundary
      const resultMax = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "dGVzdA==",
        prompt: "Test prompt",
        strength: 0.65,
      });
      expect(resultMax.success).toBe(true);
    });

    it("rejects empty composedImageBase64", () => {
      const result = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "",
        prompt: "Test prompt",
      });

      expect(result.success).toBe(false);
    });

    it("rejects empty prompt", () => {
      const result = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "dGVzdA==",
        prompt: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejects prompt longer than 2000 characters", () => {
      const result = refineFinalizeInputSchema.safeParse({
        composedImageBase64: "dGVzdA==",
        prompt: "a".repeat(2001),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getBase64DecodedSize", () => {
    it("calculates correct size for simple base64 string", () => {
      // "hello" in base64 is "aGVsbG8=" (5 bytes)
      const base64 = "aGVsbG8=";
      const size = getBase64DecodedSize(base64);
      expect(size).toBe(5);
    });

    it("handles base64 without padding", () => {
      // "hi" in base64 is "aGk" (2 bytes, no padding)
      const base64 = "aGk";
      const size = getBase64DecodedSize(base64);
      expect(size).toBe(2);
    });

    it("handles data URL prefix", () => {
      // Should strip the prefix and calculate correctly
      const dataUrl = "data:image/png;base64,aGVsbG8=";
      const size = getBase64DecodedSize(dataUrl);
      expect(size).toBe(5);
    });

    it("handles larger base64 strings", () => {
      // 1000 bytes encoded = ~1333 base64 chars
      // "A" repeated 1000 times
      const originalBytes = 1000;
      const base64 = Buffer.from("A".repeat(originalBytes)).toString("base64");
      const size = getBase64DecodedSize(base64);
      expect(size).toBe(originalBytes);
    });
  });

  describe("validateImageSize", () => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    it("accepts images under the size limit", () => {
      // Create a small base64 string
      const smallBase64 = Buffer.from("small image data").toString("base64");
      const result = validateImageSize(smallBase64);

      expect(result.valid).toBe(true);
      expect(result.maxSize).toBe(MAX_SIZE);
    });

    it("rejects images over the size limit", () => {
      // Create a base64 string representing > 10MB
      // We need ~13.33MB of base64 to encode 10MB
      // For testing, we'll create a slightly oversized buffer
      const oversizedBuffer = Buffer.alloc(MAX_SIZE + 1000);
      const oversizedBase64 = oversizedBuffer.toString("base64");
      const result = validateImageSize(oversizedBase64);

      expect(result.valid).toBe(false);
      expect(result.size).toBeGreaterThan(MAX_SIZE);
    });

    it("accepts image exactly at the size limit", () => {
      // Create exactly 10MB
      const exactBuffer = Buffer.alloc(MAX_SIZE);
      const exactBase64 = exactBuffer.toString("base64");
      const result = validateImageSize(exactBase64);

      expect(result.valid).toBe(true);
      expect(result.size).toBe(MAX_SIZE);
    });

    it("handles data URL format", () => {
      const smallBase64 = Buffer.from("test").toString("base64");
      const dataUrl = `data:image/png;base64,${smallBase64}`;
      const result = validateImageSize(dataUrl);

      expect(result.valid).toBe(true);
    });

    it("returns correct size information", () => {
      const testData = "test image content here";
      const base64 = Buffer.from(testData).toString("base64");
      const result = validateImageSize(base64);

      expect(result.size).toBe(testData.length);
      expect(result.maxSize).toBe(MAX_SIZE);
      expect(result.valid).toBe(true);
    });
  });
});
