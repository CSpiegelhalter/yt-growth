/**
 * StylePack Registry
 *
 * Defines strong, deterministic style transformations for thumbnails.
 * Each StylePack has:
 * - promptAdditions: High-impact style descriptors added to prompts
 * - negativeAdditions: Anti-artifacts specific to the style
 * - generationParams: Model-specific parameter overrides
 * - postProcessing: Deterministic image filters to apply after generation
 * - recommendedModel: Which provider handles this style best
 *
 * GOAL: When a toggle is enabled, the effect should be IMMEDIATELY OBVIOUS.
 */

import type { MemeStyle, VisualStyle } from "./generationControls";
import type { ImageProviderType } from "./imageProvider";

// ============================================
// TYPES
// ============================================

export interface PostProcessingStep {
  type:
    | "saturation"
    | "contrast"
    | "sharpen"
    | "blur"
    | "jpeg_artifacts"
    | "posterize"
    | "chromatic_aberration"
    | "noise"
    | "outline"
    | "cel_shade"
    | "brightness"
    | "gamma";
  /** Intensity 0-100 */
  intensity: number;
  /** Additional options for the step */
  options?: Record<string, unknown>;
}

export interface StylePack {
  id: string;
  name: string;
  description: string;

  /**
   * High-impact prompt additions.
   * These are PREPENDED to ensure maximum influence.
   */
  promptPrefix: string;

  /**
   * Additional prompt phrases appended.
   */
  promptSuffix: string;

  /**
   * Additional negative prompt terms.
   */
  negativeAdditions: string;

  /**
   * Provider-specific generation parameters.
   */
  generationParams: {
    guidance_scale?: number;
    num_inference_steps?: number;
    style_preset?: string;
  };

  /**
   * Post-processing pipeline steps.
   * Applied in order after image generation.
   */
  postProcessing: PostProcessingStep[];

  /**
   * Which model handles this style best.
   */
  recommendedModel: ImageProviderType | "any";

  /**
   * Priority when multiple styles conflict (higher = wins).
   */
  priority: number;

  /**
   * Whether this style uses post-processing (vs model-only).
   */
  usePostProcessing: boolean;

  /**
   * Styles that cannot be combined with this one.
   */
  conflictsWith: string[];
}

// ============================================
// UNIVERSAL CONSTRAINTS (applied to ALL generations)
// ============================================

export const UNIVERSAL_PROMPT_SUFFIX =
  "absolutely no text, no words, no letters, no numbers, no writing, no captions, no watermarks, no logos, no signs anywhere in the image";

export const UNIVERSAL_NEGATIVE_PROMPT =
  "text, words, letters, numbers, writing, caption, watermark, logo, sign, label, gibberish text, random letters, " +
  "hands, fingers, visible hands, palm, wrist, " +
  "asymmetrical eyes, missing pupil, extra teeth, melted face, distorted features, uncanny valley, " +
  "duplicate objects, extra limbs, deformed, blurry, low quality";

// ============================================
// STYLE PACK DEFINITIONS
// ============================================

/**
 * DEEP FRIED - EXTREME post-processing style
 *
 * This MUST look like deepfriedmemes.com:
 * - HIGH contrast (crushed blacks, blown highlights)
 * - MODERATE saturation (not too red!)
 * - Heavy sharpening (crunchy edges)
 * - MULTIPLE JPEG compression passes (blocky artifacts, ringing)
 * - Noise/grain texture
 */
const deepFriedPack: StylePack = {
  id: "deepFried",
  name: "Deep Fried",
  description: "EXTREME meme effect - JPEG artifacts, high contrast, grainy",

  // Prompt additions - doesn't matter much since post-processing dominates
  promptPrefix: "bold colors, high contrast, ",

  promptSuffix: ", vibrant colors",

  negativeAdditions: "muted colors, soft",

  generationParams: {
    guidance_scale: 7,
  },

  // Mark as using DEDICATED deep fried processing (not generic pipeline)
  // The actual effect is applied via applyDeepFriedEffect() function
  postProcessing: [
    { type: "saturation", intensity: 70 }, // Reduced from 100
    { type: "contrast", intensity: 100 },
    { type: "sharpen", intensity: 100 },
    { type: "noise", intensity: 50 }, // Added noise
    { type: "jpeg_artifacts", intensity: 100 },
    { type: "jpeg_artifacts", intensity: 100 },
    { type: "jpeg_artifacts", intensity: 100 },
  ],

  recommendedModel: "any", // Post-processing handles everything
  priority: 100, // Highest priority
  usePostProcessing: true, // CRITICAL - triggers post-processing
  conflictsWith: ["photorealistic", "minimal", "clean", "cinematic"],
};

