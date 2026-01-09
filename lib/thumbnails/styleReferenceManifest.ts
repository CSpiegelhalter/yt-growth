/**
 * Style Reference Manifest
 *
 * Central registry of all visual style options with:
 * - Preview images for UI display
 * - Reference images for generation (when supported)
 * - Prompt recipe keys
 * - Intensity mappings
 *
 * Each option is designed to produce VISUALLY DISTINCT outputs.
 */

// ============================================
// TYPES
// ============================================

export type StyleCategory =
  | "memeStyle"
  | "characterStyle"
  | "expression"
  | "composition"
  | "background"
  | "intensity";

export type IntensityLevel = "light" | "medium" | "max";

export interface StyleOption {
  /** Unique ID for this option */
  id: string;
  /** Category this belongs to */
  category: StyleCategory;
  /** Short display label */
  label: string;
  /** 1-line description for tooltip */
  description: string;
  /** Path to preview image (small, for UI tiles) */
  previewImage: string;
  /** Path to reference image (full, for generation) */
  referenceImage?: string;
  /** Key into STYLE_RECIPES from promptBuilder */
  promptRecipeKey?: string;
  /** Additional negative prompt additions */
  negativePromptKey?: string;
  /** Default intensity when selected */
  defaultIntensity?: IntensityLevel;
  /** Intensity -> guidance strength mapping */
  intensityStrength?: Record<IntensityLevel, number>;
  /** Safety note (e.g., "original inspired-by look") */
  safeNote?: string;
  /** If true, this is a "no selection" / off option */
  isOff?: boolean;
  /** Hex color for visual accent (used in placeholder SVGs) */
  accentColor?: string;
}

export interface StyleDial {
  /** Dial ID */
  id: string;
  /** Display title */
  title: string;
  /** Subtitle / help text */
  subtitle: string;
  /** Tooltip explanation (1 sentence) */
  tooltip: string;
  /** Available options */
  options: StyleOption[];
  /** Whether to show intensity slider */
  showIntensity?: boolean;
  /** Default option ID */
  defaultOptionId: string;
}

// ============================================
// MEME STYLE OPTIONS
// ============================================

export const MEME_STYLE_OPTIONS: StyleOption[] = [
  {
    id: "meme-off",
    category: "memeStyle",
    label: "Off",
    description: "No meme styling - clean professional look",
    previewImage: "/style_refs/meme/off.svg",
    isOff: true,
    accentColor: "#6B7280",
  },
  {
    id: "meme-rage-comic",
    category: "memeStyle",
    label: "Rage Comic",
    description: "Classic rage comic webcomic line art style",
    previewImage: "/style_refs/meme/rage-comic.svg",
    referenceImage: "/style_refs/meme/rage-comic-ref.png",
    promptRecipeKey: "rageComic",
    negativePromptKey: "rageComic",
    defaultIntensity: "max",
    intensityStrength: { light: 0.4, medium: 0.7, max: 1.0 },
    safeNote: "Original rage-comic-inspired design, not a copy of known meme faces",
    accentColor: "#000000",
  },
  {
    id: "meme-reaction-face",
    category: "memeStyle",
    label: "Reaction Face",
    description: "Sticker cutout style with bold outlines",
    previewImage: "/style_refs/meme/reaction-face.svg",
    referenceImage: "/style_refs/meme/reaction-face-ref.png",
    promptRecipeKey: "reactionFace",
    negativePromptKey: "reactionFace",
    defaultIntensity: "medium",
    intensityStrength: { light: 0.3, medium: 0.6, max: 0.9 },
    safeNote: "Original reaction face design with cutout sticker aesthetic",
    accentColor: "#FF6B00",
  },
  {
    id: "meme-wojak",
    category: "memeStyle",
    label: "Minimalist Line",
    description: "Simple line art portrait, emotional expression",
    previewImage: "/style_refs/meme/wojak-like.svg",
    referenceImage: "/style_refs/meme/wojak-like-ref.png",
    promptRecipeKey: "wojakLike",
    negativePromptKey: "wojakLike",
    defaultIntensity: "max",
    intensityStrength: { light: 0.5, medium: 0.75, max: 1.0 },
    safeNote: "Original minimalist design inspired by web comic aesthetics",
    accentColor: "#94A3B8",
  },
  {
    id: "meme-cursed",
    category: "memeStyle",
    label: "Surreal Cursed",
    description: "Surreal absurdist internet meme aesthetic",
    previewImage: "/style_refs/meme/cursed.svg",
    referenceImage: "/style_refs/meme/cursed-ref.png",
    promptRecipeKey: "surrealCursed",
    negativePromptKey: "surrealCursed",
    defaultIntensity: "medium",
    intensityStrength: { light: 0.3, medium: 0.6, max: 0.85 },
    safeNote: "Surreal but safe imagery, no body horror or disturbing content",
    accentColor: "#7C3AED",
  },
  {
    id: "meme-deep-fried",
    category: "memeStyle",
    label: "Deep Fried",
    description: "Over-sharpened, high contrast, posterized colors",
    previewImage: "/style_refs/meme/deep-fried.svg",
    referenceImage: "/style_refs/meme/deep-fried-ref.png",
    promptRecipeKey: "deepFried",
    negativePromptKey: "deepFried",
    defaultIntensity: "medium",
    intensityStrength: { light: 0.25, medium: 0.5, max: 0.8 },
    safeNote: "Controlled artifacts - still readable at thumbnail size",
    accentColor: "#EF4444",
  },
];

