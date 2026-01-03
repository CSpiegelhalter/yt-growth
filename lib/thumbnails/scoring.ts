/**
 * Concept Scoring System
 *
 * Scores and ranks ConceptPlans to show the best ones first.
 * Ensures variety and quality across generated variants.
 */

import type { ConceptPlan, ConceptScore, ThumbnailPalette } from "./types";
import type { ConceptId } from "./concepts";

// ============================================
// MAIN SCORING FUNCTION
// ============================================

/**
 * Score a single ConceptPlan.
 */
export function scoreConceptPlan(
  plan: ConceptPlan,
  allPlans: ConceptPlan[]
): ConceptScore {
  const breakdown = {
    hookLength: scoreHookLength(plan.hookText),
    contrast: scoreContrast(plan.palette),
    diversity: scoreDiversity(plan, allPlans),
    focalClarity: scoreFocalClarity(plan),
    conceptMatch: scoreConceptMatch(plan),
  };

  // Weighted total
  const weights = {
    hookLength: 0.25,
    contrast: 0.2,
    diversity: 0.25,
    focalClarity: 0.15,
    conceptMatch: 0.15,
  };

  const total = Object.entries(breakdown).reduce(
    (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
    0
  );

  return { total, breakdown };
}

/**
 * Score and sort all plans by quality.
 */
export function rankConceptPlans(
  plans: ConceptPlan[]
): Array<{ plan: ConceptPlan; score: ConceptScore; rank: number }> {
  const scored = plans.map((plan) => ({
    plan,
    score: scoreConceptPlan(plan, plans),
    rank: 0,
  }));

  // Sort by total score descending
  scored.sort((a, b) => b.score.total - a.score.total);

  // Assign ranks
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  return scored;
}

// ============================================
// INDIVIDUAL SCORING FUNCTIONS
// ============================================

/**
 * Score hook text length.
 * Optimal: 2-4 words, 10-20 characters.
 */
function scoreHookLength(hookText: string): number {
  const wordCount = hookText.split(/\s+/).filter(Boolean).length;
  const charCount = hookText.length;

  // Word count score (2-4 words is ideal)
  let wordScore: number;
  if (wordCount >= 2 && wordCount <= 4) {
    wordScore = 100;
  } else if (wordCount === 1) {
    wordScore = 60; // Single word can work but less impactful
  } else if (wordCount === 5) {
    wordScore = 80; // Acceptable but getting long
  } else {
    wordScore = 40; // Too long
  }

  // Character count score (10-20 chars is ideal)
  let charScore: number;
  if (charCount >= 10 && charCount <= 20) {
    charScore = 100;
  } else if (charCount >= 8 && charCount < 10) {
    charScore = 80;
  } else if (charCount > 20 && charCount <= 25) {
    charScore = 70;
  } else if (charCount > 25) {
    charScore = 50;
  } else {
    charScore = 60; // Very short
  }

  return (wordScore + charScore) / 2;
}

/**
 * Score palette contrast for text readability.
 * Higher contrast = better readability.
 */
function scoreContrast(palette: ThumbnailPalette): number {
  const textColor = palette.text;
  const bg1 = palette.bg1;
  const bg2 = palette.bg2;

  // Calculate contrast with both background colors
  const contrast1 = getContrastRatio(textColor, bg1);
  const contrast2 = getContrastRatio(textColor, bg2);

  // Use the lower contrast (worst case)
  const minContrast = Math.min(contrast1, contrast2);

  // WCAG guidelines:
  // - 4.5:1 minimum for normal text
  // - 3:1 minimum for large text
  // Thumbnails use large text, so 3:1 is our minimum

  if (minContrast >= 7) return 100; // Excellent
  if (minContrast >= 4.5) return 85; // Good
  if (minContrast >= 3) return 70; // Acceptable
  if (minContrast >= 2) return 50; // Poor
  return 30; // Very poor
}

/**
 * Score diversity compared to other plans.
 * Penalize plans that are too similar to others.
 */
function scoreDiversity(plan: ConceptPlan, allPlans: ConceptPlan[]): number {
  // Count how many other plans share the same concept
  const sameConceptCount = allPlans.filter(
    (p) => p !== plan && p.conceptId === plan.conceptId
  ).length;

  // Count palette similarity
  const similarPaletteCount = allPlans.filter(
    (p) =>
      p !== plan &&
      arePalettesSimilar(p.palette, plan.palette)
  ).length;

  // Count hook similarity
  const similarHookCount = allPlans.filter(
    (p) =>
      p !== plan &&
      areHooksSimilar(p.hookText, plan.hookText)
  ).length;

  // Score based on uniqueness
  let score = 100;
  score -= sameConceptCount * 15; // Penalize shared concepts
  score -= similarPaletteCount * 10; // Penalize similar palettes
  score -= similarHookCount * 20; // Penalize similar hooks (most important)

  return Math.max(0, score);
}

/**
 * Score focal clarity - does the plan have clear subject direction?
 */
function scoreFocalClarity(plan: ConceptPlan): number {
  let score = 60; // Base score

  // Has subjects description?
  if (plan.subjects && plan.subjects.length > 10) {
    score += 15;
  }

  // Has clear focal position (not just center)?
  if (plan.composition.focalSubjectPosition !== "center") {
    score += 10; // More interesting compositions
  }

  // Has overlay directives that add visual interest?
  if (plan.overlayDirectives.bigSymbol !== "NONE") {
    score += 10;
  }
  if (plan.overlayDirectives.highlights.length > 0) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Score concept-content match.
 * Based on whether the concept fits the content type.
 */
function scoreConceptMatch(plan: ConceptPlan): number {
  // Concepts with clear visual patterns score higher
  const highImpactConcepts: ConceptId[] = [
    "before-after-split",
    "mistake-x",
    "vs-face-off",
    "big-number",
  ];

  const mediumImpactConcepts: ConceptId[] = [
    "shock-reaction",
    "problem-solution",
    "secret-reveal",
    "tool-spotlight",
  ];

  if (highImpactConcepts.includes(plan.conceptId)) {
    return 90;
  }
  if (mediumImpactConcepts.includes(plan.conceptId)) {
    return 75;
  }
  return 60; // Default concepts
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate contrast ratio between two colors.
 * Returns ratio like 4.5:1 as a number (4.5).
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color.
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex to RGB.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Try short hex
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (!shortResult) return null;
    return {
      r: parseInt(shortResult[1] + shortResult[1], 16),
      g: parseInt(shortResult[2] + shortResult[2], 16),
      b: parseInt(shortResult[3] + shortResult[3], 16),
    };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Check if two palettes are too similar.
 */
function arePalettesSimilar(
  p1: ThumbnailPalette,
  p2: ThumbnailPalette
): boolean {
  const colorDiff = (c1: string, c2: string): number => {
    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    if (!rgb1 || !rgb2) return 255;

    return Math.abs(rgb1.r - rgb2.r) + Math.abs(rgb1.g - rgb2.g) + Math.abs(rgb1.b - rgb2.b);
  };

  // Check main background color similarity
  const bgDiff = colorDiff(p1.bg1, p2.bg1);
  const accentDiff = colorDiff(p1.accent, p2.accent);

  // If both main colors are very similar, palettes are similar
  return bgDiff < 50 && accentDiff < 50;
}

/**
 * Check if two hooks are too similar.
 */
function areHooksSimilar(hook1: string, hook2: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const words1 = normalize(hook1);
  const words2 = normalize(hook2);

  // If exactly the same
  if (hook1.toLowerCase() === hook2.toLowerCase()) return true;

  // Check word overlap
  const set1 = new Set(words1);
  const overlap = words2.filter((w) => set1.has(w)).length;
  const maxLen = Math.max(words1.length, words2.length);

  return maxLen > 0 && overlap / maxLen >= 0.6;
}

// ============================================
// DIVERSITY ENFORCEMENT
// ============================================

/**
 * Enforce diversity by ensuring at least N unique concepts.
 * Reorders plans if needed to promote variety.
 */
export function enforceDiversity(
  plans: ConceptPlan[],
  minUniqueConcepts: number = 5
): ConceptPlan[] {
  if (plans.length <= minUniqueConcepts) return plans;

  const result: ConceptPlan[] = [];
  const usedConcepts = new Set<ConceptId>();
  const remaining = [...plans];

  // First pass: pick one of each unique concept
  while (result.length < plans.length) {
    // Find next plan with an unused concept
    const nextIndex = remaining.findIndex(
      (p) => !usedConcepts.has(p.conceptId)
    );

    if (nextIndex !== -1) {
      const plan = remaining.splice(nextIndex, 1)[0];
      usedConcepts.add(plan.conceptId);
      result.push(plan);
    } else {
      // All concepts used, add remaining in order
      result.push(...remaining);
      break;
    }
  }

  return result;
}

/**
 * Get diversity statistics for a set of plans.
 */
export function getDiversityStats(plans: ConceptPlan[]): {
  uniqueConcepts: number;
  uniquePalettes: number;
  uniqueHooks: number;
  conceptDistribution: Record<string, number>;
} {
  const concepts = new Set(plans.map((p) => p.conceptId));

  // Count unique palettes (by bg1 color as proxy)
  const palettes = new Set(plans.map((p) => p.palette.bg1));

  // Count unique hooks
  const hooks = new Set(plans.map((p) => p.hookText.toLowerCase()));

  // Concept distribution
  const conceptDist: Record<string, number> = {};
  for (const plan of plans) {
    conceptDist[plan.conceptId] = (conceptDist[plan.conceptId] || 0) + 1;
  }

  return {
    uniqueConcepts: concepts.size,
    uniquePalettes: palettes.size,
    uniqueHooks: hooks.size,
    conceptDistribution: conceptDist,
  };
}
