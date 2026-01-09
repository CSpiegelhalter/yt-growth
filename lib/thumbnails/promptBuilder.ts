/**
 * YouTube Thumbnail Prompt Builder (V2 - Weighted Blocks)
 *
 * Builds optimized prompts with HARD constraints first, then SOFT preferences.
 * Includes explicit style recipes for meme styles (rage comic, cursed, etc.)
 *
 * Key principles:
 * 1. HARD MUST constraints take priority (topic, style, locked controls)
 * 2. Style recipes are explicit and specific (not diluted by generic language)
 * 3. BOGY palette + contrast + negative space always preserved
 * 4. Anti-AI artifact constraints (hands, screens, UI)
 * 5. NO TEXT in base image (text composited by us)
 *
 * Block order:
 * 1. hardMust + topicAnchors + locked user controls
 * 2. styleBlock (style recipe paragraph - specific to meme/cartoon/photoreal)
 * 3. compositionBlock + negative space
 * 4. paletteBlock (BOGY)
 * 5. qualityBlock + anti-artifact constraints
 * 6. Final reminder: "no text/no words"
 */

import type { ThumbnailDirection, LayoutType } from "./thumbnailDirection";
import type { ConceptPlan, ThumbnailPlan, FallbackMode } from "./types";
import type {
  GenerationControls,
  MemeStyle,
} from "./generationControls";
import {
  getMemeInspirationDescription,
  sanitizeInspirationText,
} from "./generationControls";
import { getStyleReferencePromptAddition } from "./memeReferences";

// ============================================
// TYPES
// ============================================

export type PromptBlocks = {
  /** Requirements that MUST be in the image */
  hardMust: string[];
  /** Things that MUST NOT be in the image */
  hardAvoid: string[];
  /** Style recipe paragraph (meme/cartoon/photoreal specific) */
  styleBlock: string;
  /** Composition and layout guidance */
  compositionBlock: string;
  /** BOGY color palette guidance */
  paletteBlock: string;
  /** Topic anchors - what must be depicted */
  topicAnchorsBlock: string;
  /** Quality and anti-artifact constraints */
  qualityBlock: string;
};

// ============================================
// CONSTANTS
// ============================================

/**
 * Core BOGY instruction for all prompts
 */
const BOGY_INSTRUCTION = `Use a vibrant BOGY palette (Blue, Orange, Green, Yellow) as the dominant colors. Avoid heavy red, white, or black dominance - small amounts allowed for outlines, shadows, or accents only.`;

/**
 * Quality instruction
 */
const QUALITY_INSTRUCTION = `Professional quality, 4K sharp details, high contrast, dramatic lighting with rim light on subject, crisp edges, vibrant saturated colors.`;

/**
 * NO TEXT instruction - ALWAYS included
 */
const NO_TEXT_INSTRUCTION = `CRITICAL: Generate NO text, NO words, NO letters, NO numbers, NO watermarks, NO logos in the image. Leave clean space for text overlay to be added later.`;

/**
 * Negative prompt for exclusions (includes anti-AI artifact terms)
 */
export const STANDARD_NEGATIVE_PROMPT = `text, words, letters, numbers, watermarks, logos, signatures, low contrast, flat background, blurry, grainy, cluttered, busy collage, tiny subject, oversaturated, washed out, dark muddy colors, amateur quality, stock photo look, deformed, extra fingers, extra limbs, malformed hands, distorted face, duplicated objects, impossible screens, warped keyboard, uncanny valley, bad anatomy, wrong proportions, mutated, disfigured, poorly drawn`;

// ============================================
// STYLE RECIPES - Explicit meme style prompts
// ============================================

/**
 * Style recipe for rage comic aesthetic
 * IMPORTANT: Must NOT include "photoreal", "3D", "cinematic" - these dilute the style
 */
const RAGE_COMIC_RECIPE = `STYLE: Black-and-white rage-comic-inspired webcomic line art. Thick uneven ink outlines, simple crude shading with minimal gradients, 2D flat drawing, extremely exaggerated facial features and expression. Face is the focal point, taking up most of the frame. High contrast black lines on white/light background. Expression is extreme and comedic. Looks like an early 2010s forum comic or MS Paint webcomic. IMPORTANT: This must be an ORIGINAL face design inspired by rage comic aesthetic, NOT a copy of any existing meme face (not trollface, not rage guy, not any known meme).`;

const RAGE_COMIC_AVOID = [
  "photorealistic",
  "3D render",
  "soft painterly",
  "anime shading",
  "cute Pixar style",
  "generic cartoon mascot",
  "smooth gradients",
  "realistic lighting",
  "cinematic",
  "hyperrealistic",
  "exact trollface",
  "exact rage guy",
  "exact y u no face",
  "copyrighted meme faces",
];

/**
 * Style recipe for reaction face (modern meme thumbnail)
 */
const REACTION_FACE_RECIPE = `STYLE: Clean sticker-cutout reaction face style. Bold thick outline around the subject like a sticker cutout. High saturation accent colors. Simple flat shading with minimal gradients. Original expressive face design - NOT photorealistic, NOT uncanny. Exaggerated facial expression matching the emotion. Face clearly separated from background. Modern YouTube thumbnail reaction aesthetic.`;

const REACTION_FACE_AVOID = [
  "photorealistic skin texture",
  "hyperrealistic",
  "uncanny valley",
  "soft blended edges",
  "no outline",
  "realistic portrait photography",
];