// ============================================
// CHARACTER STYLE OPTIONS
// ============================================

export const CHARACTER_STYLE_OPTIONS: StyleOption[] = [
  {
    id: "char-auto",
    category: "characterStyle",
    label: "Auto",
    description: "Best style for your topic",
    previewImage: "/style_refs/character/auto.svg",
    isOff: true,
    accentColor: "#3B82F6",
  },
  {
    id: "char-photoreal",
    category: "characterStyle",
    label: "Photoreal",
    description: "Realistic photography style",
    previewImage: "/style_refs/character/photoreal.svg",
    referenceImage: "/style_refs/character/photoreal-ref.png",
    promptRecipeKey: "photoreal",
    intensityStrength: { light: 0.5, medium: 0.75, max: 1.0 },
    accentColor: "#D4A373",
  },
  {
    id: "char-cinematic",
    category: "characterStyle",
    label: "Cinematic",
    description: "Movie poster quality, dramatic lighting",
    previewImage: "/style_refs/character/cinematic.svg",
    referenceImage: "/style_refs/character/cinematic-ref.png",
    promptRecipeKey: "photoreal", // Same base but with dramatic lighting
    intensityStrength: { light: 0.5, medium: 0.75, max: 1.0 },
    accentColor: "#1E3A5F",
  },
  {
    id: "char-cartoon-simple",
    category: "characterStyle",
    label: "Simple Cartoon",
    description: "Clean cartoon style, simplified shapes",
    previewImage: "/style_refs/character/cartoon-simple.svg",
    referenceImage: "/style_refs/character/cartoon-simple-ref.png",
    promptRecipeKey: "cartoon",
    intensityStrength: { light: 0.4, medium: 0.7, max: 0.95 },
    accentColor: "#FBBF24",
  },
  {
    id: "char-vector-sticker",
    category: "characterStyle",
    label: "Vector Sticker",
    description: "Flat vector art with bold outlines",
    previewImage: "/style_refs/character/vector-sticker.svg",
    referenceImage: "/style_refs/character/vector-sticker-ref.png",
    promptRecipeKey: "cartoon",
    intensityStrength: { light: 0.5, medium: 0.75, max: 1.0 },
    accentColor: "#10B981",
  },
  {
    id: "char-comic-ink",
    category: "characterStyle",
    label: "Comic Ink",
    description: "Comic book ink linework, halftone shading",
    previewImage: "/style_refs/character/comic-ink.svg",
    referenceImage: "/style_refs/character/comic-ink-ref.png",
    promptRecipeKey: "cartoon",
    intensityStrength: { light: 0.4, medium: 0.7, max: 0.9 },
    accentColor: "#000000",
  },
  {
    id: "char-3d-mascot",
    category: "characterStyle",
    label: "3D Mascot",
    description: "Smooth 3D rendered mascot style",
    previewImage: "/style_refs/character/3d-mascot.svg",
    referenceImage: "/style_refs/character/3d-mascot-ref.png",
    promptRecipeKey: "mascot3d",
    intensityStrength: { light: 0.5, medium: 0.75, max: 1.0 },
    accentColor: "#F97316",
  },
  {
    id: "char-anime",
    category: "characterStyle",
    label: "Anime",
    description: "Japanese animation style, expressive eyes",
    previewImage: "/style_refs/character/anime.svg",
    referenceImage: "/style_refs/character/anime-ref.png",
    promptRecipeKey: "anime",
    intensityStrength: { light: 0.5, medium: 0.75, max: 1.0 },
    accentColor: "#EC4899",
  },
];

