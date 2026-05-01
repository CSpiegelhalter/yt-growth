/**
 * Per-niche keyword pool for the dashboard creator brief.
 *
 * Calls DataForSEO `fetchRelatedKeywords` seeded with the niche's phrase to
 * get 50+ real related keywords (each with search volume, difficulty, and a
 * 12-month trend series). Scores them, returns the top N as BriefAnchor[]
 * with momentum derived from the trend slope.
 *
 * Cached for 24h per niche via TrendingCache row `niche-keywords:<niche>`.
 * The first dashboard visitor to pick a niche pays the DataForSEO cost
 * (~1-3s) and seeds the cache for everyone after them.
 */
import "server-only";

import { fetchRelatedKeywords, type RelatedKeywordRow } from "@/lib/dataforseo";
import type { BriefAnchor } from "@/lib/llm";
import { trendingCacheExpiresAt } from "@/lib/shared/cache-ttl";
import { logger } from "@/lib/shared/logger";
import { getSeedPhraseForNiche } from "@/lib/shared/niche-categories";
import { prisma } from "@/prisma";

const POOL_SIZE = 12;
const FETCH_LIMIT = 50;

function cacheKeyForNiche(niche: string): string {
  return `niche-keywords:${niche}`;
}

/**
 * Compare a `tail` average to a `head` average of the trend series and
 * project to the brief's momentum tags.
 */
function classifyMomentum(trend: number[] | undefined): BriefAnchor["trendMomentum"] {
  if (!trend || trend.length < 4) {return "steady";}
  const window = Math.max(2, Math.floor(trend.length / 4));
  const head = trend.slice(0, window).reduce((a, b) => a + b, 0) / window;
  const tail = trend.slice(-window).reduce((a, b) => a + b, 0) / window;
  if (head === 0) {return tail > 0 ? "rising" : "steady";}
  const ratio = tail / head;
  if (ratio >= 1.5) {return "hot";}
  if (ratio >= 1.15) {return "rising";}
  return "steady";
}

const MOMENTUM_BOOST: Record<BriefAnchor["trendMomentum"], number> = {
  hot: 1.5,
  rising: 1.2,
  steady: 1,
};

/**
 * Score a related-keyword row for inclusion in the anchor pool. Mirrors the
 * compute-gaps formula but operates on a single row so we can rank across
 * the whole DFS result set.
 *
 *   score = volume × (1 - difficulty/100) × momentumBoost
 */
function scoreRow(row: RelatedKeywordRow): number {
  const volume = Math.max(0, row.searchVolume);
  const difficulty = Math.min(100, Math.max(0, row.difficultyEstimate));
  const momentum = classifyMomentum(row.trend);
  return volume * (1 - difficulty / 100) * MOMENTUM_BOOST[momentum];
}

function rowToAnchor(row: RelatedKeywordRow): BriefAnchor {
  return {
    keyword: row.keyword,
    searchVolume: Math.max(0, row.searchVolume),
    keywordDifficulty: Math.round(Math.min(100, Math.max(0, row.difficultyEstimate))),
    trendMomentum: classifyMomentum(row.trend),
    ...(row.trend && row.trend.length > 1 && { trendData: row.trend }),
  };
}

async function readFreshCache(niche: string): Promise<BriefAnchor[] | null> {
  const cached = await prisma.trendingCache.findUnique({
    where: { key: cacheKeyForNiche(niche) },
  });
  if (!cached || cached.expiresAt.getTime() <= Date.now()) {return null;}
  const data = cached.data as unknown as { anchors?: BriefAnchor[] } | null;
  return Array.isArray(data?.anchors) ? data!.anchors : null;
}

async function writeCache(niche: string, anchors: BriefAnchor[]): Promise<void> {
  const expiresAt = trendingCacheExpiresAt();
  try {
    await prisma.trendingCache.upsert({
      where: { key: cacheKeyForNiche(niche) },
      create: {
        key: cacheKeyForNiche(niche),
        data: { anchors } as unknown as object,
        expiresAt,
      },
      update: {
        data: { anchors } as unknown as object,
        expiresAt,
      },
    });
  } catch (error) {
    logger.warn("niche_keywords.cache_write_failed", {
      niche,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get the per-niche anchor pool. Returns [] when the niche is unknown or
 * the upstream fetch fails — never fabricates anchors.
 */
export async function getNicheKeywords(niche: string): Promise<BriefAnchor[]> {
  const cached = await readFreshCache(niche);
  if (cached) {return cached;}

  const seed = getSeedPhraseForNiche(niche);
  if (!seed) {return [];}

  let rows: RelatedKeywordRow[];
  try {
    const response = await fetchRelatedKeywords({ phrase: seed, limit: FETCH_LIMIT });
    rows = response.rows;
  } catch (error) {
    logger.warn("niche_keywords.fetch_failed", {
      niche,
      seed,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }

  const anchors = rows
    .filter((r) => r.searchVolume > 0)
    .map((r) => ({ row: r, score: scoreRow(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, POOL_SIZE)
    .map(({ row }) => rowToAnchor(row));

  // Cache empty results too — protects against hammering DFS when a niche
  // genuinely has no useful pool. Refreshes after the 24h TTL.
  await writeCache(niche, anchors);
  return anchors;
}
