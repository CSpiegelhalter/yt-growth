/**
 * Thumbnail Generator Unit Tests (Concept-Based)
 *
 * Tests for:
 * - SVG escaping and safety
 * - Schema validation (ConceptPlan)
 * - Hook text guardrails
 * - Prompt guardrails
 * - Concept library
 * - Scoring system
 */

import { describe, expect, it } from "bun:test";
import {
  svgEscape,
  svgAttrEscape,
  safeText,
  isInSafeZone,
} from "@/lib/thumbnails/svg";
import {
  thumbnailJobInputSchema,
  hexColorSchema,
  hookTextSchema,
  normalizeJobInput,
  isHookTooSimilarToTitle,
  shortenHookText,
  ensurePromptSafety,
} from "@/lib/thumbnails/schemas";
import {
  shortenHeadline,
  truncateExact,
  transformHeadline,
  generateHeadlineVariants,
  validateHeadlineContent,
  estimateReadability,
} from "@/lib/thumbnails/headline";
import { hardenPrompt } from "@/lib/thumbnails/openaiImages";
import {
  CONCEPT_IDS,
  getConcept,
  isValidConceptId,
  suggestConceptsForKeywords,
  getAllConceptsMeta,
} from "@/lib/thumbnails/concepts";
import {
  scoreConceptPlan,
  rankConceptPlans,
  enforceDiversity,
  getDiversityStats,
  getContrastRatio,
} from "@/lib/thumbnails/scoring";
import type { ConceptPlan } from "@/lib/thumbnails/types";

// ============================================
// SVG ESCAPE TESTS
// ============================================

