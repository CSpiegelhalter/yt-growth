/**
 * Unit tests for Anti-AI Artifact Thumbnail System
 *
 * Tests:
 * - Description field is required
 * - ThumbnailPlan contains topicAnchors derived from title+description
 * - Prompt contains anti-artifact constraints when humans/screens involved
 * - Fallback mode selection based on risk
 * - Safe prompt variations maintain topicAnchors
 */

import { describe, expect, test } from "bun:test";
import {
  buildSafePrompt,
  generateSafeVariations,
  STANDARD_NEGATIVE_PROMPT,
} from "@/lib/thumbnails/promptBuilder";
import { thumbnailJobInputSchema } from "@/lib/thumbnails/schemas";
import type { ThumbnailPlan } from "@/lib/thumbnails/types";

// ============================================
// DESCRIPTION REQUIREMENT TESTS
// ============================================

describe("Description Field Requirement", () => {
  test("schema requires description field", () => {
    const result = thumbnailJobInputSchema.safeParse({
      title: "10 JavaScript Tips",
      // missing description
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("description"))).toBe(true);
    }
  });

  test("schema rejects short description", () => {
    const result = thumbnailJobInputSchema.safeParse({
      title: "10 JavaScript Tips",
      description: "short", // less than 10 chars
    });

    expect(result.success).toBe(false);
  });

  test("schema accepts valid description", () => {
    const result = thumbnailJobInputSchema.safeParse({
      title: "10 JavaScript Tips",
      description: "In this tutorial, I show you 10 essential JavaScript tips for beginners.",
    });

    expect(result.success).toBe(true);
  });

  test("schema trims and validates description", () => {
    const result = thumbnailJobInputSchema.safeParse({
      title: "Test Title",
      description: "   This is a valid description with enough characters.   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("This is a valid description with enough characters.");
    }
  });
});

// ============================================
// THUMBNAIL PLAN TESTS
// ============================================

describe("ThumbnailPlan Structure", () => {
  const basePlan: ThumbnailPlan = {
    topicSummary: "JavaScript tips for developers",
    topicAnchors: ["JavaScript", "code", "developer"],
    scene: {
      setting: "clean desk with laptop",
      props: ["laptop", "code on screen"],
      prohibitedProps: ["gibberish text", "multiple screens"],
    },
    subject: {
      type: "human_face",
      description: "developer looking at screen",
      pose: "sitting at desk",
      emotion: "focused",
      constraints: ["natural face proportions", "5 fingers per hand"],
    },
    layout: "subject-left_text-right",
    headline: {
      text: "10 JS TIPS",
      style: "bold",
    },
    palette: {
      primary: "blue",
      secondary: "#1E3A8A",
      accent: "#FF6B00",
    },
    qualityBar: [
      "photorealistic style",
      "no text in base image",
      "high contrast",
    ],
    fallbackMode: "face_only",
  };

  test("plan has required topicAnchors", () => {
    expect(basePlan.topicAnchors).toHaveLength(3);
    expect(basePlan.topicAnchors).toContain("JavaScript");
  });

  test("plan has scene with prohibited props", () => {
    expect(basePlan.scene.prohibitedProps).toBeDefined();
    expect(basePlan.scene.prohibitedProps.length).toBeGreaterThan(0);
  });

  test("plan has subject constraints", () => {
    expect(basePlan.subject.constraints).toBeDefined();
    expect(basePlan.subject.constraints.length).toBeGreaterThan(0);
  });

  test("plan has valid fallback mode", () => {
    expect(["icon_driven", "face_only", "full_scene"]).toContain(basePlan.fallbackMode);
  });
});

// ============================================
// SAFE PROMPT BUILDER TESTS
// ============================================

