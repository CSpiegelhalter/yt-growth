/**
 * Controlled Prompt Builder
 *
 * Builds image generation prompts that honor user's GenerationControls.
 * Priority: title+description > controls > best practices > defaults
 */

import type {
  GenerationControls,
  VisualStyle,
  PersonaVibe,
  BackgroundMode,
  LightingStyle,
  MemeIntensity,
  MemeFormat,
} from "./generationControls";
import { sanitizeInspirationText, getSeedVariants } from "./generationControls";

// ============================================
// PERSON DIVERSITY DESCRIPTORS
// ============================================

/**
 * Person diversity pool - used when diversityVariety is ON
 * Designed to be neutral and non-stereotyping
 */
const PERSON_DIVERSITY = {
  hairStyles: [
    "short hair",
    "medium length hair",
    "long hair",
    "curly hair",
    "wavy hair",
    "straight hair",
    "buzz cut",
    "styled updo",
  ],
  accessories: [
    "glasses",
    "no glasses",
    "headphones around neck",
    "simple earrings",
    "baseball cap",
    "beanie",
    "no accessories",
  ],
  clothing: [
    "casual t-shirt",
    "hoodie",
    "blazer",
    "button-up shirt",
    "sweater",
    "athletic wear",
    "professional attire",
  ],
  angles: [
    "front-facing",
    "slight three-quarter turn",
    "looking to the side",
    "slight tilt",
  ],
  lighting: [
    "key light from left",
    "key light from right",
    "even lighting",
    "dramatic side lighting",
  ],
};

/**
 * Get random diversity descriptors based on seed
 */
function getDiversityDescriptors(seed: number): string {
  const pick = <T>(arr: T[], offset: number): T =>
    arr[(seed + offset) % arr.length];

  return [
    pick(PERSON_DIVERSITY.hairStyles, 0),
    pick(PERSON_DIVERSITY.accessories, 17),
    pick(PERSON_DIVERSITY.clothing, 31),
    pick(PERSON_DIVERSITY.angles, 47),
    pick(PERSON_DIVERSITY.lighting, 63),
  ].join(", ");
}

// ============================================
// ARCHETYPE LIBRARY
// ============================================

/**
 * Original character archetypes to prevent "same AI man" syndrome
 */
const CHARACTER_ARCHETYPES = {
  "bold-cartoon-mascot": {
    prompt: "bold cartoon mascot character, clean linework, expressive face, simple shapes, vibrant colors",
    style: "cartoon",
  },
  "cinematic-host": {
    prompt: "professional content creator, cinematic lighting, engaging expression, clean background separation",
    style: "cinematic",
  },
  "vector-face-sticker": {
    prompt: "flat vector style face, sticker-like, thick outlines, simplified features, bold colors",
    style: "vector-flat",
  },
  "anime-protagonist": {
    prompt: "anime-style character, expressive eyes, dynamic pose, colorful hair accents",
    style: "anime",
  },
  "3d-friendly-mascot": {
    prompt: "3D rendered friendly mascot, smooth surfaces, approachable expression, soft shadows",
    style: "3d-mascot",
  },
  "comic-ink-character": {
    prompt: "comic book style character, ink outlines, halftone shading, dynamic expression",
    style: "comic-ink",
  },
  "meme-reaction-face": {
    prompt: "exaggerated reaction face, cartoonish proportions, bold expressions, meme-style composition",
    style: "cartoon",
  },
  "photoreal-influencer": {
    prompt: "realistic person, natural lighting, authentic expression, professional photography style",
    style: "photoreal",
  },
};

type ArchetypeKey = keyof typeof CHARACTER_ARCHETYPES;

/**
 * Select archetype based on controls and seed
 */
