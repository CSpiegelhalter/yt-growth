/**
 * Thumbnail Color Palettes
 *
 * Curated color palettes optimized for YouTube thumbnail readability.
 * All palettes meet WCAG AA contrast requirements for text on background.
 */

import type { ThumbnailPalette, ThumbnailStyle } from "./types";

// ============================================
// STYLE-BASED PALETTES
// ============================================

/**
 * Bold style - High contrast, attention-grabbing colors
 */
export const BOLD_PALETTES: ThumbnailPalette[] = [
  { bg1: "#FF0000", bg2: "#CC0000", accent: "#FFFF00", text: "#FFFFFF" },
  { bg1: "#FF6B00", bg2: "#FF4500", accent: "#FFFFFF", text: "#000000" },
  { bg1: "#1E40AF", bg2: "#1E3A8A", accent: "#FBBF24", text: "#FFFFFF" },
  { bg1: "#7C3AED", bg2: "#6D28D9", accent: "#10B981", text: "#FFFFFF" },
  { bg1: "#DC2626", bg2: "#B91C1C", accent: "#FFFFFF", text: "#FFFFFF" },
  { bg1: "#0891B2", bg2: "#0E7490", accent: "#FCD34D", text: "#FFFFFF" },
];

/**
 * Minimal style - Clean, professional, subtle gradients
 */
export const MINIMAL_PALETTES: ThumbnailPalette[] = [
  { bg1: "#FFFFFF", bg2: "#F8FAFC", accent: "#3B82F6", text: "#0F172A" },
  { bg1: "#F8FAFC", bg2: "#E2E8F0", accent: "#10B981", text: "#1E293B" },
  { bg1: "#1E293B", bg2: "#0F172A", accent: "#38BDF8", text: "#FFFFFF" },
  { bg1: "#FAFAF9", bg2: "#F5F5F4", accent: "#EA580C", text: "#1C1917" },
  { bg1: "#F9FAFB", bg2: "#F3F4F6", accent: "#8B5CF6", text: "#111827" },
  { bg1: "#0F172A", bg2: "#1E293B", accent: "#F472B6", text: "#FFFFFF" },
];

/**
 * Neon style - Vibrant, glowing, cyberpunk-inspired
 */
export const NEON_PALETTES: ThumbnailPalette[] = [
  { bg1: "#0F0F23", bg2: "#1A1A2E", accent: "#00FF41", text: "#00FF41" },
  { bg1: "#1A0033", bg2: "#2D004D", accent: "#FF00FF", text: "#FF00FF" },
  { bg1: "#001A33", bg2: "#002B52", accent: "#00FFFF", text: "#00FFFF" },
  { bg1: "#1F0A0A", bg2: "#330D0D", accent: "#FF3366", text: "#FF3366" },
  { bg1: "#0A1F0A", bg2: "#0D330D", accent: "#39FF14", text: "#39FF14" },
  { bg1: "#1A1A2E", bg2: "#16213E", accent: "#E94560", text: "#FFFFFF" },
];

/**
 * Clean style - Modern, airy, subtle shadows
 */
export const CLEAN_PALETTES: ThumbnailPalette[] = [
  { bg1: "#FFFFFF", bg2: "#FAFBFC", accent: "#0066CC", text: "#1A1A1A" },
  { bg1: "#F7F8FA", bg2: "#EEF1F5", accent: "#059669", text: "#0D0D0D" },
  { bg1: "#FEFEFE", bg2: "#F5F7FA", accent: "#7C3AED", text: "#18181B" },
  { bg1: "#FFFBEB", bg2: "#FEF3C7", accent: "#B45309", text: "#1C1917" },
  { bg1: "#F0FDF4", bg2: "#DCFCE7", accent: "#16A34A", text: "#14532D" },
  { bg1: "#FFF7ED", bg2: "#FFEDD5", accent: "#EA580C", text: "#431407" },
];

