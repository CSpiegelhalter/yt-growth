/**
 * Generation Controls Schema
 *
 * User-facing controls for thumbnail generation.
 * These strongly influence the ThumbnailPlan + image generation prompt.
 *
 * V2: Enhanced with character identity, meme styles, and explicit prompt control.
 */

import { z } from "zod";

// ============================================
// CONTROL ENUMS
// ============================================

export const subjectTypeOptions = [
  "auto",
  "person-face",
  "object-icon",
  "mascot-character",
  "environment-only",
] as const;

export const personaVibeOptions = [
  "auto",
  "serious",
  "confident",
  "curious",
  "shocked",
  "silly",
  "chaotic",
  "deadpan",
] as const;

export const visualStyleOptions = [
  "auto",
  "photoreal",
  "cinematic",
  "cartoon",
  "anime",
  "3d-mascot",
  "vector-flat",
  "comic-ink",
] as const;

export const faceStyleOptions = [
  "auto",
  "emoji-like",
  "expressive-cartoon",
  "meme-face-vibe",
  "cute-mascot",
] as const;

export const memeIntensityOptions = ["off", "light", "medium", "max"] as const;

export const emojiStyleOptions = ["popular-basic", "cursed-weird"] as const;

export const backgroundModeOptions = [
  "auto",
  "clean-gradient",
  "studio-desk",
  "scene-environment",
  "abstract-texture",
] as const;

export const environmentThemeOptions = [
  "auto",
  "tech-workspace",
  "gaming-setup",
  "finance-chart-room",
  "classroom-whiteboard",
  "outdoor-adventure",
  "dark-moody",
  "bright-playful",
] as const;

export const detailLevelOptions = ["minimal", "medium", "high"] as const;

export const lightingStyleOptions = [
  "auto",
  "flat",
  "dramatic",
  "neon",
  "soft-studio",
] as const;

export const paletteModeOptions = [
  "auto-bogy",
  "pick-colors",
  "brand-palette",
] as const;

export const bogyColorOptions = ["blue", "orange", "green", "yellow"] as const;

export const headlineStyleOptions = [
  "bold-outline",
  "shadow",
  "banner",
] as const;

export const textPlacementOptions = [
  "auto",
  "left",
  "right",
  "top",
  "bottom",
] as const;

// ============================================
// NEW V2 CONTROLS - Character Identity + Meme Styles
// ============================================

/** Character gender for generated people */
export const characterGenderOptions = [
  "auto",
  "male",
  "female",
  "neutral",
] as const;

/** Character age range */
export const characterAgeOptions = [
  "auto",
  "young",
  "adult",
  "older",
] as const;

/** Character style - more granular than visualStyle */
export const characterStyleOptions = [
  "auto",
  "photoreal",
  "cinematic",
  "cartoon",
  "anime",
  "3dMascot",
  "vector",
  "comic",
] as const;

/** Meme style presets - EXPLICIT style recipes */
export const memeStyleOptions = [
  "off",
  "reactionFace",
  "rageComic",
  "wojakLike",
  "surrealCursed",
  "deepFried",
] as const;

/** Emoji style for decorative icons */
export const emojiIconStyleOptions = [
  "off",
  "popular",
  "cursed",
] as const;

/** UI depiction mode for screens/laptops */
export const uiModeOptions = [
  "none",
  "abstractBlocks",
  "blurredMockUI",
] as const;

// ============================================
// MEME INSPIRATION CATALOG (UI chips, not direct copies)
// ============================================

/** Rage comic inspiration tags (vibe only, not exact copies) */
export const RAGE_COMIC_INSPIRATIONS = [
  "trollface-vibe",
  "rageguy-fffuuu-vibe",
  "yuno-vibe",
  "foreveralone-vibe",
  "megusta-vibe",
  "okayguy-vibe",
  "derp-vibe",
  "cerealguy-vibe",
] as const;