function selectArchetype(controls: GenerationControls, seed: number): ArchetypeKey {
  const style = controls.visualStyle;
  const vibe = controls.personaVibe;

  // Map visual style to archetypes
  const styleMap: Record<VisualStyle, ArchetypeKey[]> = {
    "auto": ["cinematic-host", "bold-cartoon-mascot", "photoreal-influencer"],
    "photoreal": ["photoreal-influencer", "cinematic-host"],
    "cinematic": ["cinematic-host", "photoreal-influencer"],
    "cartoon": ["bold-cartoon-mascot", "meme-reaction-face"],
    "anime": ["anime-protagonist"],
    "3d-mascot": ["3d-friendly-mascot"],
    "vector-flat": ["vector-face-sticker"],
    "comic-ink": ["comic-ink-character"],
  };

  // Adjust for meme intensity
  if (controls.memeIntensity !== "off" && vibe === "chaotic") {
    return "meme-reaction-face";
  }

  const options = styleMap[style] || styleMap["auto"];
  return options[seed % options.length];
}

// ============================================
// PROMPT SECTION BUILDERS
// ============================================

/**
 * Build subject/person section of prompt
 */
function buildSubjectSection(
  controls: GenerationControls,
  topicAnchors: string[],
  seed: number
): string {
  const sections: string[] = [];

  // No person case
  if (!controls.includePerson || controls.subjectType === "environment-only") {
    sections.push("NO PERSON, NO HUMAN, NO FACE.");
    
    if (controls.subjectType === "object-icon") {
      sections.push(
        `Clear focal object or icon related to: ${topicAnchors.slice(0, 3).join(", ")}.`
      );
      sections.push("Bold, recognizable iconography. Simple shapes, high contrast.");
    } else if (controls.subjectType === "mascot-character") {
      sections.push(
        "Original mascot character (non-human), friendly and expressive."
      );
    } else {
      sections.push(
        `Scene-focused composition featuring: ${topicAnchors.slice(0, 3).join(", ")}.`
      );
    }

    return sections.join(" ");
  }

  // Person/character case
  const archetype = selectArchetype(controls, seed);
  const archetypeData = CHARACTER_ARCHETYPES[archetype];

  sections.push(archetypeData.prompt);

  // Add vibe/expression
  const vibeDescriptions: Record<PersonaVibe, string> = {
    "auto": "engaging expression",
    "serious": "serious, focused, professional expression",
    "confident": "confident, assured, powerful stance",
    "curious": "curious, intrigued, raised eyebrow",
    "shocked": "shocked, surprised, wide eyes, open mouth",
    "silly": "silly, playful, goofy expression",
    "chaotic": "wild, unhinged, extreme expression",
    "deadpan": "deadpan, neutral, understated look",
  };

  sections.push(vibeDescriptions[controls.personaVibe] || vibeDescriptions["auto"]);

  // Add diversity descriptors
  if (controls.diversityVariety) {
    sections.push(getDiversityDescriptors(seed));
  }

  // Face style for cartoon/comic
  if (
    controls.visualStyle === "cartoon" ||
    controls.visualStyle === "comic-ink"
  ) {
    const faceDescriptions: Record<string, string> = {
      "auto": "expressive cartoon face",
      "emoji-like": "emoji-inspired simple face, round features",
      "expressive-cartoon": "highly expressive cartoon face, exaggerated features",
      "meme-face-vibe": "meme-style reaction face, internet culture aesthetic",
      "cute-mascot": "cute mascot face, big eyes, friendly",
    };
    sections.push(faceDescriptions[controls.faceStyle] || faceDescriptions["auto"]);
  }

  // Avoid uncanny valley
  if (controls.avoidUncanny) {
    if (controls.visualStyle === "photoreal" || controls.visualStyle === "cinematic") {
      sections.push(
        "Realistic, natural proportions. No uncanny valley artifacts."
      );
    } else {
      sections.push("Clean, consistent art style. No mixed realism.");
    }
  }

  return sections.join(". ");
}

/**
 * Build meme/style section of prompt
 */
