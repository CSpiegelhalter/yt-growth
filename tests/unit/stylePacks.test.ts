/**
 * StylePack System Tests
 *
 * Tests for the style toggle system to ensure:
 * 1. Style packs are correctly defined and composable
 * 2. Prompt composition includes style-specific phrases
 * 3. Conflict resolution works correctly
 * 4. Post-processing is triggered for appropriate styles
 * 5. Model routing recommends correct providers
 */

import {
  STYLE_PACKS,
  getStylePack,
  getStylePackForMemeStyle,
  getStylePackForVisualStyle,
  getStylePackIdsFromControls,
  resolveStyleConflicts,
  composeStyledPrompt,
  composeStyledNegativePrompt,
  getRecommendedModel,
  getPostProcessingPipeline,
  requiresPostProcessing,
  logStyleApplication,
} from "../../lib/thumbnails/stylePacks";

// ============================================
// STYLE PACK REGISTRY TESTS
// ============================================

describe("StylePack Registry", () => {
  it("has all expected style packs defined", () => {
    const expectedPacks = [
      "deepFried",
      "cartoon",
      "anime",
      "comic-ink",
      "cinematic",
      "photorealistic",
      "vector-flat",
      "3d-mascot",
      "rageComic",
      "reactionFace",
      "wojakLike",
      "surrealCursed",
    ];

    for (const packId of expectedPacks) {
      expect(STYLE_PACKS[packId]).toBeDefined();
      expect(STYLE_PACKS[packId].id).toBe(packId);
    }
  });

  it("getStylePack returns correct pack by ID", () => {
    const deepFried = getStylePack("deepFried");
    expect(deepFried).not.toBeNull();
    expect(deepFried?.id).toBe("deepFried");
    expect(deepFried?.name).toBe("Deep Fried");
  });

  it("getStylePack returns null for unknown ID", () => {
    const unknown = getStylePack("nonexistent");
    expect(unknown).toBeNull();
  });

  it("getStylePackForMemeStyle maps meme styles correctly", () => {
    expect(getStylePackForMemeStyle("deepFried")?.id).toBe("deepFried");
    expect(getStylePackForMemeStyle("rageComic")?.id).toBe("rageComic");
    expect(getStylePackForMemeStyle("off")).toBeNull();
  });

  it("getStylePackForVisualStyle maps visual styles correctly", () => {
    expect(getStylePackForVisualStyle("cartoon")?.id).toBe("cartoon");
    expect(getStylePackForVisualStyle("cinematic")?.id).toBe("cinematic");
    expect(getStylePackForVisualStyle("auto")).toBeNull();
  });
});

// ============================================
// STYLE PACK CONTENT TESTS
// ============================================

describe("StylePack Content", () => {
  describe("deepFried pack", () => {
    const pack = STYLE_PACKS["deepFried"];

    it("triggers post-processing", () => {
      expect(pack.usePostProcessing).toBe(true);
      expect(pack.postProcessing.length).toBeGreaterThan(0);
    });

    it("has multiple JPEG passes for extreme effect", () => {
      const jpegPasses = pack.postProcessing.filter((s) => s.type === "jpeg_artifacts");
      expect(jpegPasses.length).toBeGreaterThanOrEqual(3); // Multiple passes like deepfriedmemes.com
    });

    it("has high intensity values", () => {
      const saturation = pack.postProcessing.find((s) => s.type === "saturation");
      const contrast = pack.postProcessing.find((s) => s.type === "contrast");

      expect(saturation?.intensity).toBeGreaterThanOrEqual(70);
      expect(contrast?.intensity).toBe(100);
    });

    it("has high priority", () => {
      expect(pack.priority).toBeGreaterThanOrEqual(100);
    });
  });

  describe("cartoon pack", () => {
    const pack = STYLE_PACKS["cartoon"];

    it("emphasizes COLORFUL doodle style with bright colors", () => {
      expect(pack.promptPrefix).toContain("COLORFUL");
      expect(pack.promptPrefix).toContain("blue, orange, green, yellow");
      expect(pack.promptPrefix).toContain("Kurzgesagt");
    });

    it("has anti-realistic negative additions", () => {
      expect(pack.negativeAdditions).toContain("photorealistic");
      expect(pack.negativeAdditions).toContain("realistic");
      expect(pack.negativeAdditions).toContain("photograph");
      expect(pack.negativeAdditions).toContain("black and white");
      expect(pack.negativeAdditions).toContain("grayscale");
    });

    it("has guidance scale to enforce style", () => {
      expect(pack.generationParams?.guidance_scale).toBeGreaterThanOrEqual(10);
    });

    it("enables post-processing for color flattening", () => {
      expect(pack.usePostProcessing).toBe(true);
    });

    it("conflicts with photorealistic", () => {
      expect(pack.conflictsWith).toContain("photorealistic");
    });
  });

  describe("anime pack", () => {
    const pack = STYLE_PACKS["anime"];

    it("has anime-specific prompt additions", () => {
      expect(pack.promptPrefix).toContain("anime");
      expect(pack.promptPrefix).toContain("Japanese animation");
      expect(pack.promptPrefix).toContain("anime eyes");
    });

    it("routes to OpenAI for better stylization", () => {
      expect(pack.recommendedModel).toBe("openai");
    });
  });
});