// ============================================
// EXPRESSION OPTIONS
// ============================================

export const EXPRESSION_OPTIONS: StyleOption[] = [
  {
    id: "expr-auto",
    category: "expression",
    label: "Auto",
    description: "Best expression for your topic",
    previewImage: "/style_refs/expression/auto.svg",
    isOff: true,
    accentColor: "#6B7280",
  },
  {
    id: "expr-serious",
    category: "expression",
    label: "Serious",
    description: "Focused, professional expression",
    previewImage: "/style_refs/expression/serious.svg",
    accentColor: "#1F2937",
  },
  {
    id: "expr-confident",
    category: "expression",
    label: "Confident",
    description: "Assured, powerful stance",
    previewImage: "/style_refs/expression/confident.svg",
    accentColor: "#3B82F6",
  },
  {
    id: "expr-curious",
    category: "expression",
    label: "Curious",
    description: "Intrigued, raised eyebrow",
    previewImage: "/style_refs/expression/curious.svg",
    accentColor: "#8B5CF6",
  },
  {
    id: "expr-shocked",
    category: "expression",
    label: "Shocked",
    description: "Wide eyes, jaw drop",
    previewImage: "/style_refs/expression/shocked.svg",
    accentColor: "#EF4444",
  },
  {
    id: "expr-silly",
    category: "expression",
    label: "Silly",
    description: "Playful, goofy expression",
    previewImage: "/style_refs/expression/silly.svg",
    accentColor: "#FBBF24",
  },
  {
    id: "expr-chaotic",
    category: "expression",
    label: "Chaotic",
    description: "Wild, unhinged, extreme",
    previewImage: "/style_refs/expression/chaotic.svg",
    accentColor: "#F97316",
  },
];

// ============================================
// COMPOSITION OPTIONS
// ============================================

export const COMPOSITION_OPTIONS: StyleOption[] = [
  {
    id: "comp-subject-left",
    category: "composition",
    label: "Subject Left",
    description: "Subject on left, text space on right",
    previewImage: "/style_refs/composition/subject-left.svg",
    accentColor: "#3B82F6",
  },
  {
    id: "comp-subject-right",
    category: "composition",
    label: "Subject Right",
    description: "Subject on right, text space on left",
    previewImage: "/style_refs/composition/subject-right.svg",
    accentColor: "#10B981",
  },
  {
    id: "comp-center",
    category: "composition",
    label: "Center",
    description: "Subject centered, text top or bottom",
    previewImage: "/style_refs/composition/center.svg",
    accentColor: "#F97316",
  },
  {
    id: "comp-close-up",
    category: "composition",
    label: "Close-Up",
    description: "Tight crop on face/subject",
    previewImage: "/style_refs/composition/close-up.svg",
    accentColor: "#EF4444",
  },
  {
    id: "comp-wide",
    category: "composition",
    label: "Wide Shot",
    description: "More context, environment visible",
    previewImage: "/style_refs/composition/wide.svg",
    accentColor: "#8B5CF6",
  },
];

// ============================================
// BACKGROUND OPTIONS
// ============================================