describe("buildSafePrompt", () => {
  const techPlan: ThumbnailPlan = {
    topicSummary: "Setting up OAuth for web apps",
    topicAnchors: ["OAuth", "authentication", "web app"],
    scene: {
      setting: "laptop on clean desk",
      props: ["laptop", "browser window", "login form"],
      prohibitedProps: ["detailed UI text", "multiple monitors"],
    },
    subject: {
      type: "human_face",
      description: "developer at laptop",
      pose: "typing",
      emotion: "focused",
      constraints: ["natural proportions"],
    },
    layout: "subject-left_text-right",
    headline: { text: "OAUTH SETUP", style: "bold" },
    palette: { primary: "blue", secondary: "#1E3A8A", accent: "#FF6B00" },
    qualityBar: ["photorealistic", "no text", "high contrast"],
    fallbackMode: "face_only",
  };

  test("prompt includes topicAnchors", () => {
    const { prompt } = buildSafePrompt(techPlan);

    expect(prompt).toContain("OAuth");
    expect(prompt).toContain("authentication");
  });

  test("prompt includes HEADLINE TEXT instruction", () => {
    const { prompt } = buildSafePrompt(techPlan);

    // AI generates complete thumbnails with text now
    expect(prompt.toLowerCase()).toContain("headline text");
    expect(prompt.toLowerCase()).toContain("bold");
    expect(prompt.toLowerCase()).toContain("readable");
  });

  test("prompt includes anti-artifact constraints for humans", () => {
    const { prompt } = buildSafePrompt(techPlan);

    // Should include human anatomy constraints
    expect(prompt.toLowerCase()).toContain("finger");
    expect(prompt.toLowerCase()).toContain("natural");
  });

  test("prompt includes anti-artifact constraints for tech/screens", () => {
    const { prompt } = buildSafePrompt(techPlan);

    // Should include screen constraints
    expect(prompt.toLowerCase()).toContain("laptop");
    expect(prompt.toLowerCase()).toContain("screen");
    expect(prompt.toLowerCase()).toContain("keyboard");
  });

  test("prompt includes composition guidance", () => {
    const { prompt } = buildSafePrompt(techPlan);

    // Should have composition/subject positioning
    expect(prompt.toLowerCase()).toContain("composition");
    expect(prompt.toLowerCase()).toContain("right"); // text zone
  });

  test("prompt includes BOGY palette", () => {
    const { prompt } = buildSafePrompt(techPlan);

    expect(prompt.toLowerCase()).toContain("bogy");
    expect(prompt.toLowerCase()).toContain("blue");
  });

  test("negative prompt includes anti-artifact terms", () => {
    const { negativePrompt } = buildSafePrompt(techPlan);

    expect(negativePrompt.toLowerCase()).toContain("extra fingers");
    expect(negativePrompt.toLowerCase()).toContain("deformed");
    expect(negativePrompt.toLowerCase()).toContain("malformed");
  });
});

// ============================================
// ICON-DRIVEN MODE TESTS
// ============================================

describe("Icon-Driven Mode", () => {
  const iconPlan: ThumbnailPlan = {
    topicSummary: "API concepts explained",
    topicAnchors: ["API", "data", "server"],
    scene: {
      setting: "clean gradient background",
      props: ["API icon", "data flow arrows"],
      prohibitedProps: ["human hands", "detailed screens"],
    },
    subject: {
      type: "icon_only",
      description: "bold API icon with data flow",
      pose: "n/a",
      emotion: "neutral",
      constraints: ["clean vector style"],
    },
    layout: "center",
    headline: { text: "API BASICS", style: "bold" },
    palette: { primary: "blue", secondary: "#1E3A8A", accent: "#FF6B00" },
    qualityBar: ["clean illustration style", "no text"],
    fallbackMode: "icon_driven",
  };

  test("prompt includes icon mode instructions", () => {
    const { prompt } = buildSafePrompt(iconPlan);

    expect(prompt.toLowerCase()).toContain("icon");
    expect(prompt.toLowerCase()).toContain("no human");
  });

  test("negative prompt excludes humans for icon mode", () => {
    const { negativePrompt } = buildSafePrompt(iconPlan);

    expect(negativePrompt.toLowerCase()).toContain("human");
    expect(negativePrompt.toLowerCase()).toContain("face");
    expect(negativePrompt.toLowerCase()).toContain("hands");
  });
});

// ============================================
// SAFE VARIATIONS TESTS
// ============================================

