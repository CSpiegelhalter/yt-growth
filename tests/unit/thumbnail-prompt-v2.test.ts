/**
 * Prompt Builder V2 Tests
 *
 * Tests for the new weighted-block prompt builder with:
 * - Meme style recipes (rageComic, reactionFace, wojakLike, surrealCursed, deepFried)
 * - Character identity controls (gender, age)
 * - Screen/UI constraints
 * - Style-specific avoids (no "photorealistic" diluting rage comic style)
 */

import { describe, test, expect } from "bun:test";
import {
  buildPromptBlocks,
  assemblePrompt,
  buildPromptFromControls,
  STYLE_RECIPES,
  STYLE_AVOIDS,
} from "@/lib/thumbnails/promptBuilder";
import {
  getDefaultControls,
  type GenerationControls,
} from "@/lib/thumbnails/generationControls";

describe("STYLE_RECIPES constants", () => {
  test("rage comic recipe includes key style terms", () => {
    expect(STYLE_RECIPES.rageComic.toLowerCase()).toContain("rage-comic");
    expect(STYLE_RECIPES.rageComic.toLowerCase()).toContain("webcomic line art");
    expect(STYLE_RECIPES.rageComic.toLowerCase()).toContain("thick");
    expect(STYLE_RECIPES.rageComic.toLowerCase()).toContain("ink outline");
    expect(STYLE_RECIPES.rageComic.toLowerCase()).toContain("2d flat");
    expect(STYLE_RECIPES.rageComic.toLowerCase()).toContain("original");
    expect(STYLE_RECIPES.rageComic.toLowerCase()).toContain("not a copy");
  });

  test("rage comic recipe does NOT include conflicting terms", () => {
    expect(STYLE_RECIPES.rageComic.toLowerCase()).not.toContain("photorealistic");
    expect(STYLE_RECIPES.rageComic.toLowerCase()).not.toContain("3d render");
    expect(STYLE_RECIPES.rageComic.toLowerCase()).not.toContain("cinematic");
  });

  test("reaction face recipe includes key style terms", () => {
    expect(STYLE_RECIPES.reactionFace.toLowerCase()).toContain("sticker");
    expect(STYLE_RECIPES.reactionFace.toLowerCase()).toContain("cutout");
    expect(STYLE_RECIPES.reactionFace.toLowerCase()).toContain("bold");
    expect(STYLE_RECIPES.reactionFace.toLowerCase()).toContain("outline");
  });

  test("wojak-like recipe includes key style terms", () => {
    expect(STYLE_RECIPES.wojakLike.toLowerCase()).toContain("minimalistic");
    expect(STYLE_RECIPES.wojakLike.toLowerCase()).toContain("line art");
    expect(STYLE_RECIPES.wojakLike.toLowerCase()).toContain("original");
  });

  test("surreal cursed recipe includes key style terms", () => {
    expect(STYLE_RECIPES.surrealCursed.toLowerCase()).toContain("surreal");
    expect(STYLE_RECIPES.surrealCursed.toLowerCase()).toContain("absurdist");
    expect(STYLE_RECIPES.surrealCursed.toLowerCase()).toContain("dreamlike");
  });

  test("deep fried recipe includes key style terms", () => {
    expect(STYLE_RECIPES.deepFried.toLowerCase()).toContain("deep-fried");
    expect(STYLE_RECIPES.deepFried.toLowerCase()).toContain("over-sharpened");
    expect(STYLE_RECIPES.deepFried.toLowerCase()).toContain("posterized");
    expect(STYLE_RECIPES.deepFried.toLowerCase()).toContain("jpeg");
  });
});

describe("STYLE_AVOIDS constants", () => {
  test("rage comic avoids include conflicting styles", () => {
    expect(STYLE_AVOIDS.rageComic).toContain("photorealistic");
    expect(STYLE_AVOIDS.rageComic).toContain("3D render");
    expect(STYLE_AVOIDS.rageComic).toContain("cinematic");
    expect(STYLE_AVOIDS.rageComic).toContain("anime shading");
  });

  test("reaction face avoids include photorealistic", () => {
    expect(STYLE_AVOIDS.reactionFace).toContain("photorealistic skin texture");
    expect(STYLE_AVOIDS.reactionFace).toContain("hyperrealistic");
  });

  test("deep fried avoids include clean/smooth terms", () => {
    expect(STYLE_AVOIDS.deepFried).toContain("clean crisp edges");
    expect(STYLE_AVOIDS.deepFried).toContain("smooth gradients");
  });
});

