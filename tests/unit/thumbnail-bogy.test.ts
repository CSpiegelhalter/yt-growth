/**
 * Unit tests for BOGY-enhanced thumbnail generation
 *
 * Tests:
 * - Prompt builder produces BOGY-compliant prompts
 * - ThumbnailDirection builder extracts headlines correctly
 * - Variation generator produces 4 distinct variations
 * - Palettes are BOGY-compliant
 */

import { describe, expect, test } from "bun:test";
import {
  buildThumbnailDirection,
  generateLayoutVariations,
  extractHeadline,
} from "@/lib/thumbnails/thumbnailDirection";
import {
  buildImagePrompt,
  generatePromptVariations,
  STANDARD_NEGATIVE_PROMPT,
} from "@/lib/thumbnails/promptBuilder";
import {
  getBogyPalettes,
  getDiverseBogyPalettes,
  getBogyPaletteForNiche,
  BOGY_COLORS,
  ALL_BOGY_PALETTES,
} from "@/lib/thumbnails/bogyPalettes";

// ============================================
// HEADLINE EXTRACTION TESTS
// ============================================

describe("extractHeadline", () => {
  test("extracts short hook from numbered titles", () => {
    const { headline } = extractHeadline(
      "10 Common Mistakes Beginners Make When Starting a YouTube Channel"
    );
    expect(headline.length).toBeLessThanOrEqual(25);
    expect(headline).toContain("10");
  });

  test("extracts hook from 'How to' titles", () => {
    const { headline } = extractHeadline("How to Build a Successful Business in 2024");
    expect(headline.length).toBeLessThanOrEqual(25);
    expect(headline.toUpperCase()).toBe(headline); // Should be uppercase
  });

  test("extracts hook from 'Why' titles", () => {
    const { headline } = extractHeadline("Why Most YouTubers Fail and How to Avoid It");
    expect(headline.length).toBeLessThanOrEqual(25);
  });

  test("extracts hook from 'Stop Doing' titles", () => {
    const { headline } = extractHeadline("Stop Doing This One Thing That Kills Your Channel");
    expect(headline.length).toBeLessThanOrEqual(25);
    expect(headline.toLowerCase()).toContain("stop");
  });

  test("handles VS titles", () => {
    const { headline } = extractHeadline("iPhone vs Android - Which is Better?");
    expect(headline.length).toBeLessThanOrEqual(25);
    expect(headline.toLowerCase()).toContain("vs");
  });

  test("fallback for generic titles stays within limits", () => {
    const { headline } = extractHeadline(
      "A Very Long Video Title That Has Too Many Words And Keeps Going On Forever"
    );
    expect(headline.length).toBeLessThanOrEqual(30);
  });
});

// ============================================
// THUMBNAIL DIRECTION TESTS
// ============================================

describe("buildThumbnailDirection", () => {
  test("builds direction with BOGY palette", () => {
    const direction = buildThumbnailDirection({
      title: "10 JavaScript Tips Every Developer Should Know",
      topic: "tech",
    });

    // Should have BOGY palette
    expect(direction.palette).toBeDefined();
    expect(direction.bogyPairing).toBeDefined();
    expect(["blue-orange", "green-yellow", "blue-green", "orange-yellow", "dark-accent"]).toContain(
      direction.bogyPairing
    );
  });

  test("infers tech genre for programming content", () => {
    const direction = buildThumbnailDirection({
      title: "How to Code a Website from Scratch",
      topic: "programming",
    });

    expect(direction.style.genre).toBe("tech");
    expect(direction.subject.includeFace).toBe(true);
  });

  test("infers finance genre for money content", () => {
    const direction = buildThumbnailDirection({
      title: "How I Made $10,000 in One Week",
      topic: "investing",
    });

    expect(direction.style.genre).toBe("finance");
  });

  test("infers gaming genre for game content", () => {
    const direction = buildThumbnailDirection({
      title: "Fortnite Victory Royale Gameplay",
      topic: "gaming",
    });

    expect(direction.style.genre).toBe("gaming");
    expect(direction.background.lighting).toBe("neon");
  });

  test("extracts headline correctly", () => {
    const direction = buildThumbnailDirection({
      title: "5 Secrets to Growing Your Channel Fast",
    });

    expect(direction.text.headline).toBeDefined();
    expect(direction.text.headline.length).toBeLessThanOrEqual(30);
  });
});

// ============================================
// LAYOUT VARIATIONS TESTS
// ============================================

describe("generateLayoutVariations", () => {
  test("generates 4 distinct variations", () => {
    const base = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const variations = generateLayoutVariations(base);

    expect(variations).toHaveLength(4);
  });

  test("each variation has different layout", () => {
    const base = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const variations = generateLayoutVariations(base);
    const layouts = variations.map((v) => v.layout);

    // All 4 layouts should be different
    const uniqueLayouts = new Set(layouts);
    expect(uniqueLayouts.size).toBe(4);
  });

  test("each variation has different BOGY pairing", () => {
    const base = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const variations = generateLayoutVariations(base);
    const pairings = variations.map((v) => v.bogyPairing);

    // All 4 pairings should be different
    const uniquePairings = new Set(pairings);
    expect(uniquePairings.size).toBe(4);
  });
});

// ============================================
// PROMPT BUILDER TESTS
// ============================================