export const BACKGROUND_OPTIONS: StyleOption[] = [
  {
    id: "bg-auto",
    category: "background",
    label: "Auto",
    description: "Best background for your topic",
    previewImage: "/style_refs/background/auto.svg",
    isOff: true,
    accentColor: "#6B7280",
  },
  {
    id: "bg-clean-gradient",
    category: "background",
    label: "Clean Gradient",
    description: "Simple gradient, no distractions",
    previewImage: "/style_refs/background/clean-gradient.svg",
    accentColor: "#3B82F6",
  },
  {
    id: "bg-studio",
    category: "background",
    label: "Studio",
    description: "Professional studio lighting setup",
    previewImage: "/style_refs/background/studio.svg",
    accentColor: "#F5F5F4",
  },
  {
    id: "bg-tech-workspace",
    category: "background",
    label: "Tech Workspace",
    description: "Monitors, desk, modern setup",
    previewImage: "/style_refs/background/tech-workspace.svg",
    accentColor: "#1E40AF",
  },
  {
    id: "bg-neon",
    category: "background",
    label: "Neon Glow",
    description: "Cyberpunk-style neon lighting",
    previewImage: "/style_refs/background/neon.svg",
    accentColor: "#EC4899",
  },
  {
    id: "bg-abstract",
    category: "background",
    label: "Abstract",
    description: "Abstract textures and patterns",
    previewImage: "/style_refs/background/abstract.svg",
    accentColor: "#7C3AED",
  },
  {
    id: "bg-dark-moody",
    category: "background",
    label: "Dark Moody",
    description: "Dark atmosphere, dramatic shadows",
    previewImage: "/style_refs/background/dark-moody.svg",
    accentColor: "#1F2937",
  },
];

// ============================================
// INTENSITY OPTIONS
// ============================================

export const INTENSITY_OPTIONS: StyleOption[] = [
  {
    id: "intensity-off",
    category: "intensity",
    label: "Off",
    description: "No meme/style effects",
    previewImage: "/style_refs/intensity/off.svg",
    isOff: true,
    accentColor: "#6B7280",
  },
  {
    id: "intensity-light",
    category: "intensity",
    label: "Light",
    description: "Subtle effect, professional look",
    previewImage: "/style_refs/intensity/light.svg",
    accentColor: "#86EFAC",
  },
  {
    id: "intensity-medium",
    category: "intensity",
    label: "Medium",
    description: "Balanced effect, clearly visible",
    previewImage: "/style_refs/intensity/medium.svg",
    accentColor: "#FBBF24",
  },
  {
    id: "intensity-max",
    category: "intensity",
    label: "Max",
    description: "Full effect, bold statement",
    previewImage: "/style_refs/intensity/max.svg",
    accentColor: "#EF4444",
  },
];

// ============================================
// DIALS CONFIGURATION
// ============================================

