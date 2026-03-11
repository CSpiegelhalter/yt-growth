import type { TranscriptCacheDeps, TranscriptReport } from "@/lib/features/transcript-analysis";
import type { LlmCallFn, SeoAnalysis } from "@/lib/features/video-insights/types";
import type { CompetitiveContextResult } from "@/lib/ports/DataForSeoPort";

// ── Discoverability ─────────────────────────────────────

export type TitleOption = {
  type: string;
  text: string;
  stats: string;
};

export type ThumbnailConcept = {
  name: string;
  overlayText: string;
  composition: string;
  colorScheme: string;
  emotionToConvey: string;
};

export type Discoverability = {
  titleOptions: TitleOption[];
  descriptionBlock: string;
  tags: string[];
  thumbnailConcepts: ThumbnailConcept[];
};

// ── Promotion Playbook ──────────────────────────────────

export type PromotionActionType = "social" | "community" | "collaboration" | "seo";

export type PromotionAction = {
  type: PromotionActionType;
  platform: string;
  target: string;
  action: string;
  draftText: string;
};

// ── Retention ───────────────────────────────────────────

export type DropOffPoint = {
  timestamp: string;
  percentDrop: string;
  issue: string;
  reasoning: string;
  action: string;
  visualCue: string;
};

export type RetentionAnalysis = {
  dropOffPoints: DropOffPoint[];
};

// ── Hook Analysis ───────────────────────────────────────

export type HookScore = "Strong" | "Needs Work" | "Weak";

export type HookAnalysis = {
  score: HookScore;
  issue: string;
  scriptFix: string;
  currentScript: string | null;
  hookWindowSeconds?: number;
};

// ── Video Audit ─────────────────────────────────────────

export type AuditItem = {
  criterion: string;
  passed: boolean;
  detail: string;
  action: string | null;
};

export type VideoAudit = {
  items: AuditItem[];
};

// ── Full Report ─────────────────────────────────────────

export type FullReport = {
  videoId: string;
  videoTitle: string;
  generatedAt: string;
  discoverability: Discoverability;
  promotionPlaybook: PromotionAction[];
  retention: RetentionAnalysis;
  hookAnalysis: HookAnalysis;
  videoAudit: VideoAudit;
};

// ── Video Signals (pre-LLM parsed data) ────────────────

export type VideoSignals = {
  descriptionLinkCount: number;
  hasTimestamps: boolean;
  hashtagCount: number;
  ctaCount: number;
  hasCaptions: boolean;
  titleLength: number;
};

// ── Gathered Data (intermediate) ───────────────────────

export type VideoMeta = {
  title: string;
  description?: string;
  tags?: string[];
  durationSec: number;
  categoryId?: string | null;
};

export type DerivedMetrics = {
  totalViews: number;
  viewsPerDay: number;
  avdRatio: number | null;
  engagementPerView: number | null;
  subsPer1k: number | null;
  daysInRange: number;
  impressionsCtr?: number | null;
  trafficSources?: { search?: number; total?: number } | null;
};

export type InsightDerivedData = {
  video: VideoMeta;
  derived: DerivedMetrics;
  comparison?: Record<string, unknown>;
  bottleneck?: { bottleneck: string; evidence: string } | null;
  trafficDetail?: {
    searchTerms?: Array<{ term: string; views: number }> | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type InsightContext = {
  channel: { id: number; youtubeChannelId: string; subscriberCount: number | null };
  cached: { derivedJson: unknown; llmJson: unknown; cachedUntil: Date; contentHash: string | null };
  derivedData: InsightDerivedData;
  videoPublishedAt: string | null;
  baseline: Record<string, unknown> | null;
};

export type GatheredData = {
  insightContext: InsightContext;
  transcriptReport: TranscriptReport | null;
  seoAnalysis: SeoAnalysis | null;
  competitiveContext: CompetitiveContextResult | null;
  hasCaptions: boolean;
  videoSignals: VideoSignals;
};

// ── Streaming ──────────────────────────────────────────

export type ReportSectionKey =
  | "videoAudit"
  | "discoverability"
  | "promotionPlaybook"
  | "retention"
  | "hookAnalysis";

export type ReportStreamEvent =
  | { type: "status"; phase: "gathering" | "synthesizing" }
  | { type: "section"; key: "videoAudit"; data: VideoAudit }
  | { type: "section"; key: "discoverability"; data: Discoverability }
  | { type: "section"; key: "promotionPlaybook"; data: PromotionAction[] }
  | { type: "section"; key: "retention"; data: RetentionAnalysis }
  | { type: "section"; key: "hookAnalysis"; data: HookAnalysis }
  | { type: "error"; key: ReportSectionKey; error: string; retryable?: boolean }
  | { type: "done" };

// ── Dependencies ───────────────────────────────────────

export type RetentionCurvePoint = {
  elapsedRatio: number;
  audienceWatchRatio: number;
};

export type FullReportDeps = {
  callLlm: LlmCallFn;
  transcriptCache?: TranscriptCacheDeps;
  getYouTubeTranscript: (params: { videoId: string }) => Promise<{
    videoId: string;
    segments: Array<{ text: string; start: number; duration: number }>;
    fullText: string;
    meta: { fetchedAt: string };
  }>;
  fetchRetentionCurve: (
    userId: number,
    channelId: string,
    videoId: string,
  ) => Promise<RetentionCurvePoint[]>;
  runTranscriptAnalysis: (
    input: {
      videoId: string;
      videoTitle: string;
      videoDurationSec: number;
      segments: Array<{ text: string; start: number; duration: number }>;
      dropOffPoints?: Array<{ timeSec: number; severityPct: number }>;
    },
    deps: { callLlm: LlmCallFn; cache?: TranscriptCacheDeps },
  ) => Promise<TranscriptReport>;
  generateSeoAnalysis: (
    input: {
      video: { title: string; description: string; tags: string[]; durationSec: number };
      totalViews: number;
      trafficSources: { search?: number; total?: number } | null;
    },
    callLlm: LlmCallFn,
  ) => Promise<SeoAnalysis>;
  fetchCompetitiveContext: (input: {
    videoId: string;
    title: string;
    tags: string[];
    searchTerms: Array<{ term: string; views: number }>;
    totalViews: number;
  }) => Promise<CompetitiveContextResult>;
};
