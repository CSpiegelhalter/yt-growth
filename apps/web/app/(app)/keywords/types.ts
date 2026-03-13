/**
 * Shared types for the keyword research feature UI.
 *
 * Extracted to break the circular dependency between
 * KeywordResearchClient and ResearchTab.
 */

export type RelatedKeyword = {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  trend: number[];
  intent: string | null;
  cpc?: number | null;
  competition?: number | null;
  competitionIndex?: number | null;
  competitionLevel?: string | null;
  relevance?: number;
  difficultyIsEstimate?: boolean;
};

export type YouTubeRanking = {
  position: number;
  title: string;
  channelName: string;
  channelUrl: string;
  videoUrl: string;
  videoId: string;
  views: number | null;
  publishedDate: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
};

export type GoogleTrendsTimePoint = {
  dateFrom: string;
  dateTo: string;
  timestamp: number;
  value: number;
  missingData: boolean;
};

export type GoogleTrendsRisingQuery = {
  query: string;
  value: number;
};

export type GoogleTrendsRegion = {
  geoId: string;
  geoName: string;
  value: number;
};

export type GoogleTrendsData = {
  keyword: string;
  interestOverTime: GoogleTrendsTimePoint[];
  risingQueries: GoogleTrendsRisingQuery[];
  topQueries: Array<{ query: string; value: number }>;
  regionBreakdown: GoogleTrendsRegion[];
  averageInterest: number;
};