export const STYLE_DIALS: StyleDial[] = [
  {
    id: "memeStyle",
    title: "Meme Style",
    subtitle: "Choose a visual aesthetic",
    tooltip: "Applies an internet meme-inspired look to your thumbnail",
    options: MEME_STYLE_OPTIONS,
    showIntensity: true,
    defaultOptionId: "meme-off",
  },
  {
    id: "characterStyle",
    title: "Character Style",
    subtitle: "How people/characters look",
    tooltip: "Controls the artistic style of any people or characters",
    options: CHARACTER_STYLE_OPTIONS,
    showIntensity: false,
    defaultOptionId: "char-auto",
  },
  {
    id: "expression",
    title: "Expression",
    subtitle: "Facial expression & vibe",
    tooltip: "Sets the emotion shown on faces in the thumbnail",
    options: EXPRESSION_OPTIONS,
    showIntensity: false,
    defaultOptionId: "expr-auto",
  },
  {
    id: "composition",
    title: "Composition",
    subtitle: "Layout & framing",
    tooltip: "Controls where the subject is positioned and how much is shown",
    options: COMPOSITION_OPTIONS,
    showIntensity: false,
    defaultOptionId: "comp-subject-left",
  },
  {
    id: "background",
    title: "Background",
    subtitle: "Environment & setting",
    tooltip: "Sets the background style and atmosphere",
    options: BACKGROUND_OPTIONS,
    showIntensity: false,
    defaultOptionId: "bg-auto",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a style option by ID
 */
export function getStyleOption(id: string): StyleOption | undefined {
  const allOptions = [
    ...MEME_STYLE_OPTIONS,
    ...CHARACTER_STYLE_OPTIONS,
    ...EXPRESSION_OPTIONS,
    ...COMPOSITION_OPTIONS,
    ...BACKGROUND_OPTIONS,
    ...INTENSITY_OPTIONS,
  ];
  return allOptions.find((opt) => opt.id === id);
}

/**
 * Get dial configuration by ID
 */
export function getStyleDial(id: string): StyleDial | undefined {
  return STYLE_DIALS.find((dial) => dial.id === id);
}

/**
 * Map dial selections to GenerationControls
 */
export function mapDialSelectionsToControls(selections: Record<string, string>): Partial<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  // Meme style
  if (selections.memeStyle) {
    const opt = getStyleOption(selections.memeStyle);
    if (opt?.promptRecipeKey) {
      result.memeStyle = opt.promptRecipeKey;
    } else if (opt?.isOff) {
      result.memeStyle = "off";
    }
  }

  // Character style
  if (selections.characterStyle) {
    const opt = getStyleOption(selections.characterStyle);
    if (opt?.id.includes("photoreal")) {
      result.visualStyle = "photoreal";
    } else if (opt?.id.includes("cinematic")) {
      result.visualStyle = "cinematic";
    } else if (opt?.id.includes("cartoon") || opt?.id.includes("vector")) {
      result.visualStyle = "cartoon";
    } else if (opt?.id.includes("comic")) {
      result.visualStyle = "comic-ink";
    } else if (opt?.id.includes("3d")) {
      result.visualStyle = "3d-mascot";
    } else if (opt?.id.includes("anime")) {
      result.visualStyle = "anime";
    } else {
      result.visualStyle = "auto";
    }
  }

  // Expression
  if (selections.expression) {
    const opt = getStyleOption(selections.expression);
    if (opt?.id.includes("serious")) {
      result.personaVibe = "serious";
    } else if (opt?.id.includes("confident")) {
      result.personaVibe = "confident";
    } else if (opt?.id.includes("curious")) {
      result.personaVibe = "curious";
    } else if (opt?.id.includes("shocked")) {
      result.personaVibe = "shocked";
    } else if (opt?.id.includes("silly")) {
      result.personaVibe = "silly";
    } else if (opt?.id.includes("chaotic")) {
      result.personaVibe = "chaotic";
    } else {
      result.personaVibe = "auto";
    }
  }

  // Composition
  if (selections.composition) {
    const opt = getStyleOption(selections.composition);
    if (opt?.id.includes("left")) {
      result.textPlacement = "right";
    } else if (opt?.id.includes("right")) {
      result.textPlacement = "left";
    } else if (opt?.id.includes("center")) {
      result.textPlacement = "bottom";
    }
    // Close-up / wide affects detailLevel indirectly
    if (opt?.id.includes("close")) {
      result.detailLevel = "high";
    } else if (opt?.id.includes("wide")) {
      result.detailLevel = "medium";
    }
  }

  // Background
  if (selections.background) {
    const opt = getStyleOption(selections.background);
    if (opt?.id.includes("gradient")) {
      result.backgroundMode = "clean-gradient";
    } else if (opt?.id.includes("studio")) {
      result.backgroundMode = "studio-desk";
      result.lightingStyle = "soft-studio";
    } else if (opt?.id.includes("tech")) {
      result.backgroundMode = "scene-environment";
      result.environmentTheme = "tech-workspace";
    } else if (opt?.id.includes("neon")) {
      result.lightingStyle = "neon";
      result.backgroundMode = "scene-environment";
    } else if (opt?.id.includes("abstract")) {
      result.backgroundMode = "abstract-texture";
    } else if (opt?.id.includes("dark")) {
      result.environmentTheme = "dark-moody";
      result.lightingStyle = "dramatic";
    } else {
      result.backgroundMode = "auto";
    }
  }

  return result;
}

/**
 * Get reference strength for an intensity level
 */
export function getIntensityStrength(
  optionId: string,
  intensity: IntensityLevel
): number {
  const opt = getStyleOption(optionId);
  if (opt?.intensityStrength) {
    return opt.intensityStrength[intensity];
  }
  // Default strengths
  const defaults: Record<IntensityLevel, number> = {
    light: 0.4,
    medium: 0.7,
    max: 1.0,
  };
  return defaults[intensity];
}

/**
 * Export dial selections as summary for "What changed?" hint
 */
export function getDialSelectionsSummary(
  selections: Record<string, string>,
  intensity?: IntensityLevel
): string {
  const parts: string[] = [];

  for (const [dialId, optionId] of Object.entries(selections)) {
    const opt = getStyleOption(optionId);
    if (opt && !opt.isOff) {
      parts.push(`${getStyleDial(dialId)?.title || dialId}: ${opt.label}`);
    }
  }

  if (intensity && intensity !== "light") {
    parts.push(`Intensity: ${intensity}`);
  }

  return parts.join(" • ") || "Default settings";
}
