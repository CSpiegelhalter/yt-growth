/**
 * Domain types for the video-insights feature.
 *
 * Covers SEO auditing, competitive context, AI-powered analysis,
 * comment insights, and content idea generation.
 */

// ── SEO Audit Types ─────────────────────────────────────────

export type QuickFixAction =
  | "generate_description"
  | "generate_hashtags"
  | "generate_tags"
  | "generate_chapters"
  | "open_learn"
  | "copy_template";

export type DescriptionCheckStatus = "strong" | "needs_work" | "missing";

export type DescriptionCheck = {
  id: string;
  label: string;
  status: DescriptionCheckStatus;
  evidence?: string;
  recommendation: string;
  exampleFix?: string;
  quickFix?: {
    label: string;
    action: QuickFixAction;
    payload?: Record<string, unknown>;
  };
};

export type DescriptionSeoInput = {
  title: string;
  description: string;
  tags: string[];
};

export type FocusKeywordConfidence = "high" | "med" | "low";

export type DescriptionSeoResult = {
  focusKeyword: {
    value: string | null;
    candidates: string[];
    confidence: FocusKeywordConfidence;
  };
  summary: string;
  priorityFixes: DescriptionCheck[];
  checks: DescriptionCheck[];
  descriptionChecks: DescriptionCheck[];
  hashtagChecks: DescriptionCheck[];
  tagChecks: DescriptionCheck[];
  chapterChecks: DescriptionCheck[];
  googleSuggestions: string[];
};

export type DescriptionSeoOptions = {
  /** Override the auto-detected focus keyword with a specific keyword (e.g., from LLM) */
  focusKeywordOverride?: string | null;
};

// ── Competitive Context Types ───────────────────────────────
// Re-exported from port for convenience

export type {
  CompetitiveContextInput,
  CompetitiveContextResult,
} from "@/lib/ports/DataForSeoPort";

// ── Summary / Core Analysis Types ───────────────────────────

export type CoreAnalysis = {
  headline?: string;
  wins?: Array<{
    label: string;
    metric: string;
    why: string;
  }>;
  improvements?: Array<{
    label: string;
    metric: string;
    fix: string;
  }>;
  topAction?: {
    what: string;
    why: string;
    effort: "low" | "medium" | "high";
  };
  insight_headline?: string;
  the_viewer_journey?: {
    discovery_phase: string;
    consumption_phase: string;
    conversion_phase: string;
  };
  dimensional_nuance?: string;
  strategic_pivot?: {
    what: string;
    why: string;
    impact_forecast: string;
  };
};

// ── SEO Analysis (LLM-powered) ──────────────────────────────

export type FocusKeywordResult = {
  keyword: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  alternatives: string[];
};

export type SeoAnalysis = {
  focusKeyword?: FocusKeywordResult;
  titleAnalysis: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  descriptionAnalysis: {
    score: number;
    weaknesses: string[];
    rewrittenOpening: string;
    addTheseLines: string[];
  };
  tagAnalysis: {
    score: number;
    feedback: string;
    missing: string[];
    impactLevel: "high" | "medium" | "low";
  };
};

// ── Comment Insights ────────────────────────────────────────

export type CommentInsights = {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  themes: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  viewerLoved: string[];
  viewerAskedFor: string[];
  hookInspiration: string[];
};

// ── Ideas / Remix ───────────────────────────────────────────

export type RemixIdea = {
  title: string;
  hook: string;
  keywords: string[];
  angle: string;
};

export type IdeasAnalysis = {
  remixIdeas: RemixIdea[];
  contentGaps: string[];
};

// ── Shared Analytics Types ───────────────────────────────────

export type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

export type GoogleAccountResult = GoogleAccount | null;

export type RawComment = {
  text: string;
  likes?: number;
  author?: string;
  publishedAt?: string;
};

// ── LLM Dependency ──────────────────────────────────────────

export type LlmCallFn = (
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  opts?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: "json_object";
  },
) => Promise<{ content: string }>;

