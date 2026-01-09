/**
 * BOGY Color Palettes for YouTube Thumbnails
 *
 * BOGY = Blue, Orange, Green, Yellow
 * These are proven high-CTR colors for YouTube thumbnails.
 * Avoids red/white/black as dominant colors (they blend with YouTube UI).
 *
 * Each palette is designed for:
 * - High contrast between background and text
 * - BOGY as primary/accent colors
 * - Professional, click-worthy appearance
 */

import type { ThumbnailPalette } from "./types";

// ============================================
// BOGY COLOR DEFINITIONS
// ============================================

export const BOGY_COLORS = {
  // Blues (trust, authority, tech)
  blue: {
    vibrant: "#0066FF",
    deep: "#1E40AF",
    cyan: "#0891B2",
    electric: "#3B82F6",
    navy: "#1E3A8A",
  },
  // Oranges (energy, excitement, urgency)
  orange: {
    vibrant: "#FF6B00",
    warm: "#F97316",
    coral: "#FB923C",
    sunset: "#EA580C",
    amber: "#F59E0B",
  },
  // Greens (growth, success, money)
  green: {
    vibrant: "#00D26A",
    emerald: "#10B981",
    lime: "#84CC16",
    forest: "#16A34A",
    teal: "#14B8A6",
  },
  // Yellows (attention, warning, optimism)
  yellow: {
    vibrant: "#FFD700",
    golden: "#FBBF24",
    lemon: "#FACC15",
    amber: "#FCD34D",
    sunshine: "#EAB308",
  },
} as const;

// ============================================
// BOGY PALETTE COMBINATIONS
// ============================================

/**
 * Blue/Orange combination - Classic high-contrast pairing
 * Best for: Tech, tutorials, comparisons
 */
export const BLUE_ORANGE_PALETTES: ThumbnailPalette[] = [
  {
    bg1: "#1E40AF", // Deep blue
    bg2: "#1E3A8A", // Navy blue
    accent: "#FF6B00", // Vibrant orange
    text: "#FFFFFF",
  },
  {
    bg1: "#0066FF", // Vibrant blue
    bg2: "#0052CC", // Darker blue
    accent: "#FBBF24", // Golden yellow
    text: "#FFFFFF",
  },
  {
    bg1: "#FF6B00", // Vibrant orange
    bg2: "#EA580C", // Darker orange
    accent: "#3B82F6", // Electric blue
    text: "#FFFFFF",
  },
  {
    bg1: "#0891B2", // Cyan blue
    bg2: "#0E7490", // Darker cyan
    accent: "#F97316", // Warm orange
    text: "#FFFFFF",
  },
];

/**
 * Green/Yellow combination - Energy and growth
 * Best for: Finance, success stories, motivation
 */
export const GREEN_YELLOW_PALETTES: ThumbnailPalette[] = [
  {
    bg1: "#10B981", // Emerald green
    bg2: "#059669", // Darker green
    accent: "#FBBF24", // Golden yellow
    text: "#FFFFFF",
  },
  {
    bg1: "#16A34A", // Forest green
    bg2: "#15803D", // Darker forest
    accent: "#FFD700", // Vibrant yellow
    text: "#FFFFFF",
  },
  {
    bg1: "#FACC15", // Lemon yellow
    bg2: "#EAB308", // Darker yellow
    accent: "#10B981", // Emerald green
    text: "#0F172A", // Dark text
  },
  {
    bg1: "#84CC16", // Lime green
    bg2: "#65A30D", // Darker lime
    accent: "#FCD34D", // Amber yellow
    text: "#0F172A", // Dark text
  },
];

/**
 * Blue/Green combination - Trust and growth
 * Best for: Education, health, wellness
 */
export const BLUE_GREEN_PALETTES: ThumbnailPalette[] = [
  {
    bg1: "#0891B2", // Cyan
    bg2: "#0E7490", // Darker cyan
    accent: "#10B981", // Emerald
    text: "#FFFFFF",
  },
  {
    bg1: "#1E40AF", // Deep blue
    bg2: "#1E3A8A", // Navy
    accent: "#00D26A", // Vibrant green
    text: "#FFFFFF",
  },
  {
    bg1: "#14B8A6", // Teal
    bg2: "#0D9488", // Darker teal
    accent: "#3B82F6", // Electric blue
    text: "#FFFFFF",
  },
];

/**
 * Orange/Yellow combination - Maximum energy
 * Best for: Entertainment, gaming, reactions
 */
export const ORANGE_YELLOW_PALETTES: ThumbnailPalette[] = [
  {
    bg1: "#F97316", // Warm orange
    bg2: "#EA580C", // Sunset orange
    accent: "#FFD700", // Vibrant yellow
    text: "#FFFFFF",
  },
  {
    bg1: "#FBBF24", // Golden
    bg2: "#F59E0B", // Amber
    accent: "#FF6B00", // Vibrant orange
    text: "#0F172A", // Dark text
  },
  {
    bg1: "#FB923C", // Coral
    bg2: "#F97316", // Warm orange
    accent: "#FACC15", // Lemon yellow
    text: "#0F172A", // Dark text
  },
];