/** Cursed emoji-like inspiration tags */
export const CURSED_EMOJI_INSPIRATIONS = [
  "melting-face-vibe",
  "dizzy-spiral-vibe",
  "clown-vibe",
  "skull-vibe",
  "uncanny-smile-vibe",
  "void-eyes-vibe",
  "glitched-expression-vibe",
] as const;

/** Cursed meme aesthetic tags */
export const CURSED_MEME_AESTHETICS = [
  "surreal-absurdist-vibe",
  "liminal-space-vibe",
  "deep-fried-vibe",
  "weirdcore-vibe",
  "glitchcore-vibe",
  "lowres-sticker-collage-vibe",
] as const;

export type RageComicInspiration = (typeof RAGE_COMIC_INSPIRATIONS)[number];
export type CursedEmojiInspiration = (typeof CURSED_EMOJI_INSPIRATIONS)[number];
export type CursedMemeAesthetic = (typeof CURSED_MEME_AESTHETICS)[number];
export type MemeInspiration = RageComicInspiration | CursedEmojiInspiration | CursedMemeAesthetic;

/** All available meme inspirations for UI */
export const ALL_MEME_INSPIRATIONS = [
  ...RAGE_COMIC_INSPIRATIONS,
  ...CURSED_EMOJI_INSPIRATIONS,
  ...CURSED_MEME_AESTHETICS,
] as const;

// ============================================
// PRESETS
// ============================================

export const GENERATION_PRESETS = {
  "high-ctr-face": {
    name: "High CTR (Face + Bold Text)",
    description: "Expressive face with punchy text - proven high click-through",
    controls: {
      subjectType: "person-face" as const,
      includePerson: true,
      characterEnabled: true,
      characterGender: "auto" as const,
      characterAge: "adult" as const,
      personaVibe: "shocked" as const,
      visualStyle: "cinematic" as const,
      memeIntensity: "light" as const,
      memeStyle: "off" as const,
      backgroundMode: "clean-gradient" as const,
      lightingStyle: "dramatic" as const,
      contrastBoost: true,
      saturationBoost: true,
    },
  },
  "clean-tech": {
    name: "Clean Tech (No Face, Icon Focus)",
    description: "Professional tech style with icons and UI elements",
    controls: {
      subjectType: "object-icon" as const,
      includePerson: false,
      characterEnabled: false,
      visualStyle: "vector-flat" as const,
      memeIntensity: "off" as const,
      memeStyle: "off" as const,
      backgroundMode: "clean-gradient" as const,
      environmentTheme: "tech-workspace" as const,
      lightingStyle: "soft-studio" as const,
      detailLevel: "minimal" as const,
      avoidScreens: false,
      uiMode: "abstractBlocks" as const,
    },
  },
  "meme-reaction": {
    name: "Meme Reaction",
    description: "Exaggerated expressions with meme-style composition",
    controls: {
      subjectType: "person-face" as const,
      includePerson: true,
      characterEnabled: true,
      characterGender: "auto" as const,
      personaVibe: "chaotic" as const,
      visualStyle: "cartoon" as const,
      faceStyle: "meme-face-vibe" as const,
      memeIntensity: "max" as const,
      memeStyle: "reactionFace" as const,
      memeFormats: ["reaction-face", "exaggerated-expression", "bold-outline"] as string[],
      backgroundMode: "abstract-texture" as const,
      lightingStyle: "neon" as const,
      saturationBoost: true,
    },
  },
  "rage-comic": {
    name: "Rage Comic Style",
    description: "Classic rage comic webcomic aesthetic - original, not copied",
    controls: {
      subjectType: "person-face" as const,
      includePerson: true,
      characterEnabled: true,
      characterGender: "auto" as const,
      visualStyle: "comic-ink" as const,
      faceStyle: "meme-face-vibe" as const,
      memeIntensity: "max" as const,
      memeStyle: "rageComic" as const,
      backgroundMode: "clean-gradient" as const,
      lightingStyle: "flat" as const,
      detailLevel: "minimal" as const,
      avoidHands: true,
    },
  },
  "cursed-meme": {
    name: "Cursed/Surreal Meme",
    description: "Surreal absurdist internet meme aesthetic",
    controls: {
      subjectType: "auto" as const,
      includePerson: true,
      characterEnabled: true,
      memeIntensity: "max" as const,
      memeStyle: "surrealCursed" as const,
      includeEmojis: true,
      emojiStyle: "cursed-weird" as const,
      emojiIconStyle: "cursed" as const,
      emojiCount: 2,
      backgroundMode: "abstract-texture" as const,
      saturationBoost: true,
    },
  },
  "gaming-neon": {
    name: "Gaming Neon",
    description: "High-energy gaming aesthetic with neon colors",
    controls: {
      subjectType: "auto" as const,
      includePerson: true,
      personaVibe: "confident" as const,
      visualStyle: "cinematic" as const,
      memeIntensity: "medium" as const,
      memeStyle: "off" as const,
      memeFormats: ["glitch-retro-pixels"] as string[],
      backgroundMode: "scene-environment" as const,
      environmentTheme: "gaming-setup" as const,
      lightingStyle: "neon" as const,
      primaryColor: "orange" as const,
      accentColor: "blue" as const,
      saturationBoost: true,
      avoidScreens: false,
      uiMode: "blurredMockUI" as const,
    },
  },
  "minimal-pro": {
    name: "Minimal Pro",
    description: "Clean, professional look with minimal distractions",
    controls: {
      subjectType: "object-icon" as const,
      includePerson: false,
      characterEnabled: false,
      visualStyle: "vector-flat" as const,
      memeIntensity: "off" as const,
      memeStyle: "off" as const,
      backgroundMode: "clean-gradient" as const,
      detailLevel: "minimal" as const,
      lightingStyle: "soft-studio" as const,
      primaryColor: "blue" as const,
      accentColor: "yellow" as const,
    },
  },
} as const;

