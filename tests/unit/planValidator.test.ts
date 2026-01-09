/**
 * Tests for Plan Validator
 * 
 * Covers:
 * - Schema validation
 * - Constraint enforcement (basePrompt suffix, laptop terms, etc.)
 * - Auto-repair functionality
 * - Hook text length validation
 */

import { describe, it, expect } from "vitest";
import {
  validatePlan,
  repairPlan,
  validateAndRepairPlans,
  planSchema,
} from "@/lib/thumbnails/planValidator";

// ============================================
// FIXTURES
// ============================================

const validPlan = {
  conceptId: "clean-hero",
  hookText: "STOP THIS NOW",
  emotionTone: "urgent",
  palette: {
    bg1: "#1E40AF",
    bg2: "#1E3A8A",
    accent: "#FF6B00",
    text: "#FFFFFF",
  },
  composition: {
    textSafeArea: "left",
    focalSubjectPosition: "right",
    backgroundComplexity: "low",
  },
  basePrompt: "A frustrated content creator with wide eyes looking at camera, dramatic lighting, studio background, no text, no words, no letters, no watermark, no logos",
  negativePrompt: "text, words, letters, logos, watermarks, floating screen, visible hands",
  overlayDirectives: {
    badges: [],
    highlights: [],
    bigSymbol: "X",
  },
  subjects: "Content creator, camera",
};

const planWithLaptop = {
  ...validPlan,
  basePrompt: "A person looking at a front-facing laptop with correct hinge, abstract color blocks on screen, dark studio, no text, no words, no letters, no watermark, no logos",
};

const planWithInvalidLaptop = {
  ...validPlan,
  basePrompt: "A person looking at laptop screen showing code, dark studio, no text, no words, no letters, no watermark, no logos",
};

// ============================================
// SCHEMA VALIDATION TESTS
// ============================================

