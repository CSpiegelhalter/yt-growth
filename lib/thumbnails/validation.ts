/**
 * Image Validation Utilities
 *
 * Comprehensive validation for generated thumbnail images:
 * - Magic bytes verification (PNG signature)
 * - Dimension validation
 * - Quality checks (variance, luminance)
 * - Sharp-based decode verification
 */

import type { GeneratedImage } from "./types";

// ============================================
// CONSTANTS
// ============================================

export const THUMBNAIL_WIDTH = 1280;
export const THUMBNAIL_HEIGHT = 720;
export const MIN_FILE_SIZE = 10 * 1024; // 10KB minimum
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB maximum

// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// JPEG magic bytes: FF D8 FF
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export type ValidationResult = {
  valid: boolean;
  width?: number;
  height?: number;
  format?: "png" | "jpeg" | "webp" | "unknown";
  issues: string[];
  quality?: ImageQuality;
};

export type ImageQuality = {
  variance: number; // 0-1, higher = more detail
  avgLuminance: number; // 0-255
  isFlat: boolean; // True if image lacks detail
  isTooLight: boolean; // True if image is washed out
  isTooDark: boolean; // True if image is too dark
};

// ============================================
// MAGIC BYTES VALIDATION
// ============================================

/**
 * Check if buffer starts with PNG magic bytes.
 */
export function isPngBuffer(buffer: Buffer): boolean {
  if (buffer.length < PNG_MAGIC.length) return false;
  return buffer.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC);
}

/**
 * Check if buffer starts with JPEG magic bytes.
 */
export function isJpegBuffer(buffer: Buffer): boolean {
  if (buffer.length < JPEG_MAGIC.length) return false;
  return buffer.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC);
}

/**
 * Detect image format from magic bytes.
 */
export function detectImageFormat(
  buffer: Buffer
): "png" | "jpeg" | "webp" | "unknown" {
  if (isPngBuffer(buffer)) return "png";
  if (isJpegBuffer(buffer)) return "jpeg";
  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  ) {
    return "webp";
  }
  return "unknown";
}

// ============================================
// SHARP-BASED VALIDATION
// ============================================

 
let sharpModule: any = null;

async function getSharp(): Promise<any> {
  if (!sharpModule) {
    try {
      const imported = await import("sharp");
      sharpModule = imported.default ?? imported;
    } catch {
      throw new Error("Sharp is required for image validation");
    }
  }
  return sharpModule;
}

/**
 * Validate an image buffer using Sharp.
 * Returns detailed validation results including dimensions and quality metrics.
 */
