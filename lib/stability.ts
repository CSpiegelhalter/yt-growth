/**
 * Stability AI Client Wrapper
 *
 * Provides typed functions for interacting with the Stability AI API:
 * - generateBaseThumbnail(): Text-to-image generation for base thumbnails
 * - refineThumbnail(): Image-to-image refinement with LOW strength to preserve composition
 *
 * IMPORTANT: Uses low image_strength (0.2-0.35) during refinement to ensure
 * the user's placement of meme overlays is preserved. The model should only
 * blend/harmonize, NOT redesign the composition.
 */

import { z } from "zod";

// ============================================
// CONFIGURATION
// ============================================

const STABILITY_API_BASE = "https://api.stability.ai/v2beta/stable-image";

// Default refinement strength - MODERATE to blend overlays while preserving layout
// 0.0 = identical to input, 1.0 = complete reimagining
// We use 0.35-0.5 range to actually integrate overlays while keeping composition
// NOTE: Too low (< 0.3) results in virtually no changes
const DEFAULT_REFINE_STRENGTH = 0.45;

// ============================================
// TYPES
// ============================================

export interface GenerateBaseOptions {
  /** Description of the thumbnail scene */
  description: string;
  /** Video topic for context */
  videoTopic: string;
  /** Style preset (optional) */
  stylePreset?: "cinematic" | "digital-art" | "photographic" | "anime" | "neon-punk";
  /** Aspect ratio - defaults to 16:9 for YouTube */
  aspectRatio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "4:5" | "5:4" | "9:16" | "9:21";
  /** Negative prompt - what to avoid */
  negativePrompt?: string;
  /** Seed for reproducibility */
  seed?: number;
}

export interface RefineOptions {
  /** The composed image as base64 (PNG preferred) */
  composedImageBase64: string;
  /** Guidance prompt for refinement */
  prompt: string;
  /** Style preset (optional) */
  stylePreset?: "cinematic" | "digital-art" | "photographic" | "anime" | "neon-punk";
  /**
   * Image strength (0.0-1.0). KEEP LOW (0.2-0.35) to preserve composition.
   * Higher values = more AI interpretation = risk of changing user's layout.
   * Default: 0.28
   */
  strength?: number;
  /** Seed for reproducibility */
  seed?: number;
}

