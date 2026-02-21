/**
 * Domain types for the subscriber-insights feature.
 *
 * Captures the inputs and outputs for subscriber conversion analysis:
 * per-video conversion metrics, pattern analysis via LLM, and
 * aggregate channel stats.
 */

import type { LlmPort } from "@/lib/ports/LlmPort";

// ── Per-Video Conversion Metrics ────────────────────────────

type ConversionTier = "strong" | "average" | "weak";

export type SubscriberMagnetVideo = {
  videoId: string;
  title: string;
  views: number;
  subscribersGained: number;
  subsPerThousand: number;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  durationSec?: number | null;
  viewsPerDay?: number;
  avdSec?: number | null;
  apv?: number | null;
  playlistAddsPer1k?: number | null;
  engagedRate?: number | null;
  commentsPer1k?: number | null;
  sharesPer1k?: number | null;
  conversionTier?: ConversionTier;
  percentileRank?: number;
  insight?: {
    whyItConverts: string[];
    stealThis: string[];
    hookIdea: string[];
  };
};

// ── Structured Insights (LLM output) ───────────────────────

type ConversionPattern = {
  pattern: string;
  evidence: string;
  howToUse: string;
};

type ConversionRecipe = {
  titleFormulas: string[];
  ctaTiming: string;
  structure: string;
};

type ConversionVideoIdea = {
  title: string;
  hook: string;
  whyItConverts: string;
  ctaSuggestion: string;
};

type StructuredInsights = {
  commonPatterns: ConversionPattern[];
  conversionRecipe: ConversionRecipe;
  nextIdeas: ConversionVideoIdea[];
};

// ── Pattern Analysis (full LLM response) ────────────────────

export type PatternAnalysisJson = {
  summary: string;
  commonPatterns: string[];
  ctaPatterns: string[];
  formatPatterns: string[];
  nextExperiments: string[];
  hooksToTry: string[];
  structuredInsights?: StructuredInsights;
};

// ── Use-Case Inputs ─────────────────────────────────────────

export type SubscriberVideoInput = {
  title: string;
  subsPerThousand: number;
  views: number;
  viewsPerDay: number;
  engagedRate: number;
};

export type PatternAnalysisInput = {
  topSubscriberDrivers: SubscriberVideoInput[];
  channelAvgSubsPerThousand: number;
};

// ── Full Subscriber Audit ───────────────────────────────────

export type RunSubscriberAuditInput = {
  userId: number;
  channelId: string;
  limit: number;
};

export type SubscriberAuditDeps = {
  llm: LlmPort;
};

export type SubscriberAuditResult = {
  channelId: string;
  range: "all";
  generatedAt: string;
  cachedUntil: string;
  videos: SubscriberMagnetVideo[];
  patternAnalysis: {
    analysisJson: PatternAnalysisJson | null;
    analysisMarkdownFallback: string | null;
  };
  stats: {
    totalVideosAnalyzed: number;
    avgSubsPerThousand: number;
    totalSubscribersGained: number;
    totalViews: number;
    strongSubscriberDriverCount: number;
    avgEngagedRate?: number;
  };
};