function buildMemeSection(controls: GenerationControls): string {
  if (controls.memeIntensity === "off") return "";

  const sections: string[] = [];
  
  const intensityDescriptions: Record<MemeIntensity, string> = {
    "off": "",
    "light": "Subtle meme energy, slight exaggeration",
    "medium": "Clear meme composition, exaggerated expression, graphic accents",
    "max": "Maximum meme energy, extreme expression, bold graphic elements, sticker-cutout style",
  };

  sections.push(intensityDescriptions[controls.memeIntensity]);

  // Meme format hints
  const formatDescriptions: Record<MemeFormat, string> = {
    "reaction-face": "reaction-face composition centered",
    "exaggerated-expression": "extremely exaggerated facial expression",
    "bold-outline": "thick bold outline around subject, sticker cutout effect",
    "circle-highlight-arrow": "circle highlight and arrow pointing to key element",
    "glitch-retro-pixels": "glitch effects, retro pixels, VHS aesthetic",
  };

  for (const format of controls.memeFormats) {
    sections.push(formatDescriptions[format]);
  }

  // Emoji-like icons
  if (controls.includeEmojis && controls.emojiCount > 0) {
    const emojiDesc =
      controls.emojiStyle === "cursed-weird"
        ? "cursed, weird emoji-like icons"
        : "popular emoji-style icons";
    sections.push(
      `Include ${controls.emojiCount} original ${emojiDesc} as decorative elements.`
    );
  }

  return sections.join(". ");
}

/**
 * Build environment/background section of prompt
 */
function buildEnvironmentSection(controls: GenerationControls): string {
  const sections: string[] = [];

  // Background mode
  const bgDescriptions: Record<BackgroundMode, string> = {
    "auto": "appropriate background for topic",
    "clean-gradient": "clean gradient background, no distractions",
    "studio-desk": "professional studio or desk environment",
    "scene-environment": "contextual scene environment",
    "abstract-texture": "abstract textured background, artistic",
  };

  sections.push(bgDescriptions[controls.backgroundMode]);

  // Environment theme
  if (
    controls.backgroundMode === "scene-environment" ||
    controls.backgroundMode === "studio-desk" ||
    controls.backgroundMode === "auto"
  ) {
    const themeDescriptions: Record<string, string> = {
      "auto": "",
      "tech-workspace": "tech workspace, monitors, clean desk, modern setup",
      "gaming-setup": "gaming setup, RGB lights, gaming peripherals",
      "finance-chart-room": "finance environment, charts, graphs, professional",
      "classroom-whiteboard": "educational setting, whiteboard, learning environment",
      "outdoor-adventure": "outdoor adventure setting, nature, exploration",
      "dark-moody": "dark moody atmosphere, shadows, mysterious",
      "bright-playful": "bright playful environment, colorful, energetic",
    };

    const theme = themeDescriptions[controls.environmentTheme];
    if (theme) sections.push(theme);
  }

  // Detail level
  const detailDescriptions: Record<string, string> = {
    "minimal": "minimal detail, clean, uncluttered",
    "medium": "moderate detail, balanced",
    "high": "rich detail, layered, complex",
  };

  sections.push(detailDescriptions[controls.detailLevel]);

  // Lighting
  const lightingDescriptions: Record<LightingStyle, string> = {
    "auto": "appropriate lighting",
    "flat": "flat even lighting",
    "dramatic": "dramatic cinematic lighting, rim light, strong shadows",
    "neon": "neon lighting, vibrant glows, cyberpunk aesthetic",
    "soft-studio": "soft studio lighting, professional, even",
  };

  sections.push(lightingDescriptions[controls.lightingStyle]);

  return sections.join(". ");
}

/**
 * Build color/palette section of prompt
 */
function buildColorSection(controls: GenerationControls): string {
  const sections: string[] = [];

  // BOGY palette
  const primary = controls.primaryColor || "blue";
  const accent = controls.accentColor || "orange";

  sections.push(
    `BOGY color palette: ${primary.toUpperCase()} as primary, ${accent.toUpperCase()} as accent.`
  );

  sections.push(
    "Use vibrant BOGY colors (Blue, Orange, Green, Yellow). Avoid heavy red/white/black dominance."
  );

  if (controls.contrastBoost) {
    sections.push("High contrast, strong color separation.");
  }

  if (controls.saturationBoost) {
    sections.push("Boosted saturation, vibrant punchy colors.");
  }

  return sections.join(" ");
}

/**
 * Build anti-artifact constraints
 */
