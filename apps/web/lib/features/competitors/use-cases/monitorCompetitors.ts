import "server-only";

import { fetchNicheKeywords } from "@/lib/features/suggestions/use-cases/fetchNicheKeywords";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const log = createLogger({ module: "monitorCompetitors" });

const YOUTUBE_RSS_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=";
const BATCH_SIZE = 10;
const BREAKOUT_MULTIPLIER = 3;

type RSSVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  channelId: string;
};

/**
 * Parse YouTube RSS feed for a channel. Returns recent video IDs.
 * RSS is free (no API quota) and gives us the latest ~15 videos.
 */
async function fetchRSSVideos(ytChannelId: string): Promise<RSSVideo[]> {
  const response = await fetch(`${YOUTUBE_RSS_URL}${ytChannelId}`, {
    headers: { Accept: "application/xml" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    log.warn("RSS fetch failed", { ytChannelId, status: response.status });
    return [];
  }

  const xml = await response.text();

  const entries: RSSVideo[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>(.*?)<\/title>/)?.[1];
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1];

    if (videoId && title) {
      entries.push({
        videoId,
        title: decodeXMLEntities(title),
        publishedAt: published ?? new Date().toISOString(),
        channelId: ytChannelId,
      });
    }
  }

  return entries;
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Fetch video stats from YouTube Data API for a batch of video IDs.
 * Uses API key (no OAuth needed for public data).
 */
async function fetchVideoStatsBatch(
  videoIds: string[],
): Promise<Map<string, { viewCount: number; likeCount: number; commentCount: number }>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || videoIds.length === 0) return new Map();

  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(",")}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    log.warn("YouTube stats API failed", { status: response.status });
    return new Map();
  }

  const data = (await response.json()) as {
    items?: Array<{
      id: string;
      statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }>;
  };

  const statsMap = new Map<string, { viewCount: number; likeCount: number; commentCount: number }>();

  for (const item of data.items ?? []) {
    statsMap.set(item.id, {
      viewCount: parseInt(item.statistics?.viewCount ?? "0", 10),
      likeCount: parseInt(item.statistics?.likeCount ?? "0", 10),
      commentCount: parseInt(item.statistics?.commentCount ?? "0", 10),
    });
  }

  return statsMap;
}

type MonitorResult = {
  competitorsProcessed: number;
  newVideosFound: number;
  breakoutsDetected: number;
  errors: number;
};

/**
 * Monitor all active saved competitors for new videos.
 * Runs as a cron job. Uses RSS + API in batches.
 */
export async function monitorCompetitors(): Promise<MonitorResult> {
  const result: MonitorResult = {
    competitorsProcessed: 0,
    newVideosFound: 0,
    breakoutsDetected: 0,
    errors: 0,
  };

  // Get distinct active saved competitors
  const competitors = await prisma.savedCompetitor.findMany({
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      channelId: true,
      ytChannelId: true,
      channelTitle: true,
      lastProcessedVideoId: true,
    },
    distinct: ["ytChannelId"],
  });

  if (competitors.length === 0) {
    log.info("No active competitors to monitor");
    return result;
  }

  log.info("Starting competitor monitoring", { totalCompetitors: competitors.length });

  // Process in batches of 10
  for (let i = 0; i < competitors.length; i += BATCH_SIZE) {
    const batch = competitors.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (competitor) => {
        try {
          return await processCompetitor(competitor);
        } catch (err) {
          log.warn("Failed to process competitor", {
            ytChannelId: competitor.ytChannelId,
            channelTitle: competitor.channelTitle,
            error: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      }),
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        result.competitorsProcessed++;
        result.newVideosFound += r.value.newVideos;
        result.breakoutsDetected += r.value.breakouts;
      } else {
        result.errors++;
      }
    }
  }

  // Pre-warm keyword cache for active channels
  const channelIds = [...new Set(competitors.map((c) => ({ userId: c.userId, channelId: c.channelId })))];
  const uniqueChannels = channelIds.filter((c, i, arr) =>
    arr.findIndex((x) => x.channelId === c.channelId) === i,
  );

  log.info("Pre-warming keyword cache", { channels: uniqueChannels.length });
  await Promise.allSettled(
    uniqueChannels.map((c) =>
      fetchNicheKeywords(c).catch((err) => {
        log.warn("Keyword pre-warm failed", {
          channelId: c.channelId,
          error: err instanceof Error ? err.message : String(err),
        });
      }),
    ),
  );

  log.info("Competitor monitoring complete", result);
  return result;
}

