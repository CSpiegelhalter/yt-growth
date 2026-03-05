/**
 * Competitive Context Use-Case
 *
 * Fetches competitive insights for videos:
 * - Search rankings for videos (where do they rank for key terms?)
 * - Topic trend analysis (is the topic rising or falling?)
 * - Similar video context
 *
 * Business logic lives here; I/O delegated to DataForSeoPort.
 */

import type {
  CompetitiveContextInput,
  CompetitiveContextResult,
  DataForSeoPort,
  SearchRanking,
  SimilarVideo,
  TopicTrend,
  YouTubeSerpResult,
} from "@/lib/ports/DataForSeoPort";
import { logger } from "@/lib/shared/logger";

// ============================================
// CTR EXPECTATIONS BY POSITION
// ============================================

/**
 * Expected CTR by search position (rough industry averages)
 * Based on YouTube search behavior studies
 */
const EXPECTED_CTR_BY_POSITION: Record<number, number> = {
  1: 20,
  2: 15,
  3: 12,
  4: 10,
  5: 8,
  6: 6.5,
  7: 5.5,
  8: 4.5,
  9: 4,
  10: 3.5,
  11: 3,
  12: 2.5,
  13: 2.2,
  14: 2,
  15: 1.8,
  16: 1.6,
  17: 1.4,
  18: 1.2,
  19: 1.1,
  20: 1,
};

function getExpectedCtr(position: number): number {
  if (position <= 20) {
    return EXPECTED_CTR_BY_POSITION[position] ?? 1;
  }
  return Math.max(0.5, 1 - (position - 20) * 0.05);
}

// ============================================
// TOPIC EXTRACTION
// ============================================

const STOPWORDS = new Set([
  "how", "to", "the", "a", "an", "and", "or", "but", "in", "on", "at",
  "for", "with", "about", "as", "by", "from", "of", "i", "you", "we",
  "why", "what", "when", "where", "is", "are", "was", "were", "be",
  "this", "that", "these", "those", "my", "your", "our", "their",
]);

/**
 * Extract main topic from title.
 * Simple heuristic: remove common stopwords and take first few meaningful words.
 */
function extractMainTopicFromTitle(title: string): string {
  const words = title
    .toLowerCase()
    .replaceAll(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  return words.slice(0, 3).join(" ");
}

// ============================================
// TREND ANALYSIS
// ============================================

/**
 * Determine trend direction from interest-over-time data points.
 * Returns null if insufficient data.
 */
function analyzeTrendDirection(
  dataPoints: Array<{ value: number | null }>,
): TopicTrend | null {
  if (dataPoints.length < 2) {
    return null;
  }

  const recentData = dataPoints.slice(-8);
  const avgRecent =
    recentData.reduce((sum, d) => sum + (d.value ?? 0), 0) /
    recentData.length;

  const olderSlice = dataPoints.slice(0, Math.min(8, dataPoints.length - 8));
  if (olderSlice.length === 0) {
    return { trend: "stable", recentInterest: Math.round(avgRecent) };
  }

  const avgOlder =
    olderSlice.reduce((sum, d) => sum + (d.value ?? 0), 0) / olderSlice.length;

  const changePct =
    avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder) * 100 : 0;

  let trend: "rising" | "falling" | "stable";
  if (changePct > 15) {
    trend = "rising";
  } else if (changePct < -15) {
    trend = "falling";
  } else {
    trend = "stable";
  }

  return {
    trend,
    recentInterest: Math.round(avgRecent),
  };
}

// ============================================
// MAIN USE-CASE
// ============================================

type CompetitiveContextPort = Pick<DataForSeoPort, "getYouTubeSerp" | "getTrends">;

/**
 * Fetch competitive context for a video.
 *
 * Rate-limited by DataForSEO costs, so we:
 * - Only check top 3 search terms
 * - Only fetch trends for main topic
 * - Cache aggressively (via DataForSEO cache layer)
 */
