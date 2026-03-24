import "server-only";

import crypto from "crypto";

import {
  getKeywordsForKeywordsTask,
  type KeywordMetrics,
  postKeywordsForKeywordsTask,
} from "@/lib/adapters/dataforseo/client";
import { fetchYouTubeSerp } from "@/lib/adapters/dataforseo/youtube-serp";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const log = createLogger({ module: "fetchNicheKeywords" });

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STALE_SERVE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const POLL_MAX_MS = 8000;
const POLL_INTERVALS = [500, 1000, 2000, 3000];

// ── Types ───────────────────────────────────────────────────

export type NicheKeyword = {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunityScore: number;
  competitionLevel: string | null;
  trendDirection: "rising" | "stable" | "declining";
  intent: string | null;
  youtubeValidated: boolean;
  youtubeGapScore: number | null; // high volume + few/poor YouTube results = high opportunity
  youtubeResultCount: number | null;
  seasonalPeak: number | null; // month (1-12) when searches peak, null if flat
  monthlySearches: Array<{ year: number; month: number; searchVolume: number }>;
};

type FetchNicheKeywordsInput = {
  userId: number;
  channelId: number;
};

// ── YouTube autocomplete ────────────────────────────────────

async function fetchYouTubeAutocomplete(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&hl=en`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];

    const text = await res.text();
    // Response is JSONP: window.google.ac.h([...])
    const match = text.match(/\[.*\]/s);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as [string, Array<[string]>];
    return (parsed[1] ?? []).map((item) => item[0].toLowerCase());
  } catch {
    return [];
  }
}

async function validateKeywordsAgainstYouTube(
  keywords: NicheKeyword[],
  seedQueries: string[],
): Promise<NicheKeyword[]> {
  // Get YouTube autocomplete suggestions for each seed query
  const suggestions = await Promise.all(
    seedQueries.slice(0, 5).map((q) => fetchYouTubeAutocomplete(q)),
  );
  const ytSuggestions = new Set(suggestions.flat());

  // Mark keywords that appear in YouTube suggestions
  return keywords.map((kw) => ({
    ...kw,
    youtubeValidated: ytSuggestions.has(kw.keyword.toLowerCase()) ||
      [...ytSuggestions].some((s) => s.includes(kw.keyword.toLowerCase()) || kw.keyword.toLowerCase().includes(s)),
  }));
}

// ── Scoring ─────────────────────────────────────────────────

function computeOpportunityScore(volume: number, difficulty: number): number {
  return volume / (difficulty + 1);
}

function computeTrendDirection(trend: number[]): "rising" | "stable" | "declining" {
  if (trend.length < 6) return "stable";
  const recent = trend.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const prior = trend.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
  if (prior === 0) return recent > 0 ? "rising" : "stable";
  const change = (recent - prior) / prior;
  if (change > 0.1) return "rising";
  if (change < -0.1) return "declining";
  return "stable";
}

function detectSeasonalPeak(monthlySearches: Array<{ month: number; searchVolume: number }>): number | null {
  if (monthlySearches.length < 6) return null;
  const avg = monthlySearches.reduce((s, m) => s + m.searchVolume, 0) / monthlySearches.length;
  if (avg === 0) return null;

  let peakMonth = 0;
  let peakRatio = 0;
  for (const m of monthlySearches) {
    const ratio = m.searchVolume / avg;
    if (ratio > peakRatio) {
      peakRatio = ratio;
      peakMonth = m.month;
    }
  }
  // Only report a peak if it's >30% above average (clear seasonality)
  return peakRatio > 1.3 ? peakMonth : null;
}

function metricsToNicheKeyword(m: KeywordMetrics): NicheKeyword {
  return {
    keyword: m.keyword,
    searchVolume: m.searchVolume,
    difficulty: m.difficultyEstimate,
    opportunityScore: computeOpportunityScore(m.searchVolume, m.difficultyEstimate),
    competitionLevel: m.competitionLevel,
    trendDirection: computeTrendDirection(m.trend),
    intent: m.intent,
    youtubeValidated: false,
    youtubeGapScore: null,
    youtubeResultCount: null,
    seasonalPeak: detectSeasonalPeak(m.monthlySearches),
    monthlySearches: m.monthlySearches,
  };
}

// ── YouTube SERP gap analysis (Expansion 2) ─────────────────

async function enrichWithYouTubeGap(keywords: NicheKeyword[]): Promise<NicheKeyword[]> {
  // Check top 3 keywords against YouTube SERP (parallel, capped)
  const top3 = keywords.slice(0, 3);

  const serpResults = await Promise.allSettled(
    top3.map((kw) =>
      fetchYouTubeSerp({ keyword: kw.keyword, limit: 10 }).catch(() => null),
    ),
  );

  for (let i = 0; i < top3.length; i++) {
    const result = serpResults[i];
    if (result.status !== "fulfilled" || !result.value) continue;

    const serp = result.value;
    const resultCount = serp.totalResults;
    // Gap score: high Google volume but few/poor YouTube results
    // Score = searchVolume / (resultCount + 1) — higher = bigger gap
    const gapScore = top3[i].searchVolume / (Math.min(resultCount, 100) + 1);

    // Find this keyword in the full list and update
    const idx = keywords.findIndex((k) => k.keyword === top3[i].keyword);
    if (idx >= 0) {
      keywords[idx] = {
        ...keywords[idx],
        youtubeGapScore: Math.round(gapScore),
        youtubeResultCount: resultCount,
      };
    }
  }

  log.info("YouTube SERP gap analysis complete", {
    checked: top3.length,
    withGapScores: keywords.filter((k) => k.youtubeGapScore !== null).length,
  });

  return keywords;
}

// ── Cache ───────────────────────────────────────────────────

function buildCacheKey(channelId: number, seedQueries: string[]): string {
  const sorted = [...seedQueries].sort().join(",");
  return crypto.createHash("sha256").update(`${channelId}:${sorted}`).digest("hex");
}

async function getCachedKeywords(requestHash: string): Promise<{
  keywords: NicheKeyword[] | null;
  isStale: boolean;
}> {
  const row = await prisma.keywordCache.findFirst({
    where: {
      provider: "dataforseo",
      mode: "niche_opportunities",
      requestHash,
    },
    orderBy: { fetchedAt: "desc" },
  });

  if (!row) return { keywords: null, isStale: false };

  const keywords = row.responseJson as unknown as NicheKeyword[];
  const now = new Date();

  if (row.expiresAt > now) {
    return { keywords, isStale: false };
  }

  // Stale but within 7-day window
  const staleLimit = new Date(row.fetchedAt.getTime() + STALE_SERVE_MS);
  if (staleLimit > now) {
    return { keywords, isStale: true };
  }

  return { keywords: null, isStale: false };
}

async function cacheKeywords(
  requestHash: string,
  channelId: number,
  keywords: NicheKeyword[],
): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
  await prisma.keywordCache.upsert({
    where: {
      provider_mode_requestHash: {
        provider: "dataforseo",
        mode: "niche_opportunities",
        requestHash,
      },
    },
    update: {
      responseJson: keywords as unknown as object,
      fetchedAt: new Date(),
      expiresAt,
    },
    create: {
      provider: "dataforseo",
      mode: "niche_opportunities",
      phrase: `channel:${channelId}`,
      database: "us",
      requestHash,
      responseJson: keywords as unknown as object,
      expiresAt,
    },
  });
}

// ── DataForSEO fetch ────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFromDataForSEO(seedQueries: string[]): Promise<KeywordMetrics[]> {
  const { taskId } = await postKeywordsForKeywordsTask({
    keywords: seedQueries,
    location: "us",
    limit: 100,
  });

  const startTime = Date.now();
  let attemptIndex = 0;

  while (Date.now() - startTime < POLL_MAX_MS) {
    const waitTime = POLL_INTERVALS[attemptIndex] ?? POLL_INTERVALS.at(-1) ?? 3000;
    await sleep(waitTime);

    const result = await getKeywordsForKeywordsTask(taskId);

    if (result.status === "completed") {
      log.info("DataForSEO K4K completed", {
        taskId,
        keywordsReturned: result.data?.length ?? 0,
        waitMs: Date.now() - startTime,
      });
      return result.data ?? [];
    }

    if (result.status === "error") {
      log.warn("DataForSEO K4K error", { taskId, error: result.error });
      return [];
    }

    attemptIndex++;
  }

  log.warn("DataForSEO K4K poll timeout", { taskId, waitMs: Date.now() - startTime });
  return [];
}

// ── Two-tier filtering ──────────────────────────────────────

function filterKeywords(keywords: NicheKeyword[]): NicheKeyword[] {
  // Tier 1: strict
  const tier1 = keywords.filter((k) => k.searchVolume >= 100 && k.difficulty <= 70);
  if (tier1.length >= 5) {
    return tier1.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 15);
  }

  // Tier 2: relaxed
  const tier2 = keywords.filter((k) => k.searchVolume >= 10 && k.difficulty <= 85);
  return tier2.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 15);
}

// ── Response validation ─────────────────────────────────────

function validateResponse(metrics: KeywordMetrics[]): boolean {
  if (metrics.length === 0) return false;
  const hasVolume = metrics.some((m) => m.searchVolume > 0);
  if (!hasVolume) {
    log.warn("DataForSEO returned all-zero search volumes — possible API schema change");
  }
  return hasVolume;
}

// ── Main entry point ────────────────────────────────────────

export async function fetchNicheKeywords(
  input: FetchNicheKeywordsInput,
): Promise<NicheKeyword[]> {
  const { channelId } = input;

  try {
    // 1. Get seed queries from ChannelNiche
    const channelNiche = await prisma.channelNiche.findUnique({
      where: { channelId },
      select: { queriesJson: true },
    });

    if (!channelNiche?.queriesJson) {
      log.info("No niche queries for keyword fetch", { channelId });
      return [];
    }

    const seedQueries = channelNiche.queriesJson as string[];
    if (!Array.isArray(seedQueries) || seedQueries.length === 0) return [];

    // 2. Check cache
    const requestHash = buildCacheKey(channelId, seedQueries);
    const cached = await getCachedKeywords(requestHash);

    if (cached.keywords && !cached.isStale) {
      log.info("Keyword cache hit", { channelId, count: cached.keywords.length });
      return cached.keywords;
    }

    // 3. Fetch from DataForSEO
    const metrics = await fetchFromDataForSEO(seedQueries.slice(0, 10));

    // 4. Validate response
    if (!validateResponse(metrics)) {
      if (cached.keywords) {
        log.info("Serving stale keyword cache after validation failure", { channelId });
        return cached.keywords;
      }
      return [];
    }

    // 5. Convert, score, filter
    let keywords = metrics.map(metricsToNicheKeyword);
    keywords = filterKeywords(keywords);

    // 6. Validate against YouTube autocomplete
    keywords = await validateKeywordsAgainstYouTube(keywords, seedQueries.slice(0, 5));

    // 7. YouTube SERP gap analysis (top 3 keywords, parallel)
    keywords = await enrichWithYouTubeGap(keywords);

    // Sort: YouTube-validated first, then by opportunity score
    keywords.sort((a, b) => {
      if (a.youtubeValidated !== b.youtubeValidated) {
        return a.youtubeValidated ? -1 : 1;
      }
      return b.opportunityScore - a.opportunityScore;
    });

    // 8. Cache
    await cacheKeywords(requestHash, channelId, keywords);

    log.info("Fetched niche keywords", {
      channelId,
      total: metrics.length,
      filtered: keywords.length,
      youtubeValidated: keywords.filter((k) => k.youtubeValidated).length,
      withGapScores: keywords.filter((k) => k.youtubeGapScore !== null).length,
      withSeasonalPeaks: keywords.filter((k) => k.seasonalPeak !== null).length,
    });

    return keywords;
  } catch (err) {
    log.warn("fetchNicheKeywords failed", {
      channelId,
      error: err instanceof Error ? err.message : String(err),
    });

    // Try stale cache as last resort
    try {
      const channelNiche = await prisma.channelNiche.findUnique({
        where: { channelId },
        select: { queriesJson: true },
      });
      if (channelNiche?.queriesJson) {
        const seeds = channelNiche.queriesJson as string[];
        const hash = buildCacheKey(channelId, seeds);
        const stale = await getCachedKeywords(hash);
        if (stale.keywords) {
          log.info("Serving stale keywords after error", { channelId });
          return stale.keywords;
        }
      }
    } catch {
      // Double failure — give up
    }

    return [];
  }
}
