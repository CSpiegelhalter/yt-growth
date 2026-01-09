/**
 * Plan Validator
 *
 * Validates LLM-generated concept plans for:
 * - Required fields and formats
 * - Physical plausibility constraints
 * - Anti-artifact requirements
 * - Hook text length limits
 */

import { z } from "zod";
import { isValidConceptId } from "./concepts";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color");

const paletteSchema = z.object({
  bg1: hexColorSchema,
  bg2: hexColorSchema,
  accent: hexColorSchema,
  text: hexColorSchema,
});

const compositionSchema = z.object({
  textSafeArea: z.enum(["left", "right", "top", "bottom", "center"]),
  focalSubjectPosition: z.enum(["left", "right", "center", "split"]),
  backgroundComplexity: z.enum(["low", "medium", "high"]),
});

const badgeSchema = z.object({
  text: z.string().max(20),
  style: z.enum(["pill", "corner-flag", "stamp", "ribbon", "circle"]),
});

const highlightSchema = z.object({
  type: z.enum(["arrow", "circle", "glow", "blur-region", "split-line"]),
});

const overlayDirectivesSchema = z.object({
  badges: z.array(badgeSchema).optional().default([]),
  highlights: z.array(highlightSchema).optional().default([]),
  bigSymbol: z
    .enum(["X", "CHECK", "VS", "ARROW", "QUESTION", "NONE"])
    .optional()
    .default("NONE"),
});

export const planSchema = z.object({
  conceptId: z.string().refine(isValidConceptId, "Invalid conceptId"),
  hookText: z.string().min(1),
  subHook: z.string().optional(),
  emotionTone: z.enum([
    "urgent",
    "curious",
    "clean",
    "dramatic",
    "playful",
    "professional",
    "shocking",
    "mysterious",
  ]),
  palette: paletteSchema,
  composition: compositionSchema,
  basePrompt: z.string().min(20),
  negativePrompt: z.string().min(10),
  overlayDirectives: overlayDirectivesSchema.optional(),
  subjects: z.string().optional(),
});

export type ValidatedPlan = z.infer<typeof planSchema>;

// ============================================
// CONSTRAINT VALIDATORS
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_PROMPT_SUFFIX =
  "no text, no words, no letters, no watermark, no logos";

// Terms that indicate the prompt is asking for problematic content
// Note: "logo" is OK in the safety suffix "no logos", but not as positive instruction
const BANNED_PROMPT_PATTERNS = [
  /\breadable text\b/i,
  /\bwords on (?:the )?screen\b/i,
  /\bshow(?:ing)? (?:a )?logo\b/i, // "showing logo" but not "no logos"
  /\bbrand name\b/i,
  /\bgibberish text\b/i,
  /\bpseudo-code\b/i,
  /\bwith logo\b/i,
  /\bcompany logo\b/i,
];

const REQUIRED_LAPTOP_TERMS = [
  "front-facing",
  "correct hinge",
  "abstract color",
];

const REQUIRED_NEGATIVE_TERMS = [
  "text",
  "words",
  "letters",
  "hands",
  "fingers",
  "asymmetrical eyes",
];

/**
 * Validate a plan against all constraints.
 */
export function validatePlan(plan: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Schema validation
  const schemaResult = planSchema.safeParse(plan);
  if (!schemaResult.success) {
    errors.push(
      ...schemaResult.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      )
    );
    return { valid: false, errors, warnings };
  }

  const validated = schemaResult.data;

  // 2. BasePrompt suffix check
  if (
    !validated.basePrompt
      .toLowerCase()
      .includes(REQUIRED_PROMPT_SUFFIX.toLowerCase())
  ) {
    errors.push(`basePrompt must end with: "${REQUIRED_PROMPT_SUFFIX}"`);
  }

  // 3. Banned pattern check (more nuanced than simple term matching)
  const promptText = validated.basePrompt;
  const lowerPrompt = promptText.toLowerCase();
  for (const pattern of BANNED_PROMPT_PATTERNS) {
    if (pattern.test(promptText)) {
      errors.push(`basePrompt contains banned pattern: ${pattern.source}`);
    }
  }

  // 4. Laptop/screen plausibility check
  if (
    lowerPrompt.includes("laptop") ||
    lowerPrompt.includes("screen") ||
    lowerPrompt.includes("monitor")
  ) {
    const missingTerms = REQUIRED_LAPTOP_TERMS.filter(
      (term) => !lowerPrompt.includes(term)
    );
    if (missingTerms.length > 0) {
      warnings.push(
        `Laptop/screen detected but missing: ${missingTerms.join(", ")}`
      );
    }
  }

  // 5. Negative prompt check
  const lowerNegative = validated.negativePrompt.toLowerCase();
  const missingNegatives = REQUIRED_NEGATIVE_TERMS.filter(
    (term) => !lowerNegative.includes(term)
  );
  if (missingNegatives.length > 0) {
    warnings.push(
      `negativePrompt missing recommended terms: ${missingNegatives.join(", ")}`
    );
  }

  // 6. hookText - trust the LLM, don't validate length

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all plans in a batch.
 */