/**
 * CARTOON - Routes to OpenAI GPT-Image for COLORFUL doodle style
 *
 * Think: Kurzgesagt, Minute Physics, colorful whiteboard animations
 * - VIBRANT colors (blue, orange, green, yellow)
 * - Simple rounded characters FILLED with solid colors
 * - Playful doodle aesthetic, NOT black and white sketches
 */
const cartoonPack: StylePack = {
  id: "cartoon",
  name: "Cartoon",
  description: "Colorful doodle style with bright colors",

  // Emphasize COLOR over everything else
  promptPrefix:
    "COLORFUL CARTOON DOODLE ILLUSTRATION. " +
    "Style reference: Kurzgesagt YouTube videos, colorful infographic animations. " +
    "COLOR PALETTE (MANDATORY): bright blue, orange, green, yellow - use these colors everywhere. " +
    "Characters: simple blob-like cartoon characters with solid bright color fills (blue body, orange body, green body, or yellow body). " +
    "Faces: simple dot eyes, curved smile, NO detailed features. " +
    "Background: bold solid color or simple gradient (blue-to-orange, green-to-yellow). " +
    "Everything must be FILLED WITH BRIGHT SATURATED COLORS. " +
    "This is a VIBRANT, FUN, COLORFUL illustration - NOT a black and white sketch. ",

  promptSuffix:
    ". VIBRANT COLORS MANDATORY. Blue, orange, green, yellow color scheme. " +
    "Colorful cartoon blob characters with solid color fills. " +
    "Kurzgesagt infographic style. Bright and playful. " +
    "NEVER black and white. NEVER grayscale. NEVER pencil sketch.",

  negativeAdditions:
    "black and white, grayscale, monochrome, " +
    "pencil sketch, ink drawing, line art, uncolored, " +
    "realistic, photorealistic, photograph, real person, " +
    "muted colors, desaturated, dull, brown, gray, beige, tan, " +
    "3D render, cinematic, red background, white background",

  generationParams: {
    guidance_scale: 12,
    num_inference_steps: 50,
  },

  // Post-processing - HEAVY saturation boost to ensure vibrant colors
  postProcessing: [
    { type: "saturation", intensity: 100 }, // Maximum saturation boost
    { type: "contrast", intensity: 40 },
  ],

  // Route to OpenAI GPT-Image (DALL-E 3)
  recommendedModel: "openai",
  priority: 80,
  usePostProcessing: true,
  conflictsWith: ["photorealistic", "cinematic"],
};

/**
 * ANIME - Japanese animation style - Routes to OpenAI GPT-Image
 */
const animePack: StylePack = {
  id: "anime",
  name: "Anime",
  description: "Japanese animation style with large eyes and dynamic poses",

  promptPrefix:
    "Create an anime illustration in Japanese animation style. " +
    "Large expressive anime eyes, dynamic anime pose, cel-shaded coloring. " +
    "Anime character design with vibrant anime colors. " +
    "COLOR PALETTE: Use blues, oranges, greens, and yellows. Avoid heavy red backgrounds. " +
    "This is NOT photorealistic. This is 2D anime art. ",

  promptSuffix:
    ". Draw in anime art style with cel shading and anime aesthetic. " +
    "Use blue, orange, green, yellow color scheme. " +
    "Japanese animation quality. Not a photograph.",

  negativeAdditions:
    "photorealistic, western cartoon, 3D render, realistic proportions, " +
    "small eyes, realistic skin, photograph, real person, red background",

  generationParams: {
    guidance_scale: 8,
  },

  postProcessing: [
    { type: "saturation", intensity: 30 },
    { type: "contrast", intensity: 25 },
  ],

  // Route to OpenAI GPT-Image - better at stylization than Flux
  recommendedModel: "openai",
  priority: 75,
  usePostProcessing: true,
  conflictsWith: ["photorealistic", "cinematic", "comic-ink"],
};

/**
 * COMIC INK - Bold ink comic style
 */