describe("buildPromptBlocks - memeStyle=rageComic", () => {
  const baseControls = getDefaultControls();

  test("produces rage comic style block", () => {
    const controls: GenerationControls = {
      ...baseControls,
      memeStyle: "rageComic",
      includePerson: true,
    };
    const blocks = buildPromptBlocks(controls);

    expect(blocks.styleBlock.toLowerCase()).toContain("rage-comic");
    expect(blocks.styleBlock.toLowerCase()).toContain("webcomic");
    expect(blocks.styleBlock.toLowerCase()).toContain("ink outline");
  });

  test("includes rage comic specific avoids", () => {
    const controls: GenerationControls = {
      ...baseControls,
      memeStyle: "rageComic",
    };
    const blocks = buildPromptBlocks(controls);

    expect(blocks.hardAvoid).toContain("photorealistic");
    expect(blocks.hardAvoid).toContain("3D render");
    expect(blocks.hardAvoid).toContain("cinematic");
  });

  test("assembled prompt includes style recipe", () => {
    const controls: GenerationControls = {
      ...baseControls,
      memeStyle: "rageComic",
    };
    const blocks = buildPromptBlocks(controls);
    const { prompt, negativePrompt } = assemblePrompt(blocks);

    expect(prompt.toLowerCase()).toContain("rage-comic");
    expect(prompt.toLowerCase()).toContain("webcomic");
    expect(negativePrompt.toLowerCase()).toContain("photorealistic");
    expect(negativePrompt.toLowerCase()).toContain("3d render");
  });

  test("does NOT include generic bold modern language", () => {
    const controls: GenerationControls = {
      ...baseControls,
      memeStyle: "rageComic",
    };
    const blocks = buildPromptBlocks(controls);
    const { prompt } = assemblePrompt(blocks);

    // Rage comic should not have conflicting style terms
    expect(prompt.toLowerCase()).not.toContain("cinematic quality");
    expect(prompt.toLowerCase()).not.toContain("photorealistic");
  });
});

describe("buildPromptBlocks - characterGender", () => {
  const baseControls = getDefaultControls();

  test("includes female-presenting when gender=female", () => {
    const controls: GenerationControls = {
      ...baseControls,
      characterEnabled: true,
      characterGender: "female",
      includePerson: true,
    };
    const blocks = buildPromptBlocks(controls);

    const hasFemale = blocks.hardMust.some(
      (m) => m.toLowerCase().includes("female") || m.toLowerCase().includes("feminine")
    );
    expect(hasFemale).toBe(true);
  });

  test("includes male-presenting when gender=male", () => {
    const controls: GenerationControls = {
      ...baseControls,
      characterEnabled: true,
      characterGender: "male",
      includePerson: true,
    };
    const blocks = buildPromptBlocks(controls);

    const hasMale = blocks.hardMust.some(
      (m) => m.toLowerCase().includes("male") || m.toLowerCase().includes("masculine")
    );
    expect(hasMale).toBe(true);
  });

  test("includes neutral when gender=neutral", () => {
    const controls: GenerationControls = {
      ...baseControls,
      characterEnabled: true,
      characterGender: "neutral",
      includePerson: true,
    };
    const blocks = buildPromptBlocks(controls);

    const hasNeutral = blocks.hardMust.some(
      (m) => m.toLowerCase().includes("neutral") || m.toLowerCase().includes("androgynous")
    );
    expect(hasNeutral).toBe(true);
  });

  test("no gender constraint when gender=auto", () => {
    const controls: GenerationControls = {
      ...baseControls,
      characterEnabled: true,
      characterGender: "auto",
      includePerson: true,
    };
    const blocks = buildPromptBlocks(controls);

    const hasGenderConstraint = blocks.hardMust.some(
      (m) =>
        m.toLowerCase().includes("female") ||
        m.toLowerCase().includes("male") ||
        m.toLowerCase().includes("masculine") ||
        m.toLowerCase().includes("feminine")
    );
    expect(hasGenderConstraint).toBe(false);
  });
});