/**
 * Style recipe for wojak-like minimalist faces
 */
const WOJAK_LIKE_RECIPE = `STYLE: Minimalistic 2D line art portrait in the style of simple emotional web comics. Muted but high-contrast palette. Simple geometric shapes for features. Expressive sadness, irony, or emotion through minimal lines. Original character design (NOT a direct copy of wojak, feels guy, or any specific meme). Clean simple background. Focus on emotional expression with minimal detail.`;

const WOJAK_LIKE_AVOID = [
  "photorealistic",
  "detailed shading",
  "complex textures",
  "3D render",
  "exact wojak copy",
  "exact feels guy copy",
  "copyrighted meme characters",
];

/**
 * Style recipe for surreal cursed meme aesthetic
 */
const SURREAL_CURSED_RECIPE = `STYLE: Surreal absurdist internet meme aesthetic. Slightly unsettling but funny. Unexpected object combinations that are still physically plausible. Bold color pops against muted or strange backgrounds. Simple composition with clear subject. Dreamlike or "slightly wrong" feeling. NOT grotesque or body horror. Original surreal imagery, not copied from existing memes.`;

const SURREAL_CURSED_AVOID = [
  "body horror",
  "grotesque anatomy",
  "gore",
  "disturbing content",
  "realistic violence",
  "generic stock photo",
  "normal everyday scene",
];

/**
 * Style recipe for deep-fried meme look
 */
const DEEP_FRIED_RECIPE = `STYLE: "Deep-fried" meme aesthetic. Over-sharpened edges, heavy contrast, posterized colors with reduced color depth. Slight JPEG artifact texture (subtle, not overwhelming). Red/orange color cast tint. Bright saturated highlights. Still readable and recognizable at mobile thumbnail size. Clear focal subject despite the processing effect.`;

const DEEP_FRIED_AVOID = [
  "clean crisp edges",
  "smooth gradients",
  "professional photography look",
  "soft lighting",
  "muted colors",
];

/**
 * Style recipe for photoreal (when NOT using meme style)
 */
const PHOTOREAL_RECIPE = `STYLE: Photorealistic, cinematic quality. Natural skin textures and lighting. Professional photography or high-end digital art. Dramatic cinematic lighting with rim light. Realistic proportions and anatomy. High detail and sharp focus.`;

/**
 * Style recipe for cartoon (generic, not meme-specific)
 */
const CARTOON_RECIPE = `STYLE: Clean cartoon illustration style. Bold outlines, vibrant colors, simplified shapes. Expressive but not extreme. Professional illustration quality. Consistent style throughout.`;

/**
 * Style recipe for anime
 */
const ANIME_RECIPE = `STYLE: Anime/manga illustration style. Large expressive eyes, dynamic poses, cel-shaded coloring. Clean linework, vibrant colors. Japanese animation aesthetic.`;

/**
 * Style recipe for 3D mascot
 */
const MASCOT_3D_RECIPE = `STYLE: 3D rendered mascot character. Smooth surfaces, soft shadows, friendly appearance. Pixar/Disney-quality rendering. Appealing character design.`;

// ============================================
// EMOJI STYLE RECIPES
// ============================================

/**
 * Popular emoji-like icons (original, not platform copies)
 */
const POPULAR_EMOJI_ICONS = [
  "fire icon",
  "sparkles icon",
  "chart trending up icon",
  "warning triangle icon",
  "thumbs up icon",
  "star icon",
  "lightning bolt icon",
  "checkmark icon",
  "skull icon",
  "crown icon",
];

/**
 * Cursed/weird emoji-like icons (original designs)
 */
const CURSED_EMOJI_ICONS = [
  "melting face icon",
  "dizzy spiral eyes icon",
  "clown face icon",
  "skull with heart eyes icon",
  "alien face icon",
  "ghost icon",
  "eye icon",
  "brain icon",
  "void/black circle icon",
];

const EMOJI_STYLE_INSTRUCTION = `Include original emoji-like sticker icons as decorative elements (NOT official Apple emoji, NOT Twemoji, NOT platform emoji glyphs). Simple vector sticker style icons.`;

// ============================================
// SCREEN/UI CONSTRAINTS
// ============================================

const SCREEN_CONSTRAINTS_STRICT = `CRITICAL: NO laptops, NO monitors, NO screens, NO phones, NO tablets, NO computer displays of any kind.`;

const SCREEN_CONSTRAINTS_ABSTRACT = `If showing a screen/laptop: SINGLE front-facing screen only, correct laptop hinge angle (90-120 degrees), proper keyboard layout, screen faces viewer directly. UI shown as BLURRED ABSTRACT BLOCKS or color shapes only - NO readable text, NO specific UI elements, NO warped perspective, NO screens on the back of the device.`;

const SCREEN_CONSTRAINTS_BLURRED = `If showing a screen/laptop: UI must be blurred mockup only with abstract color blocks representing interface. NO readable text on screen. Single correctly-oriented device.`;

// ============================================
// HUMAN SUBJECT CONSTRAINTS
// ============================================

const HUMAN_CONSTRAINTS = `HUMAN SUBJECT: Natural proportions, symmetric features, proper skin texture. If hands visible: EXACTLY 5 fingers per hand. No extra limbs or duplicated body parts.`;

const HANDS_AVOID_CONSTRAINT = `CRITICAL: NO visible hands. Crop above wrists or hide hands behind objects/frame edge.`;

