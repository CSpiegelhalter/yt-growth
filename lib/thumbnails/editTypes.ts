/**
 * Edit Request Types and Schemas
 *
 * Data model for thumbnail editing/regeneration flow.
 * Stores user feedback, toggles, and locks for reproducibility.
 */

import { z } from "zod";

// ============================================
// EDIT REQUEST ENUMS
// ============================================

export const layoutOptions = [
  "keep",
  "flip-horizontal",
  "center-subject",
  "more-negative-space",
] as const;

export const cropOptions = [
  "keep",
  "zoom-in",
  "zoom-out",
  "rule-of-thirds",
] as const;

export const clutterOptions = ["keep", "simplify", "add-context"] as const;

export const subjectTypeOptions = [
  "keep",
  "face",
  "object",
  "mascot",
  "icon-only",
] as const;

export const expressionOptions = [
  "curious",
  "shocked",
  "confident",
  "focused",
  "excited",
  "neutral",
] as const;

export const subjectSizeOptions = ["small", "medium", "large"] as const;

export const backgroundStyleOptions = [
  "gradient",
  "photo-like",
  "illustration",
  "abstract-texture",
] as const;

export const depthOptions = ["flat", "medium", "high"] as const;

export const cleanlinessOptions = ["minimal", "medium", "busy"] as const;

export const bogyColorOptions = ["blue", "orange", "green", "yellow"] as const;

export const textPlacementOptions = ["left", "right", "top", "bottom"] as const;

export const textTreatmentOptions = [
  "outline-heavy",
  "drop-shadow",
  "banner-behind",
] as const;

export const calloutTypeOptions = [
  "none",
  "arrow",
  "circle-highlight",
  "glow-outline",
] as const;

export const calloutTargetOptions = [
  "subject",
  "logo-icon",
  "important-prop",
] as const;

export const calloutIntensityOptions = ["subtle", "medium", "bold"] as const;

export const lockableAspects = [
  "palette",
  "layout",
  "subject-identity",
  "background-style",
  "headline-style",
  "callout-style",
] as const;

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Composition settings for edit request
 */
export const compositionSettingsSchema = z.object({
  layout: z.enum(layoutOptions).default("keep"),
  crop: z.enum(cropOptions).default("keep"),
  clutter: z.enum(clutterOptions).default("keep"),
});

/**
 * Subject settings for edit request
 */
export const subjectSettingsSchema = z.object({
  keepSubject: z.boolean().default(true),
  subjectType: z.enum(subjectTypeOptions).default("keep"),
  expression: z.enum(expressionOptions).optional(),
  subjectSize: z.enum(subjectSizeOptions).default("medium"),
  changeSubjectTo: z.string().max(100).optional(),
  avoidHands: z.boolean().default(true),
  avoidScreens: z.boolean().default(false),
  avoidTextInImage: z.boolean().default(true),
});

/**
 * Background settings for edit request
 */
export const backgroundSettingsSchema = z.object({
  style: z.enum(backgroundStyleOptions).default("gradient"),
  depth: z.enum(depthOptions).default("high"),
  cleanliness: z.enum(cleanlinessOptions).default("minimal"),
});

/**
 * Color and contrast settings for edit request
 */
export const colorSettingsSchema = z.object({
  primaryColor: z.enum(bogyColorOptions).default("blue"),
  accentColor: z.enum(bogyColorOptions).default("orange"),
  boostContrast: z.boolean().default(true),
  boostSaturation: z.boolean().default(false),
  limitRedWhiteBlack: z.boolean().default(true),
});

/**
 * Text/typography settings for edit request
 */
export const textSettingsSchema = z.object({
  headlineText: z.string().max(28).optional(),
  autoSuggestHeadline: z.boolean().default(false),
  textPlacement: z.enum(textPlacementOptions).default("right"),
  textTreatment: z.enum(textTreatmentOptions).default("outline-heavy"),
  textSizeMultiplier: z.number().min(0.5).max(2).default(1),
  maxWords: z.number().int().min(1).max(6).default(4),
  maxChars: z.number().int().min(5).max(30).default(20),
});

/**
 * Graphics/callout settings for edit request
 */
export const graphicsSettingsSchema = z.object({
  calloutType: z.enum(calloutTypeOptions).default("none"),
  calloutTarget: z.enum(calloutTargetOptions).default("subject"),
  calloutIntensity: z.enum(calloutIntensityOptions).default("medium"),
});

/**
 * Branding settings for edit request
 */
export const brandingSettingsSchema = z.object({
  useBrandStyle: z.boolean().default(false),
  brandAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  showCornerBug: z.boolean().default(false),
});

/**
 * Complete EditRequest schema
 */
export const editRequestSchema = z.object({
  // Required identifiers
  referenceThumbnailId: z.string().min(1, "Reference thumbnail ID is required"),
  referenceVariantId: z.string().min(1, "Reference variant ID is required"),
  
  // Video context (required for topic accuracy)
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(1000),
  
  // Free-form feedback (user's words - highest priority)
  userLikes: z.string().max(500).optional(),
  userDislikes: z.string().max(500).optional(),
  emphasize: z.string().max(500).optional(),
  mustAvoid: z.string().max(500).optional(),
  
  // Structured settings
  composition: compositionSettingsSchema.default({}),
  subject: subjectSettingsSchema.default({}),
  background: backgroundSettingsSchema.default({}),
  color: colorSettingsSchema.default({}),
  text: textSettingsSchema.default({}),
  graphics: graphicsSettingsSchema.default({}),
  branding: brandingSettingsSchema.default({}),
  
  // Locks - aspects to preserve from reference
  locks: z.array(z.enum(lockableAspects)).default([]),
  
  // Number of variants to generate
  variantCount: z.number().int().min(1).max(4).default(4),
});

