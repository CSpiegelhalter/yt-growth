import "server-only";

import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import type { NicheKeywordForContext } from "../types";

const log = createLogger({ module: "competitorKeywordGaps" });

export type KeywordGap = {
  keyword: string;
  source: "competitor_covers" | "uncovered_opportunity";
  competitorCount: number;
  searchVolume: number | null;
  difficulty: number | null;
};

/**
 * Extract meaningful keyword phrases from competitor video titles.
 * Tokenizes titles, removes stop words, produces 2-3 word phrases.
 */
function extractKeywordsFromTitles(titles: string[]): Map<string, number> {
  const stopWords = new Set([
    "a", "an", "the", "is", "it", "in", "on", "at", "to", "for", "of", "and",
    "or", "but", "not", "with", "this", "that", "my", "your", "how", "what",
    "why", "when", "who", "i", "you", "we", "they", "he", "she", "do", "did",
    "does", "was", "were", "will", "can", "could", "would", "should", "just",
    "all", "so", "if", "no", "yes", "get", "got", "have", "has", "had", "be",
    "been", "am", "are", "from", "by", "about", "into", "out", "up", "down",
    "new", "old", "big", "more", "most", "very", "really", "ever", "every",
  ]);

  const phraseCount = new Map<string, number>();

  for (const title of titles) {
    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    // Generate 2-word and 3-word phrases
    for (let len = 2; len <= 3; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(" ");
        phraseCount.set(phrase, (phraseCount.get(phrase) ?? 0) + 1);
      }
    }

    // Also include significant single words (4+ chars)
    for (const w of words) {
      if (w.length >= 4) {
        phraseCount.set(w, (phraseCount.get(w) ?? 0) + 1);
      }
    }
  }

  return phraseCount;
}

/**
 * Find keyword gaps between competitor content and the user's keyword opportunities.
 *
 * Returns two types of gaps:
 * 1. Keywords competitors cover frequently that the user hasn't targeted
 * 2. High-opportunity keywords that NO competitor covers well
 */
export async function findCompetitorKeywordGaps(input: {
  userId: number;
  channelId: number;
  nicheKeywords: NicheKeywordForContext[];
}): Promise<KeywordGap[]> {
  const { userId, channelId, nicheKeywords } = input;

  try {
    // Get saved competitors
    const savedCompetitors = await prisma.savedCompetitor.findMany({
      where: { userId, channelId, isActive: true },
      select: { ytChannelId: true },
    });

    if (savedCompetitors.length === 0) return [];

    const competitorChannelIds = savedCompetitors.map((sc) => sc.ytChannelId);

    // Get competitor video titles from CompetitorVideo table
    const competitorVideos = await prisma.competitorVideo.findMany({
      where: { channelId: { in: competitorChannelIds } },
      select: { title: true },
      take: 100,
      orderBy: { publishedAt: "desc" },
    });

    if (competitorVideos.length === 0) return [];

    const titles = competitorVideos.map((v) => v.title);
    const competitorPhrases = extractKeywordsFromTitles(titles);

    // Get user's own video titles for comparison
    const userVideos = await prisma.video.findMany({
      where: { channelId },
      select: { title: true },
      take: 30,
      orderBy: { publishedAt: "desc" },
    });
    const userPhrases = extractKeywordsFromTitles(
      userVideos.map((v) => v.title ?? "").filter(Boolean),
    );

    const gaps: KeywordGap[] = [];
    const nicheKwSet = new Map(nicheKeywords.map((k) => [k.keyword.toLowerCase(), k]));

    // Type 1: Keywords competitors cover that user doesn't
    for (const [phrase, count] of competitorPhrases) {
      if (count < 2) continue; // Must appear in 2+ competitor videos
      if (userPhrases.has(phrase)) continue; // User already covers this

      const nicheMatch = nicheKwSet.get(phrase);
      gaps.push({
        keyword: phrase,
        source: "competitor_covers",
        competitorCount: count,
        searchVolume: nicheMatch?.searchVolume ?? null,
        difficulty: nicheMatch?.difficulty ?? null,
      });
    }

    // Type 2: High-opportunity keywords no competitor covers
    for (const kw of nicheKeywords) {
      const lower = kw.keyword.toLowerCase();
      const competitorCovers = [...competitorPhrases.keys()].some(
        (p) => p.includes(lower) || lower.includes(p),
      );
      if (!competitorCovers && kw.opportunityScore > 100) {
        gaps.push({
          keyword: kw.keyword,
          source: "uncovered_opportunity",
          competitorCount: 0,
          searchVolume: kw.searchVolume,
          difficulty: kw.difficulty,
        });
      }
    }

    // Sort: uncovered opportunities first, then by search volume
    gaps.sort((a, b) => {
      if (a.source !== b.source) {
        return a.source === "uncovered_opportunity" ? -1 : 1;
      }
      return (b.searchVolume ?? 0) - (a.searchVolume ?? 0);
    });

    log.info("Competitor keyword gap analysis", {
      channelId,
      competitorVideos: titles.length,
      competitorPhrases: competitorPhrases.size,
      gaps: gaps.length,
      uncovered: gaps.filter((g) => g.source === "uncovered_opportunity").length,
    });

    return gaps.slice(0, 10);
  } catch (err) {
    log.warn("Competitor keyword gap analysis failed", {
      channelId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
