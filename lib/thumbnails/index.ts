/**
 * Thumbnail Generator (Concept-Driven)
 *
 * Main entry point for the thumbnail generation system.
 * Exports all types, schemas, utilities, and functions.
 */

// Core types
export type {
  // Job types
  ThumbnailJobInput,
  ThumbnailJobStatus,
  ThumbnailJobResponse,
  ThumbnailVariantResponse,
  // Plan types
  ConceptPlan,
  ConceptSpec,
  ConceptScore,
  ThumbnailPalette,
  // Directive types
  BadgeDirective,
  HighlightDirective,
  CompositionDirectives,
  OverlayDirectives,
  EmotionTone,
  TextAlignment,
  // Storage types
  StorageObject,
  StorageMetadata,
  GeneratedImage,
  ModerationResult,
  TemplateRenderInput,
  TemplateRenderOutput,
  // Legacy aliases
  ThumbnailPlan,
  ThumbnailSpec,
} from "./types";

// Re-export concept types
export type {
  ConceptId,
  TextSafeArea,
  FocalPosition,
  BackgroundComplexity,
  BigSymbolType,
  BadgeStyle,
  OverlayElementType,
} from "./concepts";

// Concept library
export {
  CONCEPT_IDS,
  CONCEPT_LIBRARY,
  getConcept,
  getAllConceptIds,
  isValidConceptId,
  getDefaultConcept,
  suggestConceptsForKeywords,
  getConceptMeta,
  getAllConceptsMeta,
} from "./concepts";

// Schemas
export {
  hexColorSchema,
  thumbnailJobInputSchema,
  thumbnailPaletteSchema,
  conceptPlanSchema,
  conceptSpecSchema,
  rerenderPatchSchema,
  hookTextSchema,
  basePromptSchema,
  parsePlanJson,
  parseSpecJson,
  normalizeJobInput,
  isHookTooSimilarToTitle,
  shortenHookText,
  containsBannedTerms,
  ensurePromptSafety,
  // Legacy
  thumbnailPlanSchema,
  thumbnailSpecSchema,
} from "./schemas";

// LLM Planning
export {
  generateConceptPlans,
  moderateContent,
  regenerateHook,
  // Legacy alias
  generateThumbnailPlans,
} from "./llmPlanner";

// Scoring
export {
  scoreConceptPlan,
  rankConceptPlans,
  enforceDiversity,
  getDiversityStats,
  getContrastRatio,
} from "./scoring";

// Image Generation
export {
  buildScenePrompt,
  hardenPrompt,
  generateBaseImage,
  generateBaseImagesBatch,
  regenerateBaseImage,
  estimateCost,
  getFallbackSceneDescription,
} from "./openaiImages";

// Overlays
export {
  generateBigX,
  generateBigCheck,
  generateVsBadge,
  generateQuestionMark,
  generateBigArrow,
  generateBigSymbol,
  generateCircleHighlight,
  generateArrowPointer,
  generateGlowEffect,
  generateBlurRegion,
  generateSplitLine,
  generateHighlight,
  generatePillBadge,
  generateStampBadge,
  generateCornerFlagBadge,
  generateCircleBadge,
  generateBadge,
  generateAllOverlays,
} from "./overlays";

// Templates
export {
  generateOverlay,
  generateGradientBackground,
  getConceptTemplateGenerator,
  getAllTemplatesMeta,
  TEMPLATE_META,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
  // Individual templates
  generateCleanHeroOverlay,
  generateBeforeAfterSplitOverlay,
  generateMistakeXOverlay,
  generateProblemSolutionOverlay,
  generateVsOverlay,
} from "./templates";

// Rendering
export {
  renderThumbnail,
  rerenderOverlay,
  renderFallbackThumbnail,
  renderGradientPreview,
  processUploadedImage,
  exportOverlaySvg,
  renderBatch,
} from "./render";

// Palettes
export { getPalettesForStyle, getRandomPalette } from "./palettes";

// SVG utilities
export {
  svgEscape,
  svgAttrEscape,
  safeText,
  svgText,
  svgTextWithOutline,
  svgDropShadowFilter,
  SAFE_ZONES,
  isInSafeZone,
} from "./svg";

// Headline utilities (still useful for hook text)
export {
  shortenHeadline,
  truncateExact,
  transformHeadline,
  generateHeadlineVariants,
  validateHeadlineContent,
  estimateReadability,
} from "./headline";
