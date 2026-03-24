/**
 * Domain types for the suggestions feature.
 */

export type VideoSuggestionStatus = "active" | "saved" | "dismissed" | "used";

export type SuggestionAction = "save" | "dismiss" | "use";

export type SuggestionContext = {
  channelNiche: string | null;
  contentPillars: string[];
  targetAudience: string | null;
  recentVideoTitles: string[];
  recentVideoPerformance: VideoPerformanceSummary[];
  trendingTopics: string[];
};

export type VideoPerformanceSummary = {
  title: string;
  views: number;
  likes: number;
  comments: number;
  avgViewPercentage: number;
};

export type GenerateSuggestionsInput = {
  userId: number;
  channelId: number;
  count: number;
  context: SuggestionContext;
};

export type ActOnSuggestionInput = {
  userId: number;
  channelId: number;
  suggestionId: string;
  action: SuggestionAction;
};

export type VideoSuggestion = {
  id: string;
  title: string;
  description: string;
  sourceContext: SuggestionContext;
  status: VideoSuggestionStatus;
  generatedAt: string;
};

export type ActOnSuggestionResult = {
  suggestion: { id: string; status: VideoSuggestionStatus };
  replacement: VideoSuggestion;
  videoIdeaId?: string;
  ideaFlowUrl?: string;
};

// ============================================
// Competitor-Backed Suggestion Types
// ============================================

export type SourceVideoSnapshot = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  stats: {
    viewCount: number;
    viewsPerDay: number;
  };
  publishedAt: string;
};

export type SourceProvenance = {
  sourceVideos: SourceVideoSnapshot[];
  pattern: string;
  rationale: string;
  adaptationAngle: string;
};

export type CompetitorVideoForContext = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  viewCount: number;
  viewsPerDay: number;
  publishedAt: string;
  durationSec: number | null;
  tags: string[];
};

export type GenerationMode = "profile_only" | "competitor_backed";

export type NicheKeywordForContext = {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunityScore: number;
  competitionLevel: string | null;
  trendDirection: "rising" | "stable" | "declining";
  intent: string | null;
  youtubeValidated: boolean;
  youtubeGapScore: number | null;
  youtubeResultCount: number | null;
  seasonalPeak: number | null;
  monthlySearches: Array<{ year: number; month: number; searchVolume: number }>;
};

export type CompetitorBackedSuggestionContext = SuggestionContext & {
  provenance: SourceProvenance | null;
  generationMode: GenerationMode;
  competitorVideos: CompetitorVideoForContext[];
  nicheAvgViewsPerDay: number | null;
  nicheKeywords: NicheKeywordForContext[];
};