// ============================================
// GENDER CONSTRAINTS
// ============================================

function getGenderConstraint(gender: string): string {
  switch (gender) {
    case "male":
      return "Character is clearly MALE-presenting with masculine features.";
    case "female":
      return "Character is clearly FEMALE-presenting with feminine features.";
    case "neutral":
      return "Character is GENDER-NEUTRAL with androgynous features.";
    default:
      return "";
  }
}

// ============================================
// MAIN BLOCK BUILDER
// ============================================

/**
 * Build prompt blocks from GenerationControls and ThumbnailPlan.
 * Returns structured blocks that are assembled in priority order.
 */
export function buildPromptBlocks(
  controls: GenerationControls,
  plan?: Partial<ThumbnailPlan>,
  topicSummary?: string
): PromptBlocks {
  const hardMust: string[] = [];
  const hardAvoid: string[] = [];
  let styleBlock = "";
  let compositionBlock = "";
  let paletteBlock = BOGY_INSTRUCTION;
  let topicAnchorsBlock = "";
  let qualityBlock = QUALITY_INSTRUCTION;

  // === HARD MUST: Topic anchors ===
  if (plan?.topicAnchors && plan.topicAnchors.length > 0) {
    topicAnchorsBlock = `MUST DEPICT: ${plan.topicAnchors.join(
      ", "
    )}. Topic: "${topicSummary || plan.topicSummary || "general"}".`;
  } else if (topicSummary) {
    topicAnchorsBlock = `Topic: "${topicSummary}".`;
  }

  // === STYLE BLOCK: Based on memeStyle (takes priority over visualStyle) ===
  styleBlock = buildStyleBlock(controls);

  // === STYLE REFERENCE: If user selected a meme reference image ===
  if (controls.styleReferenceId) {
    const styleRefPrompt = getStyleReferencePromptAddition(
      controls.styleReferenceId
    );
    if (styleRefPrompt) {
      // Style reference takes highest priority - prepend to style block
      styleBlock = styleRefPrompt + " " + styleBlock;
    }
  }

  // Add style-specific avoids
  const styleAvoids = getStyleAvoids(controls.memeStyle);
  hardAvoid.push(...styleAvoids);

  // === CHARACTER CONSTRAINTS ===
  if (controls.includePerson && controls.characterEnabled) {
    // Gender constraint
    if (controls.characterGender && controls.characterGender !== "auto") {
      hardMust.push(getGenderConstraint(controls.characterGender));
    }

    // Age constraint
    if (controls.characterAge && controls.characterAge !== "auto") {
      const ageMap: Record<string, string> = {
        young: "young adult in their 20s",
        adult: "adult in their 30s-40s",
        older: "mature adult 50+",
      };
      hardMust.push(
        `Character appears as ${ageMap[controls.characterAge] || "adult"}.`
      );
    }

    // Human constraints (unless meme style overrides)
    if (controls.memeStyle === "off" || controls.memeStyle === "reactionFace") {
      hardMust.push(HUMAN_CONSTRAINTS);
    }
  } else if (!controls.includePerson) {
    hardAvoid.push("human", "person", "face", "people");
  }

  // === HAND AVOIDANCE ===
  if (controls.avoidHands) {
    hardMust.push(HANDS_AVOID_CONSTRAINT);
    hardAvoid.push("visible hands", "fingers", "holding objects");
  }

  // === SCREEN/UI CONSTRAINTS ===
  if (controls.avoidScreens) {
    hardMust.push(SCREEN_CONSTRAINTS_STRICT);
    hardAvoid.push(
      "laptop",
      "monitor",
      "screen",
      "phone",
      "tablet",
      "computer display"
    );
  } else if (controls.uiMode === "none") {
    hardMust.push(SCREEN_CONSTRAINTS_STRICT);
  } else if (controls.uiMode === "abstractBlocks") {
    hardMust.push(SCREEN_CONSTRAINTS_ABSTRACT);
    hardAvoid.push("readable text on screen", "detailed UI", "warped screen");
  } else if (controls.uiMode === "blurredMockUI") {
    hardMust.push(SCREEN_CONSTRAINTS_BLURRED);
    hardAvoid.push("readable text on screen", "specific app interfaces");
  }

  // === EMOJI ICONS ===
  if (controls.includeEmojis && controls.emojiCount > 0) {
    const emojiInstruction = buildEmojiInstruction(controls);
    hardMust.push(emojiInstruction);
    hardAvoid.push(
      "official Apple emoji",
      "Twemoji",
      "platform emoji glyphs",
      "exact emoji copies"
    );
  }

  // === COMPOSITION ===
  compositionBlock = buildCompositionBlock(controls, plan);

  // === PALETTE ===
  if (controls.primaryColor) {
    paletteBlock += ` Primary color: ${controls.primaryColor.toUpperCase()}.`;
  }
  if (controls.accentColor) {
    paletteBlock += ` Accent color: ${controls.accentColor.toUpperCase()}.`;
  }
  if (controls.contrastBoost) {
    paletteBlock += " High contrast, strong color separation.";
  }
  if (controls.saturationBoost) {
    paletteBlock += " Boosted saturation, vibrant punchy colors.";
  }

  // === QUALITY/ANTI-ARTIFACT ===
  if (controls.avoidUncanny) {
    qualityBlock +=
      " Avoid uncanny valley - consistent style, no mixed realism.";
  }

  // === INSPIRATION TEXT ===
  if (controls.inspirationsText) {
    const sanitized = sanitizeInspirationText(controls.inspirationsText);
    if (sanitized) {
      hardMust.push(`Style inspiration (vibe only, not copy): "${sanitized}".`);
    }
  }

  // === MEME INSPIRATIONS ===
  if (controls.memeInspirations && controls.memeInspirations.length > 0) {
    const inspirationDescs = controls.memeInspirations
      .slice(0, 2) // Max 2 inspirations
      .map((tag) => getMemeInspirationDescription(tag))
      .join("; ");
    hardMust.push(
      `Expression inspiration (ORIGINAL design, not copy): ${inspirationDescs}.`
    );
  }

  // Always add no-text to hardMust
  hardMust.push(NO_TEXT_INSTRUCTION);

  // Standard negative prompt items
  hardAvoid.push(
    "text",
    "words",
    "letters",
    "numbers",
    "watermarks",
    "logos",
    "signatures"
  );

  return {
    hardMust,
    hardAvoid,
    styleBlock,
    compositionBlock,
    paletteBlock,
    topicAnchorsBlock,
    qualityBlock,
  };
}