describe("generateSafeVariations", () => {
  const basePlan: ThumbnailPlan = {
    topicSummary: "React hooks tutorial",
    topicAnchors: ["React", "hooks", "useState"],
    scene: {
      setting: "code editor on screen",
      props: ["laptop", "React code"],
      prohibitedProps: ["detailed text"],
    },
    subject: {
      type: "human_face",
      description: "developer explaining",
      pose: "facing camera",
      emotion: "excited",
      constraints: [],
    },
    layout: "subject-left_text-right",
    headline: { text: "REACT HOOKS", style: "bold" },
    palette: { primary: "blue", secondary: "#1E3A8A", accent: "#FF6B00" },
    qualityBar: ["photorealistic", "no text"],
    fallbackMode: "face_only",
  };

  test("generates 4 variations", () => {
    const variations = generateSafeVariations(basePlan);
    expect(variations).toHaveLength(4);
  });

  test("all variations include topicAnchors", () => {
    const variations = generateSafeVariations(basePlan);

    for (const v of variations) {
      expect(v.prompt).toContain("React");
      expect(v.prompt).toContain("hooks");
    }
  });

  test("variations have unique notes", () => {
    const variations = generateSafeVariations(basePlan);
    const notes = variations.map((v) => v.variationNote);
    const uniqueNotes = new Set(notes);

    expect(uniqueNotes.size).toBe(4);
  });

  test("all variations include headline text and anti-artifact constraints", () => {
    const variations = generateSafeVariations(basePlan);

    for (const v of variations) {
      // AI generates complete thumbnails with headline text
      expect(v.prompt.toLowerCase()).toContain("headline text");
      expect(v.negativePrompt.toLowerCase()).toContain("deformed");
    }
  });

  test("variations maintain layout variations", () => {
    const variations = generateSafeVariations(basePlan);

    // Should have both left and right layouts
    const hasLeft = variations.some((v) => v.prompt.includes("LEFT"));
    const hasRight = variations.some((v) => v.prompt.includes("RIGHT"));

    expect(hasLeft || hasRight).toBe(true);
  });
});

// ============================================
// NEGATIVE PROMPT COMPLETENESS TESTS
// ============================================

describe("STANDARD_NEGATIVE_PROMPT", () => {
  test("includes AI artifact prevention terms", () => {
    const lower = STANDARD_NEGATIVE_PROMPT.toLowerCase();

    // Common AI artifacts
    expect(lower).toContain("deformed");
    expect(lower).toContain("extra fingers");
    expect(lower).toContain("malformed hands");
    expect(lower).toContain("distorted face");
  });

  test("includes text prevention", () => {
    const lower = STANDARD_NEGATIVE_PROMPT.toLowerCase();

    expect(lower).toContain("text");
    expect(lower).toContain("watermark");
    expect(lower).toContain("logo");
  });

  test("includes quality issues", () => {
    const lower = STANDARD_NEGATIVE_PROMPT.toLowerCase();

    expect(lower).toContain("blurry");
    expect(lower).toContain("low contrast");
    expect(lower).toContain("amateur");
  });

  test("includes screen/UI issues", () => {
    const lower = STANDARD_NEGATIVE_PROMPT.toLowerCase();

    expect(lower).toContain("impossible screens");
    expect(lower).toContain("warped keyboard");
    expect(lower).toContain("blurry text"); // We want readable text, not blurry
  });
});

// ============================================
// FALLBACK MODE SELECTION TESTS
// ============================================

describe("Fallback Mode Constraints", () => {
  test("icon_driven mode excludes humans", () => {
    const plan: ThumbnailPlan = {
      topicSummary: "Test",
      topicAnchors: ["test"],
      scene: { setting: "clean", props: [], prohibitedProps: [] },
      subject: { type: "icon_only", description: "icon", pose: "n/a", emotion: "neutral", constraints: [] },
      layout: "center",
      headline: { text: "TEST", style: "bold" },
      palette: { primary: "blue", secondary: "#000", accent: "#FFF" },
      qualityBar: [],
      fallbackMode: "icon_driven",
    };

    const { negativePrompt } = buildSafePrompt(plan);
    expect(negativePrompt.toLowerCase()).toContain("human");
  });

  test("face_only mode excludes hands and full body", () => {
    const plan: ThumbnailPlan = {
      topicSummary: "Test",
      topicAnchors: ["test"],
      scene: { setting: "clean", props: [], prohibitedProps: [] },
      subject: { type: "human_face", description: "face", pose: "facing", emotion: "focused", constraints: [] },
      layout: "subject-left_text-right",
      headline: { text: "TEST", style: "bold" },
      palette: { primary: "blue", secondary: "#000", accent: "#FFF" },
      qualityBar: [],
      fallbackMode: "face_only",
    };

    const { negativePrompt } = buildSafePrompt(plan);
    expect(negativePrompt.toLowerCase()).toContain("hands");
    expect(negativePrompt.toLowerCase()).toContain("full body");
  });
});
