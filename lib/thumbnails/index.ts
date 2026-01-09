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
  // Anti-artifact plan types
  ThumbnailPlan,
  RiskReview,
  SubjectType,
  FallbackMode,
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
  ensurePromptSafety,
  // Legacy
  thumbnailPlanSchema,
  thumbnailSpecSchema,
} from "./schemas";

// LLM Planning
export {
  generateConceptPlans,
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
  // BOGY-enhanced generation (YouTube best practices)
  generateBogyBaseImage,
  generate4Variations,
  enhanceConceptPlanPrompt,
} from "./openaiImages";

// Unified Image Provider (switch between replicate/stability/openai)
export {
  generateImage,
  generateStyledImage,
  generateDeepFriedImage,
  generateCartoonImage,
  generateAnimeImage,
  generateCinematicImage,
  getImageProvider,
  getProviderByName,
  getAvailableProviders,
} from "./imageProvider";

export type {
  ImageProviderType,
  ImageProvider,
  ImageGenerationOptions,
  StyledImageGenerationOptions,
  GeneratedImageResult,
} from "./imageProvider";

// Style Pack System (toggles for cartoon, deepFried, etc.)
export {
  STYLE_PACKS,
  getStylePack,
  getStylePackForMemeStyle,
  getStylePackForVisualStyle,
  getStylePackIdsFromControls,
  resolveStyleConflicts,
  composeStyledPrompt,
  composeStyledNegativePrompt,
  getRecommendedModel,
  getPostProcessingPipeline,
  requiresPostProcessing,
  logStyleApplication,
  UNIVERSAL_PROMPT_SUFFIX,
  UNIVERSAL_NEGATIVE_PROMPT,
} from "./stylePacks";

export type {
  StylePack,
  PostProcessingStep,
  StyleApplicationLog,
} from "./stylePacks";

// Image Post-Processing Pipeline
export {
  applyPostProcessing,
  applyDeepFriedEffect,
  applyCartoonEnhancement,
} from "./imagePostProcess";

export type { PostProcessingResult } from "./imagePostProcess";

// BOGY Palettes (YouTube best practices)
export {
  BOGY_COLORS,
  ALL_BOGY_PALETTES,
  BLUE_ORANGE_PALETTES,
  GREEN_YELLOW_PALETTES,
  BLUE_GREEN_PALETTES,
  ORANGE_YELLOW_PALETTES,
  DARK_BOGY_PALETTES,
  getBogyPalettes,
  getRandomBogyPalette,
  getDiverseBogyPalettes,
  getBogyPaletteForNiche,
} from "./bogyPalettes";
export type { BogyPairing } from "./bogyPalettes";

// Thumbnail Direction Builder
export {
  buildThumbnailDirection,
  generateLayoutVariations,
  extractHeadline,
} from "./thumbnailDirection";
export type {
  ThumbnailDirection,
  ThumbnailDirectionInput,
  SubjectEmotion,
  LayoutType,
  GenreType,
} from "./thumbnailDirection";

// Prompt Builder (V2 - Weighted Blocks)
export {
  buildImagePrompt,
  buildPromptFromPlan,
  generatePromptVariations,
  buildSafePrompt,
  generateSafeVariations,
  STANDARD_NEGATIVE_PROMPT,
  // V2 exports
  buildPromptBlocks,
  assemblePrompt,
  buildPromptFromControls,
  STYLE_RECIPES,
  STYLE_AVOIDS,
} from "./promptBuilder";
export type { PromptBlocks } from "./promptBuilder";

// Anti-Artifact Plan Builder
export {
  generateThumbnailPlan,
  reviewPlanRisks,
  generateSafePlan,
  HIGH_RISK_ELEMENTS,
  HUMAN_CONSTRAINTS,
  SCREEN_CONSTRAINTS,
  STANDARD_QUALITY_BAR,
} from "./antiArtifactPlan";

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
  renderGradientPreview,
  processUploadedImage,
  exportOverlaySvg,
  renderBatch,
} from "./render";