/**
 * Build the style block based on memeStyle and visualStyle.
 * memeStyle takes PRIORITY - if set, it overrides visualStyle.
 */
function buildStyleBlock(controls: GenerationControls): string {
  const { memeStyle, visualStyle, memeIntensity } = controls;

  // Meme style takes priority
  if (memeStyle && memeStyle !== "off") {
    switch (memeStyle) {
      case "rageComic":
        return RAGE_COMIC_RECIPE;
      case "reactionFace":
        return REACTION_FACE_RECIPE;
      case "wojakLike":
        return WOJAK_LIKE_RECIPE;
      case "surrealCursed":
        return SURREAL_CURSED_RECIPE;
      case "deepFried":
        return DEEP_FRIED_RECIPE;
    }
  }

  // If meme intensity is high but no specific meme style, use reaction face as default
  if (memeIntensity === "max" && memeStyle === "off") {
    return REACTION_FACE_RECIPE;
  }

  // Fall back to visualStyle
  switch (visualStyle) {
    case "photoreal":
    case "cinematic":
      return PHOTOREAL_RECIPE;
    case "cartoon":
    case "comic-ink":
      return CARTOON_RECIPE;
    case "anime":
      return ANIME_RECIPE;
    case "3d-mascot":
      return MASCOT_3D_RECIPE;
    case "vector-flat":
      return "STYLE: Flat vector illustration with bold shapes, minimal shading, clean geometric forms.";
    default:
      // Auto - return a balanced style that doesn't conflict with potential meme usage
      return "STYLE: Bold modern thumbnail style, clear focal subject, high contrast, expressive.";
  }
}

/**
 * Get style-specific avoid terms to prevent dilution.
 */
function getStyleAvoids(memeStyle: MemeStyle): string[] {
  switch (memeStyle) {
    case "rageComic":
      return [...RAGE_COMIC_AVOID];
    case "reactionFace":
      return [...REACTION_FACE_AVOID];
    case "wojakLike":
      return [...WOJAK_LIKE_AVOID];
    case "surrealCursed":
      return [...SURREAL_CURSED_AVOID];
    case "deepFried":
      return [...DEEP_FRIED_AVOID];
    default:
      return [];
  }
}

/**
 * Build emoji instruction based on controls.
 */
function buildEmojiInstruction(controls: GenerationControls): string {
  const count = controls.emojiCount || 1;
  const isCursed =
    controls.emojiIconStyle === "cursed" ||
    controls.emojiStyle === "cursed-weird";

  const iconPool = isCursed ? CURSED_EMOJI_ICONS : POPULAR_EMOJI_ICONS;

  // Pick random icons from pool
  const selectedIcons = iconPool
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  return `${EMOJI_STYLE_INSTRUCTION} Include ${count} decorative icon(s) near subject: ${selectedIcons.join(
    ", "
  )}.`;
}

/**
 * Build composition block.
 */
function buildCompositionBlock(
  controls: GenerationControls,
  plan?: Partial<ThumbnailPlan>
): string {
  let block = "COMPOSITION: ";

  // Layout from plan or controls
  const layout = plan?.layout || controls.textPlacement || "auto";

  switch (layout) {
    case "subject-left_text-right":
    case "right":
      block +=
        "Subject on LEFT side (30-40% of frame), clean negative space on RIGHT for text. ";
      break;
    case "subject-right_text-left":
    case "left":
      block +=
        "Subject on RIGHT side (30-40% of frame), clean negative space on LEFT for text. ";
      break;
    case "top":
      block +=
        "Subject in CENTER-BOTTOM, clean negative space at TOP for text. ";
      break;
    case "bottom":
      block +=
        "Subject in CENTER-TOP, clean negative space at BOTTOM for text. ";
      break;
    default:
      block +=
        "Subject on one side with clean negative space for text overlay. ";
  }

  // Background mode
  if (controls.backgroundMode !== "auto") {
    const bgDescriptions: Record<string, string> = {
      "clean-gradient": "Simple gradient background, no distracting elements.",
      "studio-desk": "Professional studio or desk environment.",
      "scene-environment": "Contextual scene with depth and layers.",
      "abstract-texture": "Abstract textured background with visual interest.",
    };
    block += bgDescriptions[controls.backgroundMode] || "";
  }

  block += "Rule of thirds composition, clear focal point.";

  return block;
}

