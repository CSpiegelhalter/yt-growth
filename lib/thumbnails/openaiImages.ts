/**
 * OpenAI Image Generation (YouTube Best Practices)
 *
 * Generates scene-like base images for thumbnails using OpenAI's image models.
 * Implements proven YouTube thumbnail best practices:
 * - BOGY color palette (Blue, Orange, Green, Yellow)
 * - High contrast, dramatic lighting
 * - Clear focal subject with reserved text space
 * - NO text in images (added by compositor for guaranteed readability)
 *
 * Includes:
 * - BOGY-optimized prompt builder
 * - Retry logic with quality-enhancing prompt adjustments
 * - Quality validation (flatness, contrast, dimension checks)
 * - 4 diverse variations by default
 */

import type { GeneratedImage, ConceptPlan } from "./types";
import { getConcept } from "./concepts";
import { validateImage, isGeneratedImageUsable } from "./validation";
import {
  buildThumbnailDirection,
  generateLayoutVariations,
  type ThumbnailDirection,
  type ThumbnailDirectionInput,
} from "./thumbnailDirection";
import {
  buildImagePrompt,
  buildPromptFromPlan,
  generatePromptVariations,
} from "./promptBuilder";

// ============================================
// CONSTANTS
// ============================================

// Image generation model and size config
const IMAGE_MODEL = "gpt-image-1.5";
const IMAGE_SIZE = "1536x1024"; // Landscape for YouTube thumbnails

// Text styling guidance - referenced dynamically per thumbnail
// DO NOT include generic "headline" or "text" words that AI might render literally
const TEXT_STYLE_SUFFIX =
  "Use thick sans-serif font, high contrast (white with black outline or vice versa). Typography must be clearly readable at small sizes. No watermarks, no logos, no copyrighted characters.";

// YouTube-optimized quality suffix with BOGY guidance
const QUALITY_SUFFIX =
  "Use vibrant BOGY palette (Blue, Orange, Green, Yellow) as dominant colors. Avoid heavy red/white/black dominance. Professional photography or digital art style, dramatic cinematic lighting with rim light, high contrast, vibrant saturated colors, clear focal point, depth of field.";

// Blocked terms that should never appear in prompts
// Note: "youtube" is intentionally NOT blocked since we need to say "YouTube thumbnail"
const BLOCKED_TERMS = [
  // Brands
  "nike",
  "adidas",
  "apple",
  "google",
  "microsoft",
  "amazon",
  "coca-cola",
  "pepsi",
  "mcdonalds",
  "starbucks",
  // "youtube" - intentionally allowed for "YouTube thumbnail" context
  "facebook",
  "instagram",
  "twitter",
  "tiktok",
  "netflix",
  "disney",
  "pixar",
  "marvel",
  "dc comics",
  // Characters
  "mickey mouse",
  "mario",
  "luigi",
  "pikachu",
  "pokemon",
  "spider-man",
  "batman",
  "superman",
  "iron man",
  "hulk",
  "darth vader",
  "yoda",
  "harry potter",
  "frozen",
  "elsa",
  // People
  "elon musk",
  "trump",
  "biden",
  "obama",
  "taylor swift",
  "beyonce",
  "kardashian",
  "pewdiepie",
  "mrbeast",
  // Sensitive
  "nude",
  "naked",
  "nsfw",
  "violence",
  "blood",
  "gore",
  "weapon",
  "gun",
  "knife",
  "death",
  "murder",
  "hate",
  "drugs",
  "cocaine",
  "marijuana",
  "alcohol",
];

// Generic replacements for blocked terms
const GENERIC_REPLACEMENTS: Record<string, string> = {
  phone: "smartphone device",
  laptop: "portable computer",
  computer: "desktop workstation",
  car: "modern vehicle",
  celebrity: "professional person",
  influencer: "content creator silhouette",
};

// ============================================
// PROMPT BUILDING
// ============================================

/**
 * Build a complete thumbnail prompt from ConceptPlan.
 * AI generates the entire thumbnail including the specific hook text.
 */
