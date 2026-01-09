/**
 * Thumbnail Generator Zod Schemas
 *
 * Validation schemas for concept-driven thumbnail data.
 * Includes strict validation for hook text, prompt safety,
 * and guardrails against using full titles verbatim.
 */

import { z } from "zod";
import { CONCEPT_IDS } from "./concepts";
import { generationControlsSchema } from "./generationControls";

// ============================================
// BASIC VALIDATORS
// ============================================

/** Hex color validator - accepts #RGB, #RRGGBB formats */
export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color")
  .transform((v) => v.toUpperCase());

/** Text field with trim and max length */
const trimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Text must be ${maxLength} characters or less`);

// ============================================
// JOB INPUT SCHEMA
// ============================================

export const thumbnailStyleSchema = z.enum([
  "Bold",
  "Minimal",
  "Neon",
  "Clean",
  "Dramatic",
]);

export const thumbnailJobInputSchema = z.object({
  title: trimmedString(200).min(1, "Title is required"),
  description: trimmedString(1000).min(
    10,
    "Description is required (min 10 characters). Explain what happens in the video or what the viewer learns."
  ),
  topic: trimmedString(100).optional(),
  audience: trimmedString(100).optional(),
  style: thumbnailStyleSchema.optional().default("Bold"),
  count: z.coerce.number().int().min(1).max(12).optional().default(12),
  assetId: z.string().uuid().optional(),
  aiBase: z.boolean().optional().default(true),
  // Generation controls for fine-tuning subject, style, meme, environment, color, text
  controls: generationControlsSchema.optional(),
});

export type ThumbnailJobInputSchema = z.infer<typeof thumbnailJobInputSchema>;

// ============================================
// PALETTE SCHEMA
// ============================================

export const thumbnailPaletteSchema = z.object({
  bg1: hexColorSchema,
  bg2: hexColorSchema,
  accent: hexColorSchema,
  text: hexColorSchema,
});

// ============================================
// CONCEPT PLAN SCHEMA (NEW)
// ============================================

export const conceptIdSchema = z.enum(
  CONCEPT_IDS as unknown as [string, ...string[]]
);

export const emotionToneSchema = z.enum([
  "urgent",
  "curious",
  "clean",
  "dramatic",
  "playful",
  "professional",
  "shocking",
  "mysterious",
]);

export const textSafeAreaSchema = z.enum([
  "left",
  "right",
  "top",
  "bottom",
  "center",
]);

export const focalPositionSchema = z.enum(["left", "right", "center", "split"]);

export const backgroundComplexitySchema = z.enum(["low", "medium", "high"]);

export const bigSymbolSchema = z.enum([
  "X",
  "CHECK",
  "VS",
  "ARROW",
  "QUESTION",
  "NONE",
]);

export const badgeStyleSchema = z.enum([
  "pill",
  "corner-flag",
  "stamp",
  "ribbon",
  "circle",
]);

export const overlayElementTypeSchema = z.enum([
  "arrow",
  "circle",
  "glow",
  "blur-region",
  "split-line",
  "badge",
  "big-symbol",
]);

export const badgeDirectiveSchema = z.object({
  text: z.string().trim(),
  style: badgeStyleSchema,
  position: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
    .optional(),
});

export const highlightDirectiveSchema = z.object({
  type: overlayElementTypeSchema,
  target: z.enum(["subject", "secondary", "custom"]).optional(),
  color: hexColorSchema.optional(),
});

export const compositionDirectivesSchema = z.object({
  textSafeArea: textSafeAreaSchema,
  focalSubjectPosition: focalPositionSchema,
  backgroundComplexity: backgroundComplexitySchema,
});

export const overlayDirectivesSchema = z.object({
  badges: z.array(badgeDirectiveSchema).default([]),
  highlights: z.array(highlightDirectiveSchema).default([]),
  bigSymbol: bigSymbolSchema.default("NONE"),
});

/**
 * Hook text validation - short punchy text for thumbnails.
 * Trust the LLM to generate appropriate length.
 */
export const hookTextSchema = z.string().trim().min(1, "Hook text is required");

/**
 * Base prompt validation.
 * Trust the LLM - no arbitrary length limits.
 */
export const basePromptSchema = z
  .string()
  .trim()
  .min(10, "Base prompt too short");

export const negativePromptSchema = z
  .string()
  .trim()
  .default("text, words, letters, logos, watermarks, brands, signatures");

export const subjectsSchema = z.string().trim().default("");

/**
 * Full ConceptPlan schema.
 */
export const conceptPlanSchema = z.object({
  conceptId: conceptIdSchema,
  hookText: hookTextSchema,
  subHook: z.string().trim().optional(),
  emotionTone: emotionToneSchema,
  palette: thumbnailPaletteSchema,
  composition: compositionDirectivesSchema,
  basePrompt: basePromptSchema,
  negativePrompt: negativePromptSchema,
  overlayDirectives: overlayDirectivesSchema,
  subjects: subjectsSchema,
});

export type ConceptPlanSchema = z.infer<typeof conceptPlanSchema>;

// ============================================
// CONCEPT SPEC SCHEMA (Plan + User Edits)
// ============================================

export const conceptSpecSchema = z.object({
  plan: conceptPlanSchema,
  hookText: z.string().trim().optional(),
  subHook: z.string().trim().optional(),
  palette: thumbnailPaletteSchema.partial().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  outline: z.boolean().optional(),
  shadow: z.boolean().optional(),
  showBadges: z.boolean().optional(),
  showSymbol: z.boolean().optional(),
  showHighlights: z.boolean().optional(),
  badgeText: z.string().trim().optional(),
});

export type ConceptSpecSchema = z.infer<typeof conceptSpecSchema>;

// ============================================
// RERENDER PATCH SCHEMA
// ============================================

export const rerenderPatchSchema = z.object({
  hookText: z.string().trim().optional(),
  subHook: z.string().trim().optional(),
  badgeText: z.string().trim().optional(),
  palette: thumbnailPaletteSchema.partial().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  outline: z.boolean().optional(),
  shadow: z.boolean().optional(),
  showBadges: z.boolean().optional(),
  showSymbol: z.boolean().optional(),
  showHighlights: z.boolean().optional(),
});

export type RerenderPatchSchema = z.infer<typeof rerenderPatchSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse and validate a ConceptPlan from JSON string.
 * Returns null if parsing fails.
 */
export function parsePlanJson(json: string): ConceptPlanSchema | null {
  try {
    const parsed = JSON.parse(json);
    const result = conceptPlanSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Parse and validate a ConceptSpec from JSON string.
 * Returns null if parsing fails.
 */
export function parseSpecJson(json: string): ConceptSpecSchema | null {
  try {
    const parsed = JSON.parse(json);
    const result = conceptSpecSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Normalize job input with defaults.
 */
export function normalizeJobInput(
  input: unknown
): ThumbnailJobInputSchema | null {
  const result = thumbnailJobInputSchema.safeParse(input);
  return result.success ? result.data : null;
}

// ============================================
// GUARDRAIL FUNCTIONS
// ============================================

/**
 * Check if hook text is too similar to the original title.
 * Returns true if similarity exceeds threshold.
 */
export function isHookTooSimilarToTitle(
  hookText: string,
  title: string,
  threshold: number = 0.7
): boolean {
  const normalizeText = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const hookWords = normalizeText(hookText);
  const titleWords = normalizeText(title);

  if (hookWords.length === 0 || titleWords.length === 0) return false;

  // Count overlapping words
  const hookSet = new Set(hookWords);
  const overlap = titleWords.filter((w) => hookSet.has(w)).length;

  // Calculate similarity as ratio of overlap to hook length
  const similarity = overlap / hookWords.length;

  return similarity >= threshold;
}

/**
 * Shorten hook text to meet word count limit.
 */
export function shortenHookText(text: string, maxWords: number = 5): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

/**
 * Ensure base prompt includes comprehensive safety suffix.
 */
export function ensurePromptSafety(prompt: string): string {
  const safetyClause =
    "absolutely no text, no words, no letters, no numbers, no writing, no captions, no watermarks, no logos, no signs anywhere in the image";
  const lower = prompt.toLowerCase();

  if (!lower.includes("no text")) {
    return `${prompt}. ${safetyClause}`;
  }
  return prompt;
}

// ============================================
// LEGACY ALIASES (backward compatibility)
// ============================================

/** @deprecated Use conceptPlanSchema */
export const thumbnailPlanSchema = conceptPlanSchema;
export type ThumbnailPlanSchema = ConceptPlanSchema;

/** @deprecated Use conceptSpecSchema */
export const thumbnailSpecSchema = conceptSpecSchema;
export type ThumbnailSpecSchema = ConceptSpecSchema;