// ============================================
// PROMPT ASSEMBLY
// ============================================

/**
 * Assemble final prompt from blocks in priority order.
 * Order: hardMust → styleBlock → compositionBlock → paletteBlock → qualityBlock → final no-text reminder
 */
export function assemblePrompt(blocks: PromptBlocks): {
  prompt: string;
  negativePrompt: string;
} {
  const sections: string[] = [];

  // 1. Format declaration
  sections.push("YouTube thumbnail base image. 16:9 aspect ratio, 1280x720.");

  // 2. HARD MUST constraints (highest priority)
  if (blocks.hardMust.length > 0) {
    sections.push(
      "REQUIREMENTS:\n" + blocks.hardMust.map((m) => `- ${m}`).join("\n")
    );
  }

  // 3. Topic anchors
  if (blocks.topicAnchorsBlock) {
    sections.push(blocks.topicAnchorsBlock);
  }

  // 4. Style recipe (specific to meme/cartoon/photoreal - NOT diluted)
  if (blocks.styleBlock) {
    sections.push(blocks.styleBlock);
  }

  // 5. Composition
  if (blocks.compositionBlock) {
    sections.push(blocks.compositionBlock);
  }

  // 6. Palette
  sections.push(blocks.paletteBlock);

  // 7. Quality
  sections.push(blocks.qualityBlock);

  // 8. Final no-text reminder (critical)
  sections.push(
    "FINAL REMINDER: Generate NO text, NO words, NO letters in the image."
  );

  const prompt = sections.join("\n\n");

  // Build negative prompt
  const negativePrompt = [STANDARD_NEGATIVE_PROMPT, ...blocks.hardAvoid].join(
    ", "
  );

  return { prompt, negativePrompt };
}

/**
 * Build complete prompt from GenerationControls (main entry point for V2)
 */
export function buildPromptFromControls(
  controls: GenerationControls,
  topicSummary?: string,
  plan?: Partial<ThumbnailPlan>
): { prompt: string; negativePrompt: string } {
  const blocks = buildPromptBlocks(controls, plan, topicSummary);
  return assemblePrompt(blocks);
}

/**
 * Get composition guidance based on layout
 */
function getCompositionGuidance(layout: LayoutType): string {
  switch (layout) {
    case "subject-left_text-right":
      return "Compose with the main subject on the LEFT side (30-40% of frame). Leave clean negative space on the RIGHT side for text overlay. Rule of thirds composition.";
    case "subject-right_text-left":
      return "Compose with the main subject on the RIGHT side (30-40% of frame). Leave clean negative space on the LEFT side for text overlay. Rule of thirds composition.";
    case "subject-center_text-top":
      return "Compose with the main subject in the CENTER-BOTTOM of frame. Leave clean negative space at the TOP for text overlay. Dramatic upward angle.";
    case "subject-center_text-bottom":
      return "Compose with the main subject in the CENTER-TOP of frame. Leave clean negative space at the BOTTOM for text overlay. Looking down perspective.";
    default:
      return "Compose with clear focal subject and designated negative space for text overlay.";
  }
}

/**
 * Get lighting description based on style
 */
function getLightingDescription(
  lighting: "dramatic" | "soft" | "neon" | "natural"
): string {
  switch (lighting) {
    case "dramatic":
      return "Dramatic cinematic lighting with strong key light, rim light on subject edges, deep shadows for depth. High contrast.";
    case "neon":
      return "Vibrant neon lighting with glowing accents, cyberpunk-style rim lights in blue and orange, atmospheric glow.";
    case "soft":
      return "Soft diffused lighting, even exposure, gentle shadows, professional studio quality.";
    case "natural":
      return "Natural daylight, golden hour warmth, realistic shadows, outdoor feel.";
    default:
      return "Professional lighting with good contrast and subject separation.";
  }
}

/**
 * Build an optimized image generation prompt from ThumbnailDirection.
 * @deprecated Use buildPromptFromControls for new code
 */
export function buildImagePrompt(direction: ThumbnailDirection): {
  prompt: string;
  negativePrompt: string;
} {
  const { subject, background, layout, style, palette } = direction;

  const sections: string[] = [];

  // 1. Format and purpose
  sections.push(
    `Create a YouTube thumbnail base image. 16:9 aspect ratio, 1280x720 composition. Bold, high-contrast, click-worthy.`
  );

  // 2. NO TEXT instruction first (high priority)
  sections.push(NO_TEXT_INSTRUCTION);

  // 3. BOGY color guidance
  sections.push(BOGY_INSTRUCTION);
  sections.push(
    `Primary colors: ${palette.bg1} and ${palette.bg2}. Accent: ${palette.accent}.`
  );

  // 4. Subject description
  const subjectDesc = subject.includeFace
    ? `Clear focal subject: ${subject.description}, showing ${subject.emotion} expression. Close-up to medium shot, face clearly visible and expressive.`
    : `Clear focal subject: ${subject.description}. Bold, recognizable, well-lit.`;
  sections.push(subjectDesc);

  // 5. Props (if any)
  if (subject.props.length > 0) {
    sections.push(
      `Include visual elements: ${subject.props.slice(0, 3).join(", ")}.`
    );
  }

  // 6. Background
  sections.push(
    `Background: ${background.setting}. ${
      background.depth === "high"
        ? "Rich depth with layers, not flat."
        : "Clean but with subtle depth."
    } Gradient and texture, visually interesting but not distracting.`
  );

  // 7. Lighting
  sections.push(getLightingDescription(background.lighting));

  // 8. Composition
  sections.push(getCompositionGuidance(layout));

  // 9. Style
  const styleDesc =
    style.look === "bold-modern"
      ? "Bold modern style, sharp lines, high saturation, professional but eye-catching."
      : style.look === "energetic-bright"
      ? "Energetic bright style, dynamic angles, vibrant colors, exciting and fun."
      : style.look === "dramatic-dark"
      ? "Dramatic dark style, moody atmosphere, selective lighting, cinematic feel."
      : "Clean minimal style, uncluttered, professional, elegant.";
  sections.push(styleDesc);

  // 10. Quality instruction
  sections.push(QUALITY_INSTRUCTION);

  // 11. Final no-text reminder
  sections.push(
    "CRITICAL: No text, no words, no letters, no watermarks in the image."
  );

  const prompt = sections.join("\n\n");

  return {
    prompt,
    negativePrompt: STANDARD_NEGATIVE_PROMPT,
  };
}

