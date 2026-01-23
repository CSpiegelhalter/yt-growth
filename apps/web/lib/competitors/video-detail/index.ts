/**
 * Competitor Video Detail - Module Index
 *
 * Re-exports all public types and functions for the video detail analysis pipeline.
 */

// Types
export * from "./types";

// Validation
export { ParamsSchema, QuerySchema, parseParams, parseQuery } from "./validation";
export type { ValidatedParams, ValidatedQuery } from "./validation";

// Timeout utilities
export { withTimeout, withTimeoutFallback, withTimeoutOptional, TimeoutError } from "./timeout";

// YouTube fetch helpers
export {
  getGoogleAccountOrThrow,
  fetchVideoDetailsWithTimeout,
  fetchCommentsWithTimeout,
  fetchRecentChannelVideosWithTimeout,
} from "./youtube";

// Cache operations
export {
  readCachesParallel,
  isCommentsCacheFresh,
  isAnalysisCacheFresh,
  upsertCompetitorVideo,
  saveAnalysisCache,
  backfillBeatChecklist,
  saveCommentsCache,
} from "./cache";
export type { CacheReadResult } from "./cache";

// Strategic insights (pure functions)
export {
  computeStrategicInsights,
  deriveKeywordsFromText,
  guessLikelyFormat,
  guessProductionLevel,
  fallbackWhatItsAbout,
  generateFreshAngles,
  generateFallbackBeatChecklist,
  commonWords,
} from "./strategic";
export type { LikelyFormat } from "./strategic";

// LLM analysis
export {
  normalizeBeatChecklist,
  normalizeAnalysis,
  runCommentsAnalysis,
  runMainAnalysis,
  runParallelAnalysis,
  cacheCommentsInBackground,
} from "./analysis";
export type { AnalysisResult, CommentsAnalysisResult } from "./analysis";

// Response building
export {
  buildVideoObject,
  buildMoreFromChannel,
  buildResponse,
  buildLLMErrorResponse,
} from "./response";
export type { BuildResponseInput } from "./response";