/**
 * High-contrast dark backgrounds with BOGY accents
 * Best for: Drama, gaming, tech reveals
 */
export const DARK_BOGY_PALETTES: ThumbnailPalette[] = [
  {
    bg1: "#0F172A", // Slate dark
    bg2: "#1E293B", // Slate
    accent: "#3B82F6", // Electric blue
    text: "#FFFFFF",
  },
  {
    bg1: "#0F172A",
    bg2: "#1E293B",
    accent: "#F97316", // Warm orange
    text: "#FFFFFF",
  },
  {
    bg1: "#0F172A",
    bg2: "#1E293B",
    accent: "#10B981", // Emerald
    text: "#FFFFFF",
  },
  {
    bg1: "#0F172A",
    bg2: "#1E293B",
    accent: "#FBBF24", // Golden
    text: "#FFFFFF",
  },
];

// ============================================
// PALETTE GETTERS
// ============================================

/**
 * All BOGY palettes combined
 */
export const ALL_BOGY_PALETTES: ThumbnailPalette[] = [
  ...BLUE_ORANGE_PALETTES,
  ...GREEN_YELLOW_PALETTES,
  ...BLUE_GREEN_PALETTES,
  ...ORANGE_YELLOW_PALETTES,
  ...DARK_BOGY_PALETTES,
];

/**
 * Get BOGY palettes by color pairing
 */
export type BogyPairing =
  | "blue-orange"
  | "green-yellow"
  | "blue-green"
  | "orange-yellow"
  | "dark-accent";

export function getBogyPalettes(pairing: BogyPairing): ThumbnailPalette[] {
  switch (pairing) {
    case "blue-orange":
      return BLUE_ORANGE_PALETTES;
    case "green-yellow":
      return GREEN_YELLOW_PALETTES;
    case "blue-green":
      return BLUE_GREEN_PALETTES;
    case "orange-yellow":
      return ORANGE_YELLOW_PALETTES;
    case "dark-accent":
      return DARK_BOGY_PALETTES;
    default:
      return BLUE_ORANGE_PALETTES;
  }
}

/**
 * Get a random BOGY palette
 */
export function getRandomBogyPalette(): ThumbnailPalette {
  return ALL_BOGY_PALETTES[Math.floor(Math.random() * ALL_BOGY_PALETTES.length)];
}

/**
 * Get diverse BOGY palettes (one from each pairing)
 */
export function getDiverseBogyPalettes(count: number = 4): ThumbnailPalette[] {
  const pairings: BogyPairing[] = [
    "blue-orange",
    "green-yellow",
    "blue-green",
    "orange-yellow",
  ];

  const result: ThumbnailPalette[] = [];

  for (let i = 0; i < count; i++) {
    const pairing = pairings[i % pairings.length];
    const palettes = getBogyPalettes(pairing);
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    result.push(palette);
  }

  return result;
}

/**
 * Get BOGY palette recommendation based on niche/topic
 */
export function getBogyPaletteForNiche(
  niche?: string
): { pairing: BogyPairing; palette: ThumbnailPalette } {
  const lower = (niche || "").toLowerCase();

  // Tech, tutorials, comparisons -> Blue/Orange
  if (
    lower.includes("tech") ||
    lower.includes("tutorial") ||
    lower.includes("how to") ||
    lower.includes("review")
  ) {
    const palettes = BLUE_ORANGE_PALETTES;
    return {
      pairing: "blue-orange",
      palette: palettes[Math.floor(Math.random() * palettes.length)],
    };
  }

  // Finance, money, success -> Green/Yellow
  if (
    lower.includes("finance") ||
    lower.includes("money") ||
    lower.includes("invest") ||
    lower.includes("crypto") ||
    lower.includes("success")
  ) {
    const palettes = GREEN_YELLOW_PALETTES;
    return {
      pairing: "green-yellow",
      palette: palettes[Math.floor(Math.random() * palettes.length)],
    };
  }

  // Gaming, entertainment -> Orange/Yellow
  if (
    lower.includes("gaming") ||
    lower.includes("game") ||
    lower.includes("react") ||
    lower.includes("funny") ||
    lower.includes("entertainment")
  ) {
    const palettes = ORANGE_YELLOW_PALETTES;
    return {
      pairing: "orange-yellow",
      palette: palettes[Math.floor(Math.random() * palettes.length)],
    };
  }

  // Education, health -> Blue/Green
  if (
    lower.includes("education") ||
    lower.includes("learn") ||
    lower.includes("health") ||
    lower.includes("wellness") ||
    lower.includes("science")
  ) {
    const palettes = BLUE_GREEN_PALETTES;
    return {
      pairing: "blue-green",
      palette: palettes[Math.floor(Math.random() * palettes.length)],
    };
  }

  // Default to Blue/Orange (most versatile)
  const palettes = BLUE_ORANGE_PALETTES;
  return {
    pairing: "blue-orange",
    palette: palettes[Math.floor(Math.random() * palettes.length)],
  };
}
