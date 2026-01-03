/**
 * Thumbnail Generator Types
 *
 * Core types for the concept-driven thumbnail generation flow:
 * 1. LLM produces ConceptPlan (JSON) - visual story concepts, not just titles
 * 2. OpenAI Image API generates scene-like base image (no text)
 * 3. Sharp + SVG renderer applies hook text, badges, arrows, highlights
 */

import type {
  ConceptId,
  TextSafeArea,
  FocalPosition,
  BackgroundComplexity,
  BigSymbolType,
  BadgeStyle,
  OverlayElementType,
} from "./concepts";

// Re-export concept types for convenience
export type {
  ConceptId,
  TextSafeArea,
  FocalPosition,
  BackgroundComplexity,
  BigSymbolType,
  BadgeStyle,
  OverlayElementType,
};

// ============================================
// INPUT TYPES
// ============================================

export type ThumbnailStyle = "Bold" | "Minimal" | "Neon" | "Clean" | "Dramatic";

export type ThumbnailJobInput = {
  title: string; // Video title (required) - used to derive hook
  topic?: string; // Topic / niche
  audience?: string; // Target audience
  style?: ThumbnailStyle; // Style preset (affects palettes)
  count?: number; // Number of variants (default 12)
  assetId?: string; // Optional subject image asset
  aiBase?: boolean; // Generate AI base image (default true)
};

export type ThumbnailJobStatus =
  | "queued"
  | "planning"
  | "generating"
  | "rendering"
  | "completed"
  | "failed";

// ============================================
// CONCEPT PLAN (LLM OUTPUT) - NEW
// ============================================

export type EmotionTone =
  | "urgent"
  | "curious"
  | "clean"
  | "dramatic"
  | "playful"
  | "professional"
  | "shocking"
  | "mysterious";

export type ThumbnailPalette = {
  bg1: string; // Background color 1 (hex)
  bg2: string; // Background color 2 (hex) - for gradients
  accent: string; // Accent color (hex)
  text: string; // Text color (hex)
};

export type BadgeDirective = {
  text: string; // Badge text (e.g., "NEW", "SECRET", "#1")
  style: BadgeStyle;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export type HighlightDirective = {
  type: OverlayElementType;
  target?: "subject" | "secondary" | "custom";
  color?: string; // Optional override color
};

export type CompositionDirectives = {
  textSafeArea: TextSafeArea;
  focalSubjectPosition: FocalPosition;
  backgroundComplexity: BackgroundComplexity;
};

export type OverlayDirectives = {
  badges: BadgeDirective[];
  highlights: HighlightDirective[];
  bigSymbol: BigSymbolType;
};

/**
 * ConceptPlan - The new planning output from LLM.
 * Focuses on visual storytelling, not just text placement.
 */
export type ConceptPlan = {
  /** Must be one of our library concept IDs */
  conceptId: ConceptId;
  /** Short hook text (2-5 words, NOT the full title) */
  hookText: string;
  /** Optional sub-hook (<=18 chars) */
  subHook?: string;
  /** Emotional tone for the thumbnail */
  emotionTone: EmotionTone;
  /** Color palette */
  palette: ThumbnailPalette;
  /** Composition guidance */
  composition: CompositionDirectives;
  /** Base image prompt (must include safety suffix) */
  basePrompt: string;
  /** Negative prompt (what to exclude) */
  negativePrompt: string;
  /** Overlay element directives */
  overlayDirectives: OverlayDirectives;
  /** Description of key subjects/props in the scene */
  subjects: string;
};

// ============================================
// CONCEPT SPEC (Plan + User Edits)
// ============================================

export type TextAlignment = "left" | "center" | "right";

/**
 * ConceptSpec - ConceptPlan plus any user overrides.
 */
export type ConceptSpec = {
  plan: ConceptPlan;
  // User edits (override plan values)
  hookText?: string;
  subHook?: string;
  palette?: Partial<ThumbnailPalette>;
  align?: TextAlignment;
  outline?: boolean;
  shadow?: boolean;
  // Overlay toggles
  showBadges?: boolean;
  showSymbol?: boolean;
  showHighlights?: boolean;
  // Individual badge override
  badgeText?: string;
};

// ============================================
// JOB & VARIANT RESPONSES
// ============================================

export type ThumbnailVariantResponse = {
  variantId: string;
  previewUrl: string; // URL to final rendered image
  spec: ConceptSpec;
  // Additional metadata for UI
  conceptName?: string;
  score?: number;
};

export type ThumbnailJobResponse = {
  jobId: string;
  status: ThumbnailJobStatus;
  progress: number; // 0-100
  phase?: string;
  error?: string;
  variants: ThumbnailVariantResponse[];
};

// ============================================
// TEMPLATE TYPES (Concept-based)
// ============================================

/** Template IDs now map to concept-based renderers */
export const TEMPLATE_IDS = [
  "before-after-split",
  "mistake-x",
  "vs-face-off",
  "problem-solution",
  "clean-hero",
  // These are universal overlays that work with any concept
  "concept-overlay",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type TemplateRenderInput = {
  baseImage: Buffer;
  spec: ConceptSpec;
  width?: number; // Default 1280
  height?: number; // Default 720
};

export type TemplateRenderOutput = {
  buffer: Buffer;
  mime: string;
  width: number;
  height: number;
};

// ============================================
// STORAGE TYPES
// ============================================

export type StorageObject = {
  buffer: Buffer;
  mime: string;
  size: number;
};

export type StorageMetadata = {
  key: string;
  mime: string;
  size: number;
  createdAt: Date;
};

// ============================================
// IMAGE GENERATION TYPES
// ============================================

export type GeneratedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  mime: string;
};

export type ModerationResult = {
  safe: boolean;
  flaggedCategories?: string[];
  reason?: string;
};

// ============================================
// SCORING TYPES
// ============================================

export type ConceptScore = {
  total: number;
  breakdown: {
    hookLength: number; // Shorter is better (to a point)
    contrast: number; // Text readability
    diversity: number; // How different from others
    focalClarity: number; // Clear subject directive
    conceptMatch: number; // How well concept fits input
  };
};

// ============================================
// LEGACY TYPE ALIASES (for backward compatibility)
// ============================================

/** @deprecated Use ConceptPlan instead */
export type ThumbnailPlan = ConceptPlan;

/** @deprecated Use ConceptSpec instead */
export type ThumbnailSpec = ConceptSpec;
