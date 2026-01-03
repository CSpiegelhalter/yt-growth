/**
 * OpenAI Image Generation (Concept-Driven)
 *
 * Generates scene-like base images for thumbnails using DALL-E.
 * Images must have:
 * - A clear focal subject (not just abstract backgrounds)
 * - Proper composition with space for text overlay
 * - NO text, logos, or watermarks
 * - Strong contrast and lighting
 */

import type { GeneratedImage, ConceptPlan } from "./types";
import { getConcept } from "./concepts";

// ============================================
// CONSTANTS
// ============================================

// DALL-E 3 supports 1024x1024, 1024x1792, 1792x1024
// We use landscape for YouTube thumbnails
const DALLE_SIZE = "1792x1024"; // Closest to 16:9 aspect
const DALLE_MODEL = "dall-e-3";

// Safety suffix appended to all prompts (CRITICAL - must prevent text)
const SAFETY_SUFFIX =
  "Absolutely no text, no words, no letters, no numbers, no typography, no logos, no watermarks, no brand names, no copyrighted characters, no readable writing of any kind. High quality, clean composition, suitable for YouTube thumbnail background.";

// Scene quality suffix for better images
const QUALITY_SUFFIX =
  "Professional photography or digital art style, dramatic lighting, high contrast, vibrant colors, clear focal point, depth of field where appropriate.";

// Blocked terms that should never appear in prompts
const BLOCKED_TERMS = [
  // Brands
  "nike", "adidas", "apple", "google", "microsoft", "amazon",
  "coca-cola", "pepsi", "mcdonalds", "starbucks", "youtube",
  "facebook", "instagram", "twitter", "tiktok", "netflix",
  "disney", "pixar", "marvel", "dc comics",
  // Characters
  "mickey mouse", "mario", "luigi", "pikachu", "pokemon",
  "spider-man", "batman", "superman", "iron man", "hulk",
  "darth vader", "yoda", "harry potter", "frozen", "elsa",
  // People
  "elon musk", "trump", "biden", "obama", "taylor swift",
  "beyonce", "kardashian", "pewdiepie", "mrbeast",
  // Sensitive
  "nude", "naked", "nsfw", "violence", "blood", "gore",
  "weapon", "gun", "knife", "death", "murder", "hate",
  "drugs", "cocaine", "marijuana", "alcohol",
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
 * Build a scene-focused prompt from ConceptPlan.
 * Ensures the prompt creates a compelling scene, not just a background.
 */
export function buildScenePrompt(plan: ConceptPlan): string {
  const concept = getConcept(plan.conceptId);

  // Start with the concept's prompt scaffold
  const { promptScaffold, constraints } = concept;

  // Build the scene description
  let prompt = "";

  // 1. Scene opener from scaffold
  prompt += promptScaffold.prefix + " ";

  // 2. Subject description
  if (plan.subjects) {
    prompt += plan.subjects + ". ";
  }

  // 3. Composition guidance
  prompt += promptScaffold.compositionGuidance + ". ";

  // 4. Empty space for text
  prompt += constraints.emptySpaceNote + ". ";

  // 5. Color/mood guidance
  prompt += constraints.colorGuidance + ". ";

  // 6. Quality suffix
  prompt += QUALITY_SUFFIX + " ";

  // 7. Safety suffix (CRITICAL)
  prompt += SAFETY_SUFFIX;

  return prompt;
}

/**
 * Sanitize and harden a prompt for safe image generation.
 */
export function hardenPrompt(
  plan: ConceptPlan
): { prompt: string; blocked: boolean; reason?: string } {
  // Build the scene prompt
  let prompt = plan.basePrompt || buildScenePrompt(plan);

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

  // Ensure safety suffix is present
  if (!lowerPrompt.includes("no text")) {
    prompt += " " + SAFETY_SUFFIX;
  }

  // Add negative prompt elements
  if (plan.negativePrompt) {
    prompt += ` Avoid: ${plan.negativePrompt}.`;
  }

  // Truncate to avoid token limits
  if (prompt.length > 1000) {
    prompt = prompt.slice(0, 950) + "... " + SAFETY_SUFFIX;
  }

  return { prompt, blocked: false };
}

// ============================================
// IMAGE GENERATION
// ============================================

/**
 * Generate a base image using DALL-E.
 */
export async function generateBaseImage(
  plan: ConceptPlan
): Promise<GeneratedImage | null> {
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

  // Harden the prompt
  const { prompt, blocked, reason } = hardenPrompt(plan);
  if (blocked) {
    console.warn(`[generateBaseImage] Prompt blocked: ${reason}`);
    return null;
  }

  console.log(`[generateBaseImage] Generating for concept: ${plan.conceptId}`);
  console.log(`[generateBaseImage] Prompt (truncated): ${prompt.slice(0, 200)}...`);

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DALLE_MODEL,
        prompt,
        n: 1,
        size: DALLE_SIZE,
        response_format: "b64_json",
        quality: "standard", // Use "hd" for higher quality (more expensive)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        `[generateBaseImage] API error ${response.status}:`,
        errorData
      );

      // Check for content policy violation
      if (
        response.status === 400 &&
        errorData?.error?.code === "content_policy_violation"
      ) {
        console.warn("[generateBaseImage] Content policy violation, using fallback");
        return null;
      }

      return null;
    }

    const data = await response.json();
    const imageData = data.data?.[0]?.b64_json;

    if (!imageData) {
      console.error("[generateBaseImage] No image data in response");
      return null;
    }

    const buffer = Buffer.from(imageData, "base64");

    // DALL-E 3 returns 1792x1024 for landscape
    return {
      buffer,
      width: 1792,
      height: 1024,
      mime: "image/png",
    };
  } catch (err) {
    console.error("[generateBaseImage] Error:", err);
    return null;
  }
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

  const suffix = variationSuffixes[Math.floor(Math.random() * variationSuffixes.length)];

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
 * DALL-E 3 pricing (as of 2024):
 * - Standard 1024x1024: $0.040
 * - Standard 1024x1792 or 1792x1024: $0.080
 * - HD 1024x1024: $0.080
 * - HD 1024x1792 or 1792x1024: $0.120
 */
export function estimateCost(
  count: number,
  quality: "standard" | "hd" = "standard"
): number {
  const pricePerImage = quality === "hd" ? 0.12 : 0.08;
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
