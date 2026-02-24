// Schemas
export {
  AuditParamsSchema,
  AuditQuerySchema,
  ChannelInsightsBodySchema,
  OverviewQuerySchema,
  RecommendationsBodySchema,
} from "./schemas";

// Types
export type {
  ChannelInsightsDeps,
  ChannelInsightsInput,
  GetOverviewDeps,
  RecommendationsDeps,
  RunAuditDeps,
} from "./types";
export type {
  ActionableInsight,
  ChannelOverviewResult,
  InsightVideoInput,
  OverviewDailyRow,
  TrendMetric,
  VideoPublishMarker,
} from "./types";

// Errors
export { ChannelAuditError } from "./errors";

// Use-cases
export { computeActionableInsights } from "./use-cases/computeActionableInsights";
export { computeTrends } from "./use-cases/computeBaseline";
export {
  buildVideoSummary,
  generateChannelInsights,
} from "./use-cases/generateChannelInsights";
export { generateLlmRecommendations } from "./use-cases/generateRecommendations";
export { getChannelOverview } from "./use-cases/getChannelOverview";
export { runChannelAudit } from "./use-cases/runChannelAudit";