export function buildScenePrompt(plan: ConceptPlan): string {
  const concept = getConcept(plan.conceptId);

  // Start with the concept's prompt scaffold
  const { promptScaffold, constraints } = concept;

  // Ensure we have actual hook text, not a placeholder
  const hookText = plan.hookText?.trim();
  if (
    !hookText ||
    hookText.toLowerCase().includes("headline") ||
    hookText.length < 2
  ) {
    console.warn(
      `[buildScenePrompt] Invalid hookText: "${hookText}", plan will have no text overlay`
    );
  }

  // Build the complete thumbnail description
  let prompt = "Design a YouTube thumbnail (16:9, 1280x720). ";

  // 1. THE SPECIFIC TEXT TO RENDER (most important - be very explicit)
  if (hookText && hookText.length >= 2) {
    prompt += `RENDER THESE EXACT WORDS in large bold typography: "${hookText}". `;
    prompt +=
      "Make the text big, bold, readable, with thick sans-serif font and high contrast (white with black outline). ";
  }

  // 2. Scene opener from scaffold
  prompt += promptScaffold.prefix + " ";

  // 3. Subject description
  if (plan.subjects) {
    prompt += plan.subjects + ". ";
  }

  // 4. Composition guidance
  prompt += promptScaffold.compositionGuidance + ". ";

  // 5. Color/mood guidance
  prompt += constraints.colorGuidance + ". ";

  // 6. Quality suffix
  prompt += QUALITY_SUFFIX + " ";

  // 7. Text styling (generic, no words that could be rendered)
  prompt += TEXT_STYLE_SUFFIX;

  return prompt;
}

/**
 * Sanitize and harden a prompt for safe image generation.
 * ALWAYS prepends the hook text to ensure it's rendered in the thumbnail.
 */
export function hardenPrompt(plan: ConceptPlan): {
  prompt: string;
  blocked: boolean;
  reason?: string;
} {
  // Validate hook text first - this is what the user will see
  const hookText = plan.hookText?.trim();
  const hasValidHook =
    hookText &&
    hookText.length >= 2 &&
    !hookText.toLowerCase().includes("headline");

  // Build the base prompt (scene description)
  let basePrompt = plan.basePrompt || buildScenePrompt(plan);

  // ALWAYS prepend explicit hook text instruction if we have valid hook
  // This ensures the AI knows exactly what text to render
  let prompt = "";
  if (hasValidHook) {
    prompt = `YouTube thumbnail. RENDER THESE EXACT WORDS as big bold text: "${hookText}". `;
    prompt += basePrompt;
  } else {
    // No valid hook - just use the base prompt (will generate image without text)
    console.warn(
      `[hardenPrompt] No valid hookText for thumbnail, generating without text overlay`
    );
    prompt = basePrompt;
  }

  // Check for blocked terms
  const lowerPrompt = prompt.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lowerPrompt.includes(term)) {
      // Try to replace with generic equivalent
      const replacement = GENERIC_REPLACEMENTS[term];
      if (replacement) {
        prompt = prompt.replace(new RegExp(term, "gi"), replacement);
      } else {
        return {
          prompt: "",
          blocked: true,
          reason: `Blocked term detected: ${term}`,
        };
      }
    }
  }

  // Add negative prompt elements
  if (plan.negativePrompt) {
    prompt += ` Avoid: ${plan.negativePrompt}.`;
  }

  // Truncate to avoid token limits (preserve the hook at the start)
  if (prompt.length > 1200) {
    // Keep the first part (with hook) and truncate the middle
    const hookPart = prompt.slice(0, 200);
    const endPart = prompt.slice(-300);
    prompt = hookPart + "... " + endPart;
  }

  return { prompt, blocked: false };
}

// ============================================
// IMAGE GENERATION
// ============================================

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Quality-focused prompt enhancements for retries (addresses common issues)
const RETRY_ENHANCEMENTS = [
  // Retry 1: Address flatness and detail
  " IMPORTANT: More texture and detail. NOT flat or uniform. Rich background with depth, layers, and visual interest. Strong contrast between elements.",
  // Retry 2: Address subject clarity and composition
  " CRITICAL: Clear, prominent focal subject in frame. NOT tiny or unclear. Dramatic lighting with rim light. Bold, high-contrast composition.",
];