export async function fetchCompetitiveContext(
  input: CompetitiveContextInput,
  port: CompetitiveContextPort,
): Promise<CompetitiveContextResult> {
  const { videoId, title, tags, searchTerms, totalViews } = input;

  // Run search rankings and topic trends in parallel
  const [rankingsResult, topicTrends] = await Promise.all([
    fetchSearchRankings(videoId, searchTerms.slice(0, 3), totalViews, port).catch(
      (error) => {
        logger.warn("[CompetitiveContext] Search rankings failed:", error);
        return null;
      },
    ),
    fetchTopicTrends(title, tags, port).catch((error) => {
      logger.warn("[CompetitiveContext] Topic trends failed:", error);
      return null;
    }),
  ]);

  // Reuse the first search term's SERP result for similar videos (avoids duplicate API call)
  const similarVideos = await extractSimilarVideos(
    searchTerms[0]?.term,
    videoId,
    port,
    rankingsResult?.firstSerp,
  ).catch((error) => {
    logger.warn("[CompetitiveContext] Similar videos failed:", error);
    return null;
  });

  return {
    searchRankings: rankingsResult?.rankings ?? null,
    topicTrends,
    similarVideos,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface SearchRankingsResult {
  rankings: SearchRanking[];
  firstSerp: YouTubeSerpResult | null;
}

async function fetchSearchRankings(
  videoId: string,
  searchTerms: Array<{ term: string; views: number }>,
  totalViews: number,
  port: CompetitiveContextPort,
): Promise<SearchRankingsResult | null> {
  if (!searchTerms || searchTerms.length === 0) {
    return null;
  }

  let firstSerp: YouTubeSerpResult | null = null;

  const rankings = await Promise.all(
    searchTerms.map(async ({ term, views }, index) => {
      try {
        const serp = await port.getYouTubeSerp({
          keyword: term,
          region: "us",
          limit: 20,
        });

        if (index === 0) {
          firstSerp = serp;
        }

        const result = serp.results.find((r) => r.videoId === videoId);
        const position = result?.position ?? null;
        const expectedCtr = position ? getExpectedCtr(position) : 0;
        const actualCtr = totalViews > 0 ? (views / totalViews) * 100 : 0;

        return {
          term,
          position,
          expectedCtr,
          actualCtr,
        };
      } catch (error) {
        logger.warn("[SearchRankings] Failed:", { term, error });
        return {
          term,
          position: null,
          expectedCtr: 0,
          actualCtr: 0,
        };
      }
    }),
  );

  return {
    rankings: rankings.filter((r) => r !== null),
    firstSerp,
  };
}

async function fetchTopicTrends(
  title: string,
  tags: string[],
  port: CompetitiveContextPort,
): Promise<TopicTrend | null> {
  const mainTopic = tags[0] || extractMainTopicFromTitle(title);

  if (!mainTopic || mainTopic.length < 3) {
    return null;
  }

  try {
    const trends = await port.getTrends({
      keyword: mainTopic,
      region: "us",
    });

    return analyzeTrendDirection(trends.interestOverTime);
  } catch (error) {
    logger.warn("[TopicTrends] Failed:", { topic: mainTopic, error });
    return null;
  }
}

async function extractSimilarVideos(
  topSearchTerm: string | undefined,
  excludeVideoId: string,
  port: CompetitiveContextPort,
  prefetchedSerp?: YouTubeSerpResult | null,
): Promise<SimilarVideo[] | null> {
  if (!topSearchTerm) {
    return null;
  }

  try {
    // Reuse pre-fetched SERP from search rankings; fall back to fresh fetch
    const serp = prefetchedSerp ?? await port.getYouTubeSerp({
      keyword: topSearchTerm,
      region: "us",
      limit: 10,
    });

    const similar = serp.results
      .filter((r) => r.videoId !== excludeVideoId)
      .slice(0, 5)
      .map((r) => ({
        videoId: r.videoId,
        title: r.title,
        views: r.views,
        publishedDate: r.publishedDate,
      }));

    return similar.length > 0 ? similar : null;
  } catch (error) {
    logger.warn("[SimilarVideos] Failed:", { term: topSearchTerm, error });
    return null;
  }
}
