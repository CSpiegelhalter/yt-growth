/**
 * Visual Dials Test Suite
 *
 * Tests for the visual dial selector system and style reference manifest.
 */

import { describe, it, expect } from "vitest";
import {
  STYLE_DIALS,
  MEME_STYLE_OPTIONS,
  CHARACTER_STYLE_OPTIONS,
  EXPRESSION_OPTIONS,
  COMPOSITION_OPTIONS,
  BACKGROUND_OPTIONS,
  INTENSITY_OPTIONS,
  getStyleOption,
  getStyleDial,
  mapDialSelectionsToControls,
  getIntensityStrength,
  getDialSelectionsSummary,
  type StyleOption,
} from "@/lib/thumbnails/styleReferenceManifest";

describe("Style Reference Manifest", () => {
  describe("STYLE_DIALS", () => {
    it("should have all required dials", () => {
      expect(STYLE_DIALS).toHaveLength(5);
      
      const dialIds = STYLE_DIALS.map((d) => d.id);
      expect(dialIds).toContain("memeStyle");
      expect(dialIds).toContain("characterStyle");
      expect(dialIds).toContain("expression");
      expect(dialIds).toContain("composition");
      expect(dialIds).toContain("background");
    });

    it("each dial should have required properties", () => {
      for (const dial of STYLE_DIALS) {
        expect(dial.id).toBeTruthy();
        expect(dial.title).toBeTruthy();
        expect(dial.subtitle).toBeTruthy();
        expect(dial.tooltip).toBeTruthy();
        expect(dial.options.length).toBeGreaterThan(0);
        expect(dial.defaultOptionId).toBeTruthy();
      }
    });

    it("meme style dial should show intensity slider", () => {
      const memeDial = STYLE_DIALS.find((d) => d.id === "memeStyle");
      expect(memeDial?.showIntensity).toBe(true);
    });
  });

  describe("MEME_STYLE_OPTIONS", () => {
    it("should have off option and meme styles", () => {
      expect(MEME_STYLE_OPTIONS.length).toBeGreaterThanOrEqual(5);

      const offOption = MEME_STYLE_OPTIONS.find((o) => o.isOff);
      expect(offOption).toBeTruthy();
      expect(offOption?.id).toBe("meme-off");

      // Check for meme styles
      const rageOption = MEME_STYLE_OPTIONS.find((o) => o.id === "meme-rage-comic");
      expect(rageOption).toBeTruthy();
      expect(rageOption?.promptRecipeKey).toBe("rageComic");
      expect(rageOption?.safeNote?.toLowerCase()).toContain("original");
    });

    it("each option should have preview image path", () => {
      for (const option of MEME_STYLE_OPTIONS) {
        expect(option.previewImage).toMatch(/^\/style_refs\//);
      }
    });

    it("meme options should have intensity strength mappings", () => {
      const rageOption = MEME_STYLE_OPTIONS.find((o) => o.id === "meme-rage-comic");
      expect(rageOption?.intensityStrength).toBeDefined();
      expect(rageOption?.intensityStrength?.light).toBeLessThan(
        rageOption?.intensityStrength?.max ?? 0
      );
    });
  });

  describe("CHARACTER_STYLE_OPTIONS", () => {
    it("should have all character styles", () => {
      const styleLabels = CHARACTER_STYLE_OPTIONS.map((o) => o.label.toLowerCase());
      
      expect(styleLabels).toContain("auto");
      expect(styleLabels).toContain("photoreal");
      expect(styleLabels).toContain("cinematic");
      // Cartoon variants
      const hasCartoon = styleLabels.some((l) => l.includes("cartoon"));
      expect(hasCartoon).toBe(true);
    });

    it("each style should have distinct accent color", () => {
      const colors = CHARACTER_STYLE_OPTIONS.map((o) => o.accentColor);
      const uniqueColors = new Set(colors);
      // Allow some overlap but most should be unique
      expect(uniqueColors.size).toBeGreaterThanOrEqual(
        CHARACTER_STYLE_OPTIONS.length * 0.7
      );
    });
  });

  describe("EXPRESSION_OPTIONS", () => {
    it("should have all expression types", () => {
      const expressions = EXPRESSION_OPTIONS.map((o) => o.id);
      
      expect(expressions).toContain("expr-auto");
      expect(expressions).toContain("expr-serious");
      expect(expressions).toContain("expr-confident");
      expect(expressions).toContain("expr-curious");
      expect(expressions).toContain("expr-shocked");
      expect(expressions).toContain("expr-silly");
      expect(expressions).toContain("expr-chaotic");
    });
  });

  describe("COMPOSITION_OPTIONS", () => {
    it("should have all composition types", () => {
      const compositions = COMPOSITION_OPTIONS.map((o) => o.id);
      
      expect(compositions).toContain("comp-subject-left");
      expect(compositions).toContain("comp-subject-right");
      expect(compositions).toContain("comp-center");
      expect(compositions).toContain("comp-close-up");
      expect(compositions).toContain("comp-wide");
    });
  });

  describe("BACKGROUND_OPTIONS", () => {
    it("should have all background types", () => {
      const backgrounds = BACKGROUND_OPTIONS.map((o) => o.id);
      
      expect(backgrounds).toContain("bg-auto");
      expect(backgrounds).toContain("bg-clean-gradient");
      expect(backgrounds).toContain("bg-studio");
      expect(backgrounds).toContain("bg-tech-workspace");
      expect(backgrounds).toContain("bg-neon");
      expect(backgrounds).toContain("bg-abstract");
      expect(backgrounds).toContain("bg-dark-moody");
    });
  });
});

describe("Helper Functions", () => {
  describe("getStyleOption", () => {
    it("should find option by ID", () => {
      const option = getStyleOption("meme-rage-comic");
      expect(option).toBeTruthy();
      expect(option?.label).toBe("Rage Comic");
    });

    it("should return undefined for invalid ID", () => {
      const option = getStyleOption("invalid-id");
      expect(option).toBeUndefined();
    });
  });

  describe("getStyleDial", () => {
    it("should find dial by ID", () => {
      const dial = getStyleDial("memeStyle");
      expect(dial).toBeTruthy();
      expect(dial?.title).toBe("Meme Style");
    });

    it("should return undefined for invalid ID", () => {
      const dial = getStyleDial("invalid-dial");
      expect(dial).toBeUndefined();
    });
  });

  describe("mapDialSelectionsToControls", () => {
    it("should map meme style to controls", () => {
      const selections = { memeStyle: "meme-rage-comic" };
      const controls = mapDialSelectionsToControls(selections);
      
      expect(controls.memeStyle).toBe("rageComic");
    });

    it("should map off to meme style off", () => {
      const selections = { memeStyle: "meme-off" };
      const controls = mapDialSelectionsToControls(selections);
      
      expect(controls.memeStyle).toBe("off");
    });

    it("should map character style to visualStyle", () => {
      const selections = { characterStyle: "char-photoreal" };
      const controls = mapDialSelectionsToControls(selections);
      
      expect(controls.visualStyle).toBe("photoreal");
    });

    it("should map expression to personaVibe", () => {
      const selections = { expression: "expr-shocked" };
      const controls = mapDialSelectionsToControls(selections);
      
      expect(controls.personaVibe).toBe("shocked");
    });

    it("should map composition to text placement", () => {
      const selections = { composition: "comp-subject-left" };
      const controls = mapDialSelectionsToControls(selections);
      
      // Subject left means text goes right
      expect(controls.textPlacement).toBe("right");
    });

    it("should map background to backgroundMode and lighting", () => {
      const selections = { background: "bg-neon" };
      const controls = mapDialSelectionsToControls(selections);
      
      expect(controls.lightingStyle).toBe("neon");
    });
  });

  describe("getIntensityStrength", () => {
    it("should return strength for meme style", () => {
      const light = getIntensityStrength("meme-rage-comic", "light");
      const medium = getIntensityStrength("meme-rage-comic", "medium");
      const max = getIntensityStrength("meme-rage-comic", "max");

      expect(light).toBeLessThan(medium);
      expect(medium).toBeLessThan(max);
      expect(max).toBe(1.0);
    });

    it("should return default strengths for unknown options", () => {
      const light = getIntensityStrength("unknown", "light");
      const max = getIntensityStrength("unknown", "max");

      expect(light).toBe(0.4);
      expect(max).toBe(1.0);
    });
  });

  describe("getDialSelectionsSummary", () => {
    it("should return summary of selections", () => {
      const selections = {
        memeStyle: "meme-rage-comic",
        characterStyle: "char-cartoon-simple",
      };
      const summary = getDialSelectionsSummary(selections, "max");

      expect(summary).toContain("Rage Comic");
      expect(summary).toContain("Intensity: max");
    });

    it("should return default text when all off", () => {
      const selections = {
        memeStyle: "meme-off",
        characterStyle: "char-auto",
      };
      const summary = getDialSelectionsSummary(selections);

      expect(summary).toBe("Default settings");
    });
  });
});

describe("Visual Option Completeness", () => {
  const allOptions: StyleOption[] = [
    ...MEME_STYLE_OPTIONS,
    ...CHARACTER_STYLE_OPTIONS,
    ...EXPRESSION_OPTIONS,
    ...COMPOSITION_OPTIONS,
    ...BACKGROUND_OPTIONS,
    ...INTENSITY_OPTIONS,
  ];

  it("every option should have unique ID", () => {
    const ids = allOptions.map((o) => o.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every option should have category", () => {
    for (const option of allOptions) {
      expect(option.category).toBeTruthy();
    }
  });

  it("every option should have label and description", () => {
    for (const option of allOptions) {
      expect(option.label).toBeTruthy();
      expect(option.description).toBeTruthy();
    }
  });

  it("every option should have preview image", () => {
    for (const option of allOptions) {
      expect(option.previewImage).toBeTruthy();
      expect(option.previewImage).toMatch(/\.(svg|png|jpg)$/);
    }
  });
});

describe("Dial Default Values", () => {
  it("each dial default should exist in options", () => {
    for (const dial of STYLE_DIALS) {
      const defaultOption = dial.options.find(
        (o) => o.id === dial.defaultOptionId
      );
      expect(defaultOption).toBeTruthy();
    }
  });
});