/**
 * Generate a base image using OpenAI's image generation API with retry logic.
 * Supports optional style reference image for meme/style transfer.
 */
export async function generateBaseImage(
  plan: ConceptPlan,
  options?: {
    maxRetries?: number;
    validateQuality?: boolean;
    /** Path to style reference image (e.g., "/memes/trollface.jpg") */
    styleReferenceImagePath?: string;
  }
): Promise<GeneratedImage | null> {
  const {
    maxRetries = MAX_RETRIES,
    validateQuality = true,
    styleReferenceImagePath,
  } = options ?? {};

  // TEST_MODE: Return null (will use fallback)
  if (process.env.TEST_MODE === "1") {
    console.log("[generateBaseImage] TEST_MODE: skipping AI generation");
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[generateBaseImage] No OPENAI_API_KEY configured");
    return null;
  }

  // Log if using style reference
  if (styleReferenceImagePath) {
    console.log(
      `[generateBaseImage] Will use style reference: ${styleReferenceImagePath}`
    );
  }

  // Harden the prompt
  const { prompt: basePrompt, blocked, reason } = hardenPrompt(plan);
  if (blocked) {
    console.warn(`[generateBaseImage] Prompt blocked: ${reason}`);
    return null;
  }

  console.log(`[generateBaseImage] Generating for concept: ${plan.conceptId}`);
  console.log(
    `[generateBaseImage] Prompt (truncated): ${basePrompt.slice(0, 200)}...`
  );

  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Enhance prompt on retries
    let prompt =
      attempt === 0
        ? basePrompt
        : basePrompt +
          RETRY_ENHANCEMENTS[
            Math.min(attempt - 1, RETRY_ENHANCEMENTS.length - 1)
          ];

    // If we have a reference image, add explicit instruction to use it
    if (styleReferenceImagePath) {
      prompt =
        `IMPORTANT: Transform this image into a YouTube thumbnail while preserving the character's face and expression style. ` +
        `Keep the same artistic style, line work, and visual aesthetic. ` +
        `Adapt the scene to match this description: ` +
        prompt;
    }

    if (attempt > 0) {
      console.log(
        `[generateBaseImage] Retry ${attempt}/${maxRetries} with enhanced prompt`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }

    try {
      const result = await callImageGenerationApi(
        prompt,
        apiKey,
        styleReferenceImagePath
      );

      if (!result) {
        lastError = "No image data in response";
        continue;
      }

      // Validate the generated image
      if (validateQuality) {
        const isUsable = await isGeneratedImageUsable(result);
        if (!isUsable) {
          console.warn(
            "[generateBaseImage] Generated image failed quality check"
          );
          const validation = await validateImage(result.buffer, {
            checkQuality: true,
          });
          console.warn("[generateBaseImage] Issues:", validation.issues);
          lastError = `Quality check failed: ${validation.issues.join(", ")}`;
          continue;
        }
      }

      console.log(
        `[generateBaseImage] Success on attempt ${attempt + 1}, size: ${
          result.buffer.length
        } bytes`
      );
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[generateBaseImage] Attempt ${attempt + 1} error:`,
        lastError
      );

      // Check for content policy - don't retry
      if (lastError.includes("content_policy_violation")) {
        console.warn(
          "[generateBaseImage] Content policy violation, not retrying"
        );
        break;
      }
    }
  }

  console.error(
    `[generateBaseImage] All attempts failed. Last error: ${lastError}`
  );
  return null;
}

// ============================================
// BOGY-ENHANCED GENERATION (YouTube Best Practices)
// ============================================

/**
 * Generate a base image using BOGY-optimized prompt builder.
 * This is the preferred method for new thumbnails.
 */
export async function generateBogyBaseImage(
  input: ThumbnailDirectionInput,
  options?: {
    maxRetries?: number;
    validateQuality?: boolean;
  }
): Promise<GeneratedImage | null> {
  const { maxRetries = MAX_RETRIES, validateQuality = true } = options ?? {};

  // Skip in test mode
  if (process.env.TEST_MODE === "1") {
    console.log("[generateBogyBaseImage] TEST_MODE: skipping AI generation");
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[generateBogyBaseImage] No OPENAI_API_KEY configured");
    return null;
  }

  // Build BOGY-optimized direction and prompt
  const direction = buildThumbnailDirection(input);
  const { prompt: basePrompt } = buildImagePrompt(direction);

  console.log(
    `[generateBogyBaseImage] BOGY palette: ${direction.bogyPairing}, layout: ${direction.layout}`
  );
  console.log(
    `[generateBogyBaseImage] Prompt (first 300 chars): ${basePrompt.slice(
      0,
      300
    )}...`
  );

  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Enhance prompt on retries with quality boosters
    const prompt =
      attempt === 0
        ? basePrompt
        : basePrompt +
          RETRY_ENHANCEMENTS[
            Math.min(attempt - 1, RETRY_ENHANCEMENTS.length - 1)
          ];

    if (attempt > 0) {
      console.log(`[generateBogyBaseImage] Retry ${attempt}/${maxRetries}`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }

    try {
      const result = await callImageGenerationApi(prompt, apiKey);

      if (!result) {
        lastError = "No image data in response";
        continue;
      }

      // Validate quality
      if (validateQuality) {
        const isUsable = await isGeneratedImageUsable(result);
        if (!isUsable) {
          const validation = await validateImage(result.buffer, {
            checkQuality: true,
          });
          console.warn(
            `[generateBogyBaseImage] Quality check failed:`,
            validation.issues
          );
          lastError = `Quality: ${validation.issues.join(", ")}`;
          continue;
        }
      }

      console.log(
        `[generateBogyBaseImage] Success on attempt ${attempt + 1}, ${
          result.buffer.length
        } bytes`
      );
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[generateBogyBaseImage] Attempt ${attempt + 1} error:`,
        lastError
      );

      if (lastError.includes("content_policy_violation")) {
        break;
      }
    }
  }

  console.error(`[generateBogyBaseImage] All attempts failed: ${lastError}`);
  return null;
}