describe("svgEscape", () => {
  it("should escape XML special characters", () => {
    expect(svgEscape("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
    );
  });

  it("should escape ampersands first", () => {
    expect(svgEscape("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("should escape quotes", () => {
    expect(svgEscape('He said "Hello"')).toBe("He said &quot;Hello&quot;");
  });

  it("should handle empty strings", () => {
    expect(svgEscape("")).toBe("");
  });

  it("should remove control characters", () => {
    expect(svgEscape("Hello\x00World")).toBe("HelloWorld");
  });

  it("should preserve normal text", () => {
    expect(svgEscape("Hello World 123")).toBe("Hello World 123");
  });

  it("should handle unicode characters", () => {
    expect(svgEscape("Hello 世界 🎉")).toBe("Hello 世界 🎉");
  });
});

describe("svgAttrEscape", () => {
  it("should escape newlines for attributes", () => {
    expect(svgAttrEscape("Line1\nLine2")).toBe("Line1&#10;Line2");
  });

  it("should escape tabs", () => {
    expect(svgAttrEscape("Tab\there")).toBe("Tab&#9;here");
  });
});

describe("safeText", () => {
  it("should apply max length", () => {
    expect(safeText("Hello World", { maxLength: 5 })).toBe("Hello");
  });

  it("should filter with allowed chars", () => {
    expect(safeText("Hello123", { allowedChars: /[A-Za-z]/ })).toBe("Hello");
  });

  it("should escape and truncate together", () => {
    // Note: truncation happens before escaping, then result is escaped
    const result = safeText("<script>dangerous</script>", { maxLength: 20 });
    // First 20 chars: "<script>dangerous</s" then escaped: "&lt;script&gt;dangerous&lt;/s"
    expect(result).toBe("&lt;script&gt;dangerous&lt;/s");
  });
});

describe("isInSafeZone", () => {
  it("should return true for center positions", () => {
    expect(isInSafeZone(640, 360, 200, 100)).toBe(true);
  });

  it("should return false for timestamp corner", () => {
    // Bottom-right corner overlaps timestamp
    expect(isInSafeZone(1150, 695, 100, 20)).toBe(false);
  });

  it("should return true for top-left positions", () => {
    expect(isInSafeZone(40, 40, 200, 100)).toBe(true);
  });
});

// ============================================
// SCHEMA VALIDATION TESTS
// ============================================

describe("hexColorSchema", () => {
  it("should accept valid 6-char hex", () => {
    const result = hexColorSchema.safeParse("#FF0000");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("#FF0000");
  });

  it("should accept valid 3-char hex", () => {
    const result = hexColorSchema.safeParse("#F00");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("#F00");
  });

  it("should accept lowercase and convert to uppercase", () => {
    const result = hexColorSchema.safeParse("#ff0000");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("#FF0000");
  });

  it("should reject invalid hex", () => {
    expect(hexColorSchema.safeParse("red").success).toBe(false);
    expect(hexColorSchema.safeParse("#GG0000").success).toBe(false);
    expect(hexColorSchema.safeParse("FF0000").success).toBe(false);
  });
});

describe("thumbnailJobInputSchema", () => {
  it("should accept valid input", () => {
    const result = thumbnailJobInputSchema.safeParse({
      title: "10 Tips for Success",
      description: "Learn the top 10 tips that will help you succeed in your career.",
      style: "Bold",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("10 Tips for Success");
      expect(result.data.description).toBe("Learn the top 10 tips that will help you succeed in your career.");
      expect(result.data.style).toBe("Bold");
      expect(result.data.count).toBe(12); // default
      expect(result.data.aiBase).toBe(true); // default
    }
  });

  it("should reject empty title", () => {
    const result = thumbnailJobInputSchema.safeParse({
      title: "",
      description: "Valid description here.",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid style", () => {
    const result = thumbnailJobInputSchema.safeParse({
      title: "Test",
      description: "Valid description here.",
      style: "InvalidStyle",
    });
    expect(result.success).toBe(false);
  });

  it("should clamp count to valid range", () => {
    const high = thumbnailJobInputSchema.safeParse({
      title: "Test",
      description: "Valid description here.",
      count: 100,
    });
    expect(high.success).toBe(false);

    const low = thumbnailJobInputSchema.safeParse({
      title: "Test",
      description: "Valid description here.",
      count: 0,
    });
    expect(low.success).toBe(false);
  });

  it("should trim whitespace from title", () => {
    const result = thumbnailJobInputSchema.safeParse({
      title: "  Spaced Title  ",
      description: "Valid description here.",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Spaced Title");
  });
});

describe("hookTextSchema", () => {
  it("should accept valid short hook", () => {
    const result = hookTextSchema.safeParse("STOP THIS");
    expect(result.success).toBe(true);
  });

  it("should accept 5-word hook", () => {
    const result = hookTextSchema.safeParse("You Need To See This");
    expect(result.success).toBe(true);
  });

  // TODO: hookTextSchema maxLength was removed upstream; re-enable if length limit restored
  it.skip("should reject hook over 28 chars", () => {
    const result = hookTextSchema.safeParse("This is a very long hook that exceeds the limit");
    expect(result.success).toBe(false);
  });

  it("should reject empty hook", () => {
    const result = hookTextSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("normalizeJobInput", () => {
  it("should return normalized input for valid data", () => {
    const result = normalizeJobInput({ 
      title: "Test",
      description: "Valid description that explains the video content."
    });
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test");
    expect(result?.description).toBe("Valid description that explains the video content.");
  });

  it("should return null for invalid data", () => {
    expect(normalizeJobInput({})).toBeNull();
    expect(normalizeJobInput({ title: "" })).toBeNull();
    expect(normalizeJobInput({ title: "Test" })).toBeNull(); // missing description
    expect(normalizeJobInput({ title: "Test", description: "short" })).toBeNull(); // description too short
    expect(normalizeJobInput(null)).toBeNull();
  });
});

// ============================================
// HOOK TEXT GUARDRAILS TESTS
// ============================================

describe("isHookTooSimilarToTitle", () => {
  it("should detect when hook is same as title", () => {
    const result = isHookTooSimilarToTitle("same text", "same text");
    expect(result).toBe(true);
  });

  it("should detect high similarity", () => {
    const result = isHookTooSimilarToTitle(
      "Tips for Success",
      "10 Tips for Success in Business"
    );
    expect(result).toBe(true);
  });

  it("should allow different hooks", () => {
    const result = isHookTooSimilarToTitle("STOP THIS", "10 Common Mistakes");
    expect(result).toBe(false);
  });
});

describe("shortenHookText", () => {
  it("should return text if under limit", () => {
    expect(shortenHookText("Short", 5)).toBe("Short");
  });

  it("should shorten to max words", () => {
    expect(shortenHookText("one two three four five six", 3)).toBe("one two three");
  });

  it("should handle empty string", () => {
    expect(shortenHookText("", 5)).toBe("");
  });
});

describe("ensurePromptSafety", () => {
  it("should add safety suffix if missing", () => {
    const result = ensurePromptSafety("A beautiful scene");
    expect(result).toContain("no text");
  });

  it("should not double-add safety suffix", () => {
    const input = "A beautiful scene, no text, no words, no letters";
    const result = ensurePromptSafety(input);
    expect(result).toBe(input);
  });
});

// ============================================
// HEADLINE TESTS
// ============================================

describe("shortenHeadline", () => {
  it("should return text if under limit", () => {
    expect(shortenHeadline("Short", 32)).toBe("Short");
  });

  it("should truncate long text with ellipsis", () => {
    const result = shortenHeadline(
      "This is a very long headline that needs to be shortened",
      32
    );
    expect(result.length).toBeLessThanOrEqual(32);
    expect(result.endsWith("...")).toBe(true);
  });

  it("should preserve whole words when possible", () => {
    const result = shortenHeadline("Hello World Test", 15);
    expect(result).toBe("Hello World...");
  });

  it("should normalize whitespace", () => {
    expect(shortenHeadline("  Multiple   Spaces  ", 32)).toBe("Multiple Spaces");
  });

  it("should handle empty string", () => {
    expect(shortenHeadline("", 32)).toBe("");
  });
});

describe("truncateExact", () => {
  it("should truncate to exact length without ellipsis", () => {
    expect(truncateExact("Hello World", 5)).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(truncateExact("", 10)).toBe("");
  });
});

describe("transformHeadline", () => {
  it("should transform to uppercase", () => {
    expect(transformHeadline("hello world", "uppercase")).toBe("HELLO WORLD");
  });

  it("should transform to titlecase", () => {
    expect(transformHeadline("hello world", "titlecase")).toBe("Hello World");
  });

  it("should add question mark", () => {
    expect(transformHeadline("What", "question")).toBe("What?");
    expect(transformHeadline("What?", "question")).toBe("What?"); // no double
  });

  it("should add exclamation", () => {
    expect(transformHeadline("Wow", "exclaim")).toBe("Wow!");
    expect(transformHeadline("Wow!", "exclaim")).toBe("Wow!"); // no double
  });

  it("should add ellipsis", () => {
    expect(transformHeadline("Coming soon", "ellipsis")).toBe("Coming soon...");
  });
});

describe("generateHeadlineVariants", () => {
  it("should generate requested number of variants", () => {
    const variants = generateHeadlineVariants("Test Headline", 4);
    expect(variants.length).toBeLessThanOrEqual(4);
    expect(variants.length).toBeGreaterThanOrEqual(1);
  });

  it("should include original headline", () => {
    const variants = generateHeadlineVariants("Original", 3);
    expect(variants).toContain("Original");
  });

  it("should generate unique variants", () => {
    const variants = generateHeadlineVariants("Test", 4);
    const unique = new Set(variants);
    expect(unique.size).toBe(variants.length);
  });
});

describe("validateHeadlineContent", () => {
  it("should flag excessive capitalization", () => {
    const concerns = validateHeadlineContent("ALL CAPS HEADLINE");
    expect(concerns.length).toBeGreaterThan(0);
  });

  it("should flag excessive punctuation", () => {
    const concerns = validateHeadlineContent("What?!?!");
    expect(concerns.length).toBeGreaterThan(0);
  });

  it("should flag clickbait patterns", () => {
    const concerns = validateHeadlineContent("You won't believe this");
    expect(concerns.length).toBeGreaterThan(0);
  });

  it("should return empty for clean headlines", () => {
    const concerns = validateHeadlineContent("10 Tips for Success");
    expect(concerns.length).toBe(0);
  });
});

describe("estimateReadability", () => {
  it("should give high score to short punchy text", () => {
    const score = estimateReadability("BIG WIN");
    expect(score).toBeGreaterThan(80);
  });

  it("should penalize very long text", () => {
    const score = estimateReadability(
      "This is a very long headline that goes on and on"
    );
    expect(score).toBeLessThan(50);
  });

  it("should return 0 for empty text", () => {
    expect(estimateReadability("")).toBe(0);
  });
});

// ============================================
// CONCEPT LIBRARY TESTS
// ============================================

describe("Concept Library", () => {
  it("should have at least 10 concepts", () => {
    expect(CONCEPT_IDS.length).toBeGreaterThanOrEqual(10);
  });

  it("should validate concept IDs", () => {
    expect(isValidConceptId("clean-hero")).toBe(true);
    expect(isValidConceptId("mistake-x")).toBe(true);
    expect(isValidConceptId("invalid-concept")).toBe(false);
  });

  it("should get concept by ID", () => {
    const concept = getConcept("before-after-split");
    expect(concept.id).toBe("before-after-split");
    expect(concept.name).toBe("Before/After Split");
    expect(concept.whenToUse.length).toBeGreaterThan(0);
  });

  it("should suggest concepts for keywords", () => {
    const suggestions = suggestConceptsForKeywords(["comparison", "vs"]);
    expect(suggestions).toContain("vs-face-off");
  });

  it("should get all concepts metadata", () => {
    const meta = getAllConceptsMeta();
    expect(meta.length).toBe(CONCEPT_IDS.length);
    expect(meta[0].name).toBeDefined();
    expect(meta[0].description).toBeDefined();
  });
});

// ============================================
// SCORING TESTS
// ============================================

describe("Concept Scoring", () => {
  const makeTestPlan = (overrides: Partial<ConceptPlan> = {}): ConceptPlan => ({
    conceptId: "clean-hero",
    hookText: "TEST HOOK",
    emotionTone: "curious",
    palette: { bg1: "#000000", bg2: "#333333", accent: "#FF0000", text: "#FFFFFF" },
    composition: {
      textSafeArea: "left",
      focalSubjectPosition: "right",
      backgroundComplexity: "low",
    },
    basePrompt: "Test scene, no text, no words, no letters",
    negativePrompt: "text, logos",
    overlayDirectives: {
      badges: [],
      highlights: [],
      bigSymbol: "NONE",
    },
    subjects: "test subject",
    ...overrides,
  });

  it("should score a plan", () => {
    const plan = makeTestPlan();
    const score = scoreConceptPlan(plan, [plan]);
    expect(score.total).toBeGreaterThan(0);
    expect(score.breakdown.hookLength).toBeDefined();
    expect(score.breakdown.contrast).toBeDefined();
  });

  it("should rank plans by score", () => {
    const plans = [
      makeTestPlan({ hookText: "A" }), // Very short
      makeTestPlan({ hookText: "PERFECT HOOK" }), // Good length
      makeTestPlan({ hookText: "This is too long" }), // Too long
    ];
    const ranked = rankConceptPlans(plans);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[2].rank).toBe(3);
    expect(ranked[0].score.total).toBeGreaterThanOrEqual(ranked[2].score.total);
  });

  it("should enforce diversity", () => {
    const plans = [
      makeTestPlan({ conceptId: "clean-hero" }),
      makeTestPlan({ conceptId: "clean-hero" }),
      makeTestPlan({ conceptId: "mistake-x" }),
      makeTestPlan({ conceptId: "clean-hero" }),
      makeTestPlan({ conceptId: "vs-face-off" }),
    ];
    const diverse = enforceDiversity(plans, 3);
    // First few should be unique concepts
    const firstThreeConcepts = diverse.slice(0, 3).map((p) => p.conceptId);
    const uniqueFirstThree = new Set(firstThreeConcepts);
    expect(uniqueFirstThree.size).toBeGreaterThanOrEqual(2);
  });

  it("should calculate diversity stats", () => {
    const plans = [
      makeTestPlan({ conceptId: "clean-hero", hookText: "Hook 1" }),
      makeTestPlan({ conceptId: "mistake-x", hookText: "Hook 2" }),
      makeTestPlan({ conceptId: "clean-hero", hookText: "Hook 1" }),
    ];
    const stats = getDiversityStats(plans);
    expect(stats.uniqueConcepts).toBe(2);
    expect(stats.uniqueHooks).toBe(2);
    expect(stats.conceptDistribution["clean-hero"]).toBe(2);
  });
});

describe("Contrast Ratio", () => {
  it("should calculate high contrast for black/white", () => {
    const ratio = getContrastRatio("#000000", "#FFFFFF");
    expect(ratio).toBeGreaterThan(20);
  });

  it("should calculate low contrast for similar colors", () => {
    const ratio = getContrastRatio("#AAAAAA", "#BBBBBB");
    expect(ratio).toBeLessThan(2);
  });
});

// ============================================
// PROMPT GUARDRAILS TESTS
// ============================================

describe("hardenPrompt", () => {
  const makeBasePlan = (): ConceptPlan => ({
    conceptId: "clean-hero",
    hookText: "TEST",
    emotionTone: "curious",
    palette: { bg1: "#000", bg2: "#111", accent: "#F00", text: "#FFF" },
    composition: {
      textSafeArea: "left",
      focalSubjectPosition: "right",
      backgroundComplexity: "low",
    },
    basePrompt: "Test scene, no text, no words, no letters",
    negativePrompt: "text",
    overlayDirectives: { badges: [], highlights: [], bigSymbol: "NONE" },
    subjects: "test",
  });

  it("should block prompts with brand names", () => {
    const plan = makeBasePlan();
    plan.basePrompt = "A Nike shoe on white background";
    const result = hardenPrompt(plan);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("nike");
  });

  it("should block prompts with character names", () => {
    const plan = makeBasePlan();
    plan.basePrompt = "Mickey Mouse in a field";
    const result = hardenPrompt(plan);
    expect(result.blocked).toBe(true);
  });

  it("should block sensitive content", () => {
    const plan = makeBasePlan();
    plan.basePrompt = "Violence scene";
    const result = hardenPrompt(plan);
    expect(result.blocked).toBe(true);
  });

  it("should allow clean prompts", () => {
    const plan = makeBasePlan();
    plan.basePrompt = "Abstract colorful background with gradient";
    const result = hardenPrompt(plan);
    expect(result.blocked).toBe(false);
    expect(result.prompt).toContain("Abstract colorful background");
  });

  it("should include the hookText in prompt", () => {
    const plan = makeBasePlan();
    plan.hookText = "DO THIS";
    const result = hardenPrompt(plan);
    // The prompt should contain the hook text for rendering
    expect(result.prompt).toContain("DO THIS");
    expect(result.blocked).toBe(false);
  });

  it("should truncate very long prompts", () => {
    const plan = makeBasePlan();
    plan.basePrompt = "A".repeat(2000) + ", no text, no words, no letters";
    const result = hardenPrompt(plan);
    // Prompt is truncated to around 1000 chars plus safety suffix
    expect(result.prompt.length).toBeLessThanOrEqual(1500);
  });
});