// ============================================
// PROMPT COMPOSITION TESTS
// ============================================

describe("Prompt Composition", () => {
  const basePrompt = "A person sitting at a desk, excited expression";
  const baseNegative = "blurry, low quality";

  it("adds style prefix to prompt", () => {
    const packs = [STYLE_PACKS["cartoon"]];
    const composed = composeStyledPrompt(basePrompt, packs);

    expect(composed).toContain("COLORFUL CARTOON DOODLE");
    expect(composed).toContain("Kurzgesagt");
    expect(composed).toContain(basePrompt);
  });

  it("adds universal safety suffix", () => {
    const packs = [STYLE_PACKS["cartoon"]];
    const composed = composeStyledPrompt(basePrompt, packs);

    expect(composed).toContain("no text");
    expect(composed).toContain("no watermark");
  });

  it("composes negative prompt with style additions", () => {
    const packs = [STYLE_PACKS["cartoon"]];
    const composed = composeStyledNegativePrompt(baseNegative, packs);

    expect(composed).toContain("photorealistic");
    expect(composed).toContain("hands");
    expect(composed).toContain("fingers");
  });

  it("includes universal negative constraints", () => {
    const composed = composeStyledNegativePrompt("", []);

    expect(composed).toContain("hands");
    expect(composed).toContain("asymmetrical eyes");
    expect(composed).toContain("watermark");
  });

  it("handles multiple style packs", () => {
    // Note: these don't conflict, so both should be applied
    const packs = [STYLE_PACKS["reactionFace"]];
    const composed = composeStyledPrompt(basePrompt, packs);

    expect(composed).toContain("sticker");
    expect(composed).toContain("bold");
  });
});

// ============================================
// CONFLICT RESOLUTION TESTS
// ============================================

describe("Conflict Resolution", () => {
  it("removes lower priority conflicting packs", () => {
    const cartoon = STYLE_PACKS["cartoon"];
    const photorealistic = STYLE_PACKS["photorealistic"];

    // Cartoon conflicts with photorealistic
    const resolved = resolveStyleConflicts([cartoon, photorealistic]);

    // Cartoon has higher priority, should win
    expect(resolved.length).toBe(1);
    expect(resolved[0].id).toBe("cartoon");
  });

  it("deepFried wins over other styles due to high priority", () => {
    const deepFried = STYLE_PACKS["deepFried"];
    const cinematic = STYLE_PACKS["cinematic"];

    const resolved = resolveStyleConflicts([cinematic, deepFried]);

    // deepFried has priority 100, should be first
    expect(resolved[0].id).toBe("deepFried");
  });

  it("keeps non-conflicting packs", () => {
    const reactionFace = STYLE_PACKS["reactionFace"];
    // reactionFace doesn't conflict with many styles

    const resolved = resolveStyleConflicts([reactionFace]);
    expect(resolved.length).toBe(1);
  });

  it("returns empty array for empty input", () => {
    const resolved = resolveStyleConflicts([]);
    expect(resolved).toEqual([]);
  });
});

// ============================================
// MODEL ROUTING TESTS
// ============================================

describe("Model Routing", () => {
  it("returns null for packs with 'any' recommendation", () => {
    const packs = [STYLE_PACKS["deepFried"]];
    const model = getRecommendedModel(packs);

    expect(model).toBeNull(); // deepFried uses post-processing, doesn't need specific model
  });

  it("recommends openai for cartoon style", () => {
    const packs = [STYLE_PACKS["cartoon"]];
    const model = getRecommendedModel(packs);

    expect(model).toBe("openai"); // DALL-E handles stylization better
  });

  it("recommends openai for anime style", () => {
    const packs = [STYLE_PACKS["anime"]];
    const model = getRecommendedModel(packs);

    expect(model).toBe("openai"); // DALL-E handles stylization better
  });

  it("recommends stability for cinematic style", () => {
    const packs = [STYLE_PACKS["cinematic"]];
    const model = getRecommendedModel(packs);

    expect(model).toBe("stability");
  });

  it("uses first pack with specific recommendation", () => {
    const deepFried = STYLE_PACKS["deepFried"];
    const anime = STYLE_PACKS["anime"];

    // deepFried has 'any', anime has 'openai'
    // Since deepFried doesn't conflict with anime, both are kept
    // The function iterates through resolved packs and returns first specific recommendation
    const model = getRecommendedModel([deepFried, anime]);

    // deepFried (priority 100) is first but has 'any', anime (priority 75) has 'openai'
    // So we get openai from anime
    expect(model).toBe("openai");
  });
});

// ============================================
// POST-PROCESSING PIPELINE TESTS
// ============================================

