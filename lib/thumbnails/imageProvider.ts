/**
 * Unified Image Provider with Style System
 *
 * Abstraction layer for switching between image generation APIs:
 * - replicate: Flux Thumbnails (recommended for YouTube thumbnails)
 * - stability: Stability AI SD3
 * - openai: DALL-E / GPT-Image
 *
 * STYLE SYSTEM: Style toggles (cartoon, deepFried, etc.) are enforced at generation:
 * 1. StylePacks modify prompts with strong style descriptors
 * 2. Model routing selects the best provider for each style
 * 3. Post-processing pipeline applies deterministic effects (deep fried, etc.)
 *
 * Configure via IMAGE_PROVIDER env var (default: "replicate")
 *
 * Usage:
 *   const result = await generateStyledImage({
 *     prompt: "...",
 *     stylePacks: ["deepFried", "cartoon"]
 *   });
 */

import {
  type StylePack,
  getStylePack,
  composeStyledPrompt,
  composeStyledNegativePrompt,
  getRecommendedModel,
  getPostProcessingPipeline,
  requiresPostProcessing,
  logStyleApplication,
  UNIVERSAL_PROMPT_SUFFIX,
  UNIVERSAL_NEGATIVE_PROMPT,
} from "./stylePacks";
import {
  applyPostProcessing,
  applyDeepFriedEffect,
  applyCartoonEnhancement,
} from "./imagePostProcess";

// ============================================
// TYPES
// ============================================

export interface ImageGenerationOptions {
  /** Main prompt describing the image */
  prompt: string;
  /** Negative prompt - what to avoid */
  negativePrompt?: string;
  /** Aspect ratio (default: "16:9") */
  aspectRatio?: "16:9" | "1:1" | "9:16";
  /** Number of images to generate */
  numOutputs?: number;
  /** Seed for reproducibility */
  seed?: number;
  /** Style preset (provider-specific) */
  stylePreset?: string;
}

export interface StyledImageGenerationOptions extends ImageGenerationOptions {
  /** Style pack IDs to apply (e.g., ["deepFried", "cartoon"]) */
  stylePackIds?: string[];
  /** Style strength override (0-100, default varies by style) */
  styleStrength?: number;
  /** Force specific provider (overrides style pack recommendation) */
  forceProvider?: ImageProviderType;
}

export interface GeneratedImageResult {
  /** Image data as Buffer */
  buffer: Buffer;
  /** MIME type */
  mime: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Seed used (if available) */
  seed?: number;
  /** Provider used */
  provider: ImageProviderType;
  /** Generation time in seconds */
  duration?: number;
  /** Style packs that were applied */
  appliedStyles?: string[];
  /** Post-processing steps that were applied */
  postProcessingSteps?: string[];
}

export type ImageProviderType = "replicate" | "stability" | "openai";

export interface ImageProvider {
  name: ImageProviderType;
  isAvailable(): boolean;
  generate(options: ImageGenerationOptions): Promise<GeneratedImageResult>;
}

// ============================================
// REPLICATE PROVIDER (Flux Thumbnails)
// ============================================

const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const FLUX_MODEL = "justmalhar/flux-thumbnails-v2";

let fluxVersionCache: string | null = null;

async function getFluxVersion(apiKey: string): Promise<string> {
  if (fluxVersionCache) return fluxVersionCache;

  console.log(`[imageProvider:replicate] Fetching model version...`);
  const response = await fetch(`${REPLICATE_API_BASE}/models/${FLUX_MODEL}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Flux model: ${response.status}`);
  }

  const data = await response.json();
  fluxVersionCache = data.latest_version?.id;

  if (!fluxVersionCache) {
    throw new Error(`No version found for ${FLUX_MODEL}`);
  }

  return fluxVersionCache;
}

