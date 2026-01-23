/**
 * Competitor Video Detail - Internal Types
 *
 * Shared type definitions for the video detail analysis pipeline.
 * These are internal types used by the module; the API response type
 * is defined in types/api.d.ts.
 */

import type {
  CompetitorVideo,
  CompetitorCommentsAnalysis,
  CompetitorVideoAnalysis,
} from "@/types/api";
import type { VideoDetails, YouTubeComment } from "@/lib/youtube/types";

// ============================================
// TIMING & LOGGING
// ============================================

export type StageTiming = {
  stage: string;
  durationMs: number;
};

export type RequestContext = {
  route: string;
  requestId: string;
  userId: number;
  channelId: string;
  videoId: string;
  startTime: number;
  timings: StageTiming[];
};

// ============================================
// CACHE TYPES
// ============================================

export type CachedCompetitorVideo = {
  id: number;
  videoId: string;
  channelId: string;
  channelTitle: string | null;
  title: string;
  description: string | null;
  publishedAt: Date;
  durationSec: number | null;
  thumbnailUrl: string | null;
  tags: string[];
  categoryId: string | null;
  analysisJson: unknown | null;
  analysisContentHash: string | null;
  analysisCapturedAt: Date | null;
  lastFetchedAt: Date;
  Snapshots: Array<{
    id: number;
    viewCount: number;
    capturedAt: Date;
  }>;
};

export type CachedComments = {
  videoId: string;
  capturedAt: Date;
  contentHash: string | null;
  analysisJson: unknown | null;
  topCommentsJson: unknown;
  sentimentPos: number | null;
  sentimentNeu: number | null;
  sentimentNeg: number | null;
  themesJson: unknown | null;
};

// ============================================
// YOUTUBE FETCH RESULTS
// ============================================

export type VideoDetailsResult = VideoDetails & {
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

export type CommentsResult = {
  comments: YouTubeComment[];
  commentsDisabled?: boolean;
  error?: string;
};

export type ChannelVideosResult = Array<{
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  views: number;
  viewsPerDay: number;
}>;

// ============================================
// LLM ANALYSIS TYPES
// ============================================

export type RawLLMAnalysis = {
  whatItsAbout: string;
  whyItsWorking: string[];
  themesToRemix: Array<{ theme: string; why: string }>;
  titlePatterns: string[];
  packagingNotes: string[];
  remixIdeasForYou: Array<{
    title: string;
    hook: string;
    overlayText: string;
    angle: string;
  }>;
  beatThisVideo?: Array<{
    action: string;
    difficulty: "Easy" | "Medium" | "Hard";
    impact: "Low" | "Medium" | "High";
  }>;
};

export type NormalizedAnalysis = CompetitorVideoAnalysis["analysis"];

export type BeatChecklist = Array<{
  action: string;
  difficulty: "Easy" | "Medium" | "Hard";
  impact: "Low" | "Medium" | "High";
}>;

// ============================================
// ERROR TYPES
// ============================================

export class VideoDetailError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "VALIDATION_ERROR"
      | "AUTH_ERROR"
      | "RATE_LIMIT"
      | "VIDEO_NOT_FOUND"
      | "CHANNEL_NOT_FOUND"
      | "GOOGLE_ACCOUNT_MISSING"
      | "LLM_TIMEOUT"
      | "LLM_ERROR"
      | "YOUTUBE_ERROR"
      | "INTERNAL_ERROR",
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "VideoDetailError";
  }
}

// ============================================
// PIPELINE STATE
// ============================================

export type PipelineInput = {
  videoId: string;
  channelId: string;
  includeMoreFromChannel: boolean;
  userId: number;
  channelDbId: number;
  channelTitle: string;
};

export type PipelineState = {
  // Inputs
  input: PipelineInput;
  context: RequestContext;

  // YouTube data
  videoDetails: VideoDetailsResult | null;
  rawComments: CommentsResult | null;
  moreFromChannel: ChannelVideosResult;

  // Cache data
  cachedVideo: CachedCompetitorVideo | null;
  cachedComments: CachedComments | null;

  // Derived data
  video: CompetitorVideo | null;
  commentsAnalysis: CompetitorCommentsAnalysis | null;
  analysis: NormalizedAnalysis | null;
  beatChecklist: BeatChecklist | null;

  // Content hashes for cache invalidation
  videoContentHash: string | null;
  commentsContentHash: string | null;

  // Flags
  needsFreshAnalysis: boolean;
  needsCommentsLLM: boolean;
  llmFailed: boolean;
  llmFailureReason: string | null;
};

// ============================================
// TIMEOUT CONFIGURATION
// ============================================

export const TIMEOUTS = {
  // YouTube API calls
  VIDEO_DETAILS_MS: 8000,
  COMMENTS_FETCH_MS: 6000,
  CHANNEL_VIDEOS_MS: 5000,

  // LLM calls
  COMMENTS_LLM_MS: 15000,
  MAIN_ANALYSIS_MS: 25000,

  // Total route budget (leave headroom for response building)
  TOTAL_ROUTE_MS: 50000,
} as const;

// ============================================
// CACHE CONFIGURATION
// ============================================

export const CACHE_CONFIG = {
  COMMENTS_FRESHNESS_DAYS: 7,
  ANALYSIS_FRESHNESS_DAYS: 30,
  MORE_FROM_CHANNEL_RANGE_DAYS: 28,
} as const;