/**
 * Dramatic style - Dark, moody, high impact
 */
export const DRAMATIC_PALETTES: ThumbnailPalette[] = [
  { bg1: "#000000", bg2: "#1A1A1A", accent: "#EF4444", text: "#FFFFFF" },
  { bg1: "#0C0C0C", bg2: "#1C1C1C", accent: "#F59E0B", text: "#FFFFFF" },
  { bg1: "#1A1A2E", bg2: "#0F0F1A", accent: "#06B6D4", text: "#FFFFFF" },
  { bg1: "#0F0F0F", bg2: "#262626", accent: "#A855F7", text: "#FFFFFF" },
  { bg1: "#18181B", bg2: "#27272A", accent: "#22D3EE", text: "#FFFFFF" },
  { bg1: "#1E1B4B", bg2: "#312E81", accent: "#FCD34D", text: "#FFFFFF" },
];

// ============================================
// PALETTE LOOKUP
// ============================================

const PALETTES_BY_STYLE: Record<ThumbnailStyle, ThumbnailPalette[]> = {
  Bold: BOLD_PALETTES,
  Minimal: MINIMAL_PALETTES,
  Neon: NEON_PALETTES,
  Clean: CLEAN_PALETTES,
  Dramatic: DRAMATIC_PALETTES,
};

/**
 * Get all palettes for a given style.
 */
export function getPalettesForStyle(style: ThumbnailStyle): ThumbnailPalette[] {
  return PALETTES_BY_STYLE[style] ?? BOLD_PALETTES;
}

/**
 * Get a random palette for a given style.
 */
export function getRandomPalette(style: ThumbnailStyle): ThumbnailPalette {
  const palettes = getPalettesForStyle(style);
  return palettes[Math.floor(Math.random() * palettes.length)];
}

/**
 * Get a specific palette by style and index.
 */
export function getPalette(
  style: ThumbnailStyle,
  index: number
): ThumbnailPalette {
  const palettes = getPalettesForStyle(style);
  return palettes[index % palettes.length];
}

// ============================================
// CONTRAST UTILITIES
// ============================================

/**
 * Calculate relative luminance of a hex color.
 * Per WCAG 2.1 definition.
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex to RGB array.
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Try 3-char format
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (!short) return null;
    return [
      parseInt(short[1] + short[1], 16),
      parseInt(short[2] + short[2], 16),
      parseInt(short[3] + short[3], 16),
    ];
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Calculate contrast ratio between two colors.
 * Returns ratio as a number (e.g., 4.5 for WCAG AA).
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a palette meets WCAG AA contrast requirements.
 * Text on background must have at least 4.5:1 contrast.
 */
export function isPaletteAccessible(palette: ThumbnailPalette): boolean {
  // Check text on both background colors
  const contrastBg1 = getContrastRatio(palette.text, palette.bg1);
  const contrastBg2 = getContrastRatio(palette.text, palette.bg2);

  return contrastBg1 >= 4.5 && contrastBg2 >= 4.5;
}

/**
 * Get the better text color (black or white) for a background.
 */
export function getBestTextColor(bgColor: string): "#FFFFFF" | "#000000" {
  const luminance = getLuminance(bgColor);
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}

// ============================================
// PALETTE GENERATION
// ============================================

/**
 * Generate a complementary accent color for a background.
 */
export function generateAccentColor(bgColor: string): string {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return "#FFFFFF";

  // Shift hue by ~180 degrees for complementary
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  // Shift hue by 0.5 (180 degrees)
  h = (h + 0.5) % 1;

  // Convert back to RGB with high saturation and lightness
  const s = 0.8;
  const l = 0.5;

  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const newR = Math.round(hueToRgb(p, q, h + 1 / 3) * 255);
  const newG = Math.round(hueToRgb(p, q, h) * 255);
  const newB = Math.round(hueToRgb(p, q, h - 1 / 3) * 255);

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`.toUpperCase();
}