const comicInkPack: StylePack = {
  id: "comic-ink",
  name: "Comic Ink",
  description: "Bold ink lines, halftone dots, classic comic book style",

  promptPrefix:
    "comic book ink art, bold black ink lines, halftone dot shading, " +
    "classic comic book style, stark black and white contrast with color, " +
    "graphic novel illustration, heavy ink outlines, ",

  promptSuffix:
    ", comic book art, ink drawing style, bold linework, graphic novel aesthetic",

  negativeAdditions:
    "photorealistic, soft gradients, airbrush, smooth blending, realistic lighting, photograph",

  generationParams: {
    guidance_scale: 8,
  },

  postProcessing: [
    { type: "contrast", intensity: 60 },
    { type: "sharpen", intensity: 40 },
  ],

  recommendedModel: "any",
  priority: 70,
  usePostProcessing: false,
  conflictsWith: ["anime", "photorealistic"],
};

/**
 * CINEMATIC - Film-like quality - Routes to Stability AI for realistic people
 */
const cinematicPack: StylePack = {
  id: "cinematic",
  name: "Cinematic",
  description:
    "Film-like color grading, dramatic lighting, movie poster quality",

  promptPrefix:
    "cinematic film still, movie poster quality, dramatic rim lighting, " +
    "professional cinematography, film color grading, shallow depth of field, " +
    "anamorphic lens look, hollywood movie aesthetic, " +
    "COLOR PALETTE: Use blues and oranges for cinematic contrast. ",

  promptSuffix:
    ", cinematic lighting, film grain, movie quality, dramatic composition, " +
    "blue and orange color grading",

  negativeAdditions:
    "cartoon, anime, flat colors, cel shading, illustration, vector art, red background",

  generationParams: {
    guidance_scale: 6,
    style_preset: "cinematic",
  },

  postProcessing: [
    { type: "contrast", intensity: 25 },
    { type: "saturation", intensity: 15 },
  ],

  // Route to Stability AI - best for realistic cinematic people
  recommendedModel: "stability",
  priority: 60,
  usePostProcessing: false,
  conflictsWith: ["cartoon", "anime", "deepFried"],
};

/**
 * PHOTOREALISTIC - Maximum realism - Routes to Stability AI
 */
const photorealisticPack: StylePack = {
  id: "photorealistic",
  name: "Photorealistic",
  description: "Ultra-realistic, professional photography quality",

  promptPrefix:
    "ultra photorealistic, professional photography, DSLR quality, " +
    "natural lighting, realistic skin texture, lifelike details, " +
    "8k resolution, sharp focus, professional studio photography, " +
    "COLOR PALETTE: Use blues, oranges, greens as accent colors. Avoid heavy red backgrounds. ",

  promptSuffix:
    ", photorealistic render, hyperrealistic details, professional photograph, " +
    "blue and orange lighting accents",

  negativeAdditions:
    "cartoon, illustration, anime, cel shading, flat colors, " +
    "unrealistic, CGI look, artificial, plastic skin, red background",

  generationParams: {
    guidance_scale: 5,
    num_inference_steps: 60,
    style_preset: "photographic",
  },

  postProcessing: [{ type: "sharpen", intensity: 20 }],

  // Route to Stability AI - best for realistic people
  recommendedModel: "stability",
  priority: 50,
  usePostProcessing: false,
  conflictsWith: ["cartoon", "anime", "comic-ink", "deepFried"],
};

/**
 * VECTOR FLAT - Clean vector illustration
 */
const vectorFlatPack: StylePack = {
  id: "vector-flat",
  name: "Vector Flat",
  description: "Clean vector shapes, flat colors, minimal shading",

  promptPrefix:
    "flat vector illustration, clean geometric shapes, minimal shading, " +
    "solid color fills, graphic design style, modern flat design, " +
    "crisp edges, simplified forms, ",

  promptSuffix: ", vector art style, flat design, clean minimal illustration",

  negativeAdditions:
    "photorealistic, gradients, 3D shading, complex textures, detailed, " +
    "realistic lighting, photograph, busy background",

  generationParams: {
    guidance_scale: 7,
  },

  postProcessing: [
    { type: "posterize", intensity: 30 },
    { type: "contrast", intensity: 30 },
  ],

  recommendedModel: "any",
  priority: 55,
  usePostProcessing: false,
  conflictsWith: ["photorealistic", "cinematic"],
};

/**
 * 3D MASCOT - Pixar-like 3D character
 */
