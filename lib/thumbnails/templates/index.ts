/**
 * Template Registry (Concept-Based)
 *
 * Central export of all concept-based thumbnail templates.
 * Templates are now "composition engines" that add visual story elements.
 */

import type { ConceptSpec } from "../types";
import type { ConceptId } from "../concepts";
import { generateConceptOverlay, generateGradientBackground, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT } from "./base";
import { generateCleanHeroOverlay } from "./t_cleanHero";
import { generateBeforeAfterSplitOverlay } from "./t_beforeAfterSplit";
import { generateMistakeXOverlay } from "./t_mistakeX";
import { generateProblemSolutionOverlay } from "./t_problemSolution";
import { generateVsOverlay } from "./t_vs";

// Re-export base utilities
export * from "./base";
export { generateCleanHeroOverlay } from "./t_cleanHero";
export { generateBeforeAfterSplitOverlay } from "./t_beforeAfterSplit";
export { generateMistakeXOverlay } from "./t_mistakeX";
export { generateProblemSolutionOverlay } from "./t_problemSolution";
export { generateVsOverlay } from "./t_vs";

// ============================================
// TEMPLATE REGISTRY
// ============================================

/**
 * Concept-to-template mapping.
 * Each concept uses a specific template for overlay generation.
 */
const CONCEPT_TEMPLATE_MAP: Record<ConceptId, (spec: ConceptSpec) => string> = {
  // Specialized templates
  "before-after-split": generateBeforeAfterSplitOverlay,
  "mistake-x": generateMistakeXOverlay,
  "vs-face-off": generateVsOverlay,
  "problem-solution": generateProblemSolutionOverlay,
  "clean-hero": generateCleanHeroOverlay,

  // These concepts use the generic concept overlay
  "secret-reveal": generateConceptOverlay,
  "big-number": generateConceptOverlay,
  "shock-reaction": generateConceptOverlay,
  "simple-diagram": generateConceptOverlay,
  "tool-spotlight": generateCleanHeroOverlay, // Similar to clean hero
  "timeline-step": generateConceptOverlay,
  "mystery-blur": generateConceptOverlay,
};

/**
 * Get the overlay generator for a concept ID.
 */
export function getConceptTemplateGenerator(
  conceptId: ConceptId
): (spec: ConceptSpec) => string {
  return CONCEPT_TEMPLATE_MAP[conceptId] ?? generateConceptOverlay;
}

/**
 * Generate an SVG overlay for a concept spec.
 * Automatically selects the right template based on concept ID.
 */
export function generateOverlay(spec: ConceptSpec): string {
  const conceptId = spec.plan.conceptId;
  const generator = getConceptTemplateGenerator(conceptId);
  return generator(spec);
}

// ============================================
// TEMPLATE METADATA
// ============================================

export type TemplateMeta = {
  name: string;
  description: string;
  bestFor: string;
  hasSpecializedTemplate: boolean;
};

/**
 * Template metadata for UI display.
 */
export const TEMPLATE_META: Record<ConceptId, TemplateMeta> = {
  "before-after-split": {
    name: "Before/After Split",
    description: "Split-screen showing transformation with divider",
    bestFor: "Transformations, tutorials, before/after content",
    hasSpecializedTemplate: true,
  },
  "mistake-x": {
    name: "Mistake X",
    description: "Big red X over problematic item",
    bestFor: "Warning content, mistakes to avoid, what NOT to do",
    hasSpecializedTemplate: true,
  },
  "secret-reveal": {
    name: "Secret Reveal",
    description: "Mystery/blur effect with SECRET badge",
    bestFor: "Hidden tips, exclusive content, reveals",
    hasSpecializedTemplate: false,
  },
  "vs-face-off": {
    name: "VS Face-Off",
    description: "Epic VS badge between competitors",
    bestFor: "Comparisons, battles, debates",
    hasSpecializedTemplate: true,
  },
  "big-number": {
    name: "Big Number",
    description: "Large number with hook text",
    bestFor: "Lists, tips, rankings, statistics",
    hasSpecializedTemplate: false,
  },
  "shock-reaction": {
    name: "Shock Reaction",
    description: "Dramatic scene with highlights",
    bestFor: "Surprising content, reactions, reveals",
    hasSpecializedTemplate: false,
  },
  "simple-diagram": {
    name: "Simple Diagram",
    description: "Clean layout with arrows/labels",
    bestFor: "Educational content, how-tos, explanations",
    hasSpecializedTemplate: false,
  },
  "tool-spotlight": {
    name: "Tool Spotlight",
    description: "Hero product shot with glow",
    bestFor: "Product reviews, tools, gear",
    hasSpecializedTemplate: false,
  },
  "problem-solution": {
    name: "Problem/Solution",
    description: "X on problem, CHECK on solution",
    bestFor: "Fixes, solutions, troubleshooting",
    hasSpecializedTemplate: true,
  },
  "timeline-step": {
    name: "Timeline Step",
    description: "Step indicators with progression",
    bestFor: "Step-by-step guides, processes",
    hasSpecializedTemplate: false,
  },
  "clean-hero": {
    name: "Clean Hero",
    description: "Simple, elegant layout",
    bestFor: "General content, professional topics",
    hasSpecializedTemplate: true,
  },
  "mystery-blur": {
    name: "Mystery Blur",
    description: "Partially hidden content for intrigue",
    bestFor: "Teasers, coming soon, secrets",
    hasSpecializedTemplate: false,
  },
};

/**
 * Get all template metadata.
 */
export function getAllTemplatesMeta(): Array<{ conceptId: ConceptId } & TemplateMeta> {
  return Object.entries(TEMPLATE_META).map(([conceptId, meta]) => ({
    conceptId: conceptId as ConceptId,
    ...meta,
  }));
}

// ============================================
// LEGACY EXPORTS (backward compatibility)
// ============================================

/** @deprecated Use ConceptSpec */
export type { ConceptSpec as ThumbnailSpec } from "../types";

/** Template IDs (now concept IDs) */
export const TEMPLATE_IDS = Object.keys(TEMPLATE_META) as ConceptId[];
export type TemplateId = ConceptId;

/** @deprecated */
export function getTemplateGenerator(templateId: string): (spec: ConceptSpec) => string {
  return getConceptTemplateGenerator(templateId as ConceptId);
}

// Export constants
export { THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, generateGradientBackground };