/**
 * Generate 4 diverse thumbnail variations using BOGY best practices.
 * Each variation differs in layout and color pairing.
 */
export async function generate4Variations(
  input: ThumbnailDirectionInput,
  options?: {
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<
  Array<{
    image: GeneratedImage | null;
    direction: ThumbnailDirection;
    variationNote: string;
  }>
> {
  const { onProgress } = options ?? {};

  // Build base direction
  const baseDirection = buildThumbnailDirection(input);

  // Generate 4 layout/color variations
  const variations = generateLayoutVariations(baseDirection);
  const prompts = generatePromptVariations(baseDirection);

  const results: Array<{
    image: GeneratedImage | null;
    direction: ThumbnailDirection;
    variationNote: string;
  }> = [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[generate4Variations] No OPENAI_API_KEY configured");
    return variations.map((dir, i) => ({
      image: null,
      direction: dir,
      variationNote: prompts[i]?.variationNote || `Variation ${i + 1}`,
    }));
  }

  // Generate each variation (could parallelize, but keeping serial for rate limits)
  for (let i = 0; i < variations.length; i++) {
    const direction = variations[i];
    const { prompt, variationNote } = prompts[i];

    console.log(
      `[generate4Variations] Generating variation ${i + 1}/4: ${variationNote}`
    );

    try {
      const image = await callImageGenerationApi(prompt, apiKey);

      // Validate quality
      if (image) {
        const isUsable = await isGeneratedImageUsable(image);
        if (!isUsable) {
          console.warn(
            `[generate4Variations] Variation ${i + 1} failed quality check`
          );
          results.push({ image: null, direction, variationNote });
        } else {
          results.push({ image, direction, variationNote });
        }
      } else {
        results.push({ image: null, direction, variationNote });
      }
    } catch (err) {
      console.error(`[generate4Variations] Variation ${i + 1} error:`, err);
      results.push({ image: null, direction, variationNote });
    }

    onProgress?.(i + 1, 4);

    // Small delay between requests
    if (i < 3) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  return results;
}

/**
 * Build an enhanced BOGY prompt from a ConceptPlan.
 * Use this when you have a ConceptPlan but want BOGY optimization.
 */
export function enhanceConceptPlanPrompt(plan: ConceptPlan): {
  prompt: string;
  negativePrompt: string;
} {
  return buildPromptFromPlan(plan);
}

/**
 * Read a reference image from the public folder as a Buffer.
 * Converts to PNG format and resizes based on target API requirements.
 * Returns null if the file doesn't exist or can't be read.
 */
async function readReferenceImageBuffer(
  imagePath: string,
  options?: {
    /** Target width (default: 1536 for 16:9 YouTube thumbnail) */
    width?: number;
    /** Target height (default: 1024 for 16:9 YouTube thumbnail) */
    height?: number;
    /** Add alpha channel (required for OpenAI edits) */
    withAlpha?: boolean;
  }
): Promise<{
  buffer: Buffer;
  filename: string;
  width: number;
  height: number;
} | null> {
  const { width = 1536, height = 1024, withAlpha = false } = options ?? {};

  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const sharp = (await import("sharp")).default;

    // imagePath is like "/memes/trollface.jpg" - need to resolve to public folder
    const publicPath = path.join(process.cwd(), "public", imagePath);

    console.log(`[readReferenceImageBuffer] Reading from: ${publicPath}`);

    const originalBuffer = await fs.readFile(publicPath);
    console.log(
      `[readReferenceImageBuffer] Original file: ${originalBuffer.length} bytes`
    );

    // Convert to PNG and resize
    let sharpInstance = sharp(originalBuffer).resize(width, height, {
      fit: "cover",
    });

    // Add alpha channel if needed (required by OpenAI edits API)
    if (withAlpha) {
      sharpInstance = sharpInstance.ensureAlpha();
    }

    const pngBuffer = await sharpInstance.png().toBuffer();

    // Use .png extension for the filename
    const originalFilename = path.basename(imagePath);
    const pngFilename = originalFilename.replace(
      /\.(jpg|jpeg|gif|webp)$/i,
      ".png"
    );

    console.log(
      `[readReferenceImageBuffer] Converted to PNG ${width}x${height}: ${pngBuffer.length} bytes (${pngFilename})`
    );

    return { buffer: pngBuffer, filename: pngFilename, width, height };
  } catch (error) {
    console.error(
      `[readReferenceImageBuffer] Failed to read/convert image:`,
      error
    );
    return null;
  }
}

/**
 * Call OpenAI Image Edit API with a reference image.
 * Uses the /images/edits endpoint to generate a new image based on the reference.
 */
async function callImageEditApi(
  prompt: string,
  apiKey: string,
  referenceImage: { buffer: Buffer; filename: string }
): Promise<GeneratedImage | null> {
  console.log(
    `[callImageEditApi] Using edits endpoint with reference: ${referenceImage.filename}`
  );

  // Create form data for multipart request
  const formData = new FormData();

  // Convert Node.js Buffer to Uint8Array then to Blob for FormData
  const uint8Array = new Uint8Array(referenceImage.buffer);
  const imageBlob = new Blob([uint8Array], { type: "image/png" });
  formData.append("image", imageBlob, referenceImage.filename);
  formData.append("prompt", prompt);
  formData.append("n", "1");
  formData.append("size", "1024x1024"); // edits endpoint only supports square sizes
  formData.append("response_format", "b64_json");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // Don't set Content-Type - let fetch set it with boundary for multipart
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(
      `[callImageEditApi] API error ${response.status}:`,
      errorData
    );

    if (
      response.status === 400 &&
      errorData?.error?.code === "content_policy_violation"
    ) {
      throw new Error("content_policy_violation");
    }

    throw new Error(
      `API error ${response.status}: ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  const imageData = data.data?.[0]?.b64_json;

  if (!imageData) {
    console.error("[callImageEditApi] No image data in response");
    return null;
  }

  const buffer = Buffer.from(imageData, "base64");
  console.log(`[callImageEditApi] Success, received ${buffer.length} bytes`);

  return {
    buffer,
    mime: "image/png",
    width: 1024,
    height: 1024,
  };
}

/**
 * Call Stability AI Image-to-Image API.
 * Uses SD3 to generate a new image based on a reference image + prompt.
 * This actually transforms the reference into something new (unlike OpenAI edits).
 */
async function callStabilityImageToImage(
  prompt: string,
  referenceImage: {
    buffer: Buffer;
    filename: string;
    width: number;
    height: number;
  },
  strength: number = 0.75 // 0.0 = identical to input, 1.0 = ignore input completely
): Promise<GeneratedImage | null> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    console.warn("[callStabilityImageToImage] No STABILITY_API_KEY set");
    return null;
  }

  console.log(
    `[callStabilityImageToImage] Using Stability AI with strength ${strength}, reference: ${referenceImage.filename}`
  );

  // Create form data for multipart request
  const formData = new FormData();

  // Convert Node.js Buffer to Blob for FormData
  const uint8Array = new Uint8Array(referenceImage.buffer);
  const imageBlob = new Blob([uint8Array], { type: "image/png" });

  formData.append("image", imageBlob, referenceImage.filename);
  formData.append("prompt", prompt);
  formData.append("strength", strength.toString());
  formData.append("output_format", "png");
  formData.append("mode", "image-to-image");
  // Note: aspect_ratio not allowed in image-to-image mode - inherits from input

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error(
      `[callStabilityImageToImage] API error ${response.status}:`,
      errorText
    );

    if (response.status === 400 && errorText.includes("content_policy")) {
      throw new Error("content_policy_violation");
    }

    throw new Error(`Stability API error ${response.status}: ${errorText}`);
  }

  // Stability returns the image directly as binary
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(
    `[callStabilityImageToImage] Success, received ${buffer.length} bytes`
  );

  // Output inherits input dimensions
  return {
    buffer,
    mime: "image/png",
    width: referenceImage.width,
    height: referenceImage.height,
  };
}

/**
 * Call OpenAI Image Generation API (standard generation without reference).
 */
async function callImageGenerationApi(
  prompt: string,
  apiKey: string,
  referenceImagePath?: string | null
): Promise<GeneratedImage | null> {
  // If we have a reference image, try Stability AI first (better for style transfer)
  if (referenceImagePath) {
    // Try Stability AI first - it's designed for image-to-image transformation
    if (process.env.STABILITY_API_KEY) {
      // Load image at 16:9 aspect ratio for YouTube thumbnails
      const refImage = await readReferenceImageBuffer(referenceImagePath, {
        width: 1536,
        height: 1024,
        withAlpha: false,
      });
      if (refImage) {
        console.log(
          `[callImageGenerationApi] Using Stability AI for style transfer`
        );
        try {
          const result = await callStabilityImageToImage(prompt, refImage, 0.7);
          if (result) {
            // Update dimensions from the actual output
            return {
              ...result,
              width: refImage.width,
              height: refImage.height,
            };
          }
        } catch (error) {
          console.warn(
            `[callImageGenerationApi] Stability AI failed, falling back to OpenAI:`,
            error
          );
        }
      }
    }

    // Fallback to OpenAI edits endpoint (requires square + alpha)
    const refImageSquare = await readReferenceImageBuffer(referenceImagePath, {
      width: 1024,
      height: 1024,
      withAlpha: true, // OpenAI requires RGBA
    });
    if (refImageSquare) {
      console.log(
        `[callImageGenerationApi] Using OpenAI edits endpoint for style transfer`
      );
      // The /images/edits endpoint has a 1000 character limit on prompts
      let editPrompt = prompt;
      if (editPrompt.length > 990) {
        console.log(
          `[callImageGenerationApi] Truncating prompt from ${editPrompt.length} to 990 chars for edits API`
        );
        const keepStart = 600;
        const keepEnd = 350;
        editPrompt =
          editPrompt.slice(0, keepStart) + " ... " + editPrompt.slice(-keepEnd);
      }
      return callImageEditApi(editPrompt, apiKey, refImageSquare);
    }

    console.warn(
      `[callImageGenerationApi] Failed to load reference, falling back to generation`
    );
  }

  console.log(
    `[callImageGenerationApi] Using model: ${IMAGE_MODEL}, size: ${IMAGE_SIZE}`
  );

  const requestBody: Record<string, unknown> = {
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size: IMAGE_SIZE,
  };

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(
      `[callImageGenerationApi] API error ${response.status}:`,
      errorData
    );

    // Check for content policy violation
    if (
      response.status === 400 &&
      errorData?.error?.code === "content_policy_violation"
    ) {
      throw new Error("content_policy_violation");
    }

    throw new Error(
      `API error ${response.status}: ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();

  // gpt-image models return b64_json in the data array
  const imageData = data.data?.[0]?.b64_json;
  const revisedPrompt = data.data?.[0]?.revised_prompt;

  if (revisedPrompt) {
    console.log(
      `[callImageGenerationApi] Model revised prompt to: ${revisedPrompt.slice(
        0,
        100
      )}...`
    );
  }

  if (!imageData) {
    // Some models return URL instead of b64_json, try to fetch it
    const imageUrl = data.data?.[0]?.url;
    if (imageUrl) {
      console.log(`[callImageGenerationApi] Fetching image from URL...`);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error(
          "[callImageGenerationApi] Failed to fetch image from URL"
        );
        return null;
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(
        `[callImageGenerationApi] Received buffer from URL: ${buffer.length} bytes`
      );

      return {
        buffer,
        width: 1536,
        height: 1024,
        mime: "image/png",
      };
    }

    console.error("[callImageGenerationApi] No image data in response");
    return null;
  }

  const buffer = Buffer.from(imageData, "base64");

  // Log buffer info for debugging
  console.log(
    `[callImageGenerationApi] Received buffer: ${
      buffer.length
    } bytes, first 8 bytes: ${buffer.slice(0, 8).toString("hex")}`
  );

  return {
    buffer,
    width: 1536,
    height: 1024,
    mime: "image/png",
  };
}

// ============================================
// BATCH GENERATION
// ============================================

/**
 * Generate base images for multiple plans.
 * Processes in batches to avoid overwhelming the API.
 */
export async function generateBaseImagesBatch(
  plans: ConceptPlan[],
  options?: {
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<Map<number, GeneratedImage | null>> {
  const { batchSize = 2, onProgress } = options ?? {};
  const results = new Map<number, GeneratedImage | null>();

  // Process in batches
  for (let i = 0; i < plans.length; i += batchSize) {
    const batch = plans.slice(i, i + batchSize);
    const batchPromises = batch.map((plan, idx) =>
      generateBaseImage(plan).then((img) => ({ index: i + idx, image: img }))
    );

    const batchResults = await Promise.all(batchPromises);

    for (const { index, image } of batchResults) {
      results.set(index, image);
    }

    onProgress?.(Math.min(i + batchSize, plans.length), plans.length);

    // Small delay between batches to be nice to the API
    if (i + batchSize < plans.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

// ============================================
// IMAGE REGENERATION
// ============================================

/**
 * Regenerate base image for a plan (with variation).
 * Uses slightly modified prompt for different result.
 */
export async function regenerateBaseImage(
  plan: ConceptPlan
): Promise<GeneratedImage | null> {
  // Build a slightly varied prompt
  const variationSuffixes = [
    " Different angle and composition.",
    " Alternative perspective.",
    " New arrangement of elements.",
    " Fresh take on the concept.",
    " Varied lighting and mood.",
  ];

  const suffix =
    variationSuffixes[Math.floor(Math.random() * variationSuffixes.length)];

  // Create a modified plan with varied prompt
  const modifiedPlan: ConceptPlan = {
    ...plan,
    basePrompt: (plan.basePrompt || buildScenePrompt(plan)) + suffix,
  };

  return generateBaseImage(modifiedPlan);
}

// ============================================
// COST ESTIMATION
// ============================================

/**
 * Estimate the cost of generating images.
 * Pricing varies by model - update as needed.
 */
export function estimateCost(
  count: number,
  quality: "standard" | "hd" = "standard"
): number {
  // gpt-image-1.5 pricing (estimate - adjust based on actual pricing)
  const pricePerImage = quality === "hd" ? 0.1 : 0.05;
  return count * pricePerImage;
}

// ============================================
// FALLBACK SCENE PROMPT
// ============================================

/**
 * Generate a fallback scene description for gradient-only fallback.
 * Used when AI generation fails but we need some visual interest.
 */
export function getFallbackSceneDescription(plan: ConceptPlan): string {
  const concept = getConcept(plan.conceptId);
  return `${concept.name}: ${concept.description}`;
}