describe("buildImagePrompt", () => {
  test("includes BOGY instruction", () => {
    const direction = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const { prompt } = buildImagePrompt(direction);

    expect(prompt.toLowerCase()).toContain("bogy");
    expect(prompt.toLowerCase()).toContain("blue");
    expect(prompt.toLowerCase()).toContain("orange");
    expect(prompt.toLowerCase()).toContain("green");
    expect(prompt.toLowerCase()).toContain("yellow");
  });

  test("includes the specific text to render", () => {
    const direction = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const { prompt } = buildImagePrompt(direction);

    // AI generates complete thumbnails with the actual text to render
    expect(prompt.toLowerCase()).toContain("render these exact words");
    expect(prompt.toLowerCase()).toContain("bold");
    expect(prompt.toLowerCase()).toContain("readable");
  });

  test("includes composition guidance", () => {
    const direction = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const { prompt } = buildImagePrompt(direction);

    expect(prompt.toLowerCase()).toContain("composition");
  });

  test("includes quality requirements", () => {
    const direction = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const { prompt } = buildImagePrompt(direction);

    expect(prompt.toLowerCase()).toContain("high contrast");
    expect(prompt.toLowerCase()).toContain("dramatic");
  });

  test("returns valid negative prompt", () => {
    const direction = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const { negativePrompt } = buildImagePrompt(direction);

    expect(negativePrompt).toBe(STANDARD_NEGATIVE_PROMPT);
    // Negative prompt prevents bad text, not all text
    expect(negativePrompt.toLowerCase()).toContain("blurry text");
    expect(negativePrompt.toLowerCase()).toContain("watermark");
    expect(negativePrompt.toLowerCase()).toContain("logo");
  });
});

describe("generatePromptVariations", () => {
  test("generates 4 prompt variations", () => {
    const direction = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const variations = generatePromptVariations(direction);

    expect(variations).toHaveLength(4);
  });

  test("each variation has unique note", () => {
    const direction = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const variations = generatePromptVariations(direction);
    const notes = variations.map((v) => v.variationNote);

    // All notes should be different
    const uniqueNotes = new Set(notes);
    expect(uniqueNotes.size).toBe(4);
  });

  test("each variation includes BOGY and text rendering instructions", () => {
    const direction = buildThumbnailDirection({
      title: "Test Video Title",
    });

    const variations = generatePromptVariations(direction);

    for (const { prompt, negativePrompt } of variations) {
      expect(prompt.toLowerCase()).toContain("bogy");
      // Should include explicit text rendering instruction
      expect(prompt.toLowerCase()).toContain("render these exact words");
      // Negative prompt prevents bad text quality, not all text
      expect(negativePrompt.toLowerCase()).toContain("blurry");
    }
  });
});

// ============================================
// BOGY PALETTE TESTS
// ============================================

describe("BOGY Palettes", () => {
  test("BOGY_COLORS has all 4 color categories", () => {
    expect(BOGY_COLORS.blue).toBeDefined();
    expect(BOGY_COLORS.orange).toBeDefined();
    expect(BOGY_COLORS.green).toBeDefined();
    expect(BOGY_COLORS.yellow).toBeDefined();
  });

  test("ALL_BOGY_PALETTES has multiple palettes", () => {
    expect(ALL_BOGY_PALETTES.length).toBeGreaterThan(10);
  });

  test("all palettes have valid hex colors", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;

    for (const palette of ALL_BOGY_PALETTES) {
      expect(palette.bg1).toMatch(hexPattern);
      expect(palette.bg2).toMatch(hexPattern);
      expect(palette.accent).toMatch(hexPattern);
      expect(palette.text).toMatch(hexPattern);
    }
  });

  test("getBogyPalettes returns correct pairings", () => {
    const blueOrange = getBogyPalettes("blue-orange");
    const greenYellow = getBogyPalettes("green-yellow");

    expect(blueOrange.length).toBeGreaterThan(0);
    expect(greenYellow.length).toBeGreaterThan(0);
    expect(blueOrange).not.toEqual(greenYellow);
  });

  test("getDiverseBogyPalettes returns requested count", () => {
    const palettes4 = getDiverseBogyPalettes(4);
    const palettes2 = getDiverseBogyPalettes(2);

    expect(palettes4).toHaveLength(4);
    expect(palettes2).toHaveLength(2);
  });

  test("getBogyPaletteForNiche returns appropriate palettes", () => {
    const tech = getBogyPaletteForNiche("tech tutorial");
    const finance = getBogyPaletteForNiche("money investing");
    const gaming = getBogyPaletteForNiche("gaming stream");

    expect(tech.pairing).toBe("blue-orange");
    expect(finance.pairing).toBe("green-yellow");
    expect(gaming.pairing).toBe("orange-yellow");
  });
});

// ============================================
// STANDARD NEGATIVE PROMPT TESTS
// ============================================

describe("STANDARD_NEGATIVE_PROMPT", () => {
  test("includes all critical exclusions", () => {
    const lower = STANDARD_NEGATIVE_PROMPT.toLowerCase();

    // BAD text-related (we want good text, not no text)
    expect(lower).toContain("blurry text");
    expect(lower).toContain("distorted text");
    expect(lower).toContain("unreadable");

    // Brand-related
    expect(lower).toContain("logo");
    expect(lower).toContain("watermark");

    // Quality issues
    expect(lower).toContain("blurry");
    expect(lower).toContain("low contrast");
    expect(lower).toContain("flat");
  });
});