export type PresetKey = keyof typeof GENERATION_PRESETS;

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Meme format hints (legally safe original styles)
 */
export const memeFormatSchema = z.enum([
  "reaction-face",
  "exaggerated-expression",
  "bold-outline",
  "circle-highlight-arrow",
  "glitch-retro-pixels",
]);

/**
 * Meme inspiration tag schema
 */
export const memeInspirationSchema = z.enum([
  ...RAGE_COMIC_INSPIRATIONS,
  ...CURSED_EMOJI_INSPIRATIONS,
  ...CURSED_MEME_AESTHETICS,
]);

/**
 * Subject presence and type controls
 */
export const subjectControlsSchema = z.object({
  subjectType: z.enum(subjectTypeOptions).default("auto"),
  includePerson: z.boolean().default(true),
});

/**
 * Person/character style controls
 */
export const personStyleControlsSchema = z.object({
  personaVibe: z.enum(personaVibeOptions).default("auto"),
  visualStyle: z.enum(visualStyleOptions).default("auto"),
  faceStyle: z.enum(faceStyleOptions).default("auto"),
  avoidUncanny: z.boolean().default(true),
  avoidHands: z.boolean().default(true),
  diversityVariety: z.boolean().default(true),
  creatorReferenceAssetId: z.string().uuid().optional(), // Future: creator photo reference
});

/**
 * Meme & pop culture vibe controls
 */
export const memeControlsSchema = z.object({
  memeIntensity: z.enum(memeIntensityOptions).default("off"),
  memeFormats: z.array(memeFormatSchema).default([]),
  includeEmojis: z.boolean().default(false),
  emojiStyle: z.enum(emojiStyleOptions).default("popular-basic"),
  emojiCount: z.number().int().min(0).max(3).default(0),
  inspirationsText: z.string().max(200).optional(),
});