const mascot3dPack: StylePack = {
  id: "3d-mascot",
  name: "3D Mascot",
  description: "Pixar-like 3D character, smooth surfaces, friendly design",

  promptPrefix:
    "3D rendered character, Pixar animation style, smooth rounded surfaces, " +
    "soft shadows, friendly character design, high quality 3D render, " +
    "appealing mascot design, subsurface scattering, ",

  promptSuffix: ", 3D animation quality, Pixar-like render, smooth 3D surfaces",

  negativeAdditions:
    "flat 2D, hand drawn, sketch, line art, realistic human, " +
    "low poly, angular, harsh shadows",

  generationParams: {
    guidance_scale: 6,
    style_preset: "digital-art",
  },

  postProcessing: [],

  recommendedModel: "stability",
  priority: 65,
  usePostProcessing: false,
  conflictsWith: ["comic-ink", "vector-flat"],
};

/**
 * RAGE COMIC - Classic webcomic style
 */
const rageComicPack: StylePack = {
  id: "rageComic",
  name: "Rage Comic",
  description: "Classic rage comic webcomic aesthetic, simple line art",

  promptPrefix:
    "rage comic webcomic style, black and white line art, thick uneven ink outlines, " +
    "simple crude shading, 2D flat drawing, exaggerated facial features, " +
    "early 2010s internet meme aesthetic, MS Paint webcomic style, " +
    "original character design NOT copying known meme faces, ",

  promptSuffix:
    ", rage comic art style, webcomic illustration, crude line drawing, meme aesthetic",

  negativeAdditions:
    "photorealistic, 3D render, smooth gradients, realistic lighting, " +
    "detailed shading, professional illustration, photograph, " +
    "trollface, known meme face, copyrighted character",

  generationParams: {
    guidance_scale: 8,
  },

  postProcessing: [
    { type: "contrast", intensity: 70 },
    { type: "posterize", intensity: 40 },
  ],

  recommendedModel: "any",
  priority: 85,
  usePostProcessing: false,
  conflictsWith: ["photorealistic", "cinematic", "anime"],
};

/**
 * REACTION FACE - Exaggerated expression style
 */
const reactionFacePack: StylePack = {
  id: "reactionFace",
  name: "Reaction Face",
  description:
    "Sticker-cutout style with bold outlines and exaggerated expression",

  promptPrefix:
    "sticker cutout style, bold thick black outline, high saturation colors, " +
    "exaggerated facial expression, simple flat shading, reaction meme style, " +
    "expressive face design, clearly separated from background, ",

  promptSuffix:
    ", reaction face style, bold outline, sticker aesthetic, expressive meme",

  negativeAdditions:
    "photorealistic skin texture, hyperrealistic, soft blended edges, " +
    "subtle expression, muted colors, realistic lighting",

  generationParams: {
    guidance_scale: 7,
  },

  postProcessing: [
    { type: "saturation", intensity: 50 },
    { type: "contrast", intensity: 45 },
    { type: "sharpen", intensity: 30 },
  ],

  recommendedModel: "any",
  priority: 80,
  usePostProcessing: false,
  conflictsWith: ["photorealistic", "minimal"],
};

/**
 * WOJAK-LIKE - Minimalist line art
 */
const wojakLikePack: StylePack = {
  id: "wojakLike",
  name: "Wojak-Like",
  description: "Minimalistic 2D line art portrait, simple emotional expression",

  promptPrefix:
    "minimalistic 2D line art portrait, simple web comic style, " +
    "muted but high-contrast palette, simple geometric shapes, " +
    "expressive emotion through minimal lines, original character design, ",

  promptSuffix:
    ", minimalist line art, simple emotional portrait, web comic aesthetic",

  negativeAdditions:
    "photorealistic, detailed shading, 3D render, complex textures, " +
    "realistic anatomy, wojak, feels guy, copyrighted meme",

  generationParams: {
    guidance_scale: 7,
  },

  postProcessing: [
    { type: "contrast", intensity: 50 },
    { type: "posterize", intensity: 35 },
  ],

  recommendedModel: "any",
  priority: 75,
  usePostProcessing: false,
  conflictsWith: ["photorealistic", "cinematic", "3d-mascot"],
};

/**
 * SURREAL CURSED - Absurdist meme aesthetic
 */
