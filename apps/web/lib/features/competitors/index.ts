// Types (re-exported for consumers that need the DTOs)
export type {
  CompetitorVideo,
  CompetitorVideoAnalysis,
  CompetitorCommentsAnalysis,
  CompetitorFeedResponse,
  ContentTypeFilter,
  DateRangePreset,
  SortOption,
  CompetitorSearchFilters,
  InferredNiche,
  SearchDerivedMetrics,
  CompetitorVideoResult,
  SearchEvent,
  SearchCursor,
  DiscoveryListType,
  DiscoveryFilters,
  DiscoveredNiche,
  SampleVideo,
  SearchMode,
  DiscoverCompetitorsInput,
  DiscoverCompetitorsResult,
  SearchCompetitorsInput,
  AnalyzeVideoInput,
  GetMoreFromChannelInput,
} from "./types";

// Schemas
export {
  DiscoverBodySchema,
  SearchBodySchema,
  VideoParamsSchema,
  VideoQuerySchema,
  MoreFromChannelParamsSchema,
  MoreFromChannelQuerySchema,
} from "./schemas";

// Use-cases
export { discoverCompetitors } from "./use-cases/discoverCompetitors";
export { searchCompetitors } from "./use-cases/searchCompetitors";
export { analyzeVideo } from "./use-cases/analyzeVideo";
export { getMoreFromChannel } from "./use-cases/getMoreFromChannel";
export type { GetMoreFromChannelDeps } from "./use-cases/getMoreFromChannel";