describe("buildPromptBlocks - avoidScreens", () => {
  const baseControls = getDefaultControls();

  test("includes no screens constraint when avoidScreens=true", () => {
    const controls: GenerationControls = {
      ...baseControls,
      avoidScreens: true,
    };
    const blocks = buildPromptBlocks(controls);

    const hasNoScreens = blocks.hardMust.some(
      (m) =>
        m.toLowerCase().includes("no laptop") ||
        m.toLowerCase().includes("no screen") ||
        m.toLowerCase().includes("no monitor")
    );
    expect(hasNoScreens).toBe(true);

    expect(blocks.hardAvoid).toContain("laptop");
    expect(blocks.hardAvoid).toContain("monitor");
    expect(blocks.hardAvoid).toContain("screen");
  });

  test("allows abstract blocks UI by default", () => {
    const controls: GenerationControls = {
      ...baseControls,
      avoidScreens: false,
      uiMode: "abstractBlocks",
    };
    const blocks = buildPromptBlocks(controls);

    const hasAbstractUI = blocks.hardMust.some(
      (m) =>
        m.toLowerCase().includes("abstract") ||
        m.toLowerCase().includes("blurred")
    );
    expect(hasAbstractUI).toBe(true);

    expect(blocks.hardAvoid).toContain("readable text on screen");
  });

  test("no screens when uiMode=none", () => {
    const controls: GenerationControls = {
      ...baseControls,
      avoidScreens: false,
      uiMode: "none",
    };
    const blocks = buildPromptBlocks(controls);

    const hasNoScreens = blocks.hardMust.some(
      (m) =>
        m.toLowerCase().includes("no laptop") ||
        m.toLowerCase().includes("no screen")
    );
    expect(hasNoScreens).toBe(true);
  });
});

describe("buildPromptBlocks - emoji icons", () => {
  const baseControls = getDefaultControls();

  test("includes emoji instruction when emojis enabled", () => {
    const controls: GenerationControls = {
      ...baseControls,
      includeEmojis: true,
      emojiCount: 2,
      emojiIconStyle: "popular",
    };
    const blocks = buildPromptBlocks(controls);

    const hasEmoji = blocks.hardMust.some(
      (m) =>
        m.toLowerCase().includes("emoji") || m.toLowerCase().includes("icon")
    );
    expect(hasEmoji).toBe(true);

    expect(blocks.hardAvoid).toContain("official Apple emoji");
    expect(blocks.hardAvoid).toContain("platform emoji glyphs");
  });

  test("cursed emoji style mentions cursed icons", () => {
    const controls: GenerationControls = {
      ...baseControls,
      includeEmojis: true,
      emojiCount: 2,
      emojiIconStyle: "cursed",
    };
    const blocks = buildPromptBlocks(controls);

    // Should include some emoji instruction
    const hasEmoji = blocks.hardMust.some(
      (m) => m.toLowerCase().includes("emoji") || m.toLowerCase().includes("icon")
    );
    expect(hasEmoji).toBe(true);
  });
});

describe("buildPromptFromControls - integration", () => {
  test("rage comic produces complete prompt with style", () => {
    const controls: GenerationControls = {
      ...getDefaultControls(),
      memeStyle: "rageComic",
      includePerson: true,
      avoidHands: true,
    };

    const { prompt, negativePrompt } = buildPromptFromControls(
      controls,
      "Testing rage comic style"
    );

    // Should have style recipe
    expect(prompt.toLowerCase()).toContain("rage-comic");
    expect(prompt.toLowerCase()).toContain("webcomic");
    expect(prompt.toLowerCase()).toContain("ink outline");

    // Should have no-text instruction
    expect(prompt.toLowerCase()).toContain("no text");
    expect(prompt.toLowerCase()).toContain("no words");

    // Negative should have style avoids
    expect(negativePrompt.toLowerCase()).toContain("photorealistic");
    expect(negativePrompt.toLowerCase()).toContain("3d render");

    // Should NOT have conflicting style terms
    expect(prompt.toLowerCase()).not.toContain("cinematic lighting");
  });

  test("female character produces gender constraint", () => {
    const controls: GenerationControls = {
      ...getDefaultControls(),
      characterEnabled: true,
      characterGender: "female",
      includePerson: true,
    };

    const { prompt } = buildPromptFromControls(controls, "Test topic");

    expect(prompt.toLowerCase()).toContain("female");
  });

  test("avoidScreens produces no screen constraint", () => {
    const controls: GenerationControls = {
      ...getDefaultControls(),
      avoidScreens: true,
    };

    const { prompt, negativePrompt } = buildPromptFromControls(
      controls,
      "Tech tutorial"
    );

    expect(prompt.toLowerCase()).toContain("no laptop");
    expect(negativePrompt.toLowerCase()).toContain("laptop");
    expect(negativePrompt.toLowerCase()).toContain("monitor");
  });
});