const surrealCursedPack: StylePack = {
  id: "surrealCursed",
  name: "Surreal Cursed",
  description: "Surreal absurdist imagery, slightly unsettling but funny",

  promptPrefix:
    "surreal absurdist meme aesthetic, dreamlike impossible scene, " +
    "unexpected object combinations, slightly unsettling but humorous, " +
    "bold color pops, simple composition with clear subject, ",

  promptSuffix:
    ", surreal meme style, absurdist composition, dreamlike quality",

  negativeAdditions:
    "body horror, grotesque, realistic, stock photo, normal everyday scene, " +
    "boring composition, muted colors",

  generationParams: {
    guidance_scale: 9, // Higher for more creative/weird results
  },

  postProcessing: [
    { type: "saturation", intensity: 40 },
    { type: "contrast", intensity: 35 },
  ],

  recommendedModel: "any",
  priority: 70,
  usePostProcessing: false,
  conflictsWith: ["photorealistic", "minimal", "clean"],
};

// ============================================
// STYLE PACK REGISTRY
// ============================================

export const STYLE_PACKS: Record<string, StylePack> = {
  // Meme styles
  deepFried: deepFriedPack,
  rageComic: rageComicPack,
  reactionFace: reactionFacePack,
  wojakLike: wojakLikePack,
  surrealCursed: surrealCursedPack,

  // Visual styles
  cartoon: cartoonPack,
  anime: animePack,
  "comic-ink": comicInkPack,
  cinematic: cinematicPack,
  photorealistic: photorealisticPack,
  "vector-flat": vectorFlatPack,
  "3d-mascot": mascot3dPack,

  // Aliases for GenerationControls mapping
  photoreal: photorealisticPack,
};

// ============================================
// STYLE PACK HELPERS
// ============================================

/**
 * Get a style pack by ID.
 */
export function getStylePack(id: string): StylePack | null {
  return STYLE_PACKS[id] ?? null;
}

/**
 * Get style pack from meme style enum.
 */
export function getStylePackForMemeStyle(
  memeStyle: MemeStyle
): StylePack | null {
  if (memeStyle === "off") return null;
  return STYLE_PACKS[memeStyle] ?? null;
}

/**
 * Get style pack from visual style enum.
 */
export function getStylePackForVisualStyle(
  visualStyle: VisualStyle
): StylePack | null {
  if (visualStyle === "auto") return null;
  return STYLE_PACKS[visualStyle] ?? null;
}

/**
 * Resolve conflicts between multiple style packs.
 * Returns the packs in priority order, removing conflicting ones.
 */
export function resolveStyleConflicts(packs: StylePack[]): StylePack[] {
  if (packs.length <= 1) return packs;

  // Sort by priority (highest first)
  const sorted = [...packs].sort((a, b) => b.priority - a.priority);

  const result: StylePack[] = [];
  const excludedIds = new Set<string>();

  for (const pack of sorted) {
    // Skip if this pack was excluded by a higher-priority pack
    if (excludedIds.has(pack.id)) continue;

    result.push(pack);

    // Add this pack's conflicts to exclusion set
    for (const conflictId of pack.conflictsWith) {
      excludedIds.add(conflictId);
    }
  }

  return result;
}

/**
 * Compose final prompt from base prompt and style packs.
 */