async function pollReplicatePrediction(
  predictionId: string,
  apiKey: string,
  maxWaitMs = 120000
): Promise<string[]> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `${REPLICATE_API_BASE}/predictions/${predictionId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!response.ok) {
      throw new Error(`Failed to poll prediction: ${response.status}`);
    }

    const prediction = await response.json();

    if (prediction.status === "succeeded") {
      return prediction.output ?? [];
    }

    if (prediction.status === "failed") {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    if (prediction.status === "canceled") {
      throw new Error("Prediction was canceled");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Prediction timed out");
}

const replicateProvider: ImageProvider = {
  name: "replicate",

  isAvailable(): boolean {
    return !!process.env.REPLICATE_API_KEY;
  },

  async generate(
    options: ImageGenerationOptions
  ): Promise<GeneratedImageResult> {
    const apiKey = process.env.REPLICATE_API_KEY;
    if (!apiKey) {
      throw new Error("REPLICATE_API_KEY not configured");
    }

    const startTime = Date.now();

    // Flux Thumbnails uses a trigger word
    const thumbnailPrompt = `a youtube thumbnail in the style of YTTHUMBNAIL, ${options.prompt}`;

    console.log(`[imageProvider:replicate] Generating with Flux Thumbnails`);
    console.log(
      `[imageProvider:replicate] Prompt: ${thumbnailPrompt.slice(0, 200)}...`
    );

    const modelVersion = await getFluxVersion(apiKey);

    const response = await fetch(`${REPLICATE_API_BASE}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          model: "dev",
          prompt: thumbnailPrompt,
          lora_scale: 1,
          num_outputs: options.numOutputs ?? 1,
          aspect_ratio: options.aspectRatio ?? "16:9",
          output_format: "png",
          guidance_scale: 3.5,
          output_quality: 100,
          prompt_strength: 0.8,
          extra_lora_scale: 1,
          num_inference_steps: 50,
          ...(options.seed !== undefined && { seed: options.seed }),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(`Replicate API error ${response.status}: ${error}`);
    }

    const prediction = await response.json();
    const imageUrls = await pollReplicatePrediction(prediction.id, apiKey);

    if (imageUrls.length === 0) {
      throw new Error("Replicate returned no images");
    }

    // Fetch the first image
    const imageRes = await fetch(imageUrls[0]);
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image: ${imageRes.status}`);
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const duration = (Date.now() - startTime) / 1000;

    console.log(
      `[imageProvider:replicate] Generated in ${duration.toFixed(1)}s, ${
        buffer.length
      } bytes`
    );

    return {
      buffer,
      mime: "image/png",
      width: 1536,
      height: 864,
      provider: "replicate",
      duration,
    };
  },
};

// ============================================
// STABILITY AI PROVIDER (SD3)
// ============================================

const STABILITY_API_BASE = "https://api.stability.ai/v2beta/stable-image";

const stabilityProvider: ImageProvider = {
  name: "stability",

  isAvailable(): boolean {
    return !!process.env.STABILITY_API_KEY;
  },

  async generate(
    options: ImageGenerationOptions
  ): Promise<GeneratedImageResult> {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      throw new Error("STABILITY_API_KEY not configured");
    }

    const startTime = Date.now();

    console.log(`[imageProvider:stability] Generating with SD3`);
    console.log(
      `[imageProvider:stability] Prompt: ${options.prompt.slice(0, 200)}...`
    );

    // Build prompt for YouTube thumbnails
    const prompt = [
      "Professional YouTube thumbnail, 16:9 aspect ratio.",
      options.prompt,
      "High contrast, vibrant colors, dramatic lighting.",
      "No text, no watermarks, no logos.",
    ].join(" ");

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("aspect_ratio", options.aspectRatio ?? "16:9");
    formData.append("output_format", "png");

    if (options.negativePrompt) {
      formData.append("negative_prompt", options.negativePrompt);
    } else {
      formData.append(
        "negative_prompt",
        "text, words, letters, watermark, logo, hands, fingers, low quality, blurry"
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
      throw new Error(`Stability API error ${response.status}: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const duration = (Date.now() - startTime) / 1000;

    const seedHeader = response.headers.get("x-seed");
    const seed = seedHeader ? parseInt(seedHeader, 10) : undefined;

    console.log(
      `[imageProvider:stability] Generated in ${duration.toFixed(1)}s, ${
        buffer.length
      } bytes`
    );

    return {
      buffer,
      mime: "image/png",
      width: 1536,
      height: 864,
      seed,
      provider: "stability",
      duration,
    };
  },
};