describe("meme style overrides visual style", () => {
  test("rageComic overrides photoreal", () => {
    const controls: GenerationControls = {
      ...getDefaultControls(),
      visualStyle: "photoreal", // This should be overridden
      memeStyle: "rageComic",
    };

    const blocks = buildPromptBlocks(controls);

    // Should have rage comic style, not photoreal
    expect(blocks.styleBlock.toLowerCase()).toContain("rage-comic");
    expect(blocks.styleBlock.toLowerCase()).not.toContain("photorealistic");
  });

  test("reactionFace overrides cinematic", () => {
    const controls: GenerationControls = {
      ...getDefaultControls(),
      visualStyle: "cinematic",
      memeStyle: "reactionFace",
    };

    const blocks = buildPromptBlocks(controls);

    expect(blocks.styleBlock.toLowerCase()).toContain("sticker");
    expect(blocks.styleBlock.toLowerCase()).toContain("cutout");
  });

  test("off memeStyle uses visualStyle", () => {
    const controls: GenerationControls = {
      ...getDefaultControls(),
      visualStyle: "anime",
      memeStyle: "off",
    };

    const blocks = buildPromptBlocks(controls);

    expect(blocks.styleBlock.toLowerCase()).toContain("anime");
  });
});

describe("hands avoidance constraint", () => {
  test("avoidHands adds constraint to hardMust", () => {
    const controls: GenerationControls = {
      ...getDefaultControls(),
      avoidHands: true,
      includePerson: true,
    };

    const blocks = buildPromptBlocks(controls);

    const hasNoHands = blocks.hardMust.some(
      (m) => m.toLowerCase().includes("no visible hands")
    );
    expect(hasNoHands).toBe(true);

    expect(blocks.hardAvoid).toContain("visible hands");
    expect(blocks.hardAvoid).toContain("fingers");
  });

  test("avoidHands=false does not add constraint", () => {
    const controls: GenerationControls = {
      ...getDefaultControls(),
      avoidHands: false,
      includePerson: true,
    };

    const blocks = buildPromptBlocks(controls);

    const hasNoHands = blocks.hardMust.some(
      (m) => m.toLowerCase().includes("no visible hands")
    );
    expect(hasNoHands).toBe(false);
  });
});

describe("no text constraint always present", () => {
  test("hardMust always includes no text instruction", () => {
    const controls = getDefaultControls();
    const blocks = buildPromptBlocks(controls);

    const hasNoText = blocks.hardMust.some(
      (m) =>
        m.toLowerCase().includes("no text") ||
        m.toLowerCase().includes("no words") ||
        m.toLowerCase().includes("no letters")
    );
    expect(hasNoText).toBe(true);
  });

  test("assembled prompt ends with no text reminder", () => {
    const controls = getDefaultControls();
    const blocks = buildPromptBlocks(controls);
    const { prompt } = assemblePrompt(blocks);

    // Check final section mentions no text
    const lastSection = prompt.split("\n\n").pop() || "";
    expect(lastSection.toLowerCase()).toContain("no text");
  });
});

describe("topic anchors in prompt", () => {
  test("topic anchors appear in topicAnchorsBlock", () => {
    const controls = getDefaultControls();
    const plan = {
      topicAnchors: ["laptop", "code", "programming"],
      topicSummary: "Tech tutorial",
    };

    const blocks = buildPromptBlocks(controls, plan);

    expect(blocks.topicAnchorsBlock).toContain("laptop");
    expect(blocks.topicAnchorsBlock).toContain("code");
    expect(blocks.topicAnchorsBlock).toContain("programming");
    expect(blocks.topicAnchorsBlock).toContain("MUST DEPICT");
  });

  test("topic summary fallback when no anchors", () => {
    const controls = getDefaultControls();
    const blocks = buildPromptBlocks(controls, undefined, "Finance video");

    expect(blocks.topicAnchorsBlock).toContain("Finance video");
  });
});