/**
 * Environment/background controls
 */
export const environmentControlsSchema = z.object({
  backgroundMode: z.enum(backgroundModeOptions).default("auto"),
  environmentTheme: z.enum(environmentThemeOptions).default("auto"),
  detailLevel: z.enum(detailLevelOptions).default("medium"),
  lightingStyle: z.enum(lightingStyleOptions).default("auto"),
});

/**
 * Color & branding controls
 */
export const colorControlsSchema = z.object({
  paletteMode: z.enum(paletteModeOptions).default("auto-bogy"),
  primaryColor: z.enum(bogyColorOptions).optional(),
  accentColor: z.enum(bogyColorOptions).optional(),
  contrastBoost: z.boolean().default(true),
  saturationBoost: z.boolean().default(false),
});

/**
 * Text treatment controls
 */
export const textControlsSchema = z.object({
  headlineStyle: z.enum(headlineStyleOptions).default("bold-outline"),
  textPlacement: z.enum(textPlacementOptions).default("auto"),
  shortHeadline: z.boolean().default(true), // <=4 words
});

/**
 * Complete GenerationControls schema (V2 with character + meme controls)
 */
export const generationControlsSchema = z.object({
  // Subject
  subjectType: z.enum(subjectTypeOptions).default("auto"),
  includePerson: z.boolean().default(true),

  // === NEW V2: Character Identity Controls ===
  characterEnabled: z.boolean().default(true),
  characterGender: z.enum(characterGenderOptions).default("auto"),
  characterAge: z.enum(characterAgeOptions).default("auto"),
  characterStyle: z.enum(characterStyleOptions).default("auto"),

  // Person style
  personaVibe: z.enum(personaVibeOptions).default("auto"),
  visualStyle: z.enum(visualStyleOptions).default("auto"),
  faceStyle: z.enum(faceStyleOptions).default("auto"),
  avoidUncanny: z.boolean().default(true),
  avoidHands: z.boolean().default(true),
  diversityVariety: z.boolean().default(true),
  creatorReferenceAssetId: z.string().uuid().optional(),

  // === NEW V2: Enhanced Meme Controls ===
  memeStyle: z.enum(memeStyleOptions).default("off"),
  memeIntensity: z.enum(memeIntensityOptions).default("off"),
  memeFormats: z.array(memeFormatSchema).default([]),
  memeInspirations: z.array(memeInspirationSchema).default([]),
  
  // === Style Reference Image (user-selected meme to guide generation) ===
  styleReferenceId: z.string().optional(),
  styleReferencePath: z.string().optional(),
  
  // === NEW V2: Emoji Icon Controls ===
  includeEmojis: z.boolean().default(false),
  emojiStyle: z.enum(emojiStyleOptions).default("popular-basic"),
  emojiIconStyle: z.enum(emojiIconStyleOptions).default("off"),
  emojiCount: z.number().int().min(0).max(3).default(0),
  inspirationsText: z.string().max(200).optional(),

  // === NEW V2: Screen/UI Controls ===
  avoidScreens: z.boolean().default(false),
  uiMode: z.enum(uiModeOptions).default("abstractBlocks"),

  // Environment
  backgroundMode: z.enum(backgroundModeOptions).default("auto"),
  environmentTheme: z.enum(environmentThemeOptions).default("auto"),
  detailLevel: z.enum(detailLevelOptions).default("medium"),
  lightingStyle: z.enum(lightingStyleOptions).default("auto"),

  // Colors
  paletteMode: z.enum(paletteModeOptions).default("auto-bogy"),
  primaryColor: z.enum(bogyColorOptions).optional(),
  accentColor: z.enum(bogyColorOptions).optional(),
  contrastBoost: z.boolean().default(true),
  saturationBoost: z.boolean().default(false),

  // Text
  headlineStyle: z.enum(headlineStyleOptions).default("bold-outline"),
  textPlacement: z.enum(textPlacementOptions).default("auto"),
  shortHeadline: z.boolean().default(true),

  // Preset used (for tracking)
  presetUsed: z.string().optional(),

  // Seed control for variation
  baseSeed: z.number().int().optional(),
  lockSeed: z.boolean().default(false),
});