/**
 * Build prompt from ConceptPlan (for backward compatibility)
 */
export function buildPromptFromPlan(plan: ConceptPlan): {
  prompt: string;
  negativePrompt: string;
} {
  // If plan already has a well-formed basePrompt, enhance it
  if (plan.basePrompt && plan.basePrompt.length > 100) {
    const enhancedPrompt = enhanceExistingPrompt(plan.basePrompt, plan.palette);
    return {
      prompt: enhancedPrompt,
      negativePrompt: plan.negativePrompt || STANDARD_NEGATIVE_PROMPT,
    };
  }

  // Build from scratch using plan data
  const sections: string[] = [];

  sections.push(
    `Create a YouTube thumbnail base image. 16:9 aspect ratio, 1280x720 composition. Bold, high-contrast, click-worthy.`
  );

  sections.push(NO_TEXT_INSTRUCTION);
  sections.push(BOGY_INSTRUCTION);

  if (plan.subjects) {
    sections.push(`Clear focal subject: ${plan.subjects}.`);
  }

  if (plan.composition) {
    const textArea = plan.composition.textSafeArea;
    if (textArea === "right") {
      sections.push(
        "Compose subject on LEFT, leave RIGHT side clean for text overlay."
      );
    } else if (textArea === "left") {
      sections.push(
        "Compose subject on RIGHT, leave LEFT side clean for text overlay."
      );
    } else {
      sections.push(`Leave ${textArea} area clean for text overlay.`);
    }
  }

  sections.push(QUALITY_INSTRUCTION);
  sections.push("CRITICAL: No text, no words, no letters in the image.");

  return {
    prompt: sections.join("\n\n"),
    negativePrompt: plan.negativePrompt || STANDARD_NEGATIVE_PROMPT,
  };
}

/**
 * Enhance an existing prompt with BOGY and quality guidelines
 */
function enhanceExistingPrompt(
  prompt: string,
  palette?: { bg1: string; bg2: string; accent: string }
): string {
  const enhancements: string[] = [];

  // Add BOGY if not present
  if (
    (!prompt.toLowerCase().includes("bogy") &&
      !prompt.toLowerCase().includes("blue")) ||
    !prompt.toLowerCase().includes("orange")
  ) {
    enhancements.push(BOGY_INSTRUCTION);
    if (palette) {
      enhancements.push(
        `Use colors: ${palette.bg1}, ${palette.bg2}, accent ${palette.accent}.`
      );
    }
  }

  // Add contrast instruction if not present
  if (!prompt.toLowerCase().includes("contrast")) {
    enhancements.push("High contrast, dramatic lighting.");
  }

  // Ensure no-text instruction is present and strong
  if (!prompt.toLowerCase().includes("no text")) {
    enhancements.push(NO_TEXT_INSTRUCTION);
  }

  // Add quality if not present
  if (
    !prompt.toLowerCase().includes("professional") &&
    !prompt.toLowerCase().includes("quality")
  ) {
    enhancements.push(QUALITY_INSTRUCTION);
  }

  if (enhancements.length === 0) {
    return prompt;
  }

  return prompt + "\n\n" + enhancements.join("\n\n");
}

// ============================================
// VARIATION PROMPTS
// ============================================

/**
 * Generate 4 prompt variations for diversity.
 */
export function generatePromptVariations(
  direction: ThumbnailDirection
): Array<{ prompt: string; negativePrompt: string; variationNote: string }> {
  const variations = [
    {
      layoutOverride: "subject-left_text-right" as LayoutType,
      colorNote: "blue and orange emphasis",
      framingNote: "medium shot, showing upper body and face",
      variationNote: "Layout: Subject left, text right | Blue/Orange palette",
    },
    {
      layoutOverride: "subject-right_text-left" as LayoutType,
      colorNote: "green and yellow emphasis",
      framingNote: "medium shot, dynamic angle",
      variationNote: "Layout: Subject right, text left | Green/Yellow palette",
    },
    {
      layoutOverride: "subject-left_text-right" as LayoutType,
      colorNote: "deep blue with warm orange accents",
      framingNote: "tighter crop, more dramatic close-up",
      variationNote: "Layout: Tight crop | Blue/Orange dramatic",
    },
    {
      layoutOverride: "subject-right_text-left" as LayoutType,
      colorNote: "vibrant green with golden yellow highlights",
      framingNote: "wider shot showing more context",
      variationNote: "Layout: Wide shot | Green/Yellow energetic",
    },
  ];

  return variations.map((v) => {
    const modifiedDirection = {
      ...direction,
      layout: v.layoutOverride,
    };

    const { prompt, negativePrompt } = buildImagePrompt(modifiedDirection);

    const variationPrompt =
      prompt +
      `\n\nVARIATION SPECIFICS:\n- Color emphasis: ${v.colorNote}\n- Framing: ${v.framingNote}`;

    return {
      prompt: variationPrompt,
      negativePrompt,
      variationNote: v.variationNote,
    };
  });
}