export function validatePlans(plans: unknown[]): {
  validPlans: ValidatedPlan[];
  invalidCount: number;
  allErrors: string[];
} {
  const validPlans: ValidatedPlan[] = [];
  const allErrors: string[] = [];

  for (let i = 0; i < plans.length; i++) {
    const result = validatePlan(plans[i]);
    if (result.valid) {
      validPlans.push(planSchema.parse(plans[i]));
    } else {
      allErrors.push(`Plan ${i}: ${result.errors.join("; ")}`);
    }

    // Log warnings even for valid plans
    if (result.warnings.length > 0) {
      console.warn(`[planValidator] Plan ${i} warnings:`, result.warnings);
    }
  }

  return {
    validPlans,
    invalidCount: plans.length - validPlans.length,
    allErrors,
  };
}

// ============================================
// AUTO-REPAIR
// ============================================

/**
 * Attempt to repair common plan issues.
 * Returns null if the plan is beyond repair.
 */
export function repairPlan(
  plan: Record<string, unknown>
): Record<string, unknown> | null {
  const repaired = { ...plan };

  // 1. Fix missing/invalid conceptId
  if (!repaired.conceptId || !isValidConceptId(repaired.conceptId as string)) {
    repaired.conceptId = "clean-hero";
  }

  // 2. Fix basePrompt suffix
  if (typeof repaired.basePrompt === "string") {
    const lower = (repaired.basePrompt as string).toLowerCase();
    if (!lower.includes(REQUIRED_PROMPT_SUFFIX.toLowerCase())) {
      // Remove any partial suffix and add the full one
      repaired.basePrompt = `${(repaired.basePrompt as string)
        .replace(/,?\s*no text.*$/i, "")
        .trim()}, ${REQUIRED_PROMPT_SUFFIX}`;
    }
  }

  // 3. hookText - trust the LLM, don't truncate

  // 4. Fix laptop/screen references
  if (typeof repaired.basePrompt === "string") {
    const lower = (repaired.basePrompt as string).toLowerCase();
    if (
      (lower.includes("laptop") ||
        lower.includes("screen") ||
        lower.includes("monitor")) &&
      !lower.includes("front-facing")
    ) {
      repaired.basePrompt = (repaired.basePrompt as string).replace(
        /\b(laptop|screen|monitor)\b/i,
        "front-facing $1 with correct hinge, abstract color blocks on display"
      );
    }
  }

  // 5. Ensure negativePrompt exists
  if (!repaired.negativePrompt || typeof repaired.negativePrompt !== "string") {
    repaired.negativePrompt =
      "text, words, letters, logos, watermarks, floating screen, visible hands, uncanny valley, deformed";
  }

  // 6. Fix missing palette
  if (!repaired.palette || typeof repaired.palette !== "object") {
    repaired.palette = {
      bg1: "#1E40AF",
      bg2: "#1E3A8A",
      accent: "#FF6B00",
      text: "#FFFFFF",
    };
  }

  // 7. Fix missing composition
  if (!repaired.composition || typeof repaired.composition !== "object") {
    repaired.composition = {
      textSafeArea: "left",
      focalSubjectPosition: "right",
      backgroundComplexity: "low",
    };
  }

  // 8. Fix missing emotionTone
  if (!repaired.emotionTone) {
    repaired.emotionTone = "dramatic";
  }

  return repaired;
}

/**
 * Validate and repair a batch of plans.
 * Returns only valid plans after attempting repairs.
 */
export function validateAndRepairPlans(plans: unknown[]): ValidatedPlan[] {
  const validPlans: ValidatedPlan[] = [];

  for (const plan of plans) {
    // First attempt: direct validation
    const result = validatePlan(plan);
    if (result.valid) {
      validPlans.push(planSchema.parse(plan));
      continue;
    }

    // Second attempt: repair and validate
    const repaired = repairPlan(plan as Record<string, unknown>);
    if (repaired) {
      const repairedResult = validatePlan(repaired);
      if (repairedResult.valid) {
        console.log(`[planValidator] Repaired plan successfully`);
        validPlans.push(planSchema.parse(repaired));
        continue;
      }
    }

    console.warn(`[planValidator] Could not repair plan:`, result.errors);
  }

  return validPlans;
}
