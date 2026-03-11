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