// ============================================
// OPENAI PROVIDER (GPT-Image for cartoon/stylized)
// ============================================

const openaiProvider: ImageProvider = {
  name: "openai",

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },

  async generate(
    options: ImageGenerationOptions
  ): Promise<GeneratedImageResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const startTime = Date.now();

    console.log(`[imageProvider:openai] Generating with gpt-image-1`);
    console.log(
      `[imageProvider:openai] Prompt: ${options.prompt.slice(0, 300)}...`
    );

    // Add YouTube thumbnail best practices for colors
    // BOGY palette (Blue, Orange, Green, Yellow) - avoid heavy red/white/black
    const colorGuidance =
      "Use YouTube-optimized colors: blues, oranges, greens, and yellows. Avoid heavy red, white, or black backgrounds as they blend with YouTube's UI.";

    const prompt = `YouTube thumbnail image (16:9 aspect ratio). ${colorGuidance} ${options.prompt}`;

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          n: 1,
          size: "1536x1024", // 16:9 ish
          quality: "high",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error ${response.status}: ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const imageData = data.data?.[0]?.b64_json;
    const imageUrl = data.data?.[0]?.url;

    let buffer: Buffer;

    if (imageData) {
      buffer = Buffer.from(imageData, "base64");
    } else if (imageUrl) {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageRes.status}`);
      }
      buffer = Buffer.from(await imageRes.arrayBuffer());
    } else {
      throw new Error("No image data in OpenAI response");
    }

    const duration = (Date.now() - startTime) / 1000;

    console.log(
      `[imageProvider:openai] Generated in ${duration.toFixed(1)}s, ${
        buffer.length
      } bytes`
    );

    return {
      buffer,
      mime: "image/png",
      width: 1536,
      height: 1024,
      provider: "openai",
      duration,
    };
  },
};

// ============================================
// PROVIDER REGISTRY
// ============================================

const providers: Record<ImageProviderType, ImageProvider> = {
  replicate: replicateProvider,
  stability: stabilityProvider,
  openai: openaiProvider,
};

/**
 * Get the currently configured image provider.
 *
 * Set IMAGE_PROVIDER env var to: "replicate" | "stability" | "openai"
 * Default: "replicate" (Flux Thumbnails - best for YouTube thumbnails)
 */
export function getImageProvider(): ImageProvider {
  const configured =
    (process.env.IMAGE_PROVIDER as ImageProviderType) || "replicate";

  const provider = providers[configured];
  if (!provider) {
    throw new Error(
      `Unknown IMAGE_PROVIDER: ${configured}. Use: replicate, stability, or openai`
    );
  }

  if (!provider.isAvailable()) {
    // Try to find an available fallback
    const available = Object.values(providers).find((p) => p.isAvailable());
    if (available) {
      console.warn(
        `[imageProvider] ${configured} not available (missing API key), falling back to ${available.name}`
      );
      return available;
    }
    throw new Error(
      `No image provider available. Configure one of: REPLICATE_API_KEY, STABILITY_API_KEY, OPENAI_API_KEY`
    );
  }

  return provider;
}

/**
 * Get a specific provider by name.
 */
export function getProviderByName(name: ImageProviderType): ImageProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return provider;
}

/**
 * List all available providers (those with configured API keys).
 */
export function getAvailableProviders(): ImageProviderType[] {
  return Object.entries(providers)
    .filter(([_, p]) => p.isAvailable())
    .map(([name]) => name as ImageProviderType);
}

/**
 * Generate an image using the configured provider.
 *
 * Convenience function that gets the provider and generates in one call.
 * For styled images with toggles, use generateStyledImage instead.
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<GeneratedImageResult> {
  const provider = getImageProvider();
  console.log(`[imageProvider] Using provider: ${provider.name}`);
  return provider.generate(options);
}

// ============================================
// STYLED IMAGE GENERATION (with StylePacks)
// ============================================

/**
 * Generate an image with style packs applied.
 *
 * This is the main function for styled thumbnail generation:
 * 1. Resolves style packs and their conflicts
 * 2. Composes final prompts with style additions
 * 3. Routes to recommended model (or uses default)
 * 4. Applies post-processing pipeline if needed
 *
 * Style toggles (cartoon, deepFried, etc.) should use this function
 * to ensure the effect is STRONG and CONSISTENT.
 */
export async function generateStyledImage(
  options: StyledImageGenerationOptions
): Promise<GeneratedImageResult> {
  const startTime = Date.now();
  const {
    stylePackIds = [],
    styleStrength,
    forceProvider,
    ...baseOptions
  } = options;

  // Load style packs
  const stylePacks: StylePack[] = stylePackIds
    .map((id) => getStylePack(id))
    .filter((p): p is StylePack => p !== null);

  // Log style application for observability
  const styleLog = logStyleApplication(
    stylePackIds,
    options.prompt,
    options.negativePrompt ?? ""
  );

  console.log(`[imageProvider] ========== STYLE APPLICATION ==========`);
  console.log(
    `[imageProvider] Selected packs: ${
      styleLog.selectedPacks.join(", ") || "none"
    }`
  );
  console.log(
    `[imageProvider] Resolved packs: ${
      styleLog.resolvedPacks.join(", ") || "none"
    }`
  );
  if (styleLog.conflictsRemoved.length > 0) {
    console.log(
      `[imageProvider] Conflicts removed: ${styleLog.conflictsRemoved.join(
        ", "
      )}`
    );
  }
  console.log(
    `[imageProvider] Recommended model: ${styleLog.recommendedModel ?? "any"}`
  );
  console.log(
    `[imageProvider] Post-processing: ${
      styleLog.postProcessingSteps.join(", ") || "none"
    }`
  );
  console.log(`[imageProvider] Prompt preview: ${styleLog.promptPreview}`);
  console.log(`[imageProvider] =======================================`);

  // Compose final prompts with style additions
  const finalPrompt =
    stylePacks.length > 0
      ? composeStyledPrompt(options.prompt, stylePacks)
      : ensureUniversalSuffix(options.prompt);

  const finalNegativePrompt =
    stylePacks.length > 0
      ? composeStyledNegativePrompt(options.negativePrompt ?? "", stylePacks)
      : ensureUniversalNegatives(options.negativePrompt ?? "");

  console.log(`[imageProvider] ========== FINAL PROMPTS ==========`);
  console.log(`[imageProvider] Final prompt: ${finalPrompt.slice(0, 400)}...`);
  console.log(
    `[imageProvider] Final negative: ${finalNegativePrompt.slice(0, 200)}...`
  );
  console.log(`[imageProvider] ==================================`);

  // Determine which provider to use
  let targetProvider: ImageProvider;

  if (forceProvider) {
    targetProvider = getProviderByName(forceProvider);
    console.log(`[imageProvider] Using forced provider: ${forceProvider}`);
  } else {
    const recommendedModel = getRecommendedModel(stylePacks);
    if (recommendedModel) {
      const recommended = providers[recommendedModel];
      if (recommended.isAvailable()) {
        targetProvider = recommended;
        console.log(
          `[imageProvider] Using style-recommended provider: ${recommendedModel}`
        );
      } else {
        targetProvider = getImageProvider();
        console.log(
          `[imageProvider] Recommended ${recommendedModel} not available, using default`
        );
      }
    } else {
      targetProvider = getImageProvider();
      console.log(
        `[imageProvider] Using default provider: ${targetProvider.name}`
      );
    }
  }

  // Generate base image
  let result = await targetProvider.generate({
    ...baseOptions,
    prompt: finalPrompt,
    negativePrompt: finalNegativePrompt,
  });

  // Apply post-processing if needed
  const resolvedPackIds = styleLog.resolvedPacks;
  const needsPostProcessing = requiresPostProcessing(stylePacks);

  if (needsPostProcessing) {
    // Check for specific style treatments
    const hasDeepFried = resolvedPackIds.includes("deepFried");
    const hasCartoon = resolvedPackIds.includes("cartoon");

    if (hasDeepFried) {
      // Use DEDICATED deep fried function for maximum effect
      console.log(`[imageProvider] Applying EXTREME DEEP FRIED effect`);
      const strength = styleStrength ?? 100; // Default to maximum
      const postResult = await applyDeepFriedEffect(result.buffer, strength);

      result = {
        ...result,
        buffer: postResult.buffer,
        postProcessingSteps: postResult.stepsApplied,
      };

      console.log(
        `[imageProvider] Deep fried complete: ${postResult.stepsApplied.length} steps`
      );
    } else if (hasCartoon) {
      // Use cartoon enhancement
      console.log(`[imageProvider] Applying cartoon enhancement`);
      const strength = styleStrength ?? 70;
      const postResult = await applyCartoonEnhancement(result.buffer, strength);

      result = {
        ...result,
        buffer: postResult.buffer,
        postProcessingSteps: postResult.stepsApplied,
      };

      console.log(`[imageProvider] Cartoon enhancement complete`);
    } else {
      // Generic post-processing pipeline
      const postProcessingSteps = getPostProcessingPipeline(stylePacks);

      if (postProcessingSteps.length > 0) {
        console.log(
          `[imageProvider] Applying ${postProcessingSteps.length} generic post-processing steps`
        );

        const scaledSteps =
          styleStrength !== undefined
            ? postProcessingSteps.map((step) => ({
                ...step,
                intensity: Math.min(
                  100,
                  Math.round(step.intensity * (styleStrength / 70))
                ),
              }))
            : postProcessingSteps;

        const postResult = await applyPostProcessing(
          result.buffer,
          scaledSteps
        );

        result = {
          ...result,
          buffer: postResult.buffer,
          postProcessingSteps: postResult.stepsApplied,
        };

        console.log(
          `[imageProvider] Post-processing complete: ${postResult.stepsApplied.join(
            ", "
          )}`
        );
      }
    }
  }

  const totalDuration = (Date.now() - startTime) / 1000;

  return {
    ...result,
    appliedStyles: styleLog.resolvedPacks,
    duration: totalDuration,
  };
}

/**
 * Ensure prompt ends with universal safety suffix.
 */
function ensureUniversalSuffix(prompt: string): string {
  if (prompt.toLowerCase().includes("no text")) {
    return prompt;
  }
  return `${prompt}. ${UNIVERSAL_PROMPT_SUFFIX}`;
}

/**
 * Ensure negative prompt includes universal constraints.
 */
function ensureUniversalNegatives(negativePrompt: string): string {
  const parts = [UNIVERSAL_NEGATIVE_PROMPT];
  if (negativePrompt) {
    parts.push(negativePrompt);
  }
  return parts.join(", ");
}

// ============================================
// CONVENIENCE FUNCTIONS FOR SPECIFIC STYLES
// ============================================

/**
 * Generate a deep-fried style image.
 * Convenience wrapper that applies the deepFried style pack.
 */
export async function generateDeepFriedImage(
  options: ImageGenerationOptions,
  strength: number = 70
): Promise<GeneratedImageResult> {
  return generateStyledImage({
    ...options,
    stylePackIds: ["deepFried"],
    styleStrength: strength,
  });
}

/**
 * Generate a cartoon style image.
 * Convenience wrapper that applies the cartoon style pack.
 */
export async function generateCartoonImage(
  options: ImageGenerationOptions,
  strength: number = 80
): Promise<GeneratedImageResult> {
  return generateStyledImage({
    ...options,
    stylePackIds: ["cartoon"],
    styleStrength: strength,
  });
}

/**
 * Generate an anime style image.
 */
export async function generateAnimeImage(
  options: ImageGenerationOptions
): Promise<GeneratedImageResult> {
  return generateStyledImage({
    ...options,
    stylePackIds: ["anime"],
  });
}

/**
 * Generate a cinematic style image.
 */
export async function generateCinematicImage(
  options: ImageGenerationOptions
): Promise<GeneratedImageResult> {
  return generateStyledImage({
    ...options,
    stylePackIds: ["cinematic"],
  });
}