async function processCompetitor(competitor: {
  id: string;
  userId: number;
  channelId: number;
  ytChannelId: string;
  channelTitle: string;
  lastProcessedVideoId: string | null;
}): Promise<{ newVideos: number; breakouts: number }> {
  // 1. Fetch RSS
  const rssVideos = await fetchRSSVideos(competitor.ytChannelId);
  if (rssVideos.length === 0) return { newVideos: 0, breakouts: 0 };

  // 2. Find new videos since last processed
  let newVideos = rssVideos;
  if (competitor.lastProcessedVideoId) {
    const lastIdx = rssVideos.findIndex((v) => v.videoId === competitor.lastProcessedVideoId);
    if (lastIdx > 0) {
      newVideos = rssVideos.slice(0, lastIdx);
    } else if (lastIdx === 0) {
      return { newVideos: 0, breakouts: 0 };
    }
  }

  if (newVideos.length === 0) return { newVideos: 0, breakouts: 0 };

  // 3. Fetch stats for new videos
  const videoIds = newVideos.map((v) => v.videoId);
  const statsMap = await fetchVideoStatsBatch(videoIds);

  // 4. Get niche average for breakout detection
  const nicheAvg = await getNicheAverageViewsPerDay(competitor.userId, competitor.channelId);

  // 5. Upsert videos and snapshots, detect breakouts
  let breakouts = 0;

  for (const video of newVideos) {
    const stats = statsMap.get(video.videoId);
    const daysSincePublished = Math.max(
      1,
      (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    const viewsPerDay = (stats?.viewCount ?? 0) / daysSincePublished;
    const isBreakout = nicheAvg > 0 && viewsPerDay > nicheAvg * BREAKOUT_MULTIPLIER;

    if (isBreakout) {
      breakouts++;
      log.info("Breakout detected", {
        videoId: video.videoId,
        title: video.title,
        viewsPerDay: Math.round(viewsPerDay),
        nicheAvg: Math.round(nicheAvg),
        multiplier: (viewsPerDay / nicheAvg).toFixed(1),
      });
    }

    // Upsert CompetitorVideo
    await prisma.competitorVideo.upsert({
      where: { videoId: video.videoId },
      update: {
        lastFetchedAt: new Date(),
      },
      create: {
        videoId: video.videoId,
        title: video.title,
        channelId: video.channelId,
        channelTitle: competitor.channelTitle,
        publishedAt: new Date(video.publishedAt),
        thumbnailUrl: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
      },
    });

    // Create snapshot with stats
    if (stats) {
      await prisma.competitorVideoSnapshot.create({
        data: {
          videoId: video.videoId,
          viewCount: stats.viewCount,
          likeCount: stats.likeCount,
          commentCount: stats.commentCount,
        },
      });
    }
  }

  // 6. Update idempotency guard
  await prisma.savedCompetitor.updateMany({
    where: { ytChannelId: competitor.ytChannelId, isActive: true },
    data: { lastProcessedVideoId: newVideos[0].videoId },
  });

  log.info("Processed competitor", {
    ytChannelId: competitor.ytChannelId,
    channelTitle: competitor.channelTitle,
    newVideos: newVideos.length,
    breakouts,
  });

  return { newVideos: newVideos.length, breakouts };
}

async function getNicheAverageViewsPerDay(userId: number, channelId: number): Promise<number> {
  // Get saved competitor channel IDs
  const savedCompetitors = await prisma.savedCompetitor.findMany({
    where: { userId, channelId, isActive: true },
    select: { ytChannelId: true },
  });

  if (savedCompetitors.length === 0) return 0;

  const ytChannelIds = savedCompetitors.map((sc) => sc.ytChannelId);

  // Get recent snapshots from those channels' videos
  const recentSnapshots = await prisma.competitorVideoSnapshot.findMany({
    where: {
      Video: {
        channelId: { in: ytChannelIds },
      },
    },
    select: {
      viewCount: true,
      Video: {
        select: { publishedAt: true },
      },
    },
    take: 50,
    orderBy: { capturedAt: "desc" },
  });

  if (recentSnapshots.length === 0) return 0;

  const viewsPerDayValues = recentSnapshots.map((s) => {
    const days = Math.max(1, (Date.now() - s.Video.publishedAt.getTime()) / (1000 * 60 * 60 * 24));
    return s.viewCount / days;
  });

  return viewsPerDayValues.reduce((sum, v) => sum + v, 0) / viewsPerDayValues.length;
}
