/**
 * GET /api/cron/refresh-opportunities
 *
 * Cron job (every 4 hours) that computes opportunity gaps:
 * 1. Fetch trending topics from SerpAPI
 * 2. Bulk keyword volume lookup via DataForSEO
 * 3. Fetch Google Trends interest data via DataForSEO
 * 4. Compute gap scores and cache result
 *
 * Protected by CRON_SECRET header.
 */

import { getTrendingNow } from "@/lib/adapters/serpapi/client";
import { fetchBulkKeywordVolume, fetchGoogleTrends, type GoogleTrendsResponse } from "@/lib/dataforseo";
import { computeOpportunityGaps } from "@/lib/features/trending/compute-gaps";
import { trendingCacheExpiresAt } from "@/lib/shared/cache-ttl";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const log = createLogger({ module: "cron/refresh-opportunities" });

const LOCK_WINDOW_MS = 5 * 60 * 1000; // 5 minutes — skip if recently refreshed

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Lock check: skip if recently refreshed (prevents Vercel double-fire)
    const existing = await prisma.trendingCache.findUnique({
      where: { key: "opportunities" },
      select: { updatedAt: true },
    });
    if (existing && Date.now() - existing.updatedAt.getTime() < LOCK_WINDOW_MS) {
      log.info("Skipped — recently refreshed", { lastUpdate: existing.updatedAt.toISOString() });
      return Response.json({ ok: true, skipped: true, reason: "recently_refreshed" });
    }

    // Step 1: Fetch trending topics (bypass in-memory cache)
    const topics = await getTrendingNow("US", true);
    if (topics.length === 0) {
      log.warn("No trending topics returned from SerpAPI");
      return Response.json({ ok: true, keywordCount: 0, reason: "no_topics" });
    }

    // Step 2: Extract keywords (topic queries + related queries)
    const allKeywords = new Set<string>();
    for (const topic of topics) {
      allKeywords.add(topic.query.toLowerCase());
      for (const rq of topic.relatedQueries) {
        allKeywords.add(rq.toLowerCase());
      }
    }
    const keywords = [...allKeywords].slice(0, 50);

    // Step 3: Bulk keyword volume + difficulty lookup
    const metrics = await fetchBulkKeywordVolume(keywords, "us", 25_000);

    // Step 4: Fetch Google Trends for top keywords by volume (batches of 5)
    const trendsMap = new Map<string, GoogleTrendsResponse>();
    const sortedByVolume = [...metrics]
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 20);

    // Fetch trends in batches of 5 (DataForSEO limit) — sequential to avoid rate limits
    for (let i = 0; i < sortedByVolume.length; i += 5) {
      const batch = sortedByVolume.slice(i, i + 5);
      const promises = batch.map(async (m) => {
        try {
          const trends = await fetchGoogleTrends({ keyword: m.keyword, location: "us" });
          if (trends && !trends.pending) {
            trendsMap.set(m.keyword.toLowerCase(), trends);
          }
        } catch (error) {
          log.warn("Trends fetch failed for keyword", {
            keyword: m.keyword,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
      await Promise.all(promises);
    }

    // Step 5: Compute gap scores
    const gaps = computeOpportunityGaps(topics, metrics, trendsMap);

    // Step 6: Upsert cache
    const expiresAt = trendingCacheExpiresAt();
    const cachePayload = structuredClone(gaps);
    await prisma.trendingCache.upsert({
      where: { key: "opportunities" },
      create: {
        key: "opportunities",
        data: cachePayload,
        expiresAt,
      },
      update: {
        data: cachePayload,
        expiresAt,
      },
    });

    const duration = Date.now() - startTime;
    log.info("Cron completed", {
      keywordCount: keywords.length,
      metricsCount: metrics.length,
      trendsCount: trendsMap.size,
      gapCount: gaps.length,
      durationMs: duration,
    });

    return Response.json({
      ok: true,
      keywordCount: keywords.length,
      gapCount: gaps.length,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error("Cron failed", {
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });

    return Response.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 },
    );
  }
}
