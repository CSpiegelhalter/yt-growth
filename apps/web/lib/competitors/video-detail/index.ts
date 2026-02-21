/**
 * Competitor Video Detail - Module Index
 *
 * Re-exports all public types and functions for the video detail analysis pipeline.
 */

// Types used by the route handler
export { VideoDetailError } from "./types";
export type { RequestContext } from "./types";

// Validation (channelParamsSchema imported directly from ./validation by consumers)

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
} from "./cache";

// LLM analysis
export {
  normalizeBeatChecklist,
  normalizeAnalysis,
  runParallelAnalysis,
  cacheCommentsInBackground,
} from "./analysis";

// Response building
export {
  buildVideoObject,
  buildMoreFromChannel,
  buildResponse,
} from "./response";