// Palettes
export { getPalettesForStyle, getRandomPalette } from "./palettes";

// Generation Controls (V2 - Character Identity + Meme Styles)
export {
  generationControlsSchema,
  getDefaultControls,
  applyPreset,
  sanitizeInspirationText,
  getMemeInspirationDescription,
  generateSeed,
  getSeedVariants,
  // Control option arrays
  subjectTypeOptions,
  personaVibeOptions,
  visualStyleOptions,
  faceStyleOptions,
  memeIntensityOptions,
  memeStyleOptions,
  emojiStyleOptions,
  emojiIconStyleOptions,
  backgroundModeOptions,
  environmentThemeOptions,
  detailLevelOptions,
  lightingStyleOptions,
  paletteModeOptions,
  bogyColorOptions,
  headlineStyleOptions,
  textPlacementOptions,
  characterGenderOptions,
  characterAgeOptions,
  characterStyleOptions,
  uiModeOptions,
  // Meme inspiration catalogs
  RAGE_COMIC_INSPIRATIONS,
  CURSED_EMOJI_INSPIRATIONS,
  CURSED_MEME_AESTHETICS,
  ALL_MEME_INSPIRATIONS,
  // Presets
  GENERATION_PRESETS,
} from "./generationControls";

export type {
  GenerationControls,
  SubjectType as ControlsSubjectType,
  PersonaVibe,
  VisualStyle,
  FaceStyle,
  MemeIntensity,
  MemeStyle,
  EmojiStyle,
  EmojiIconStyle,
  UiMode,
  BackgroundMode,
  EnvironmentTheme,
  DetailLevel,
  LightingStyle,
  PaletteMode,
  BogyColor,
  HeadlineStyle,
  TextPlacement,
  CharacterGender,
  CharacterAge,
  CharacterStyle,
  MemeFormat,
  PresetKey,
  MemeInspiration,
  RageComicInspiration,
  CursedEmojiInspiration,
  CursedMemeAesthetic,
} from "./generationControls";

// Style Reference Manifest (V2 Visual Dials)
export {
  STYLE_DIALS,
  MEME_STYLE_OPTIONS,
  CHARACTER_STYLE_OPTIONS,
  EXPRESSION_OPTIONS,
  COMPOSITION_OPTIONS,
  BACKGROUND_OPTIONS,
  INTENSITY_OPTIONS,
  getStyleOption,
  getStyleDial,
  mapDialSelectionsToControls,
  getIntensityStrength,
  getDialSelectionsSummary,
} from "./styleReferenceManifest";

export type {
  StyleCategory,
  IntensityLevel,
  StyleOption,
  StyleDial,
} from "./styleReferenceManifest";

// Meme Reference Library (user-selectable style reference images)
export {
  MEME_REFERENCES,
  getMemeById,
  getMemesByCategory,
  getMemeCategories,
  searchMemes,
  getMemeStylePrompt,
  getStyleReferencePromptAddition,
} from "./memeReferences";

export type { MemeReference } from "./memeReferences";

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

// Validation utilities
export {
  validateImage,
  quickValidateImage,
  validateGeneratedImage,
  isGeneratedImageUsable,
  isPngBuffer,
  isJpegBuffer,
  detectImageFormat,
  calculateContrastRatio,
  isTextReadable,
  THUMBNAIL_WIDTH as VALIDATION_THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT as VALIDATION_THUMBNAIL_HEIGHT,
  MIN_FILE_SIZE,
  MAX_FILE_SIZE,
} from "./validation";

// Composite overlay utilities
export {
  compositeOverlay,
  compositeMemeOntoThumbnail,
  loadMemeImage,
  getDefaultOverlayTransform,
  type OverlayTransform,
  type CompositeResult,
} from "./compositeOverlay";

// Composite refinement
export {
  refineCompositeImage,
  isRefinementAvailable,
} from "./refineComposite";
