import "server-only";

import type { KeywordMetrics, GoogleTrendsResponse } from "@/lib/dataforseo";

// ============================================
// TYPES
// ============================================

export type TrendMomentum = "hot" | "rising" | "steady";

export type OpportunityGap = {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  competition: number;
  gapScore: number;
  trendMomentum: TrendMomentum;
  category: string;
  trendData: number[];
  articles: Array<{ title: string; source: string; url: string }>;
};

type TrendingTopicInput = {
  query: string;
  formattedTraffic: string;
  relatedQueries: string[];
  articles: Array<{ title: string; source: string; url: string }>;
};

// ============================================
// GAP SCORE COMPUTATION
// ============================================

/**
 * Gap Score Algorithm:
 *
 *   gapScore = normalize(volume) * (1 - normalize(difficulty)) * momentumBoost
 *
 * Normalization is computed once across the full result set.
 * Category filtering on the client hides cards — does not recompute scores.
 *
 * Momentum classification from Google Trends averageInterest:
 *   hot:     averageInterest > 75  (high recent interest)
 *   rising:  averageInterest 30-75
 *   steady:  averageInterest < 30
 */

const MOMENTUM_BOOST: Record<TrendMomentum, number> = {
  hot: 1.5,
  rising: 1.2,
  steady: 1.0,
};

function classifyMomentum(averageInterest: number): TrendMomentum {
  if (averageInterest > 75) return "hot";
  if (averageInterest >= 30) return "rising";
  return "steady";
}

function normalize(values: number[]): number[] {
  const max = Math.max(...values);
  if (max === 0) return values.map(() => 0);
  return values.map((v) => v / max);
}

/**
 * Compute opportunity gaps from trending topics + keyword metrics + trends data.
 *
 * @param topics - Trending topics from SerpAPI getTrendingNow()
 * @param metrics - Keyword volume/difficulty from DataForSEO fetchBulkKeywordVolume()
 * @param trendsMap - Google Trends data keyed by keyword from DataForSEO fetchGoogleTrends()
 */
export function computeOpportunityGaps(
  topics: TrendingTopicInput[],
  metrics: KeywordMetrics[],
  trendsMap: Map<string, GoogleTrendsResponse>,
): OpportunityGap[] {
  // Build lookup: keyword → metrics
  const metricsMap = new Map<string, KeywordMetrics>();
  for (const m of metrics) {
    metricsMap.set(m.keyword.toLowerCase(), m);
  }

  // Build lookup: query → topic (for articles)
  const topicMap = new Map<string, TrendingTopicInput>();
  for (const t of topics) {
    topicMap.set(t.query.toLowerCase(), t);
  }

  // Collect all keywords that have metrics
  const candidates: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    competition: number;
    category: string;
    trendData: number[];
    momentum: TrendMomentum;
    articles: Array<{ title: string; source: string; url: string }>;
  }> = [];

  for (const m of metrics) {
    if (m.searchVolume <= 0) continue;

    const kw = m.keyword.toLowerCase();
    const trends = trendsMap.get(kw);
    const topic = topicMap.get(kw);

    const averageInterest = trends?.averageInterest ?? 0;
    const trendData = trends?.interestOverTime?.map((p) => p.value) ?? [];
    const momentum = classifyMomentum(averageInterest);

    // Use first category name from DataForSEO, default to "General"
    const category = m.categories && m.categories.length > 0
      ? String(m.categories[0])
      : "General";

    candidates.push({
      keyword: m.keyword,
      volume: m.searchVolume,
      difficulty: m.difficultyEstimate,
      competition: m.competition,
      category,
      trendData,
      momentum,
      articles: topic?.articles ?? [],
    });
  }

  if (candidates.length === 0) return [];

  // Normalization guard: if <3 results, use raw percentile scales (0-100)
  const useRawScales = candidates.length < 3;

  const volumes = candidates.map((c) => c.volume);
  const difficulties = candidates.map((c) => c.difficulty);

  const normVolumes = useRawScales
    ? volumes.map((v) => Math.min(v / 100_000, 1)) // Cap at 100K as "max"
    : normalize(volumes);

  const normDifficulties = useRawScales
    ? difficulties.map((d) => d / 100) // Already 0-100 scale
    : normalize(difficulties);

  const gaps: OpportunityGap[] = candidates.map((c, i) => {
    const boost = MOMENTUM_BOOST[c.momentum];
    const rawScore = normVolumes[i]! * (1 - normDifficulties[i]!) * boost;
    const gapScore = Math.round(Math.min(rawScore * 100, 100));

    return {
      keyword: c.keyword,
      searchVolume: c.volume,
      keywordDifficulty: c.difficulty,
      competition: c.competition,
      gapScore,
      trendMomentum: c.momentum,
      category: c.category,
      trendData: c.trendData,
      articles: c.articles,
    };
  });

  // Sort by gap score descending
  gaps.sort((a, b) => b.gapScore - a.gapScore);

  return gaps;
}
