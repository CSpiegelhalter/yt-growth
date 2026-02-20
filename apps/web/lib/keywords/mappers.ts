/**
 * Legacy response mappers for keyword research endpoints.
 *
 * These map from the DataForSEO domain types to the response shape
 * the UI currently expects. Both /api/keywords/research and
 * /api/keywords/task/:id share these mappers.
 */

import type { KeywordMetrics, RelatedKeywordRow } from "@/lib/dataforseo";

export function mapToLegacyOverviewRow(metrics: KeywordMetrics) {
  return {
    keyword: metrics.keyword,
    searchVolume: metrics.searchVolume,
    keywordDifficulty: metrics.difficultyEstimate,
    cpc: metrics.cpc,
    competition: metrics.competition,
    competitionIndex: metrics.competitionIndex,
    competitionLevel: metrics.competitionLevel,
    lowTopOfPageBid: metrics.lowTopOfPageBid,
    highTopOfPageBid: metrics.highTopOfPageBid,
    resultsCount: 0,
    trend: metrics.trend,
    monthlySearches: metrics.monthlySearches,
    intent: metrics.intent,
    spellingCorrectedFrom: metrics.spellingCorrectedFrom,
    difficultyIsEstimate: true as const,
  };
}

export function mapToLegacyRelatedRow(row: RelatedKeywordRow) {
  return {
    keyword: row.keyword,
    searchVolume: row.searchVolume,
    keywordDifficulty: row.difficultyEstimate,
    cpc: row.cpc,
    competition: row.competition,
    competitionIndex: row.competitionIndex,
    competitionLevel: row.competitionLevel,
    lowTopOfPageBid: row.lowTopOfPageBid,
    highTopOfPageBid: row.highTopOfPageBid,
    resultsCount: 0,
    trend: row.trend,
    monthlySearches: row.monthlySearches,
    relevance: row.relevance,
    difficultyIsEstimate: true as const,
  };
}
