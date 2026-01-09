/**
 * Generation Controls Tests
 *
 * Tests for the new GenerationControls system that allows users to fine-tune
 * thumbnail generation (subject type, style, meme intensity, etc.)
 */

import { describe, test, expect } from "bun:test";
import {
  generationControlsSchema,
  getDefaultControls,
  applyPreset,
  sanitizeInspirationText,
  generateSeed,
  getSeedVariants,
} from "@/lib/thumbnails/generationControls";
import {
  buildControlledPrompt,
  generateControlledVariants,
  getControlsSummary,
} from "@/lib/thumbnails/controlledPromptBuilder";

describe("GenerationControls Schema", () => {
  test("provides valid defaults", () => {
    const defaults = getDefaultControls();
    expect(defaults.subjectType).toBe("auto");
    expect(defaults.includePerson).toBe(true);
    expect(defaults.personaVibe).toBe("auto");
    expect(defaults.visualStyle).toBe("auto");
    expect(defaults.memeIntensity).toBe("off");
    expect(defaults.avoidHands).toBe(true);
    expect(defaults.avoidUncanny).toBe(true);
    expect(defaults.contrastBoost).toBe(true);
    expect(defaults.detailLevel).toBe("medium");
  });

  test("validates subjectType enum", () => {
    const result = generationControlsSchema.safeParse({
      subjectType: "invalid-type",
    });
    expect(result.success).toBe(false);
  });

  test("accepts valid controls", () => {
    const controls = {
      subjectType: "person-face" as const,
      includePerson: true,
      personaVibe: "shocked" as const,
      visualStyle: "cartoon" as const,
      memeIntensity: "max" as const,
      backgroundMode: "clean-gradient" as const,
    };
    const result = generationControlsSchema.safeParse(controls);
    expect(result.success).toBe(true);
  });

  test("applies defaults for missing fields", () => {
    const result = generationControlsSchema.safeParse({
      subjectType: "object-icon",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includePerson).toBe(true);
      expect(result.data.avoidHands).toBe(true);
    }
  });
});

describe("Presets", () => {
  test("high-ctr-face preset configures for faces", () => {
    const preset = applyPreset("high-ctr-face");
    expect(preset.subjectType).toBe("person-face");
    expect(preset.includePerson).toBe(true);
    expect(preset.personaVibe).toBe("shocked");
  });

  test("clean-tech preset disables person", () => {
    const preset = applyPreset("clean-tech");
    expect(preset.subjectType).toBe("object-icon");
    expect(preset.includePerson).toBe(false);
    expect(preset.visualStyle).toBe("vector-flat");
  });

  test("meme-reaction preset enables max meme", () => {
    const preset = applyPreset("meme-reaction");
    expect(preset.memeIntensity).toBe("max");
    expect(preset.personaVibe).toBe("chaotic");
    expect(preset.visualStyle).toBe("cartoon");
  });

  test("gaming-neon preset uses neon lighting", () => {
    const preset = applyPreset("gaming-neon");
    expect(preset.lightingStyle).toBe("neon");
    expect(preset.environmentTheme).toBe("gaming-setup");
    expect(preset.saturationBoost).toBe(true);
  });

  test("minimal-pro preset uses clean style", () => {
    const preset = applyPreset("minimal-pro");
    expect(preset.includePerson).toBe(false);
    expect(preset.detailLevel).toBe("minimal");
    expect(preset.memeIntensity).toBe("off");
  });
});

describe("Inspiration Text Sanitization", () => {
  test("sanitizes IP references", () => {
    expect(sanitizeInspirationText("like Spiderman style")).toBe(
      "like superhero comic vibe style"
    );
    expect(sanitizeInspirationText("Mario Kart energy")).toBe(
      "colorful platformer game vibe kart energy"
    );
    expect(sanitizeInspirationText("Fortnite colors")).toBe(
      "battle royale colorful vibe colors"
    );
  });

  test("preserves safe text", () => {
    expect(sanitizeInspirationText("retro RPG UI vibe")).toBe(
      "retro rpg ui vibe"
    );
    expect(sanitizeInspirationText("horror movie poster")).toBe(
      "horror movie poster"
    );
  });

  test("handles empty string", () => {
    expect(sanitizeInspirationText("")).toBe("");
  });
});

describe("Seed Generation", () => {
  test("generates valid seed", () => {
    const seed = generateSeed();
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2147483647);
  });

  test("generates seed variants", () => {
    const variants = getSeedVariants(12345, 4);
    expect(variants.length).toBe(4);
    expect(variants[0]).toBe(12345);
    // All variants should be different
    const unique = new Set(variants);
    expect(unique.size).toBe(4);
  });
});