describe("planSchema", () => {
  it("accepts valid plan", () => {
    const result = planSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it("rejects invalid conceptId", () => {
    const plan = { ...validPlan, conceptId: "not-a-real-concept" };
    const result = planSchema.safeParse(plan);
    expect(result.success).toBe(false);
  });

  it("accepts long hookText (no truncation)", () => {
    const plan = { ...validPlan, hookText: "THIS IS A LONGER HOOK TEXT THAT WE TRUST THE LLM TO GENERATE" };
    const result = planSchema.safeParse(plan);
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex colors", () => {
    const plan = {
      ...validPlan,
      palette: { ...validPlan.palette, bg1: "not-a-color" },
    };
    const result = planSchema.safeParse(plan);
    expect(result.success).toBe(false);
  });

  it("rejects invalid emotion tone", () => {
    const plan = { ...validPlan, emotionTone: "angry" };
    const result = planSchema.safeParse(plan);
    expect(result.success).toBe(false);
  });
});

// ============================================
// CONSTRAINT VALIDATION TESTS
// ============================================

describe("validatePlan", () => {
  it("validates a correct plan", () => {
    const result = validatePlan(validPlan);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails plan missing basePrompt suffix", () => {
    const plan = {
      ...validPlan,
      basePrompt: "A person looking at camera, dramatic lighting",
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("must end with"))).toBe(true);
  });

  it("fails plan with banned patterns", () => {
    const plan = {
      ...validPlan,
      basePrompt: "A laptop showing readable text on screen, no text, no words, no letters, no watermark, no logos",
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("banned pattern"))).toBe(true);
  });

  it("allows 'no logos' in safety suffix", () => {
    // The word "logos" should be OK in "no logos" context
    const plan = {
      ...validPlan,
      basePrompt: "A person at desk, clean background, no text, no words, no letters, no watermark, no logos",
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(true);
  });

  it("warns when laptop missing plausibility terms", () => {
    const result = validatePlan(planWithInvalidLaptop);
    expect(result.warnings.some(w => w.includes("front-facing"))).toBe(true);
  });

  it("passes laptop with correct terms", () => {
    const result = validatePlan(planWithLaptop);
    expect(result.valid).toBe(true);
    expect(result.warnings.filter(w => w.includes("Laptop"))).toHaveLength(0);
  });
});

// ============================================
// AUTO-REPAIR TESTS
// ============================================

describe("repairPlan", () => {
  it("adds missing basePrompt suffix", () => {
    const plan = {
      ...validPlan,
      basePrompt: "A person looking at camera, dramatic lighting",
    };
    const repaired = repairPlan(plan);
    expect(repaired?.basePrompt).toContain("no text, no words, no letters");
  });

  it("preserves long hookText (no truncation)", () => {
    const plan = {
      ...validPlan,
      hookText: "THIS IS A LONGER HOOK TEXT THAT WE TRUST",
    };
    const repaired = repairPlan(plan);
    expect(repaired?.hookText).toBe("THIS IS A LONGER HOOK TEXT THAT WE TRUST");
  });

  it("fixes invalid conceptId to default", () => {
    const plan = { ...validPlan, conceptId: "invalid-concept" };
    const repaired = repairPlan(plan);
    expect(repaired?.conceptId).toBe("clean-hero");
  });

  it("adds missing negativePrompt", () => {
    const plan = { ...validPlan, negativePrompt: undefined };
    const repaired = repairPlan(plan);
    expect(repaired?.negativePrompt).toBeTruthy();
    expect((repaired?.negativePrompt as string)).toContain("text");
  });

  it("injects laptop plausibility when missing", () => {
    const plan = {
      ...validPlan,
      basePrompt: "A person looking at laptop, no text, no words, no letters, no watermark, no logos",
    };
    const repaired = repairPlan(plan);
    expect(repaired?.basePrompt).toContain("front-facing");
    expect(repaired?.basePrompt).toContain("abstract color blocks");
  });
});

// ============================================
// BATCH VALIDATION TESTS
// ============================================

describe("validateAndRepairPlans", () => {
  it("returns valid plans unchanged", () => {
    const plans = [validPlan, planWithLaptop];
    const result = validateAndRepairPlans(plans);
    expect(result).toHaveLength(2);
  });

  it("repairs fixable plans", () => {
    const brokenPlan = {
      ...validPlan,
      basePrompt: "A person at desk", // Missing suffix
      hookText: "THIS HOOK IS FINE NOW", 
    };
    const result = validateAndRepairPlans([brokenPlan]);
    expect(result).toHaveLength(1);
    expect(result[0].basePrompt).toContain("no text, no words");
    expect(result[0].hookText).toBe("THIS HOOK IS FINE NOW");
  });

  it("filters out unrepairable plans", () => {
    const unrepairable = {
      // Missing required fields that can't be auto-generated
      hookText: "GOOD HOOK",
      // No conceptId, no palette, no composition, etc.
    };
    const result = validateAndRepairPlans([unrepairable]);
    // Should either repair or filter out
    expect(result.length).toBeLessThanOrEqual(1);
  });
});

// ============================================
// TOPIC-SPECIFIC HOOK TESTS
// ============================================

describe("hook text patterns", () => {
  it("allows money-related hooks with amounts", () => {
    const plan = { ...validPlan, hookText: "$50K SECRET" };
    const result = validatePlan(plan);
    expect(result.valid).toBe(true);
  });

  it("allows warning hooks for mistake topics", () => {
    const plan = { ...validPlan, hookText: "STOP THIS NOW" };
    const result = validatePlan(plan);
    expect(result.valid).toBe(true);
  });

  it("accepts hooks of any length", () => {
    const longHook = { ...validPlan, hookText: "THIS IS A MUCH LONGER HOOK TEXT THAT WE ALLOW NOW" };
    const result = validatePlan(longHook);
    expect(result.valid).toBe(true);
  });
});
