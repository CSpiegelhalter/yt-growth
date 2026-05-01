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

// ── Score Strip (deterministic, baseline-anchored KPIs) ─

export type BaselineConfidence = "channel" | "platform" | "none";

export type ScoreTileTone = "above" | "on_par" | "below" | "well_below" | "unknown";

export type ScoreTile = {
  /** stable id used for ordering and aria labels */
  id: "ctr" | "avd" | "subs";
  label: string;
  /** human-readable formatted value, e.g. "4.2%" or "2:14" */
  displayValue: string;
  /** raw numeric value (for downstream LLM context) */
  rawValue: number | null;
  /** percent delta vs. baseline, signed; null if baseline unavailable */
  deltaPct: number | null;
  /** plain-language label: "on par with your average", "well below typical", etc. */
  comparisonLabel: string;
  tone: ScoreTileTone;
  /** sparkline samples (most recent N) — empty when unavailable */
  sparkline: number[];
};

export type ScoreStripData = {
  tiles: ScoreTile[];
  baselineConfidence: BaselineConfidence;
  /** sample size used for the channel-baseline comparison; null when platform-norm fallback */
  baselineSampleSize: number | null;
};

// ── Retention Curve (raw + annotated) ──────────────────

export type RetentionCurveSample = {
  /** seconds since video start */
  timeSec: number;
  /** retention as 0..1 */
  retention: number;
};

export type AnnotatedDropOff = {
  timeSec: number;
  /** percent drop expressed 0..100 */
  severityPct: number;
  /** plain-language explanation drawn from retention LLM section, or null when transcript unavailable */
  why: string | null;
  action: string | null;
  /** Deep-link URL to the YouTube video at this timestamp */
  url: string;
};

export type RetentionRebound = {
  timeSec: number;
  /** retention pct points gained over the preceding local low (0..100) */
  liftPct: number;
  /** transcript-derived label for what's happening, when available */
  label: string | null;
  /** Deep-link URL to the YouTube video at this timestamp */
  url: string;
};

export type RetentionCurveData = {
  samples: RetentionCurveSample[];
  videoDurationSec: number;
  annotations: AnnotatedDropOff[];
  /** Local retention rebounds — moments worth clipping. */
  rebounds: RetentionRebound[];
};

// ── Verdict + Priorities (summarizer LLM section) ───────

export type VerdictSeverity =
  | "outperforming"
  | "on_track"
  | "underperforming"
  | "critical";

export type VideoAge = "early" | "mature";

export type Verdict = {
  severity: VerdictSeverity;
  /** one-sentence headline; coach voice, lead with action verb */
  oneLine: string;
  videoAge: VideoAge;
};

export type PriorityRank = 1 | 2 | 3;
export type PrioritySource =
  | "retention"
  | "hook"
  | "audit"
  | "discoverability"
  | "promotion"
  | "score";

export type PriorityEvidence = {
  metric: string;
  value: string;
  baseline: string;
};

export type Priority = {
  rank: PriorityRank;
  /** short title, e.g. "Tighten the first 15 seconds" */
  title: string;
  /** plain-language description of WHAT is wrong */
  what: string;
  /** WHY — evidence, baseline comparison */
  why: string;
  /** concrete actions, ordered by tractability */
  doThis: string[];
  evidence: PriorityEvidence | null;
  sourceSection: PrioritySource;
};

export type PrioritiesList = {
  items: Priority[];
};

// ── Signals (deterministic non-obvious patterns) ───────

export type SignalCategory =
  | "timing"        // CTAs, hook delay, when things happen
  | "discovery"     // SEO, search visibility, keywords, tags
  | "engagement"    // comments, likes, shares per 1k vs baseline
  | "structure"    // pacing, beats, content gaps from transcript
  | "packaging"     // title/thumbnail vs CTR or sentiment mismatch
  | "audience";     // who is watching, demos, retention by source

export type SignalSeverity =
  | "good"          // a positive pattern worth keeping
  | "neutral"       // an observation, neither good nor bad
  | "improvement"   // a clear lift opportunity
  | "critical";     // urgent — something is actively hurting performance

export type SignalConfidence = "high" | "medium" | "low";

export type Signal = {
  id: string;
  category: SignalCategory;
  severity: SignalSeverity;
  /** One-sentence headline; lead with the finding, not the metric. */
  headline: string;
  /** 1-2 sentence explanation with evidence (numbers, timestamps). */
  body: string;
  /** Optional concrete next action; null when the headline already implies one. */
  recommendation: string | null;
  /** Optional structured evidence the UI can render compactly. */
  evidence?: { label: string; value: string }[];
  confidence: SignalConfidence;
};

export type SignalsData = {
  items: Signal[];
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
  scoreStrip: ScoreStripData;
  retentionCurve: RetentionCurveData;
  verdict: Verdict;
  priorities: PrioritiesList;
  signals: SignalsData;
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
  /** Raw retention curve from YouTube Analytics; preserved for the chart + score strip. */
  retentionCurveRaw: RetentionCurvePoint[];
};

// ── Streaming ──────────────────────────────────────────

export type ReportSectionKey =
  | "videoAudit"
  | "discoverability"
  | "promotionPlaybook"
  | "retention"
  | "hookAnalysis"
  | "scoreStrip"
  | "retentionCurve"
  | "verdict"
  | "priorities"
  | "signals";

export type ReportStreamEvent =
  | { type: "status"; phase: "gathering" | "synthesizing" }
  | { type: "section"; key: "videoAudit"; data: VideoAudit }
  | { type: "section"; key: "discoverability"; data: Discoverability }
  | { type: "section"; key: "promotionPlaybook"; data: PromotionAction[] }
  | { type: "section"; key: "retention"; data: RetentionAnalysis }
  | { type: "section"; key: "hookAnalysis"; data: HookAnalysis }
  | { type: "section"; key: "scoreStrip"; data: ScoreStripData }
  | { type: "section"; key: "retentionCurve"; data: RetentionCurveData }
  | { type: "section"; key: "verdict"; data: Verdict }
  | { type: "section"; key: "priorities"; data: PrioritiesList }
  | { type: "section"; key: "signals"; data: SignalsData }
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