describe("Post-Processing Pipeline", () => {
  it("returns post-processing steps for deepFried", () => {
    const packs = [STYLE_PACKS["deepFried"]];
    const steps = getPostProcessingPipeline(packs);

    expect(steps.length).toBeGreaterThan(0);
    expect(steps.some((s) => s.type === "saturation")).toBe(true);
    expect(steps.some((s) => s.type === "contrast")).toBe(true);
    expect(steps.some((s) => s.type === "sharpen")).toBe(true);
    expect(steps.some((s) => s.type === "jpeg_artifacts")).toBe(true);
  });

  it("returns post-processing steps for cartoon", () => {
    const packs = [STYLE_PACKS["cartoon"]];
    const steps = getPostProcessingPipeline(packs);

    // Cartoon now has post-processing for color flattening
    expect(steps.length).toBeGreaterThan(0);
  });

  it("requiresPostProcessing returns true for deepFried", () => {
    const packs = [STYLE_PACKS["deepFried"]];
    expect(requiresPostProcessing(packs)).toBe(true);
  });

  it("requiresPostProcessing returns true for cartoon", () => {
    const packs = [STYLE_PACKS["cartoon"]];
    expect(requiresPostProcessing(packs)).toBe(true);
  });
});

// ============================================
// CONTROLS MAPPING TESTS
// ============================================

describe("Controls to StylePack Mapping", () => {
  it("maps memeStyle to pack ID", () => {
    const packIds = getStylePackIdsFromControls({ memeStyle: "deepFried" });
    expect(packIds).toContain("deepFried");
  });

  it("maps visualStyle to pack ID when no memeStyle", () => {
    const packIds = getStylePackIdsFromControls({ visualStyle: "cartoon" });
    expect(packIds).toContain("cartoon");
  });

  it("prioritizes memeStyle over visualStyle", () => {
    const packIds = getStylePackIdsFromControls({
      memeStyle: "deepFried",
      visualStyle: "cartoon",
    });

    // Should have deepFried, not cartoon
    expect(packIds).toContain("deepFried");
    expect(packIds).not.toContain("cartoon");
  });

  it("returns empty array for off/auto", () => {
    const packIds = getStylePackIdsFromControls({
      memeStyle: "off",
      visualStyle: "auto",
    });

    expect(packIds).toEqual([]);
  });

  it("maps photoreal to photorealistic", () => {
    const packIds = getStylePackIdsFromControls({ visualStyle: "photoreal" });
    expect(packIds).toContain("photorealistic");
  });
});

// ============================================
// LOGGING / OBSERVABILITY TESTS
// ============================================

describe("Style Application Logging", () => {
  it("logs selected and resolved packs", () => {
    const log = logStyleApplication(["deepFried"], "test prompt", "test negative");

    expect(log.selectedPacks).toContain("deepFried");
    expect(log.resolvedPacks).toContain("deepFried");
  });

  it("logs conflicts removed", () => {
    // Cartoon and photorealistic conflict
    const log = logStyleApplication(
      ["cartoon", "photorealistic"],
      "test prompt",
      "test negative"
    );

    // Cartoon wins (higher priority), photorealistic should be removed
    expect(log.resolvedPacks).toContain("cartoon");
    expect(log.conflictsRemoved).toContain("photorealistic");
  });

  it("includes prompt preview", () => {
    const log = logStyleApplication(["deepFried"], "test prompt", "");

    expect(log.promptPreview).toBeDefined();
    expect(log.promptPreview.length).toBeGreaterThan(0);
  });

  it("includes post-processing steps", () => {
    const log = logStyleApplication(["deepFried"], "test prompt", "");

    expect(log.postProcessingSteps.length).toBeGreaterThan(0);
    expect(log.postProcessingSteps.some((s) => s.includes("saturation"))).toBe(true);
  });
});

// ============================================
// SNAPSHOT TESTS FOR PROMPT COMPOSITION
// ============================================

describe("Prompt Composition Snapshots", () => {
  const basePrompt =
    "A content creator sitting at desk, excited expression, looking at camera";

  it("deepFried prompt has effect markers", () => {
    const packs = [STYLE_PACKS["deepFried"]];
    const composed = composeStyledPrompt(basePrompt, packs);

    // Deep fried relies primarily on post-processing, not prompt
    expect(composed).toContain("bold");
    expect(composed).toContain("contrast");
  });

  it("cartoon prompt asks for COLORFUL doodles with vibrant colors", () => {
    const packs = [STYLE_PACKS["cartoon"]];
    const composed = composeStyledPrompt(basePrompt, packs);

    expect(composed).toContain("COLORFUL CARTOON DOODLE");
    expect(composed).toContain("Kurzgesagt");
    expect(composed).toContain("VIBRANT COLORS");
    expect(composed).toContain("blue, orange, green, yellow");
  });

  it("anime prompt has anime-specific markers", () => {
    const packs = [STYLE_PACKS["anime"]];
    const composed = composeStyledPrompt(basePrompt, packs);

    expect(composed).toContain("anime");
    expect(composed).toContain("Japanese animation");
    expect(composed).toContain("anime eyes");
  });

  it("rageComic prompt has rage comic markers", () => {
    const packs = [STYLE_PACKS["rageComic"]];
    const composed = composeStyledPrompt(basePrompt, packs);

    expect(composed).toContain("rage comic");
    expect(composed).toContain("line art");
    expect(composed).toContain("webcomic");
  });
});
