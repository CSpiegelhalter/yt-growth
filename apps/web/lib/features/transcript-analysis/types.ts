import type { LlmCallFn } from "@/lib/features/video-insights/types";
import type { TranscriptSegment } from "@/lib/ports/SerpApiPort";

// ── Drop-off ────────────────────────────────────────────

export type DropOffPoint = {
  timeSec: number;
  severityPct: number;
};

// ── Chunking ────────────────────────────────────────────

export type TranscriptChunk = {
  index: number;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
  segments: TranscriptSegment[];
  wordCount: number;
  dropOffPoints: DropOffPoint[];
};

// ── Map (per-chunk) ─────────────────────────────────────

export type CtaType = "subscribe" | "like" | "comment" | "link" | "other";

export type ChunkCta = {
  timeSec: number;
  type: CtaType;
  quote: string;
};

export type PacingDensity = "low" | "medium" | "high";

export type ChunkAnalysisResult = {
  chunkIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  ctas: ChunkCta[];
  keywords: string[];
  topicSummary: string;
  wordsPerMinute: number;
  pacingDensity: PacingDensity;
  dropOffHypothesis: string | null;
  frictionPoints: string[];
  valueDensity: number;
  verbatimOpening: string | null;
};

// ── Reduce (report) ─────────────────────────────────────

export type HookAnalysis = {
  summary: string;
  deliversOnPromise: boolean;
  strengths: string[];
  weaknesses: string[];
  audiencePsychology: string;
  reproduciblePattern: string;
};

export type ContentSegment = {
  label: string;
  startTimeSec: number;
  endTimeSec: number;
  description: string;
};

export type DropOffDiagnosis = {
  timeSec: number;
  severityPct: number;
  reason: string;
  contentAtMoment: string;
};

export type PacingScore = {
  avgWordsPerMinute: number;
  avgSegmentLengthSec: number;
  topicShiftFrequency: string;
  verdict: string;
};

export type BeatChecklistCategory =
  | "hook"
  | "pacing"
  | "structure"
  | "engagement"
  | "retention";

export type BeatChecklistItem = {
  action: string;
  category: BeatChecklistCategory;
};

// ── Retention Killers ──────────────────────────────────

export type RetentionKiller = {
  timeSec: number;
  issue: string;
  fix: string;
};

// ── Final Report ────────────────────────────────────────

export type TranscriptReport = {
  videoId: string;
  videoTitle: string;
  videoDurationSec: number;
  totalWordCount: number;
  chunkCount: number;
  videoFormat: string;
  hookAnalysis: HookAnalysis;
  contentStructure: ContentSegment[];
  dropOffDiagnoses: DropOffDiagnosis[];
  pacingScore: PacingScore;
  beatChecklist: BeatChecklistItem[];
  retentionKillers: RetentionKiller[];
  contentGaps: string[];
  timeToValueSec: number;
  allCtas: ChunkCta[];
  topKeywords: string[];
  chunkAnalyses: ChunkAnalysisResult[];
};

// ── Inputs / Dependencies ───────────────────────────────

export type RunTranscriptAnalysisInput = {
  videoId: string;
  videoTitle: string;
  videoDurationSec: number;
  segments: TranscriptSegment[];
  dropOffPoints?: DropOffPoint[];
};

export type RunTranscriptAnalysisDeps = {
  callLlm: LlmCallFn;
};