// ============================================
// ANTI-ARTIFACT PROMPT BUILDER (ThumbnailPlan)
// ============================================

/**
 * Anti-artifact constraints for human subjects
 */
const HUMAN_ARTIFACT_PREVENTION = `
HUMAN SUBJECT REQUIREMENTS (CRITICAL):
- Face: natural proportions, symmetric eyes, proper skin texture
- If hands visible: EXACTLY 5 fingers per hand, natural grip/pose
- No extra limbs, no duplicated body parts
- Natural body proportions, no elongated or shortened limbs
- Realistic skin tones matching the lighting`;

/**
 * Anti-artifact constraints for tech/screen elements
 */
const TECH_ARTIFACT_PREVENTION = `
TECH/SCREEN REQUIREMENTS (CRITICAL):
- Laptop: ONE screen only, screen on FRONT, correct hinge angle (90-120 degrees), proper keyboard layout
- Monitor: rectangular with proper aspect ratio (16:9 or 4:3), no warped edges
- Phone/tablet: correct proportions, proper button placement
- UI elements: keep simple, avoid overly detailed interfaces
- Cables: simple curves, no impossible tangles or floating wires`;

/**
 * Icon-driven mode instruction (safest)
 */
const ICON_MODE_INSTRUCTION = `
ICON-DRIVEN MODE (safest):
- Use bold, simple iconographic shapes to represent concepts
- NO humans, NO hands, NO complex screens
- Clean geometric shapes, abstract representations
- Large, recognizable symbols
- Simple gradient background with depth`;

/**
 * Face-only mode instruction
 */
const FACE_ONLY_MODE_INSTRUCTION = `
FACE-ONLY MODE:
- Close-up face shot (head and shoulders maximum)
- NO visible hands
- 1-2 simple props only (icon, small object)
- Clean, uncluttered background
- Strong facial expression matching the emotion`;

/**
 * Build a complete thumbnail prompt from a ThumbnailPlan.
 * For base image generation (no text in image).
 */
export function buildSafePrompt(plan: ThumbnailPlan): {
  prompt: string;
  negativePrompt: string;
} {
  const sections: string[] = [];

  // 1. Base format instruction
  sections.push(
    `Design a YouTube thumbnail base image. 16:9 aspect ratio, 1280x720.
Leave space for text overlay to be added separately.`
  );

  // 2. NO TEXT instruction (critical, early)
  sections.push(NO_TEXT_INSTRUCTION);

  // 3. Topic anchors - what MUST be depicted
  sections.push(
    `VISUAL SUBJECT: Depict these clearly: ${plan.topicAnchors.join(", ")}.
Relevant to: "${plan.topicSummary}".`
  );

  // 4. Scene setting
  sections.push(
    `SCENE: ${plan.scene.setting}.
Props: ${plan.scene.props.join(", ")}.
Keep it believable and realistic.`
  );

  // 5. Subject with anti-artifact constraints
  const subjectSection = buildSubjectSection(plan);
  sections.push(subjectSection);

  // 6. Fallback mode-specific instructions
  const modeInstruction = getModeInstruction(plan.fallbackMode);
  if (modeInstruction) {
    sections.push(modeInstruction);
  }

  // 7. Layout and composition
  sections.push(
    `COMPOSITION: ${plan.layout.replace(/_/g, ", ").replace(/-/g, " ")}.
Subject on one side, leave space for text overlay on the other. Balanced composition.`
  );

  // 8. BOGY palette
  sections.push(
    `COLOR PALETTE: ${plan.palette.primary.toUpperCase()} as primary, with ${
      plan.palette.secondary
    } and ${plan.palette.accent} accents.
Use vibrant BOGY colors (Blue/Orange/Green/Yellow). Avoid heavy red/white/black dominance.`
  );

  // 9. Quality bar (filtered to remove text items)
  const filteredQuality = plan.qualityBar.filter(
    (q) => !q.toLowerCase().includes("no text")
  );
  if (filteredQuality.length > 0) {
    sections.push(
      `QUALITY REQUIREMENTS:
${filteredQuality.map((q) => `- ${q}`).join("\n")}`
    );
  }

  // 10. Prohibited elements
  const filteredProhibited = plan.scene.prohibitedProps.filter(
    (p) =>
      !p.toLowerCase().includes("text") && !p.toLowerCase().includes("words")
  );
  if (filteredProhibited.length > 0) {
    sections.push(
      `DO NOT INCLUDE:
${filteredProhibited.map((p) => `- ${p}`).join("\n")}`
    );
  }

  // 11. Final quality instruction
  sections.push(QUALITY_INSTRUCTION);

  // 12. Final no-text reminder
  sections.push(
    "CRITICAL: No text, no words, no letters, no watermarks in the image."
  );

  const prompt = sections.join("\n\n");
  const negativePrompt = buildEnhancedNegativePrompt(plan);

  return { prompt, negativePrompt };
}