export async function validateImage(
  buffer: Buffer,
  options?: {
    requireExactSize?: boolean;
    expectedWidth?: number;
    expectedHeight?: number;
    checkQuality?: boolean;
  }
): Promise<ValidationResult> {
  const {
    requireExactSize = false,
    expectedWidth = THUMBNAIL_WIDTH,
    expectedHeight = THUMBNAIL_HEIGHT,
    checkQuality = true,
  } = options ?? {};

  const issues: string[] = [];

  // 1. Basic size check
  if (buffer.length < MIN_FILE_SIZE) {
    issues.push(`File too small: ${buffer.length} bytes (min ${MIN_FILE_SIZE})`);
  }
  if (buffer.length > MAX_FILE_SIZE) {
    issues.push(`File too large: ${buffer.length} bytes (max ${MAX_FILE_SIZE})`);
  }

  // 2. Magic bytes check
  const format = detectImageFormat(buffer);
  if (format === "unknown") {
    issues.push("Unknown image format (invalid magic bytes)");
    return { valid: false, format, issues };
  }

  // 3. Sharp decode validation
  let width: number | undefined;
  let height: number | undefined;
  let quality: ImageQuality | undefined;

  try {
    const sharp = await getSharp();
    const image = sharp(buffer);
    const metadata = await image.metadata();

    width = metadata.width;
    height = metadata.height;

    if (!width || !height) {
      issues.push("Could not read image dimensions");
      return { valid: false, format, issues };
    }

    // 4. Dimension validation
    if (requireExactSize) {
      if (width !== expectedWidth || height !== expectedHeight) {
        issues.push(
          `Wrong dimensions: ${width}x${height} (expected ${expectedWidth}x${expectedHeight})`
        );
      }
    } else {
      // Just check aspect ratio is reasonable (16:9 ± tolerance)
      const aspect = width / height;
      const expectedAspect = expectedWidth / expectedHeight;
      if (Math.abs(aspect - expectedAspect) > 0.1) {
        issues.push(
          `Wrong aspect ratio: ${aspect.toFixed(2)} (expected ~${expectedAspect.toFixed(2)})`
        );
      }
    }

    // 5. Quality analysis (optional, can be slow)
    if (checkQuality) {
      quality = await analyzeImageQuality(image, width, height);

      if (quality.isFlat) {
        issues.push("Image appears flat/solid (low variance)");
      }
      if (quality.isTooLight) {
        issues.push("Image is too light (washed out)");
      }
      if (quality.isTooDark) {
        issues.push("Image is too dark");
      }
    }
  } catch (err) {
    issues.push(`Sharp decode failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    return { valid: false, format, issues };
  }

  return {
    valid: issues.length === 0,
    width,
    height,
    format,
    issues,
    quality,
  };
}

/**
 * Analyze image quality metrics using Sharp.
 * Samples pixels to compute variance and luminance.
 */
async function analyzeImageQuality(
   
  image: any,
  width: number,
  height: number
): Promise<ImageQuality> {
  try {
    // Sample a smaller version for faster analysis
    const sampleSize = 100;
    const sample = await image
      .resize(sampleSize, Math.round(sampleSize * (height / width)), {
        fit: "fill",
      })
      .raw()
      .toBuffer();

    // Calculate statistics from raw pixels
    const pixelCount = sample.length / 3; // RGB
    let totalLum = 0;
    const lumValues: number[] = [];

    for (let i = 0; i < sample.length; i += 3) {
      const r = sample[i];
      const g = sample[i + 1];
      const b = sample[i + 2];
      // Calculate perceived luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;
      lumValues.push(lum);
    }

    const avgLuminance = totalLum / pixelCount;

    // Calculate variance
    let variance = 0;
    for (const lum of lumValues) {
      variance += (lum - avgLuminance) ** 2;
    }
    variance = Math.sqrt(variance / pixelCount) / 255; // Normalize to 0-1

    return {
      variance,
      avgLuminance,
      isFlat: variance < 0.05, // Very low variance = flat image
      isTooLight: avgLuminance > 240,
      isTooDark: avgLuminance < 15,
    };
  } catch {
    // If analysis fails, return neutral values
    return {
      variance: 0.5,
      avgLuminance: 128,
      isFlat: false,
      isTooLight: false,
      isTooDark: false,
    };
  }
}

// ============================================
// QUICK VALIDATION (No Quality Check)
// ============================================

/**
 * Quick validation - just checks magic bytes and dimensions.
 * Much faster than full validation.
 */
export async function quickValidateImage(
  buffer: Buffer
): Promise<{ valid: boolean; format: string; width?: number; height?: number }> {
  const format = detectImageFormat(buffer);
  if (format === "unknown") {
    return { valid: false, format };
  }

  try {
    const sharp = await getSharp();
    const metadata = await sharp(buffer).metadata();
    return {
      valid: Boolean(metadata.width && metadata.height),
      format,
      width: metadata.width,
      height: metadata.height,
    };
  } catch {
    return { valid: false, format };
  }
}

// ============================================
// VALIDATION FOR GENERATED IMAGES
// ============================================

/**
 * Validate a GeneratedImage from the AI pipeline.
 * Returns issues array (empty = valid).
 */
export async function validateGeneratedImage(
  image: GeneratedImage
): Promise<string[]> {
  const result = await validateImage(image.buffer, {
    requireExactSize: false, // DALL-E returns 1792x1024, we resize later
    checkQuality: true,
  });

  return result.issues;
}

/**
 * Check if a GeneratedImage is usable (passes basic validation).
 */
export async function isGeneratedImageUsable(
  image: GeneratedImage
): Promise<boolean> {
  const issues = await validateGeneratedImage(image);
  // Allow some issues, but fail on critical ones
  const criticalIssues = issues.filter(
    (i) =>
      i.includes("magic bytes") ||
      i.includes("decode failed") ||
      i.includes("dimensions")
  );
  return criticalIssues.length === 0;
}

// ============================================
// TEXT CONTRAST VALIDATION
// ============================================

/**
 * Calculate contrast ratio between text and background.
 * Returns a value from 1 (no contrast) to 21 (max contrast).
 */
export function calculateContrastRatio(
  textLuminance: number,
  bgLuminance: number
): number {
  // Normalize to 0-1
  const l1 = Math.max(textLuminance, bgLuminance) / 255;
  const l2 = Math.min(textLuminance, bgLuminance) / 255;

  // WCAG contrast formula
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Check if text will be readable on a given background.
 * Requires minimum 4.5:1 contrast ratio for normal text.
 */
export function isTextReadable(
  textColor: string,
  avgBackgroundLuminance: number
): boolean {
  // Parse text color hex
  const hex = textColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const textLum = 0.299 * r + 0.587 * g + 0.114 * b;

  const ratio = calculateContrastRatio(textLum, avgBackgroundLuminance);
  return ratio >= 4.5;
}

// ============================================
// EXPORTED UTILITIES
// ============================================

export {
  PNG_MAGIC,
  JPEG_MAGIC,
};