export type GenerationControls = z.infer<typeof generationControlsSchema>;

export type SubjectType = (typeof subjectTypeOptions)[number];
export type PersonaVibe = (typeof personaVibeOptions)[number];
export type VisualStyle = (typeof visualStyleOptions)[number];
export type FaceStyle = (typeof faceStyleOptions)[number];
export type MemeIntensity = (typeof memeIntensityOptions)[number];
export type MemeStyle = (typeof memeStyleOptions)[number];
export type EmojiStyle = (typeof emojiStyleOptions)[number];
export type EmojiIconStyle = (typeof emojiIconStyleOptions)[number];
export type UiMode = (typeof uiModeOptions)[number];
export type BackgroundMode = (typeof backgroundModeOptions)[number];
export type EnvironmentTheme = (typeof environmentThemeOptions)[number];
export type DetailLevel = (typeof detailLevelOptions)[number];
export type LightingStyle = (typeof lightingStyleOptions)[number];
export type PaletteMode = (typeof paletteModeOptions)[number];
export type BogyColor = (typeof bogyColorOptions)[number];
export type HeadlineStyle = (typeof headlineStyleOptions)[number];
export type TextPlacement = (typeof textPlacementOptions)[number];
export type CharacterGender = (typeof characterGenderOptions)[number];
export type CharacterAge = (typeof characterAgeOptions)[number];
export type CharacterStyle = (typeof characterStyleOptions)[number];
export type MemeFormat = z.infer<typeof memeFormatSchema>;

// ============================================
// HELPERS
// ============================================

/**
 * Get default controls
 */
export function getDefaultControls(): GenerationControls {
  return generationControlsSchema.parse({});
}

/**
 * Apply a preset to controls
 */
export function applyPreset(presetKey: PresetKey): Partial<GenerationControls> {
  const preset = GENERATION_PRESETS[presetKey];
  return {
    ...(preset.controls as Partial<GenerationControls>),
    presetUsed: presetKey,
  };
}

/**
 * Sanitize inspiration text to remove copyrighted references
 */
export function sanitizeInspirationText(text: string): string {
  if (!text) return "";

  // List of IP terms to sanitize (convert to vibes)
  const ipReplacements: Record<string, string> = {
    // Characters
    "spiderman": "superhero comic vibe",
    "spider-man": "superhero comic vibe",
    "batman": "dark vigilante vibe",
    "superman": "heroic comic vibe",
    "mario": "colorful platformer game vibe",
    "luigi": "colorful platformer game vibe",
    "sonic": "fast-paced game mascot vibe",
    "pikachu": "cute creature mascot vibe",
    "pokemon": "collectible creature vibe",
    "mickey mouse": "classic cartoon mascot vibe",
    "spongebob": "absurdist cartoon vibe",
    "iron man": "tech superhero vibe",
    "hulk": "powerful comic hero vibe",
    "thanos": "epic villain vibe",
    "darth vader": "sci-fi villain vibe",
    "yoda": "wise mentor vibe",
    "harry potter": "magical fantasy vibe",
    "elsa": "magical princess vibe",
    "shrek": "fairytale comedy vibe",
    // Rage comic faces (convert to vibe descriptions, not copies)
    "trollface": "mischievous grin rage-comic-inspired vibe",
    "troll face": "mischievous grin rage-comic-inspired vibe",
    "rage guy": "frustrated yelling rage-comic-inspired vibe",
    "fffuuu": "frustrated yelling rage-comic-inspired vibe",
    "y u no": "demanding expression rage-comic-inspired vibe",
    "forever alone": "sad lonely rage-comic-inspired vibe",
    "me gusta": "pleased creepy rage-comic-inspired vibe",
    "okay guy": "resigned acceptance rage-comic-inspired vibe",
    "derp": "silly confused rage-comic-inspired vibe",
    "derpina": "silly confused female rage-comic-inspired vibe",
    "cereal guy": "casual sip reaction rage-comic-inspired vibe",
    "wojak": "minimalist line art emotional vibe",
    "feels guy": "minimalist sad emotional vibe",
    "pepe": "expressive frog-like cartoon vibe",
    // Games
    "fortnite": "battle royale colorful vibe",
    "minecraft": "blocky pixel vibe",
    "roblox": "blocky game avatar vibe",
    "call of duty": "military shooter vibe",
    "gta": "open world crime vibe",
    "zelda": "adventure fantasy vibe",
    "elden ring": "dark fantasy vibe",
    // Brands
    "nike": "athletic brand vibe",
    "apple": "sleek tech vibe",
    "google": "clean tech vibe",
    "youtube": "video platform vibe",
    "tiktok": "short video vibe",
    "instagram": "social photo vibe",
    "twitter": "social media vibe",
    "netflix": "streaming vibe",
    "disney": "family entertainment vibe",
    "marvel": "superhero comic vibe",
    "dc": "superhero comic vibe",
  };

  let sanitized = text.toLowerCase();
  for (const [ip, replacement] of Object.entries(ipReplacements)) {
    sanitized = sanitized.replace(new RegExp(`\\b${ip}\\b`, "gi"), replacement);
  }

  return sanitized;
}