function buildConstraints(controls: GenerationControls): string {
  const constraints: string[] = [];

  // Always include base constraints
  constraints.push("Correct object geometry, no impossible perspectives.");
  constraints.push("If screens/UI present: simplified blurred blocks only, no readable text.");

  // Hand avoidance
  if (controls.avoidHands && controls.includePerson) {
    constraints.push("NO VISIBLE HANDS. Hide hands or crop above wrists.");
  }

  // Person avoidance
  if (!controls.includePerson) {
    constraints.push("ABSOLUTELY NO HUMANS, NO FACES, NO PEOPLE.");
  }

  // Style-specific constraints
  if (controls.visualStyle === "photoreal" || controls.visualStyle === "cinematic") {
    constraints.push(
      "Realistic proportions, natural anatomy, no distortions."
    );
  }

  if (controls.visualStyle === "cartoon" || controls.visualStyle === "comic-ink") {
    constraints.push(
      "Clean consistent linework, no mixed art styles."
    );
  }

  return constraints.join(" ");
}

/**
 * Build negative prompt based on controls
 */
function buildNegativePrompt(controls: GenerationControls): string {
  const negatives: string[] = [
    "text",
    "words",
    "letters",
    "watermark",
    "logo",
    "deformed",
    "duplicate objects",
    "impossible perspective",
    "low quality",
    "blurry",
    "amateur",
  ];

  // Add person negatives if no person
  if (!controls.includePerson) {
    negatives.push("human", "person", "face", "man", "woman", "body");
  }

  // Add hand negatives
  if (controls.avoidHands) {
    negatives.push(
      "hands",
      "fingers",
      "extra fingers",
      "malformed hands",
      "visible hands"
    );
  }

  // Add screen negatives
  negatives.push(
    "warped screens",
    "gibberish UI",
    "readable screen text",
    "detailed interfaces"
  );

  // Style-specific negatives
  if (controls.visualStyle === "photoreal" || controls.visualStyle === "cinematic") {
    negatives.push("cartoon", "anime", "drawn", "illustrated", "flat colors");
  } else if (
    controls.visualStyle === "cartoon" ||
    controls.visualStyle === "anime" ||
    controls.visualStyle === "comic-ink"
  ) {
    negatives.push(
      "photorealistic",
      "realistic",
      "photograph",
      "3D render",
      "uncanny valley"
    );
  }

  // Uncanny negatives
  if (controls.avoidUncanny) {
    negatives.push("uncanny valley", "creepy", "disturbing", "off-putting");
  }

  return negatives.join(", ");
}

// ============================================
// MAIN EXPORT
// ============================================

export type ControlledPrompt = {
  prompt: string;
  negativePrompt: string;
  seed: number;
  variationNote: string;
};

/**
 * Build a complete prompt from GenerationControls
 */
export function buildControlledPrompt(
  controls: GenerationControls,
  title: string,
  description: string,
  topicAnchors: string[],
  hookText: string,
  seed: number
): ControlledPrompt {
  void title;
  void description;
  const sections: string[] = [];

  // 1. Base instruction
  sections.push(
    `Create a YouTube thumbnail (16:9, 1280x720). Professional quality, click-worthy.`
  );

  // 2. Headline text to render
  if (hookText && hookText.length >= 2) {
    sections.push(
      `RENDER THESE EXACT WORDS as big bold text: "${hookText}". Make text large, readable, thick sans-serif font, white with black outline for high contrast.`
    );
  }

  // 3. Topic anchors
  sections.push(`TOPIC: ${topicAnchors.slice(0, 4).join(", ")}. Must be clearly depicted.`);

  // 4. Subject section
  sections.push(buildSubjectSection(controls, topicAnchors, seed));

  // 5. Meme/style section
  const memeSection = buildMemeSection(controls);
  if (memeSection) sections.push(memeSection);

  // 6. Environment section
  sections.push(buildEnvironmentSection(controls));

  // 7. Color section
  sections.push(buildColorSection(controls));

  // 8. Inspiration (sanitized)
  if (controls.inspirationsText) {
    const sanitized = sanitizeInspirationText(controls.inspirationsText);
    if (sanitized) {
      sections.push(`STYLE INSPIRATION: ${sanitized}. (Original interpretation only)`);
    }
  }

  // 9. Constraints
  sections.push(buildConstraints(controls));

  // 10. Quality
  sections.push(
    "Professional quality, 4K sharp details, crisp edges. Mobile-readable composition."
  );

  // Build variation note
  let variationNote = "Base variant";
  if (controls.visualStyle !== "auto") {
    variationNote = `${controls.visualStyle} style`;
  }
  if (controls.memeIntensity !== "off") {
    variationNote += `, ${controls.memeIntensity} meme`;
  }

  return {
    prompt: sections.join("\n\n"),
    negativePrompt: buildNegativePrompt(controls),
    seed,
    variationNote,
  };
}

