/**
 * ThumbnailDirection Builder
 *
 * Converts video information into a structured creative direction
 * that drives image generation with YouTube best practices.
 *
 * Key principles:
 * - BOGY color palette (Blue, Orange, Green, Yellow)
 * - High contrast, dramatic lighting
 * - Clear focal subject tied to topic
 * - Reserved space for text overlay
 * - Short, punchy headline (NOT the full title)
 */

import type { ThumbnailPalette } from "./types";
import {
  getBogyPaletteForNiche,
  getDiverseBogyPalettes,
  type BogyPairing,
} from "./bogyPalettes";

// ============================================
// TYPES
// ============================================

export type SubjectEmotion =
  | "excited"
  | "shocked"
  | "curious"
  | "confident"
  | "focused"
  | "surprised"
  | "determined";

export type LayoutType =
  | "subject-left_text-right"
  | "subject-right_text-left"
  | "subject-center_text-top"
  | "subject-center_text-bottom";

export type GenreType =
  | "tech"
  | "gaming"
  | "finance"
  | "education"
  | "vlog"
  | "comedy"
  | "fitness"
  | "cooking"
  | "music"
  | "general";

export type ThumbnailDirection = {
  /** Core concept/theme of the thumbnail */
  concept: string;
  /** Main subject description */
  subject: {
    includeFace: boolean;
    description: string;
    emotion: SubjectEmotion;
    props: string[];
  };
  /** Background settings */
  background: {
    setting: string;
    depth: "high" | "medium" | "low";
    lighting: "dramatic" | "soft" | "neon" | "natural";
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  /** Composition layout */
  layout: LayoutType;
  /** Text guidance */
  text: {
    headline: string; // <= 20 chars ideally
    emphasisWords: string[];
  };
  /** Visual style */
  style: {
    look: "bold-modern" | "clean-minimal" | "dramatic-dark" | "energetic-bright";
    genre: GenreType;
  };
  /** BOGY palette */
  palette: ThumbnailPalette;
  /** Color pairing used */
  bogyPairing: BogyPairing;
};

export type ThumbnailDirectionInput = {
  title: string;
  description?: string;
  topic?: string;
  audience?: string;
  brandAccentColor?: string;
  preferLayout?: LayoutType;
};

// ============================================
// HEADLINE EXTRACTION
// ============================================

/**
 * Extract a short, punchy headline from the video title.
 * Goal: 2-4 words, <= 20 characters, creates curiosity.
 */
export function extractHeadline(title: string): {
  headline: string;
  emphasisWords: string[];
} {
  // Common patterns to extract key phrases
  const patterns = [
    // "X Things You..." -> "X THINGS"
    /^(\d+)\s+(things?|ways?|tips?|mistakes?|secrets?|hacks?|reasons?)/i,
    // "How to X" -> "HOW TO X" (shortened)
    /^how\s+to\s+(\w+(?:\s+\w+)?)/i,
    // "Why X" -> "WHY X"
    /^why\s+(\w+(?:\s+\w+){0,2})/i,
    // "The X of Y" -> "THE X"
    /^the\s+(\w+(?:\s+\w+)?)\s+of/i,
    // "I Did X" -> "I DID X"
    /^i\s+(did|made|tried|tested|built|created)\s+(\w+(?:\s+\w+)?)/i,
    // "X vs Y" -> "X VS Y"
    /^(\w+)\s+vs\.?\s+(\w+)/i,
    // "Stop Doing X" -> "STOP DOING X"
    /^(stop|don'?t|never|avoid)\s+(\w+(?:\s+\w+)?)/i,
    // "This X Will Y" -> "THIS X"
    /^this\s+(\w+(?:\s+\w+)?)\s+will/i,
  ];

  const titleLower = title.toLowerCase();

  for (const pattern of patterns) {
    const match = titleLower.match(pattern);
    if (match) {
      // Build headline from match groups
      const headline = match[0]
        .split(/\s+/)
        .slice(0, 4)
        .join(" ")
        .toUpperCase();

      if (headline.length <= 25) {
        // Find emphasis words (first word and any numbers)
        const words = headline.split(" ");
        const emphasisWords = words.filter(
          (w) => /^\d+$/.test(w) || words.indexOf(w) === 0
        );

        return { headline, emphasisWords };
      }
    }
  }

  // Fallback: Take first 3-4 significant words
  const words = title
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^\d+$/.test(w))
    .slice(0, 4);

  const headline = words.join(" ").toUpperCase();
  const emphasisWords = words.filter((w) => /^\d+$/.test(w) || words.indexOf(w) === 0);

  // Truncate if still too long
  if (headline.length > 25) {
    return {
      headline: words.slice(0, 3).join(" ").toUpperCase(),
      emphasisWords,
    };
  }

  return { headline, emphasisWords };
}

// ============================================
// SUBJECT INFERENCE
// ============================================

/**
 * Infer subject description from title and topic.
 */
function inferSubject(
  title: string,
  topic?: string
): { description: string; props: string[]; includeFace: boolean } {
  const lower = (title + " " + (topic || "")).toLowerCase();

  // Tech/Programming
  if (
    lower.includes("code") ||
    lower.includes("programming") ||
    lower.includes("developer") ||
    lower.includes("software")
  ) {
    return {
      description:
        "a focused developer at a sleek workstation with multiple monitors showing code",
      props: ["laptop", "monitors", "code on screen", "keyboard"],
      includeFace: true,
    };
  }

  // Finance/Money
  if (
    lower.includes("money") ||
    lower.includes("invest") ||
    lower.includes("crypto") ||
    lower.includes("stock") ||
    lower.includes("income")
  ) {
    return {
      description:
        "an excited person looking at upward-trending charts with money/coin graphics",
      props: ["charts", "graphs", "dollar signs", "coins"],
      includeFace: true,
    };
  }

  // Gaming
  if (
    lower.includes("game") ||
    lower.includes("gaming") ||
    lower.includes("play") ||
    lower.includes("stream")
  ) {
    return {
      description:
        "an intense gamer with RGB lighting and gaming setup, expressive reaction",
      props: ["gaming controller", "RGB lights", "gaming headset", "monitor"],
      includeFace: true,
    };
  }

  // Fitness/Health
  if (
    lower.includes("fitness") ||
    lower.includes("workout") ||
    lower.includes("gym") ||
    lower.includes("health") ||
    lower.includes("diet")
  ) {
    return {
      description:
        "an athletic person in workout gear with determined expression, gym environment",
      props: ["dumbbells", "gym equipment", "fitness tracker"],
      includeFace: true,
    };
  }

  // Cooking/Food
  if (
    lower.includes("cook") ||
    lower.includes("recipe") ||
    lower.includes("food") ||
    lower.includes("eat")
  ) {
    return {
      description:
        "a chef or home cook with delicious-looking food, steam rising, vibrant ingredients",
      props: ["cooking utensils", "fresh ingredients", "plated dish"],
      includeFace: true,
    };
  }

  // Education/Learning
  if (
    lower.includes("learn") ||
    lower.includes("study") ||
    lower.includes("education") ||
    lower.includes("course")
  ) {
    return {
      description:
        "an enthusiastic teacher or student with books and learning materials, lightbulb moment",
      props: ["books", "notebook", "whiteboard", "lightbulb icon"],
      includeFace: true,
    };
  }

  // Mistakes/Problems (common thumbnail concept)
  if (
    lower.includes("mistake") ||
    lower.includes("wrong") ||
    lower.includes("fail") ||
    lower.includes("problem")
  ) {
    return {
      description:
        "a person with concerned or shocked expression pointing at something problematic",
      props: ["warning sign", "red X", "error symbol"],
      includeFace: true,
    };
  }

  // Success/Tips
  if (
    lower.includes("success") ||
    lower.includes("tip") ||
    lower.includes("hack") ||
    lower.includes("secret")
  ) {
    return {
      description:
        "a confident person with thumbs up or pointing, showing something valuable",
      props: ["checkmark", "trophy", "star icon"],
      includeFace: true,
    };
  }

  // Default: Generic creator with topic-relevant props
  return {
    description:
      "an engaging content creator with expressive face, pointing or gesturing to key visual",
      props: ["relevant icon", "graphic element", "visual aid"],
    includeFace: true,
  };
}

/**
 * Infer emotion from title
 */
function inferEmotion(title: string): SubjectEmotion {
  const lower = title.toLowerCase();

  if (
    lower.includes("shocked") ||
    lower.includes("unbelievable") ||
    lower.includes("insane") ||
    lower.includes("crazy")
  ) {
    return "shocked";
  }

  if (
    lower.includes("secret") ||
    lower.includes("hidden") ||
    lower.includes("mystery") ||
    lower.includes("?")
  ) {
    return "curious";
  }

  if (
    lower.includes("mistake") ||
    lower.includes("wrong") ||
    lower.includes("fail") ||
    lower.includes("problem")
  ) {
    return "surprised";
  }

  if (
    lower.includes("best") ||
    lower.includes("top") ||
    lower.includes("ultimate") ||
    lower.includes("success")
  ) {
    return "confident";
  }

  if (
    lower.includes("how to") ||
    lower.includes("tutorial") ||
    lower.includes("guide") ||
    lower.includes("learn")
  ) {
    return "focused";
  }

  if (
    lower.includes("amazing") ||
    lower.includes("incredible") ||
    lower.includes("awesome") ||
    lower.includes("!")
  ) {
    return "excited";
  }

  return "determined";
}

/**
 * Infer genre from topic/title
 */
function inferGenre(title: string, topic?: string): GenreType {
  const lower = (title + " " + (topic || "")).toLowerCase();

  if (lower.includes("tech") || lower.includes("code") || lower.includes("app")) {
    return "tech";
  }
  if (lower.includes("game") || lower.includes("gaming") || lower.includes("play")) {
    return "gaming";
  }
  if (lower.includes("money") || lower.includes("invest") || lower.includes("finance")) {
    return "finance";
  }
  if (lower.includes("learn") || lower.includes("education") || lower.includes("tutorial")) {
    return "education";
  }
  if (lower.includes("vlog") || lower.includes("day in")) {
    return "vlog";
  }
  if (lower.includes("funny") || lower.includes("comedy") || lower.includes("prank")) {
    return "comedy";
  }
  if (lower.includes("workout") || lower.includes("fitness") || lower.includes("gym")) {
    return "fitness";
  }
  if (lower.includes("cook") || lower.includes("recipe") || lower.includes("food")) {
    return "cooking";
  }
  if (lower.includes("music") || lower.includes("song") || lower.includes("cover")) {
    return "music";
  }

  return "general";
}

// ============================================
// MAIN BUILDER
// ============================================

/**
 * Build a ThumbnailDirection from video information.
 */
export function buildThumbnailDirection(
  input: ThumbnailDirectionInput
): ThumbnailDirection {
  const { title, topic, preferLayout } = input;

  // Extract headline
  const { headline, emphasisWords } = extractHeadline(title);

  // Infer subject
  const subject = inferSubject(title, topic);
  const emotion = inferEmotion(title);

  // Get BOGY palette for niche
  const { pairing, palette } = getBogyPaletteForNiche(topic);

  // Infer genre
  const genre = inferGenre(title, topic);

  // Default layout (can be overridden for variations)
  const layout = preferLayout || "subject-left_text-right";

  // Build background description based on genre
  const backgroundSetting = getBackgroundSetting(genre);

  return {
    concept: title.slice(0, 50),
    subject: {
      includeFace: subject.includeFace,
      description: subject.description,
      emotion,
      props: subject.props,
    },
    background: {
      setting: backgroundSetting,
      depth: "high",
      lighting: genre === "gaming" ? "neon" : "dramatic",
      colors: {
        primary: palette.bg1,
        secondary: palette.bg2,
        accent: palette.accent,
      },
    },
    layout,
    text: {
      headline,
      emphasisWords,
    },
    style: {
      look: genre === "gaming" || genre === "comedy" ? "energetic-bright" : "bold-modern",
      genre,
    },
    palette,
    bogyPairing: pairing,
  };
}

/**
 * Generate layout variations for a direction
 */
export function generateLayoutVariations(
  base: ThumbnailDirection
): ThumbnailDirection[] {
  const layouts: LayoutType[] = [
    "subject-left_text-right",
    "subject-right_text-left",
    "subject-center_text-top",
    "subject-center_text-bottom",
  ];

  // Get diverse BOGY palettes
  const palettes = getDiverseBogyPalettes(4);

  return layouts.map((layout, i) => ({
    ...base,
    layout,
    palette: palettes[i],
    bogyPairing: ["blue-orange", "green-yellow", "blue-green", "orange-yellow"][
      i
    ] as BogyPairing,
    background: {
      ...base.background,
      colors: {
        primary: palettes[i].bg1,
        secondary: palettes[i].bg2,
        accent: palettes[i].accent,
      },
    },
  }));
}

// ============================================
// HELPERS
// ============================================

function getBackgroundSetting(genre: GenreType): string {
  const settings: Record<GenreType, string> = {
    tech: "modern office or tech workspace with subtle blue lighting and screens",
    gaming: "gaming setup with RGB lighting, neon accents, dynamic backdrop",
    finance: "professional setting with charts, graphs, city skyline",
    education: "clean classroom or study environment with books and boards",
    vlog: "lifestyle setting, casual but aesthetic background",
    comedy: "bright, energetic setting with playful elements",
    fitness: "gym environment with equipment, motivational atmosphere",
    cooking: "kitchen setting with fresh ingredients, warm lighting",
    music: "studio or stage setting with instruments, artistic lighting",
    general: "clean, professional backdrop with subtle depth and texture",
  };

  return settings[genre] || settings.general;
}