export function composeStyledPrompt(
  basePrompt: string,
  stylePacks: StylePack[]
): string {
  const resolvedPacks = resolveStyleConflicts(stylePacks);

  // Build prefix from all packs (highest priority first)
  const prefixes = resolvedPacks.map((p) => p.promptPrefix).filter(Boolean);

  // Build suffix from all packs
  const suffixes = resolvedPacks.map((p) => p.promptSuffix).filter(Boolean);

  // Compose: prefixes + basePrompt + suffixes + universal suffix
  const parts: string[] = [];

  if (prefixes.length > 0) {
    parts.push(prefixes.join(" "));
  }

  parts.push(basePrompt);

  if (suffixes.length > 0) {
    parts.push(suffixes.join(" "));
  }

  // Always end with universal safety suffix
  if (!basePrompt.toLowerCase().includes("no text")) {
    parts.push(UNIVERSAL_PROMPT_SUFFIX);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Compose final negative prompt from base and style packs.
 */
export function composeStyledNegativePrompt(
  baseNegativePrompt: string,
  stylePacks: StylePack[]
): string {
  const resolvedPacks = resolveStyleConflicts(stylePacks);

  const parts: string[] = [UNIVERSAL_NEGATIVE_PROMPT];

  if (baseNegativePrompt) {
    parts.push(baseNegativePrompt);
  }

  // Add negatives from all packs
  for (const pack of resolvedPacks) {
    if (pack.negativeAdditions) {
      parts.push(pack.negativeAdditions);
    }
  }

  // Deduplicate terms
  const allTerms = parts
    .join(", ")
    .split(",")
    .map((t) => t.trim().toLowerCase());
  const uniqueTerms = [...new Set(allTerms)].filter(Boolean);

  return uniqueTerms.join(", ");
}

/**
 * Get the recommended model for a set of style packs.
 * Returns the model recommended by the highest-priority pack that has a preference.
 */
export function getRecommendedModel(
  stylePacks: StylePack[]
): ImageProviderType | null {
  const resolvedPacks = resolveStyleConflicts(stylePacks);

  for (const pack of resolvedPacks) {
    if (pack.recommendedModel !== "any") {
      return pack.recommendedModel;
    }
  }

  return null;
}

/**
 * Get all post-processing steps from style packs.
 */
export function getPostProcessingPipeline(
  stylePacks: StylePack[]
): PostProcessingStep[] {
  const resolvedPacks = resolveStyleConflicts(stylePacks);

  // Collect steps from packs that use post-processing
  const steps: PostProcessingStep[] = [];

  for (const pack of resolvedPacks) {
    if (pack.usePostProcessing && pack.postProcessing.length > 0) {
      steps.push(...pack.postProcessing);
    }
  }

  return steps;
}

/**
 * Check if any style pack requires post-processing.
 */
export function requiresPostProcessing(stylePacks: StylePack[]): boolean {
  return stylePacks.some(
    (p) => p.usePostProcessing && p.postProcessing.length > 0
  );
}

// ============================================
// LOGGING / OBSERVABILITY
// ============================================

export interface StyleApplicationLog {
  selectedPacks: string[];
  resolvedPacks: string[];
  conflictsRemoved: string[];
  recommendedModel: ImageProviderType | null;
  postProcessingSteps: string[];
  promptPreview: string;
  negativePreview: string;
}

/**
 * Map GenerationControls to style pack IDs.
 * This is the bridge between UI toggles and the style system.
 */
export function getStylePackIdsFromControls(controls: {
  memeStyle?: string;
  visualStyle?: string;
  memeIntensity?: string;
}): string[] {
  const packIds: string[] = [];

  // Map meme style to pack ID
  if (controls.memeStyle && controls.memeStyle !== "off") {
    packIds.push(controls.memeStyle);
  }

  // Map visual style to pack ID (if not auto and no meme style)
  if (
    controls.visualStyle &&
    controls.visualStyle !== "auto" &&
    !packIds.length // Don't add visual style if meme style is already set
  ) {
    // Map visual style options to pack IDs
    const visualStyleMap: Record<string, string> = {
      photoreal: "photorealistic",
      cinematic: "cinematic",
      cartoon: "cartoon",
      anime: "anime",
      "3d-mascot": "3d-mascot",
      "vector-flat": "vector-flat",
      "comic-ink": "comic-ink",
    };
    const packId = visualStyleMap[controls.visualStyle];
    if (packId) {
      packIds.push(packId);
    }
  }

  return packIds;
}

/**
 * Generate a log of style application for observability.
 */
export function logStyleApplication(
  selectedPackIds: string[],
  basePrompt: string,
  baseNegativePrompt: string
): StyleApplicationLog {
  const selectedPacks = selectedPackIds
    .map((id) => getStylePack(id))
    .filter((p): p is StylePack => p !== null);

  const resolvedPacks = resolveStyleConflicts(selectedPacks);
  const resolvedIds = resolvedPacks.map((p) => p.id);

  const conflictsRemoved = selectedPackIds.filter(
    (id) => !resolvedIds.includes(id) && selectedPacks.some((p) => p.id === id)
  );

  const finalPrompt = composeStyledPrompt(basePrompt, selectedPacks);
  const finalNegative = composeStyledNegativePrompt(
    baseNegativePrompt,
    selectedPacks
  );
  const postProcessing = getPostProcessingPipeline(selectedPacks);

  return {
    selectedPacks: selectedPackIds,
    resolvedPacks: resolvedIds,
    conflictsRemoved,
    recommendedModel: getRecommendedModel(selectedPacks),
    postProcessingSteps: postProcessing.map((s) => `${s.type}:${s.intensity}`),
    promptPreview:
      finalPrompt.slice(0, 300) + (finalPrompt.length > 300 ? "..." : ""),
    negativePreview:
      finalNegative.slice(0, 200) + (finalNegative.length > 200 ? "..." : ""),
  };
}
