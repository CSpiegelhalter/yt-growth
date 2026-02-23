/**
 * Competitor Video Detail - Module Index
 *
 * Re-exports all public types and functions for the video detail analysis pipeline.
 */

// Types used by the route handler
export type { RequestContext } from "./types";
export { VideoDetailError } from "./types";

// Validation (channelParamsSchema imported directly from ./validation by consumers)

// YouTube fetch helpers
export {
  fetchCommentsWithTimeout,
  fetchRecentChannelVideosWithTimeout,
  fetchVideoDetailsWithTimeout,
  getGoogleAccountOrThrow,
} from "./youtube";

// Cache operations
export {
  backfillBeatChecklist,
  isAnalysisCacheFresh,
  isCommentsCacheFresh,
  readCachesParallel,
  saveAnalysisCache,
  upsertCompetitorVideo,
} from "./cache";

// LLM analysis
export {
  cacheCommentsInBackground,
  normalizeAnalysis,
  normalizeBeatChecklist,
  runParallelAnalysis,
} from "./analysis";

// Response building
export {
  buildMoreFromChannel,
  buildResponse,
  buildVideoObject,
} from "./response";
