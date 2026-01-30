/**
 * Competitive Context Module
 *
 * Fetches competitive insights for videos using DataForSEO APIs:
 * - Search rankings for videos (where do they rank for key terms?)
 * - Topic trend analysis (is the topic rising or falling?)
 * - Similar video context
 *
 * Server-only module for enriching video insights with market context.
 */

import "server-only";
import { fetchYouTubeSerp } from "./youtube-serp";
import { fetchGoogleTrends } from "./client";
import { logger } from "@/lib/logger";

// ============================================
// TYPES
// ============================================

export type CompetitiveContext = {
  searchRankings: Array<{
    term: string;
    position: number | null;
    expectedCtr: number; // Based on position
    actualCtr: number;
  }> | null;
  topicTrends: {
    trend: "rising" | "falling" | "stable";
    recentInterest: number; // 0-100 from Google Trends
  } | null;
  similarVideos: Array<{
    videoId: string;
    title: string;
    views: number | null;
    publishedDate: string | null;
  }> | null;
};

type FetchCompetitiveContextOptions = {
  videoId: string;
  title: string;
  tags: string[];
  searchTerms: Array<{ term: string; views: number }>;
  totalViews: number;
};

// ============================================
// CTR EXPECTATIONS BY POSITION
// ============================================

/**
 * Expected CTR by search position (rough industry averages)
 * Based on YouTube search behavior studies
 */
const EXPECTED_CTR_BY_POSITION: Record<number, number> = {
  1: 20.0,
  2: 15.0,
  3: 12.0,
  4: 10.0,
  5: 8.0,
  6: 6.5,
  7: 5.5,
  8: 4.5,
  9: 4.0,
  10: 3.5,
  11: 3.0,
  12: 2.5,
  13: 2.2,
  14: 2.0,
  15: 1.8,
  16: 1.6,
  17: 1.4,
  18: 1.2,
  19: 1.1,
  20: 1.0,
};

function getExpectedCtr(position: number): number {
  if (position <= 20) {
    return EXPECTED_CTR_BY_POSITION[position] ?? 1.0;
  }
  // Beyond position 20, assume diminishing returns
  return Math.max(0.5, 1.0 - (position - 20) * 0.05);
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Fetch competitive context for a video
 *
 * This is called during the summary generation to provide market context.
 * It's rate-limited by DataForSEO costs, so we:
 * - Only check top 3 search terms
 * - Only fetch trends for main topic
 * - Cache aggressively (via DataForSEO cache layer)
 */
export async function fetchCompetitiveContext(
  options: FetchCompetitiveContextOptions,
): Promise<CompetitiveContext> {
  const { videoId, title, tags, searchTerms, totalViews } = options;

  // Run all fetches in parallel (but with graceful failures)
  const [searchRankings, topicTrends, similarVideos] = await Promise.all([
    fetchSearchRankings(videoId, searchTerms.slice(0, 3), totalViews).catch(
      (err) => {
        logger.warn("[CompetitiveContext] Search rankings failed:", err);
        return null;
      },
    ),
    fetchTopicTrends(title, tags).catch((err) => {
      logger.warn("[CompetitiveContext] Topic trends failed:", err);
      return null;
    }),
    fetchSimilarVideos(searchTerms[0]?.term, videoId).catch((err) => {
      logger.warn("[CompetitiveContext] Similar videos failed:", err);
      return null;
    }),
  ]);

  return {
    searchRankings,
    topicTrends,
    similarVideos,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find where the video ranks for given search terms
 */
async function fetchSearchRankings(
  videoId: string,
  searchTerms: Array<{ term: string; views: number }>,
  totalViews: number,
): Promise<CompetitiveContext["searchRankings"]> {
  if (!searchTerms || searchTerms.length === 0) {
    return null;
  }

  const rankings = await Promise.all(
    searchTerms.map(async ({ term, views }) => {
      try {
        const serp = await fetchYouTubeSerp({
          keyword: term,
          location: "us",
          limit: 20, // Only check first 20 positions
        });

        // Find our video in the results
        const result = serp.results.find((r) => r.videoId === videoId);
        const position = result?.position ?? null;
        const expectedCtr = position ? getExpectedCtr(position) : 0;

        // Calculate actual CTR from this search term
        // Assume views from this term / impressions (estimated from views * avg CTR)
        const actualCtr = totalViews > 0 ? (views / totalViews) * 100 : 0;

        return {
          term,
          position,
          expectedCtr,
          actualCtr,
        };
      } catch (err) {
        logger.warn("[SearchRankings] Failed:", { term, error: err });
        return {
          term,
          position: null,
          expectedCtr: 0,
          actualCtr: 0,
        };
      }
    }),
  );

  return rankings.filter((r) => r !== null);
}

/**
 * Analyze topic trend using Google Trends
 */
async function fetchTopicTrends(
  title: string,
  tags: string[],
): Promise<CompetitiveContext["topicTrends"]> {
  // Extract main topic from title or tags
  // Use first tag or extract key phrase from title
  const mainTopic = tags[0] || extractMainTopicFromTitle(title);

  if (!mainTopic || mainTopic.length < 3) {
    return null;
  }

  try {
    const trends = await fetchGoogleTrends({
      keyword: mainTopic,
      location: "us",
    });

    if (!trends.interestOverTime || trends.interestOverTime.length === 0) {
      return null;
    }

    const data = trends.interestOverTime;

    if (data.length < 2) {
      return null;
    }

    // Calculate trend direction from recent data
    const recentData = data.slice(-8); // Last 8 data points
    const avgRecent =
      recentData.reduce((sum: number, d) => sum + (d.value ?? 0), 0) /
      recentData.length;
    const avgOlder =
      data
        .slice(0, Math.min(8, data.length - 8))
        .reduce((sum: number, d) => sum + (d.value ?? 0), 0) /
      Math.min(8, data.length - 8);

    // Determine trend
    let trend: "rising" | "falling" | "stable";
    const changePct =
      avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder) * 100 : 0;

    if (changePct > 15) {
      trend = "rising";
    } else if (changePct < -15) {
      trend = "falling";
    } else {
      trend = "stable";
    }

    // Recent interest is the average of last few data points
    const recentInterest = Math.round(avgRecent);

    return {
      trend,
      recentInterest,
    };
  } catch (err) {
    logger.warn("[TopicTrends] Failed:", { topic: mainTopic, error: err });
    return null;
  }
}

/**
 * Fetch similar videos for the top search term
 */
async function fetchSimilarVideos(
  topSearchTerm: string | undefined,
  excludeVideoId: string,
): Promise<CompetitiveContext["similarVideos"]> {
  if (!topSearchTerm) {
    return null;
  }

  try {
    const serp = await fetchYouTubeSerp({
      keyword: topSearchTerm,
      location: "us",
      limit: 10,
    });

    // Filter out the current video and return top competitors
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
  } catch (err) {
    logger.warn("[SimilarVideos] Failed:", { term: topSearchTerm, error: err });
    return null;
  }
}

/**
 * Extract main topic from title
 * Simple heuristic: remove common stopwords and take first few meaningful words
 */
function extractMainTopicFromTitle(title: string): string {
  const stopwords = new Set([
    "how",
    "to",
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "for",
    "with",
    "about",
    "as",
    "by",
    "from",
    "of",
    "i",
    "you",
    "we",
    "why",
    "what",
    "when",
    "where",
    "is",
    "are",
    "was",
    "were",
    "be",
    "this",
    "that",
    "these",
    "those",
    "my",
    "your",
    "our",
    "their",
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  // Take first 2-3 meaningful words
  return words.slice(0, 3).join(" ");
}