export type EditRequest = z.infer<typeof editRequestSchema>;

export type CompositionSettings = z.infer<typeof compositionSettingsSchema>;
export type SubjectSettings = z.infer<typeof subjectSettingsSchema>;
export type BackgroundSettings = z.infer<typeof backgroundSettingsSchema>;
export type ColorSettings = z.infer<typeof colorSettingsSchema>;
export type TextSettings = z.infer<typeof textSettingsSchema>;
export type GraphicsSettings = z.infer<typeof graphicsSettingsSchema>;
export type BrandingSettings = z.infer<typeof brandingSettingsSchema>;

export type LayoutOption = (typeof layoutOptions)[number];
export type CropOption = (typeof cropOptions)[number];
export type ClutterOption = (typeof clutterOptions)[number];
export type SubjectTypeOption = (typeof subjectTypeOptions)[number];
export type ExpressionOption = (typeof expressionOptions)[number];
export type SubjectSizeOption = (typeof subjectSizeOptions)[number];
export type BackgroundStyleOption = (typeof backgroundStyleOptions)[number];
export type DepthOption = (typeof depthOptions)[number];
export type CleanlinessOption = (typeof cleanlinessOptions)[number];
export type BogyColorOption = (typeof bogyColorOptions)[number];
export type TextPlacementOption = (typeof textPlacementOptions)[number];
export type TextTreatmentOption = (typeof textTreatmentOptions)[number];
export type CalloutTypeOption = (typeof calloutTypeOptions)[number];
export type CalloutTargetOption = (typeof calloutTargetOptions)[number];
export type CalloutIntensityOption = (typeof calloutIntensityOptions)[number];
export type LockableAspect = (typeof lockableAspects)[number];

// ============================================
// EDIT INTENT (Processed constraints)
// ============================================

/**
 * EditIntent - Processed constraints derived from EditRequest.
 * This is what the prompt builder consumes.
 */
export type EditIntent = {
  /** Aspects to keep exactly from reference */
  keep: string[];
  /** Aspects to change based on user feedback */
  change: string[];
  /** Elements that must NOT appear */
  avoid: string[];
  /** Topic anchors from title + description */
  requiredAnchors: string[];
  /** Risk reduction flags */
  riskReductions: {
    avoidHands: boolean;
    avoidScreens: boolean;
    avoidTextInImage: boolean;
    simplifyScene: boolean;
  };
  /** Processed layout direction */
  layoutDirection: string;
  /** Processed color palette */
  palette: {
    primary: BogyColorOption;
    accent: BogyColorOption;
    boostContrast: boolean;
    boostSaturation: boolean;
  };
  /** Background config */
  background: {
    style: BackgroundStyleOption;
    depth: DepthOption;
    cleanliness: CleanlinessOption;
  };
  /** Subject config */
  subject: {
    description: string;
    size: SubjectSizeOption;
    expression?: ExpressionOption;
  };
  /** Text config */
  text: {
    headline: string;
    placement: TextPlacementOption;
    treatment: TextTreatmentOption;
    sizeMultiplier: number;
  };
  /** Graphics config */
  graphics: {
    calloutType: CalloutTypeOption;
    target: CalloutTargetOption;
    intensity: CalloutIntensityOption;
  };
  /** Locked aspects (prevents variation in these) */
  locks: LockableAspect[];
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate and parse an edit request
 */
export function parseEditRequest(data: unknown): EditRequest | null {
  const result = editRequestSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error("[parseEditRequest] Validation failed:", result.error.issues);
  return null;
}

/**
 * Get default edit request for a reference thumbnail
 */
export function getDefaultEditRequest(
  referenceThumbnailId: string,
  referenceVariantId: string,
  title: string,
  description: string
): EditRequest {
  return {
    referenceThumbnailId,
    referenceVariantId,
    title,
    description,
    userLikes: "",
    userDislikes: "",
    emphasize: "",
    mustAvoid: "",
    composition: {
      layout: "keep",
      crop: "keep",
      clutter: "keep",
    },
    subject: {
      keepSubject: true,
      subjectType: "keep",
      subjectSize: "medium",
      avoidHands: true,
      avoidScreens: false,
      avoidTextInImage: true,
    },
    background: {
      style: "gradient",
      depth: "high",
      cleanliness: "minimal",
    },
    color: {
      primaryColor: "blue",
      accentColor: "orange",
      boostContrast: true,
      boostSaturation: false,
      limitRedWhiteBlack: true,
    },
    text: {
      textPlacement: "right",
      textTreatment: "outline-heavy",
      textSizeMultiplier: 1,
      maxWords: 4,
      maxChars: 20,
      autoSuggestHeadline: false,
    },
    graphics: {
      calloutType: "none",
      calloutTarget: "subject",
      calloutIntensity: "medium",
    },
    branding: {
      useBrandStyle: false,
      showCornerBug: false,
    },
    locks: [],
    variantCount: 4,
  };
}
