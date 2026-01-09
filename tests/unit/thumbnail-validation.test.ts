/**
 * Unit Tests for Thumbnail Validation
 *
 * Tests for:
 * - Magic bytes detection (PNG, JPEG, WebP)
 * - Image format validation
 * - Quality metrics calculation
 * - Contrast calculation
 */

import { describe, it, expect } from "vitest";
import {
  isPngBuffer,
  isJpegBuffer,
  detectImageFormat,
  calculateContrastRatio,
  isTextReadable,
  PNG_MAGIC,
  JPEG_MAGIC,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
  MIN_FILE_SIZE,
  MAX_FILE_SIZE,
} from "@/lib/thumbnails/validation";

describe("Magic Bytes Detection", () => {
  it("should detect valid PNG magic bytes", () => {
    const pngBuffer = Buffer.concat([
      PNG_MAGIC,
      Buffer.alloc(1000), // Dummy data
    ]);
    expect(isPngBuffer(pngBuffer)).toBe(true);
  });

  it("should reject invalid PNG magic bytes", () => {
    const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(isPngBuffer(invalidBuffer)).toBe(false);
  });

  it("should reject buffer too short for PNG", () => {
    const shortBuffer = Buffer.from([0x89, 0x50, 0x4e]);
    expect(isPngBuffer(shortBuffer)).toBe(false);
  });

  it("should detect valid JPEG magic bytes", () => {
    const jpegBuffer = Buffer.concat([
      JPEG_MAGIC,
      Buffer.alloc(1000),
    ]);
    expect(isJpegBuffer(jpegBuffer)).toBe(true);
  });

  it("should reject invalid JPEG magic bytes", () => {
    const invalidBuffer = Buffer.from([0x00, 0x00, 0x00]);
    expect(isJpegBuffer(invalidBuffer)).toBe(false);
  });
});

describe("Image Format Detection", () => {
  it("should detect PNG format", () => {
    const pngBuffer = Buffer.concat([PNG_MAGIC, Buffer.alloc(100)]);
    expect(detectImageFormat(pngBuffer)).toBe("png");
  });

  it("should detect JPEG format", () => {
    const jpegBuffer = Buffer.concat([JPEG_MAGIC, Buffer.alloc(100)]);
    expect(detectImageFormat(jpegBuffer)).toBe("jpeg");
  });

  it("should detect WebP format", () => {
    // WebP: RIFF....WEBP
    const webpBuffer = Buffer.alloc(12);
    webpBuffer.write("RIFF", 0);
    webpBuffer.write("WEBP", 8);
    expect(detectImageFormat(webpBuffer)).toBe("webp");
  });

  it("should return unknown for unrecognized format", () => {
    const randomBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b]);
    expect(detectImageFormat(randomBuffer)).toBe("unknown");
  });

  it("should handle empty buffer", () => {
    const emptyBuffer = Buffer.alloc(0);
    expect(detectImageFormat(emptyBuffer)).toBe("unknown");
  });
});

describe("Contrast Ratio Calculation", () => {
  it("should calculate maximum contrast (black on white)", () => {
    const ratio = calculateContrastRatio(255, 0);
    expect(ratio).toBeCloseTo(21, 0); // Maximum contrast is ~21:1
  });

  it("should calculate minimum contrast (same color)", () => {
    const ratio = calculateContrastRatio(128, 128);
    expect(ratio).toBeCloseTo(1, 0); // Same luminance = 1:1
  });

  it("should calculate mid-range contrast", () => {
    const ratio = calculateContrastRatio(200, 50);
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(21);
  });

  it("should be symmetric (order of arguments doesn't matter for ratio)", () => {
    const ratio1 = calculateContrastRatio(255, 100);
    const ratio2 = calculateContrastRatio(100, 255);
    expect(ratio1).toBeCloseTo(ratio2, 2);
  });
});

describe("Text Readability Check", () => {
  it("should pass white text on dark background", () => {
    expect(isTextReadable("#FFFFFF", 30)).toBe(true);
  });

  it("should pass black text on light background", () => {
    expect(isTextReadable("#000000", 220)).toBe(true);
  });

  it("should fail low contrast combination", () => {
    // Gray text on gray background
    expect(isTextReadable("#888888", 136)).toBe(false);
  });

  it("should handle bright accent colors", () => {
    // Yellow on white is typically low contrast
    expect(isTextReadable("#FFFF00", 250)).toBe(false);
  });

  it("should pass with sufficient contrast", () => {
    // Dark blue on light background
    expect(isTextReadable("#000066", 200)).toBe(true);
  });
});

describe("Constants", () => {
  it("should have correct thumbnail dimensions", () => {
    expect(THUMBNAIL_WIDTH).toBe(1280);
    expect(THUMBNAIL_HEIGHT).toBe(720);
  });

  it("should have reasonable file size limits", () => {
    expect(MIN_FILE_SIZE).toBe(10 * 1024); // 10KB
    expect(MAX_FILE_SIZE).toBe(2 * 1024 * 1024); // 2MB
  });

  it("should have correct PNG magic bytes", () => {
    expect(PNG_MAGIC).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  });

  it("should have correct JPEG magic bytes", () => {
    expect(JPEG_MAGIC).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });
});