describe("buildControlledPrompt", () => {
  const baseControls = getDefaultControls();
  const topicAnchors = ["laptop", "code", "programming"];
  const hookText = "CODE FASTER";

  test("includes hook text instruction", () => {
    const result = buildControlledPrompt(
      baseControls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      12345
    );
    expect(result.prompt.toLowerCase()).toContain(
      `render these exact words as big bold text: "${hookText.toLowerCase()}"`
    );
  });

  test("includes topic anchors", () => {
    const result = buildControlledPrompt(
      baseControls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      12345
    );
    expect(result.prompt).toContain("laptop");
    expect(result.prompt).toContain("code");
  });

  test("respects includePerson=false", () => {
    const controls = { ...baseControls, includePerson: false };
    const result = buildControlledPrompt(
      controls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      12345
    );
    expect(result.prompt.toUpperCase()).toContain("NO PERSON");
    expect(result.negativePrompt).toContain("human");
    expect(result.negativePrompt).toContain("face");
  });

  test("includes meme instructions when memeIntensity > off", () => {
    const controls = { ...baseControls, memeIntensity: "max" as const };
    const result = buildControlledPrompt(
      controls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      12345
    );
    expect(result.prompt.toLowerCase()).toContain("meme");
  });

  test("includes BOGY color guidance", () => {
    const controls = {
      ...baseControls,
      primaryColor: "blue" as const,
      accentColor: "orange" as const,
    };
    const result = buildControlledPrompt(
      controls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      12345
    );
    expect(result.prompt.toUpperCase()).toContain("BLUE");
    expect(result.prompt.toUpperCase()).toContain("ORANGE");
  });

  test("includes hand avoidance constraint", () => {
    const controls = { ...baseControls, avoidHands: true, includePerson: true };
    const result = buildControlledPrompt(
      controls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      12345
    );
    expect(result.prompt.toUpperCase()).toContain("NO VISIBLE HANDS");
    expect(result.negativePrompt).toContain("hands");
  });

  test("includes visual style when specified", () => {
    const controls = { ...baseControls, visualStyle: "cartoon" as const };
    const result = buildControlledPrompt(
      controls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      12345
    );
    expect(result.prompt.toLowerCase()).toContain("cartoon");
    expect(result.negativePrompt).toContain("photorealistic");
  });

  test("sanitizes inspiration text", () => {
    const controls = {
      ...baseControls,
      inspirationsText: "Fortnite vibes with Mario energy",
    };
    const result = buildControlledPrompt(
      controls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      12345
    );
    expect(result.prompt).not.toContain("Fortnite");
    expect(result.prompt).not.toContain("Mario");
    expect(result.prompt).toContain("STYLE INSPIRATION");
  });
});

describe("generateControlledVariants", () => {
  const baseControls = getDefaultControls();
  const topicAnchors = ["laptop", "code"];
  const hookText = "CODE FASTER";

  test("generates requested number of variants", () => {
    const variants = generateControlledVariants(
      baseControls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      4
    );
    expect(variants.length).toBe(4);
  });

  test("all variants have unique seeds", () => {
    const variants = generateControlledVariants(
      baseControls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      4
    );
    const seeds = variants.map((v) => v.seed);
    const unique = new Set(seeds);
    expect(unique.size).toBe(4);
  });

  test("all variants include topic anchors", () => {
    const variants = generateControlledVariants(
      baseControls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      4
    );
    for (const variant of variants) {
      expect(variant.prompt).toContain("laptop");
    }
  });

  test("variants have meaningful variation notes", () => {
    const variants = generateControlledVariants(
      baseControls,
      "Test Title",
      "Test description",
      topicAnchors,
      hookText,
      4
    );
    for (const variant of variants) {
      expect(variant.variationNote).toBeTruthy();
      expect(variant.variationNote.length).toBeGreaterThan(0);
    }
  });
});

describe("getControlsSummary", () => {
  test("summarizes visual style", () => {
    const controls = { ...getDefaultControls(), visualStyle: "cartoon" as const };
    const summary = getControlsSummary(controls);
    expect(summary).toContain("cartoon");
  });

  test("summarizes no person", () => {
    const controls = { ...getDefaultControls(), includePerson: false };
    const summary = getControlsSummary(controls);
    expect(summary).toContain("No person");
  });

  test("summarizes meme intensity", () => {
    const controls = { ...getDefaultControls(), memeIntensity: "max" as const };
    const summary = getControlsSummary(controls);
    expect(summary).toContain("Meme: max");
  });

  test("returns expected summary for defaults", () => {
    const controls = getDefaultControls();
    const summary = getControlsSummary(controls);
    // Default includes "No hands" since avoidHands is true by default
    expect(summary).toContain("No hands");
  });
});

describe("No Same AI Man Problem", () => {
  test("diversity descriptors vary with seed", () => {
    const controls = {
      ...getDefaultControls(),
      includePerson: true,
      diversityVariety: true,
    };

    const variants = generateControlledVariants(
      controls,
      "Test Title",
      "Test description",
      ["topic"],
      "HOOK",
      4
    );

    // Check that the prompts have some variation (not all identical)
    const prompts = variants.map((v) => v.prompt);
    const uniquePrompts = new Set(prompts);
    // With diversity, we should see some variation in the prompts
    expect(uniquePrompts.size).toBeGreaterThan(1);
  });

  test("visual style affects archetype selection", () => {
    const cartoonControls = {
      ...getDefaultControls(),
      visualStyle: "cartoon" as const,
      includePerson: true,
    };
    const photoControls = {
      ...getDefaultControls(),
      visualStyle: "photoreal" as const,
      includePerson: true,
    };

    const cartoonPrompt = buildControlledPrompt(
      cartoonControls,
      "Test",
      "Desc",
      ["topic"],
      "HOOK",
      12345
    );
    const photoPrompt = buildControlledPrompt(
      photoControls,
      "Test",
      "Desc",
      ["topic"],
      "HOOK",
      12345
    );

    expect(cartoonPrompt.prompt.toLowerCase()).toContain("cartoon");
    expect(photoPrompt.prompt.toLowerCase()).not.toContain("cartoon");
    expect(cartoonPrompt.negativePrompt).toContain("photorealistic");
    expect(photoPrompt.negativePrompt).toContain("cartoon");
  });
});