/**
 * Build subject section with appropriate anti-artifact constraints.
 */
function buildSubjectSection(plan: ThumbnailPlan): string {
  const { subject } = plan;
  let section = `SUBJECT: ${subject.description}.`;

  if (subject.pose && subject.pose !== "n/a") {
    section += ` Pose: ${subject.pose}.`;
  }

  if (subject.emotion && subject.emotion !== "neutral") {
    section += ` Expression: ${subject.emotion}.`;
  }

  // Add type-specific constraints
  if (subject.type === "human_face" || subject.type === "hands_only") {
    section += "\n" + HUMAN_ARTIFACT_PREVENTION;
  }

  // Add tech constraints if needed
  const hasTech = plan.scene.props.some((p) =>
    [
      "laptop",
      "computer",
      "screen",
      "monitor",
      "phone",
      "tablet",
      "keyboard",
    ].some((t) => p.toLowerCase().includes(t))
  );
  if (hasTech) {
    section += "\n" + TECH_ARTIFACT_PREVENTION;
  }

  // Add custom constraints
  if (subject.constraints.length > 0) {
    section += `\n\nADDITIONAL CONSTRAINTS:\n${subject.constraints
      .map((c) => `- ${c}`)
      .join("\n")}`;
  }

  return section;
}

/**
 * Get mode-specific instruction based on fallback mode.
 */
function getModeInstruction(mode: FallbackMode): string | null {
  switch (mode) {
    case "icon_driven":
      return ICON_MODE_INSTRUCTION;
    case "face_only":
      return FACE_ONLY_MODE_INSTRUCTION;
    case "full_scene":
      return null;
    default:
      return null;
  }
}

/**
 * Build enhanced negative prompt based on plan.
 */
function buildEnhancedNegativePrompt(plan: ThumbnailPlan): string {
  const parts = [STANDARD_NEGATIVE_PROMPT];

  // Add subject-specific negatives
  if (
    plan.subject.type === "human_face" ||
    plan.subject.type === "hands_only"
  ) {
    parts.push(
      "extra fingers, extra hands, missing fingers, fused fingers, too many fingers"
    );
  }

  // Add prohibited props
  if (plan.scene.prohibitedProps.length > 0) {
    parts.push(plan.scene.prohibitedProps.join(", "));
  }

  // Add mode-specific negatives
  if (plan.fallbackMode === "icon_driven") {
    parts.push("human, person, face, hands, realistic photo");
  } else if (plan.fallbackMode === "face_only") {
    parts.push("full body, hands, multiple people, busy background");
  }

  return parts.join(", ");
}

/**
 * Generate safe prompt variations from a ThumbnailPlan.
 */
export function generateSafeVariations(
  plan: ThumbnailPlan
): Array<{ prompt: string; negativePrompt: string; variationNote: string }> {
  const variations = [
    {
      layoutOverride: "subject-left_text-right" as const,
      colorNote: `${plan.palette.primary} dominant with orange accents`,
      framingNote: "medium shot, centered subject",
      variationNote: "Layout: Subject left | Standard framing",
    },
    {
      layoutOverride: "subject-right_text-left" as const,
      colorNote: `${plan.palette.primary} with yellow highlights`,
      framingNote: "slightly tighter crop",
      variationNote: "Layout: Subject right | Tighter crop",
    },
    {
      layoutOverride: "subject-left_text-right" as const,
      colorNote: "deep blue with warm orange rim light",
      framingNote: "dramatic angle, more contrast",
      variationNote: "Layout: Subject left | Dramatic lighting",
    },
    {
      layoutOverride: "subject-right_text-left" as const,
      colorNote: "green-yellow energy palette",
      framingNote: "wider shot with more context",
      variationNote: "Layout: Subject right | Energetic palette",
    },
  ];

  return variations.map((v) => {
    const modifiedPlan: ThumbnailPlan = {
      ...plan,
      layout: v.layoutOverride,
    };

    const { prompt, negativePrompt } = buildSafePrompt(modifiedPlan);

    const variationPrompt =
      prompt +
      `\n\nVARIATION:\n- Color emphasis: ${v.colorNote}\n- Framing: ${v.framingNote}`;

    return {
      prompt: variationPrompt,
      negativePrompt,
      variationNote: v.variationNote,
    };
  });
}

// ============================================
// EXPORTS
// ============================================

export { STANDARD_NEGATIVE_PROMPT as NEGATIVE_PROMPT };

// Export style recipes for testing
export const STYLE_RECIPES = {
  rageComic: RAGE_COMIC_RECIPE,
  reactionFace: REACTION_FACE_RECIPE,
  wojakLike: WOJAK_LIKE_RECIPE,
  surrealCursed: SURREAL_CURSED_RECIPE,
  deepFried: DEEP_FRIED_RECIPE,
  photoreal: PHOTOREAL_RECIPE,
  cartoon: CARTOON_RECIPE,
  anime: ANIME_RECIPE,
  mascot3d: MASCOT_3D_RECIPE,
};

export const STYLE_AVOIDS = {
  rageComic: RAGE_COMIC_AVOID,
  reactionFace: REACTION_FACE_AVOID,
  wojakLike: WOJAK_LIKE_AVOID,
  surrealCursed: SURREAL_CURSED_AVOID,
  deepFried: DEEP_FRIED_AVOID,
};