/**
 * Generate a random seed for variation
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Get seed variants for multiple generations
 */
export function getSeedVariants(baseSeed: number, count: number): number[] {
  const variants: number[] = [];
  for (let i = 0; i < count; i++) {
    variants.push((baseSeed + i * 12345) % 2147483647);
  }
  return variants;
}

/**
 * Get meme inspiration description for prompt
 */
export function getMemeInspirationDescription(tag: MemeInspiration): string {
  const descriptions: Record<MemeInspiration, string> = {
    // Rage comic vibes
    "trollface-vibe": "mischievous wide grin, scheming expression",
    "rageguy-fffuuu-vibe": "extreme frustration, yelling, angry outburst",
    "yuno-vibe": "demanding confused expression, raised arms questioning",
    "foreveralone-vibe": "sad lonely expression, slight tears, resigned",
    "megusta-vibe": "pleased unsettling grin, eyes rolled up slightly",
    "okayguy-vibe": "resigned acceptance, slight sadness, deflated",
    "derp-vibe": "goofy confused expression, crossed eyes, silly tongue",
    "cerealguy-vibe": "casual sipping reaction, observing drama unfold",
    // Cursed emoji vibes
    "melting-face-vibe": "face appears to melt downward, surreal distortion",
    "dizzy-spiral-vibe": "spiral hypnotic eyes, disoriented expression",
    "clown-vibe": "exaggerated clown features, unsettling smile",
    "skull-vibe": "skull-like hollow eyes, death/deadpan humor",
    "uncanny-smile-vibe": "unsettlingly wide smile, too many teeth",
    "void-eyes-vibe": "completely black hollow eyes, eerie",
    "glitched-expression-vibe": "distorted glitchy face, digital corruption",
    // Cursed meme aesthetics
    "surreal-absurdist-vibe": "impossible object combinations, dreamlike logic",
    "liminal-space-vibe": "empty transitional space, slightly wrong, eerie",
    "deep-fried-vibe": "extreme contrast, over-sharpened, jpeg artifacts",
    "weirdcore-vibe": "nostalgic yet wrong, unsettling familiarity",
    "glitchcore-vibe": "digital glitches, RGB splits, data corruption aesthetic",
    "lowres-sticker-collage-vibe": "cut-out stickers, low resolution, chaotic composition",
  };
  return descriptions[tag] || tag;
}