/**
 * Generate multiple variant prompts with controlled differences
 */
export function generateControlledVariants(
  controls: GenerationControls,
  title: string,
  description: string,
  topicAnchors: string[],
  hookText: string,
  count: number = 4
): ControlledPrompt[] {
  const baseSeed = controls.baseSeed || Math.floor(Math.random() * 2147483647);
  const seeds = getSeedVariants(baseSeed, count);
  const variants: ControlledPrompt[] = [];

  // Variation strategies based on what's not locked
  const variations: Array<{
    controlOverrides: Partial<GenerationControls>;
    notePrefix: string;
  }> = [
    { controlOverrides: {}, notePrefix: "Base" },
    {
      controlOverrides: { lightingStyle: "dramatic" as const },
      notePrefix: "Dramatic lighting",
    },
    {
      controlOverrides: {
        primaryColor: controls.accentColor,
        accentColor: controls.primaryColor,
      },
      notePrefix: "Swapped palette",
    },
    {
      controlOverrides: { detailLevel: "high" as const },
      notePrefix: "High detail",
    },
  ];

  // If person is included and vibe is auto, vary expressions
  if (controls.includePerson && controls.personaVibe === "auto") {
    variations[1] = {
      controlOverrides: { personaVibe: "confident" as const },
      notePrefix: "Confident vibe",
    };
    variations[3] = {
      controlOverrides: { personaVibe: "curious" as const },
      notePrefix: "Curious vibe",
    };
  }

  // If no person, vary iconography
  if (!controls.includePerson) {
    variations[1] = {
      controlOverrides: { backgroundMode: "clean-gradient" as const },
      notePrefix: "Clean gradient",
    };
    variations[3] = {
      controlOverrides: { backgroundMode: "abstract-texture" as const },
      notePrefix: "Abstract texture",
    };
  }

  for (let i = 0; i < Math.min(count, variations.length); i++) {
    const variation = variations[i];
    const variantControls = { ...controls, ...variation.controlOverrides };

    const prompt = buildControlledPrompt(
      variantControls,
      title,
      description,
      topicAnchors,
      hookText,
      seeds[i]
    );

    variants.push({
      ...prompt,
      variationNote: `${variation.notePrefix} (seed: ${seeds[i]})`,
    });
  }

  return variants;
}

/**
 * Generate summary string of controls for display
 */
export function getControlsSummary(controls: GenerationControls): string {
  const parts: string[] = [];

  // Style
  if (controls.visualStyle !== "auto") {
    parts.push(controls.visualStyle.replace(/-/g, " "));
  }

  // Person
  if (!controls.includePerson) {
    parts.push("No person");
  } else if (controls.personaVibe !== "auto") {
    parts.push(controls.personaVibe);
  }

  // Meme
  if (controls.memeIntensity !== "off") {
    parts.push(`Meme: ${controls.memeIntensity}`);
  }

  // Colors
  if (controls.primaryColor || controls.accentColor) {
    parts.push(
      `BOGY ${controls.primaryColor || "auto"}/${controls.accentColor || "auto"}`
    );
  }

  // Safety
  if (controls.avoidHands) {
    parts.push("No hands");
  }

  return parts.length > 0 ? parts.join(" • ") : "Default settings";
}