export interface StabilityResult {
  /** Generated image as Buffer */
  buffer: Buffer;
  /** MIME type */
  mime: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Seed used for generation (for reproducibility) */
  seed?: number;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const generateBaseInputSchema = z.object({
  videoTopic: z.string().min(1).max(500),
  description: z.string().min(10).max(2000),
  stylePreset: z.enum(["cinematic", "digital-art", "photographic", "anime", "neon-punk"]).optional(),
  aspectRatio: z.enum(["16:9", "1:1", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"]).optional().default("16:9"),
  negativePrompt: z.string().max(500).optional(),
  seed: z.number().int().min(0).max(4294967295).optional(),
});

export const refineFinalizeInputSchema = z.object({
  composedImageBase64: z.string().min(1),
  prompt: z.string().min(1).max(2000),
  stylePreset: z.enum(["cinematic", "digital-art", "photographic", "anime", "neon-punk"]).optional(),
  // Strength clamped to 0.25-0.65 range - enough to blend overlays while preserving layout
  strength: z.number().min(0.25).max(0.65).optional().default(DEFAULT_REFINE_STRENGTH),
  seed: z.number().int().min(0).max(4294967295).optional(),
});

// ============================================
// SIZE VALIDATION
// ============================================

/** Maximum allowed base64 payload size: 10MB */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Calculate the approximate decoded size of a base64 string.
 */
export function getBase64DecodedSize(base64String: string): number {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(",")
    ? base64String.split(",")[1]
    : base64String;
  
  // Base64 encodes 3 bytes in 4 characters
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

/**
 * Validate that an image payload is within size limits.
 */
export function validateImageSize(base64String: string): { valid: boolean; size: number; maxSize: number } {
  const size = getBase64DecodedSize(base64String);
  return {
    valid: size <= MAX_IMAGE_SIZE_BYTES,
    size,
    maxSize: MAX_IMAGE_SIZE_BYTES,
  };
}

// ============================================
// API KEY HELPER
// ============================================

function getApiKey(): string {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error("STABILITY_API_KEY environment variable is not set");
  }
  return apiKey;
}

// ============================================
// PROMPT BUILDERS
// ============================================

/**
 * Build a text-to-image prompt optimized for YouTube thumbnails.
 */
function buildBasePrompt(options: GenerateBaseOptions): string {
  const { description, videoTopic } = options;

  // YouTube thumbnail best practices prompt structure
  const prompt = [
    "Professional YouTube thumbnail, 16:9 aspect ratio.",
    `Topic: ${videoTopic}.`,
    description,
    "High contrast, vibrant colors, dramatic lighting.",
    "Clear focal point, strong composition.",
    "No text, no watermarks, no logos.",
  ].join(" ");

  return prompt;
}

/**
 * Build a refinement prompt that integrates the overlay while preserving composition.
 *
 * The goal is to make the overlay look like it BELONGS in the scene:
 * 1. Integrate the overlaid element naturally into the image
 * 2. Match lighting, shadows, and color grading
 * 3. Smooth hard edges where the overlay meets the background
 * 4. Keep the overall composition and layout intact
 */
function buildRefinePrompt(userPrompt: string): string {
  const integrationInstructions = [
    "YouTube thumbnail image.",
    "Integrate and blend the overlaid character/element naturally into the scene.",
    "Add realistic shadows beneath the overlaid element.",
    "Match the lighting direction and color temperature across all elements.",
    "Smooth any hard edges or cut-out artifacts.",
    "Make the overlay look like it was photographed as part of the original scene.",
    "Maintain high contrast and vibrant colors suitable for YouTube thumbnails.",
    "Keep the same overall composition and element positions.",
    "Do not add new people or major elements.",
  ].join(" ");

  return `${integrationInstructions} Additional guidance: ${userPrompt}`;
}

/**
 * Standard negative prompt for refinement to prevent hallucinations.
 */
const REFINE_NEGATIVE_PROMPT = [
  "extra people",
  "extra faces",
  "extra characters",
  "new subjects",
  "text",
  "words",
  "letters",
  "watermark",
  "logo",
  "signature",
  "distorted anatomy",
  "extra limbs",
  "deformed",
  "blurry",
  "low quality",
].join(", ");

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * Generate a base thumbnail image using text-to-image.
 *
 * This is Step 1 of the workflow - creates the base scene
 * without any meme overlays.
 */
export async function generateBaseThumbnail(
  options: GenerateBaseOptions
): Promise<StabilityResult> {
  const apiKey = getApiKey();
  const prompt = buildBasePrompt(options);

  console.log(`[stability] Generating base thumbnail for topic: ${options.videoTopic}`);
  console.log(`[stability] Prompt (truncated): ${prompt.slice(0, 150)}...`);

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("aspect_ratio", options.aspectRatio || "16:9");
  formData.append("output_format", "png");

  if (options.negativePrompt) {
    formData.append("negative_prompt", options.negativePrompt);
  } else {
    // Default negative prompt for clean thumbnails
    formData.append(
      "negative_prompt",
      "text, words, letters, watermark, logo, signature, low quality, blurry"
    );
  }

  if (options.seed !== undefined) {
    formData.append("seed", options.seed.toString());
  }

  if (options.stylePreset) {
    formData.append("style_preset", options.stylePreset);
  }

  const response = await fetch(`${STABILITY_API_BASE}/generate/sd3`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "image/*",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error(`[stability] API error ${response.status}:`, errorText);
    throw new Error(`Stability API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get seed from response headers if available
  const seedHeader = response.headers.get("x-seed");
  const seed = seedHeader ? parseInt(seedHeader, 10) : undefined;

  console.log(`[stability] Base generation successful, ${buffer.length} bytes`);

  // SD3 outputs vary by aspect ratio, but for 16:9 it's typically 1536x864 or similar
  return {
    buffer,
    mime: "image/png",
    width: 1536,
    height: 864,
    seed,
  };
}

/**
 * Refine a composed thumbnail using image-to-image.
 *
 * This is Step 3 of the workflow - takes the user's composed image
 * (base + overlay) and harmonizes it while preserving the layout.
 *
 * IMPORTANT: Uses LOW strength (0.2-0.35) to keep user's composition intact.
 * The model should only blend/harmonize, not redesign.
 */
export async function refineThumbnail(
  options: RefineOptions
): Promise<StabilityResult> {
  const apiKey = getApiKey();

  // Validate image size before processing
  const sizeCheck = validateImageSize(options.composedImageBase64);
  if (!sizeCheck.valid) {
    throw new Error(
      `Image too large: ${(sizeCheck.size / 1024 / 1024).toFixed(2)}MB exceeds ` +
      `limit of ${(sizeCheck.maxSize / 1024 / 1024).toFixed(2)}MB`
    );
  }

  const prompt = buildRefinePrompt(options.prompt);
  const strength = options.strength ?? DEFAULT_REFINE_STRENGTH;

  console.log(`[stability] Refining thumbnail with strength ${strength}`);
  console.log(`[stability] User prompt: ${options.prompt.slice(0, 100)}...`);

  // Decode base64 to buffer
  const base64Data = options.composedImageBase64.includes(",")
    ? options.composedImageBase64.split(",")[1]
    : options.composedImageBase64;
  
  const imageBuffer = Buffer.from(base64Data, "base64");

  // Create form data
  const formData = new FormData();
  const imageBlob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" });
  
  formData.append("image", imageBlob, "composed.png");
  formData.append("prompt", prompt);
  formData.append("strength", strength.toString());
  formData.append("output_format", "png");
  formData.append("mode", "image-to-image");
  formData.append("negative_prompt", REFINE_NEGATIVE_PROMPT);

  if (options.seed !== undefined) {
    formData.append("seed", options.seed.toString());
  }

  if (options.stylePreset) {
    formData.append("style_preset", options.stylePreset);
  }

  const response = await fetch(`${STABILITY_API_BASE}/generate/sd3`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "image/*",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error(`[stability] Refinement API error ${response.status}:`, errorText);
    throw new Error(`Stability API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get seed from response headers if available
  const seedHeader = response.headers.get("x-seed");
  const seed = seedHeader ? parseInt(seedHeader, 10) : undefined;

  console.log(`[stability] Refinement successful, ${buffer.length} bytes`);

  // Image-to-image preserves input dimensions
  return {
    buffer,
    mime: "image/png",
    width: 1536, // Assumed from input
    height: 864,
    seed,
  };
}

/**
 * Check if the Stability API is available (API key is set).
 */
export function isStabilityAvailable(): boolean {
  return !!process.env.STABILITY_API_KEY;
}
