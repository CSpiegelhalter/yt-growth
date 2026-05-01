import "server-only";

import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import type { OpportunityGap } from "./compute-gaps";

const log = createLogger({ module: "trending/competitor-overlap" });

const MAX_COMPETITOR_VIDEOS = 100;

export type CompetitorMatch = {
  videoId: string;
  title: string;
  channelTitle: string;
};

export type EnrichedGap = OpportunityGap & {
  competitorMatches: {
    count: number;
    videos: CompetitorMatch[];
  };
};

/**
 * Enrich opportunity gaps with competitor overlap data.
 * For each gap keyword, check if any of the user's saved competitors
 * have published videos matching the keyword (by title or tags).
 *
 * Capped at 100 most recent competitor videos to bound query time.
 */
export async function enrichWithCompetitorOverlap(
  gaps: OpportunityGap[],
  userId: number,
  channelId: number,
): Promise<EnrichedGap[]> {
  if (gaps.length === 0) return [];

  try {
    // Get competitor channel IDs for this user
    const savedCompetitors = await prisma.savedCompetitor.findMany({
      where: { userId, channelId, isActive: true },
      select: { ytChannelId: true },
    });

    if (savedCompetitors.length === 0) {
      return gaps.map((g) => ({ ...g, competitorMatches: { count: 0, videos: [] } }));
    }

    const competitorChannelIds = savedCompetitors.map((c) => c.ytChannelId);

    // Fetch recent competitor videos
    const competitorVideos = await prisma.competitorVideo.findMany({
      where: { channelId: { in: competitorChannelIds } },
      select: {
        videoId: true,
        title: true,
        channelTitle: true,
        tags: true,
      },
      orderBy: { publishedAt: "desc" },
      take: MAX_COMPETITOR_VIDEOS,
    });

    if (competitorVideos.length === 0) {
      return gaps.map((g) => ({ ...g, competitorMatches: { count: 0, videos: [] } }));
    }

    // For each gap keyword, find matching competitor videos
    return gaps.map((gap) => {
      const kwLower = gap.keyword.toLowerCase();
      const kwWords = kwLower.split(/\s+/);

      const matches: CompetitorMatch[] = [];
      for (const video of competitorVideos) {
        const titleLower = video.title.toLowerCase();
        const tagsLower = (video.tags ?? []).map((t) => t.toLowerCase());

        // Match: title contains keyword, OR any tag matches keyword
        const titleMatch = kwWords.length <= 3
          ? titleLower.includes(kwLower)
          : kwWords.every((w) => titleLower.includes(w));
        const tagMatch = tagsLower.some((t) => t.includes(kwLower) || kwLower.includes(t));

        if (titleMatch || tagMatch) {
          matches.push({
            videoId: video.videoId,
            title: video.title,
            channelTitle: video.channelTitle,
          });
        }
      }

      return {
        ...gap,
        competitorMatches: {
          count: matches.length,
          videos: matches.slice(0, 5),
        },
      };
    });
  } catch (err) {
    // Degrade gracefully — return gaps without overlap data
    log.warn("Competitor overlap enrichment failed", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return gaps.map((g) => ({ ...g, competitorMatches: { count: 0, videos: [] } }));
  }
}
