/**
 * YouTube Data API and Analytics API helpers
 *
 * Uses stored Google OAuth tokens to make authenticated requests.
 * Includes fixture data for demos/tests (disabled by default).
 */
import { prisma } from "@/prisma";
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";

const YOUTUBE_DATA_API = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2";

// Fixtures should NOT run during normal local development when testing live data.
// They are only enabled explicitly via DEMO_MODE, or in NODE_ENV=test (e.g. CI).
const USE_FIXTURES =
  process.env.DEMO_MODE === "1" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
  (process.env.TEST_MODE === "1" && process.env.NODE_ENV === "test");

type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

/**
 * Decode HTML entities in strings from YouTube API responses.
 * YouTube returns titles/descriptions with encoded entities like &#39; &amp; etc.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Get Google account for a user.
 * If youtubeChannelId is provided, returns the specific GoogleAccount that owns that channel.
 * Otherwise returns the first GoogleAccount for the user (fallback behavior).
 */
export async function getGoogleAccount(
  userId: number,
  youtubeChannelId?: string
): Promise<GoogleAccount | null> {
  // If a channel ID is provided, look up the specific GoogleAccount for that channel
  if (youtubeChannelId) {
    const channel = await prisma.channel.findFirst({
      where: { userId, youtubeChannelId },
      select: { googleAccountId: true },
    });

    if (channel?.googleAccountId) {
      const ga = await prisma.googleAccount.findUnique({
        where: { id: channel.googleAccountId },
      });
      if (ga) return ga;
    }
  }

  // Fallback: return first GoogleAccount for user
  const ga = await prisma.googleAccount.findFirst({ where: { userId } });
  if (ga) return ga;

  // In YT_MOCK_MODE we don't need a real Google account/token because requests are mocked
  // at the transport layer. Return a dummy object so API routes can proceed.
  if (process.env.YT_MOCK_MODE === "1") {
    return { id: 0, refreshTokenEnc: "mock", tokenExpiresAt: null };
  }

  return null;
}

/**
 * Fetch videos for a channel (last N uploads)
 */
export async function fetchChannelVideos(
  ga: GoogleAccount,
  channelId: string,
  maxResults: number = 25
): Promise<YouTubeVideo[]> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeVideos(channelId);
  }

  // First get the uploads playlist ID
  const channelUrl = new URL(`${YOUTUBE_DATA_API}/channels`);
  channelUrl.searchParams.set("part", "contentDetails");
  channelUrl.searchParams.set("id", channelId);

  const channelData = await googleFetchWithAutoRefresh<{
    items: Array<{
      contentDetails: {
        relatedPlaylists: { uploads: string };
      };
    }>;
  }>(ga, channelUrl.toString());

  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist for channel");
  }

  // Fetch videos from uploads playlist
  const playlistUrl = new URL(`${YOUTUBE_DATA_API}/playlistItems`);
  playlistUrl.searchParams.set("part", "snippet,contentDetails");
  playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
  playlistUrl.searchParams.set("maxResults", String(Math.min(50, maxResults)));

  const playlistData = await googleFetchWithAutoRefresh<{
    items: Array<{
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        thumbnails: { high?: { url: string }; default?: { url: string } };
      };
      contentDetails: { videoId: string };
    }>;
  }>(ga, playlistUrl.toString());

  const videoIds =
    playlistData.items?.map((i) => i.contentDetails.videoId) ?? [];
  if (videoIds.length === 0) return [];

  // Fetch video details (duration, tags)
  const videosUrl = new URL(`${YOUTUBE_DATA_API}/videos`);
  videosUrl.searchParams.set("part", "contentDetails,snippet,statistics");
  videosUrl.searchParams.set("id", videoIds.join(","));

  const videosData = await googleFetchWithAutoRefresh<{
    items: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        tags?: string[];
        thumbnails: { high?: { url: string }; default?: { url: string } };
      };
      contentDetails: { duration: string };
      statistics: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
      };
    }>;
  }>(ga, videosUrl.toString());

  return (videosData.items ?? []).map((v) => ({
    videoId: v.id,
    title: decodeHtmlEntities(v.snippet.title),
    description: decodeHtmlEntities(v.snippet.description),
    publishedAt: v.snippet.publishedAt,
    durationSec: parseDuration(v.contentDetails.duration),
    tags: v.snippet.tags?.join(",") ?? null,
    thumbnailUrl:
      v.snippet.thumbnails?.high?.url ??
      v.snippet.thumbnails?.default?.url ??
      null,
    views: parseInt(v.statistics.viewCount ?? "0", 10),
    likes: parseInt(v.statistics.likeCount ?? "0", 10),
    comments: parseInt(v.statistics.commentCount ?? "0", 10),
  }));
}

/**
 * Fetch video metrics from YouTube Analytics API
 */
export async function fetchVideoMetrics(
  ga: GoogleAccount,
  channelId: string,
  videoIds: string[],
  startDate: string,
  endDate: string
): Promise<VideoMetricsData[]> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeMetrics(videoIds);
  }

  const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
  url.searchParams.set("ids", `channel==${channelId}`);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set(
    "metrics",
    "views,likes,comments,shares,subscribersGained,subscribersLost,estimatedMinutesWatched,averageViewDuration,averageViewPercentage"
  );
  url.searchParams.set("dimensions", "video");
  url.searchParams.set("filters", `video==${videoIds.join(",")}`);
  url.searchParams.set("sort", "-views");

  const data = await googleFetchWithAutoRefresh<{
    columnHeaders: Array<{ name: string }>;
    rows: Array<Array<string | number>>;
  }>(ga, url.toString());

  if (!data.rows) return [];

  const headers = data.columnHeaders.map((h) => h.name);
  return data.rows.map((row) => {
    const obj: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return {
      videoId: String(obj.video),
      views: Number(obj.views ?? 0),
      likes: Number(obj.likes ?? 0),
      comments: Number(obj.comments ?? 0),
      shares: Number(obj.shares ?? 0),
      subscribersGained: Number(obj.subscribersGained ?? 0),
      subscribersLost: Number(obj.subscribersLost ?? 0),
      estimatedMinutesWatched: Number(obj.estimatedMinutesWatched ?? 0),
      averageViewDuration: Number(obj.averageViewDuration ?? 0),
      averageViewPercentage: Number(obj.averageViewPercentage ?? 0),
    };
  });
}

/**
 * Fetch retention curve for a video
 */
export async function fetchRetentionCurve(
  ga: GoogleAccount,
  channelId: string,
  videoId: string
): Promise<RetentionPoint[]> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeRetention(videoId);
  }

  // YouTube Analytics returns audience retention as percentage values at intervals
  const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
  url.searchParams.set("ids", `channel==${channelId}`);
  url.searchParams.set("startDate", "2020-01-01");
  url.searchParams.set("endDate", new Date().toISOString().split("T")[0]);
  url.searchParams.set("metrics", "audienceWatchRatio");
  url.searchParams.set("dimensions", "elapsedVideoTimeRatio");
  url.searchParams.set("filters", `video==${videoId}`);
  url.searchParams.set("sort", "elapsedVideoTimeRatio");

  const data = await googleFetchWithAutoRefresh<{
    columnHeaders: Array<{ name: string }>;
    rows: Array<[number, number]>;
  }>(ga, url.toString());

  if (!data.rows) return [];

  return data.rows.map(([elapsedRatio, audienceWatchRatio]) => ({
    elapsedRatio,
    audienceWatchRatio,
  }));
}

/**
 * Search for competitor videos by keyword
 */
export async function searchCompetitorVideos(
  ga: GoogleAccount,
  query: string,
  maxResults: number = 50
): Promise<CompetitorVideo[]> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeCompetitors(query);
  }

  // Cache expensive search.list calls (100 units) for 24h.
  // Keyed by query string (normalized) so multiple pages can reuse it.
  const normalizedQuery = query.trim().toLowerCase();
  const now = new Date();
  const cacheTtlMs = 24 * 60 * 60 * 1000;
  if (normalizedQuery) {
    const cacheModel = (prisma as any).youTubeSearchCache;
    const cached = cacheModel?.findUnique
      ? await cacheModel.findUnique({
          where: {
            kind_query: { kind: "video", query: normalizedQuery },
          },
        })
      : null;
    if (cached && cached.cachedUntil > now) {
      const items = (cached.responseJson as unknown as CompetitorVideo[]) ?? [];
      return items.slice(0, maxResults);
    }
  }

  const url = new URL(`${YOUTUBE_DATA_API}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  // Fetch up to 50 once; slice for callers.
  url.searchParams.set(
    "maxResults",
    String(Math.min(50, Math.max(1, maxResults)))
  );
  url.searchParams.set("order", "viewCount");
  url.searchParams.set("relevanceLanguage", "en");

  const data = await googleFetchWithAutoRefresh<{
    items: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        publishedAt: string;
      };
    }>;
  }>(ga, url.toString());

  const mapped = (data.items ?? []).map((i) => ({
    videoId: i.id.videoId,
    title: decodeHtmlEntities(i.snippet.title),
    channelTitle: decodeHtmlEntities(i.snippet.channelTitle),
    publishedAt: i.snippet.publishedAt,
  }));

  // Write cache best-effort (ignore if migrations not applied yet)
  if (normalizedQuery) {
    const cachedUntil = new Date(now.getTime() + cacheTtlMs);
    try {
      const cacheModel = (prisma as any).youTubeSearchCache;
      if (cacheModel?.upsert) {
        await cacheModel.upsert({
          where: { kind_query: { kind: "video", query: normalizedQuery } },
          create: {
            kind: "video",
            query: normalizedQuery,
            responseJson: mapped as unknown as object,
            cachedUntil,
          },
          update: { responseJson: mapped as unknown as object, cachedUntil },
        });
      }
    } catch {
      // ignore
    }
  }

  return mapped.slice(0, maxResults);
}

/**
 * Search for channels similar to the given channel based on keywords
 */
export async function searchSimilarChannels(
  ga: GoogleAccount,
  keywords: string[],
  maxResults: number = 10
): Promise<SimilarChannelResult[]> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeSimilarChannels(keywords);
  }

  const query = keywords.slice(0, 3).join(" ");
  const normalizedQuery = query.trim().toLowerCase();
  const now = new Date();
  const cacheTtlMs = 24 * 60 * 60 * 1000;

  // Cache expensive search.list calls (100 units) for 24h.
  if (normalizedQuery) {
    const cacheModel = (prisma as any).youTubeSearchCache;
    const cached = cacheModel?.findUnique
      ? await cacheModel.findUnique({
          where: { kind_query: { kind: "channel", query: normalizedQuery } },
        })
      : null;
    if (cached && cached.cachedUntil > now) {
      const items =
        (cached.responseJson as unknown as SimilarChannelResult[]) ?? [];
      return items.slice(0, maxResults);
    }
  }

  const url = new URL(`${YOUTUBE_DATA_API}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "channel");
  url.searchParams.set("q", query);
  // Fetch up to 50 once; slice for callers.
  url.searchParams.set(
    "maxResults",
    String(Math.min(50, Math.max(1, maxResults)))
  );
  url.searchParams.set("relevanceLanguage", "en");

  const data = await googleFetchWithAutoRefresh<{
    items: Array<{
      id: { channelId: string };
      snippet: {
        title: string;
        description: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }>;
  }>(ga, url.toString());

  const mapped = (data.items ?? []).map((i) => ({
    channelId: i.id.channelId,
    channelTitle: decodeHtmlEntities(i.snippet.title),
    description: decodeHtmlEntities(i.snippet.description),
    thumbnailUrl:
      i.snippet.thumbnails?.medium?.url ??
      i.snippet.thumbnails?.default?.url ??
      null,
  }));

  if (normalizedQuery) {
    const cachedUntil = new Date(now.getTime() + cacheTtlMs);
    try {
      const cacheModel = (prisma as any).youTubeSearchCache;
      if (cacheModel?.upsert) {
        await cacheModel.upsert({
          where: { kind_query: { kind: "channel", query: normalizedQuery } },
          create: {
            kind: "channel",
            query: normalizedQuery,
            responseJson: mapped as unknown as object,
            cachedUntil,
          },
          update: { responseJson: mapped as unknown as object, cachedUntil },
        });
      }
    } catch {
      // ignore
    }
  }

  return mapped.slice(0, maxResults);
}

/**
 * Search for videos matching a niche query and extract unique channels.
 * This is more accurate for niche matching than channel search.
 */
export async function searchNicheVideos(
  ga: GoogleAccount,
  query: string,
  maxVideos: number = 25,
  pageToken?: string
): Promise<{
  videos: Array<{
    videoId: string;
    channelId: string;
    channelTitle: string;
    title: string;
    thumbnailUrl: string | null;
    publishedAt: string;
  }>;
  uniqueChannels: SimilarChannelResult[];
  nextPageToken?: string;
}> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    const fixtureChannels = getTestModeSimilarChannels(query.split("|"));
    return {
      videos: fixtureChannels.map((c) => ({
        videoId: `fixture-${c.channelId}`,
        channelId: c.channelId,
        channelTitle: c.channelTitle,
        title: `Fixture Video from ${c.channelTitle}`,
        thumbnailUrl: c.thumbnailUrl,
        publishedAt: new Date().toISOString(),
      })),
      uniqueChannels: fixtureChannels,
    };
  }

  const now = new Date();

  // Build the search URL with ACTUAL spaces in query (not encoded)
  // YouTube API handles unencoded spaces in the q parameter
  const baseUrl = `${YOUTUBE_DATA_API}/search`;
  const params = new URLSearchParams();
  params.set("part", "snippet");
  params.set("type", "video");
  params.set("maxResults", String(Math.min(50, maxVideos)));
  params.set("order", "relevance");
  params.set("regionCode", "US");
  params.set("relevanceLanguage", "en");
  // HD videos only for better quality
  params.set("videoDefinition", "high");
  // Only get videos from the last 6 months
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  params.set("publishedAfter", sixMonthsAgo.toISOString());

  // Add pageToken for pagination if provided
  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  // Build URL with query parameter with ACTUAL SPACES (not %20 or +)
  // The query is appended directly without encoding
  const url = `${baseUrl}?${params.toString()}&q=${query}`;

  console.log(`[YouTube Search] URL: ${url}`);

  const data = await googleFetchWithAutoRefresh<{
    items: Array<{
      id: { videoId: string };
      snippet: {
        channelId: string;
        channelTitle: string;
        title: string;
        publishedAt: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }>;
    nextPageToken?: string;
    prevPageToken?: string;
  }>(ga, url);

  // Don't store description - we'll fetch full description when analyzing specific video
  const videos = (data.items ?? []).map((i) => ({
    videoId: i.id.videoId,
    channelId: i.snippet.channelId,
    channelTitle: decodeHtmlEntities(i.snippet.channelTitle),
    title: decodeHtmlEntities(i.snippet.title),
    thumbnailUrl:
      i.snippet.thumbnails?.medium?.url ??
      i.snippet.thumbnails?.default?.url ??
      null,
    publishedAt: i.snippet.publishedAt,
  }));

  // Extract unique channels
  const channelMap = new Map<string, SimilarChannelResult>();
  videos.forEach((v) => {
    if (!channelMap.has(v.channelId)) {
      channelMap.set(v.channelId, {
        channelId: v.channelId,
        channelTitle: v.channelTitle,
        description: "", // Will be fetched later when analyzing specific video
        thumbnailUrl: null,
      });
    }
  });

  const result = {
    videos,
    uniqueChannels: Array.from(channelMap.values()),
    nextPageToken: data.nextPageToken,
  };

  // Note: Not caching video search results anymore since we use pageToken for pagination
  // The competitor feed cache handles caching at a higher level

  return result;
}

/**
 * Fetch channel statistics (subscriber count, view count, video count)
 */
export async function fetchChannelStats(
  ga: GoogleAccount,
  channelIds: string[]
): Promise<
  Map<
    string,
    { subscriberCount: number; viewCount: number; videoCount: number }
  >
> {
  const results = new Map<
    string,
    { subscriberCount: number; viewCount: number; videoCount: number }
  >();

  if (channelIds.length === 0) return results;

  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    channelIds.forEach((id, idx) => {
      // Generate realistic-ish subscriber counts for test mode
      const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      results.set(id, {
        subscriberCount: 1000 + (hash % 100000),
        viewCount: 10000 + (hash % 1000000),
        videoCount: 10 + (hash % 200),
      });
    });
    return results;
  }

  // Batch in groups of 50
  const batches: string[][] = [];
  for (let i = 0; i < channelIds.length; i += 50) {
    batches.push(channelIds.slice(i, i + 50));
  }

  for (const batch of batches) {
    const url = new URL(`${YOUTUBE_DATA_API}/channels`);
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", batch.join(","));

    try {
      const data = await googleFetchWithAutoRefresh<{
        items?: Array<{
          id: string;
          statistics: {
            subscriberCount?: string;
            viewCount?: string;
            videoCount?: string;
            hiddenSubscriberCount?: boolean;
          };
        }>;
      }>(ga, url.toString());

      for (const item of data.items ?? []) {
        const stats = item.statistics;
        if (!stats) continue; // Skip items without statistics

        results.set(item.id, {
          subscriberCount: stats.hiddenSubscriberCount
            ? 0
            : parseInt(stats.subscriberCount ?? "0", 10),
          viewCount: parseInt(stats.viewCount ?? "0", 10),
          videoCount: parseInt(stats.videoCount ?? "0", 10),
        });
      }
    } catch (err) {
      console.warn("Failed to fetch channel stats batch:", err);
    }
  }

  return results;
}

/**
 * Calculate target subscriber range for competitor discovery.
 * We want channels that are larger than the user but not unreachably large.
 * Minimum is always 20K subscribers to ensure quality content.
 * @param scaleFactor - Multiplier to look for larger channels (1 = normal, 2 = 2x bigger, etc.)
 */
export function getCompetitorSizeRange(
  userSubscribers: number,
  scaleFactor: number = 1
): {
  min: number;
  max: number;
  description: string;
} {
  // MINIMUM 20K subscribers regardless of user size - ensures quality competitors
  const ABSOLUTE_MIN_SUBS = 20000;

  // Base ranges scaled based on user's current size
  let min: number;
  let max: number;
  let baseDescription: string;

  if (userSubscribers < 1000) {
    min = 20000;
    max = 100000;
    baseDescription = "Established channels";
  } else if (userSubscribers < 10000) {
    min = 20000;
    max = 500000;
    baseDescription = "Growing channels";
  } else if (userSubscribers < 100000) {
    min = 50000;
    max = 1000000;
    baseDescription = "Established channels";
  } else {
    min = 100000;
    max = 5000000;
    baseDescription = "Large channels";
  }

  // Apply scale factor to find larger channels
  if (scaleFactor > 1) {
    min = Math.round(min * scaleFactor);
    max = Math.round(max * scaleFactor);
  }

  // Enforce absolute minimum
  min = Math.max(min, ABSOLUTE_MIN_SUBS);

  // Format subscriber counts for description
  const formatSubs = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return String(n);
  };

  const description = `${baseDescription} (${formatSubs(min)}-${formatSubs(
    max
  )} subs)`;

  return { min, max, description };
}

/**
 * Fetch recent videos from a channel (for similar channel analysis)
 */
export async function fetchRecentChannelVideos(
  ga: GoogleAccount,
  channelId: string,
  publishedAfter: string,
  maxResults: number = 10
): Promise<RecentVideoResult[]> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeRecentVideos(channelId);
  }

  // Cache per-channel video fetches for 24h to avoid repeated API calls.
  // Normalize publishedAfter to date only (YYYY-MM-DD) for stable cache keys.
  const publishedAfterDate = publishedAfter.split("T")[0];
  const cacheKey = `${channelId}:${publishedAfterDate}`;
  const now = new Date();
  const cacheTtlMs = 24 * 60 * 60 * 1000;

  const cacheModel = (prisma as any).youTubeSearchCache;
  if (cacheModel?.findUnique) {
    try {
      const cached = await cacheModel.findUnique({
        where: { kind_query: { kind: "channelVideos", query: cacheKey } },
      });
      if (cached && cached.cachedUntil > now) {
        const items =
          (cached.responseJson as unknown as RecentVideoResult[]) ?? [];
        return items.slice(0, maxResults);
      }
    } catch {
      // ignore cache read errors
    }
  }

  // IMPORTANT: Do NOT use search.list here (100 quota units/call).
  // Instead use the channel uploads playlist (cheap) then fetch stats.
  const publishedAfterMs = new Date(publishedAfter).getTime();

  // 1) Get uploads playlist id
  const channelUrl = new URL(`${YOUTUBE_DATA_API}/channels`);
  channelUrl.searchParams.set("part", "contentDetails");
  channelUrl.searchParams.set("id", channelId);

  const channelData = await googleFetchWithAutoRefresh<{
    items: Array<{
      contentDetails: { relatedPlaylists: { uploads: string } };
    }>;
  }>(ga, channelUrl.toString());

  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    // Extremely rare, but if we can't resolve the uploads playlist, fall back to search.list.
    // This preserves usefulness, but costs more quota (search.list = 100 units/call).
    const url = new URL(`${YOUTUBE_DATA_API}/search`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("publishedAfter", publishedAfter);
    url.searchParams.set("order", "viewCount");
    url.searchParams.set("maxResults", String(Math.min(25, maxResults)));

    const searchData = await googleFetchWithAutoRefresh<{
      items: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          publishedAt: string;
          thumbnails: { medium?: { url: string }; default?: { url: string } };
        };
      }>;
    }>(ga, url.toString());

    const videoIds = searchData.items?.map((i) => i.id.videoId) ?? [];
    if (videoIds.length === 0) return [];

    const videosUrl = new URL(`${YOUTUBE_DATA_API}/videos`);
    videosUrl.searchParams.set("part", "statistics");
    videosUrl.searchParams.set("id", videoIds.join(","));

    const statsData = await googleFetchWithAutoRefresh<{
      items: Array<{ id: string; statistics: { viewCount: string } }>;
    }>(ga, videosUrl.toString());

    const statsMap = new Map<string, number>();
    (statsData.items ?? []).forEach((item) => {
      statsMap.set(item.id, parseInt(item.statistics.viewCount ?? "0", 10));
    });

    const fallbackResult = (searchData.items ?? []).map((i) => {
      const views = statsMap.get(i.id.videoId) ?? 0;
      const publishedAt = i.snippet.publishedAt;
      const daysSince = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      return {
        videoId: i.id.videoId,
        title: decodeHtmlEntities(i.snippet.title),
        publishedAt,
        thumbnailUrl:
          i.snippet.thumbnails?.medium?.url ??
          i.snippet.thumbnails?.default?.url ??
          null,
        views,
        viewsPerDay: Math.round(views / daysSince),
      };
    });

    // Write fallback result to cache
    if (cacheModel?.upsert) {
      const cachedUntil = new Date(now.getTime() + cacheTtlMs);
      try {
        await cacheModel.upsert({
          where: { kind_query: { kind: "channelVideos", query: cacheKey } },
          create: {
            kind: "channelVideos",
            query: cacheKey,
            responseJson: fallbackResult as unknown as object,
            cachedUntil,
          },
          update: {
            responseJson: fallbackResult as unknown as object,
            cachedUntil,
          },
        });
      } catch {
        // ignore
      }
    }

    return fallbackResult;
  }

  // 2) Read uploads pages (reverse-chronological). Paginate cheaply until we either:
  // - have enough candidates, or
  // - we've crossed publishedAfter, or
  // - hit a small page limit (keeps calls low).
  const candidates: Array<{
    videoId: string;
    title: string;
    publishedAt: string;
    thumbnailUrl: string | null;
  }> = [];

  let pageToken: string | undefined;
  const maxPages = 2; // 2 playlist pages = up to 100 uploads (cheap; 1 unit/page)
  let crossedCutoff = false;

  for (let page = 0; page < maxPages; page++) {
    const playlistUrl = new URL(`${YOUTUBE_DATA_API}/playlistItems`);
    playlistUrl.searchParams.set("part", "snippet,contentDetails");
    playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
    playlistUrl.searchParams.set("maxResults", "50");
    if (pageToken) playlistUrl.searchParams.set("pageToken", pageToken);

    const playlistData = await googleFetchWithAutoRefresh<{
      items: Array<{
        snippet: {
          title: string;
          publishedAt: string;
          thumbnails: { medium?: { url: string }; default?: { url: string } };
        };
        contentDetails: { videoId: string };
      }>;
      nextPageToken?: string;
    }>(ga, playlistUrl.toString());

    const items = playlistData.items ?? [];
    for (const i of items) {
      const publishedAt = i.snippet.publishedAt;
      if (new Date(publishedAt).getTime() < publishedAfterMs) {
        // Since playlist is reverse-chronological, once we go older than the cutoff,
        // the rest of this page (and next pages) are too old.
        crossedCutoff = true;
        break;
      }
      candidates.push({
        videoId: i.contentDetails.videoId,
        title: decodeHtmlEntities(i.snippet.title),
        publishedAt,
        thumbnailUrl:
          i.snippet.thumbnails?.medium?.url ??
          i.snippet.thumbnails?.default?.url ??
          null,
      });
    }

    // Stop early if we crossed the cutoff or have enough material.
    if (crossedCutoff) break;
    if (!playlistData.nextPageToken) break;
    if (candidates.length >= 50) break;
    pageToken = playlistData.nextPageToken;
    if (!pageToken) break;
  }

  if (candidates.length === 0) {
    // Cache empty result to avoid repeated calls for channels with no recent videos
    if (cacheModel?.upsert) {
      const cachedUntil = new Date(now.getTime() + cacheTtlMs);
      try {
        await cacheModel.upsert({
          where: { kind_query: { kind: "channelVideos", query: cacheKey } },
          create: {
            kind: "channelVideos",
            query: cacheKey,
            responseJson: [],
            cachedUntil,
          },
          update: { responseJson: [], cachedUntil },
        });
      } catch {
        /* ignore */
      }
    }
    return [];
  }

  // 3) Fetch view counts for candidates (single videos.list call, up to 50 IDs).
  const ids = candidates.slice(0, 50).map((v) => v.videoId);
  const videosUrl = new URL(`${YOUTUBE_DATA_API}/videos`);
  videosUrl.searchParams.set("part", "statistics");
  videosUrl.searchParams.set("id", ids.join(","));

  const statsData = await googleFetchWithAutoRefresh<{
    items: Array<{ id: string; statistics: { viewCount: string } }>;
  }>(ga, videosUrl.toString());

  const statsMap = new Map<string, number>();
  (statsData.items ?? []).forEach((item) => {
    statsMap.set(item.id, parseInt(item.statistics.viewCount ?? "0", 10));
  });

  const withViews = candidates.map((v) => {
    const views = statsMap.get(v.videoId) ?? 0;
    const daysSince = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    return {
      ...v,
      views,
      viewsPerDay: Math.round(views / daysSince),
    };
  });

  // Prior behavior was ordering by viewCount; keep that (within the time window)
  // so the product value stays the same.
  withViews.sort((a, b) => b.views - a.views);

  const result = withViews.slice(0, maxResults);

  // Write to cache (best-effort)
  if (cacheModel?.upsert) {
    const cachedUntil = new Date(now.getTime() + cacheTtlMs);
    try {
      await cacheModel.upsert({
        where: { kind_query: { kind: "channelVideos", query: cacheKey } },
        create: {
          kind: "channelVideos",
          query: cacheKey,
          responseJson: result as unknown as object,
          cachedUntil,
        },
        update: { responseJson: result as unknown as object, cachedUntil },
      });
    } catch {
      // ignore cache write errors
    }
  }

  return result;
}

/**
 * Fetch details for a single video by ID
 */
export async function fetchVideoDetails(
  ga: GoogleAccount,
  videoId: string
): Promise<VideoDetails | null> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeVideoDetails(videoId);
  }

  const url = new URL(`${YOUTUBE_DATA_API}/videos`);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoId);

  const data = await googleFetchWithAutoRefresh<{
    items: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        channelTitle: string;
        tags?: string[];
        categoryId: string;
        thumbnails: {
          maxres?: { url: string };
          high?: { url: string };
          default?: { url: string };
        };
      };
      contentDetails: { duration: string };
      statistics: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
      };
    }>;
  }>(ga, url.toString());

  const item = data.items?.[0];
  if (!item) return null;

  return {
    videoId: item.id,
    title: decodeHtmlEntities(item.snippet.title),
    description: decodeHtmlEntities(item.snippet.description),
    publishedAt: item.snippet.publishedAt,
    channelId: item.snippet.channelId,
    channelTitle: decodeHtmlEntities(item.snippet.channelTitle),
    tags: item.snippet.tags ?? [],
    category: item.snippet.categoryId,
    thumbnailUrl:
      item.snippet.thumbnails?.maxres?.url ??
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.default?.url ??
      null,
    durationSec: parseDuration(item.contentDetails.duration),
    viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
    likeCount: parseInt(item.statistics.likeCount ?? "0", 10),
    commentCount: parseInt(item.statistics.commentCount ?? "0", 10),
  };
}

export type VideoDetails = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  tags: string[];
  category: string;
  thumbnailUrl: string | null;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

export type SimilarChannelResult = {
  channelId: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string | null;
};

export type RecentVideoResult = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  views: number;
  viewsPerDay: number;
  durationSec?: number;
};

// Types
export type YouTubeVideo = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSec: number;
  tags: string | null;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  comments: number;
};

export type VideoMetricsData = {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  averageViewPercentage: number;
};

export type RetentionPoint = {
  elapsedRatio: number;
  audienceWatchRatio: number;
};

export type CompetitorVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
};

/**
 * Parse ISO 8601 duration (PT4M13S) to seconds
 */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// TEST_MODE Fixtures
function getTestModeVideos(channelId: string): YouTubeVideo[] {
  return [
    {
      videoId: "test-video-1",
      title: "Building a SaaS in 24 Hours",
      description:
        "I challenged myself to build a complete SaaS product in 24 hours...",
      publishedAt: "2024-01-15T10:00:00Z",
      durationSec: 1245,
      tags: "saas,startup,coding",
      thumbnailUrl: "https://i.ytimg.com/vi/test/hqdefault.jpg",
      views: 125000,
      likes: 8500,
      comments: 420,
    },
    {
      videoId: "test-video-2",
      title: "Why I Quit My Tech Job",
      description: "After 5 years at FAANG, I made the hardest decision...",
      publishedAt: "2024-01-08T10:00:00Z",
      durationSec: 890,
      tags: "career,tech,life",
      thumbnailUrl: "https://i.ytimg.com/vi/test2/hqdefault.jpg",
      views: 89000,
      likes: 6200,
      comments: 890,
    },
    {
      videoId: "test-video-3",
      title: "The BEST VS Code Setup for 2024",
      description:
        "My complete VS Code configuration for maximum productivity...",
      publishedAt: "2024-01-01T10:00:00Z",
      durationSec: 720,
      tags: "vscode,productivity,coding",
      thumbnailUrl: "https://i.ytimg.com/vi/test3/hqdefault.jpg",
      views: 210000,
      likes: 15000,
      comments: 1200,
    },
  ];
}

function getTestModeMetrics(videoIds: string[]): VideoMetricsData[] {
  return videoIds.map((videoId, i) => ({
    videoId,
    views: 100000 - i * 20000,
    likes: 5000 - i * 1000,
    comments: 300 - i * 50,
    shares: 150 - i * 30,
    subscribersGained: 500 - i * 100,
    subscribersLost: 20 + i * 5,
    estimatedMinutesWatched: 50000 - i * 10000,
    averageViewDuration: 180 - i * 20,
    averageViewPercentage: 45 - i * 5,
  }));
}

function getTestModeRetention(videoId: string): RetentionPoint[] {
  // Generate a realistic retention curve that drops off
  const points: RetentionPoint[] = [];
  for (let i = 0; i <= 100; i += 2) {
    const ratio = i / 100;
    // Simulates typical YouTube retention: starts high, drops quickly in first 30s, then gradual decline
    let retention = 1.0;
    if (ratio < 0.1) {
      retention = 1.0 - ratio * 3; // Quick initial drop
    } else if (ratio < 0.3) {
      retention = 0.7 - (ratio - 0.1) * 0.5; // Moderate decline
    } else {
      retention = 0.6 - (ratio - 0.3) * 0.7; // Gradual decline
    }
    retention = Math.max(
      0.1,
      Math.min(1.0, retention + (Math.random() - 0.5) * 0.05)
    );
    points.push({ elapsedRatio: ratio, audienceWatchRatio: retention });
  }
  return points;
}

function getTestModeCompetitors(query: string): CompetitorVideo[] {
  return [
    {
      videoId: "comp-1",
      title: `How to ${query} - Complete Guide 2024`,
      channelTitle: "TechGuru",
      publishedAt: "2024-01-10T10:00:00Z",
    },
    {
      videoId: "comp-2",
      title: `${query} Tutorial for Beginners`,
      channelTitle: "CodeWithMe",
      publishedAt: "2024-01-05T10:00:00Z",
    },
    {
      videoId: "comp-3",
      title: `I Mastered ${query} in 30 Days`,
      channelTitle: "DevJourney",
      publishedAt: "2024-01-01T10:00:00Z",
    },
  ];
}

function getTestModeSimilarChannels(
  keywords: string[]
): SimilarChannelResult[] {
  return [
    {
      channelId: "similar-1",
      channelTitle: "CodeMaster Pro",
      description:
        "Full-stack development tutorials and career advice for developers.",
      thumbnailUrl: "https://yt3.ggpht.com/channel1/photo.jpg",
    },
    {
      channelId: "similar-2",
      channelTitle: "DevLife Daily",
      description:
        "Day in the life of a software engineer + coding challenges.",
      thumbnailUrl: "https://yt3.ggpht.com/channel2/photo.jpg",
    },
    {
      channelId: "similar-3",
      channelTitle: "Tech Interview Prep",
      description:
        "System design, algorithms, and interview tips for FAANG companies.",
      thumbnailUrl: "https://yt3.ggpht.com/channel3/photo.jpg",
    },
    {
      channelId: "similar-4",
      channelTitle: "Indie Hacker Hub",
      description: "Build in public, SaaS development, and startup stories.",
      thumbnailUrl: "https://yt3.ggpht.com/channel4/photo.jpg",
    },
    {
      channelId: "similar-5",
      channelTitle: "Frontend Focused",
      description: "React, TypeScript, and modern web development tutorials.",
      thumbnailUrl: "https://yt3.ggpht.com/channel5/photo.jpg",
    },
  ];
}

function getTestModeRecentVideos(channelId: string): RecentVideoResult[] {
  const now = Date.now();
  return [
    {
      videoId: `${channelId}-vid-1`,
      title: "I Built a $10K/mo SaaS in 30 Days",
      publishedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      thumbnailUrl: "https://i.ytimg.com/vi/recent1/mqdefault.jpg",
      views: 45000,
      viewsPerDay: 22500,
    },
    {
      videoId: `${channelId}-vid-2`,
      title: "Why Every Developer Needs This Tool",
      publishedAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
      thumbnailUrl: "https://i.ytimg.com/vi/recent2/mqdefault.jpg",
      views: 32000,
      viewsPerDay: 8000,
    },
    {
      videoId: `${channelId}-vid-3`,
      title: "The Future of Web Development (2024)",
      publishedAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
      thumbnailUrl: "https://i.ytimg.com/vi/recent3/mqdefault.jpg",
      views: 28000,
      viewsPerDay: 4667,
    },
  ];
}

function getTestModeVideoDetails(videoId: string): VideoDetails {
  return {
    videoId,
    title: "This One Change DOUBLED My YouTube Growth",
    description:
      "In this video, I share the single most important change I made to my content strategy that doubled my channel growth...",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    channelId: "demo-channel",
    channelTitle: "Creator Academy",
    tags: [
      "youtube growth",
      "content strategy",
      "creator tips",
      "upload schedule",
    ],
    category: "22", // Education
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    durationSec: 847,
    viewCount: 245000,
    likeCount: 11760,
    commentCount: 735,
  };
}

// ============================================
// YOUTUBE COMMENTS API
// ============================================

export type YouTubeComment = {
  commentId: string;
  text: string;
  likeCount: number;
  authorName: string;
  authorChannelId?: string;
  publishedAt: string;
  replyCount: number;
};

export type FetchCommentsResult = {
  comments: YouTubeComment[];
  commentsDisabled?: boolean;
  error?: string;
};

/**
 * Fetch top comments for a video using commentThreads.list
 * This can fail if comments are disabled or quota is exceeded.
 */
export async function fetchVideoComments(
  ga: GoogleAccount,
  videoId: string,
  maxResults: number = 50
): Promise<FetchCommentsResult> {
  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeComments(videoId);
  }

  try {
    const url = new URL(`${YOUTUBE_DATA_API}/commentThreads`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("videoId", videoId);
    url.searchParams.set("order", "relevance"); // Top comments first
    url.searchParams.set("maxResults", String(Math.min(maxResults, 100)));

    const data = await googleFetchWithAutoRefresh<{
      items?: Array<{
        id: string;
        snippet: {
          topLevelComment: {
            id: string;
            snippet: {
              textDisplay: string;
              textOriginal: string;
              likeCount: number;
              authorDisplayName: string;
              authorChannelId?: { value: string };
              publishedAt: string;
            };
          };
          totalReplyCount: number;
        };
      }>;
      error?: {
        code: number;
        message: string;
        errors?: Array<{ reason: string }>;
      };
    }>(ga, url.toString());

    if (!data.items) {
      // Check if comments are disabled
      if (data.error?.errors?.some((e) => e.reason === "commentsDisabled")) {
        return { comments: [], commentsDisabled: true };
      }
      return {
        comments: [],
        error: data.error?.message || "No comments found",
      };
    }

    const comments: YouTubeComment[] = data.items.map((item) => ({
      commentId: item.snippet.topLevelComment.id,
      text: item.snippet.topLevelComment.snippet.textOriginal,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
      authorChannelId:
        item.snippet.topLevelComment.snippet.authorChannelId?.value,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      replyCount: item.snippet.totalReplyCount,
    }));

    return { comments };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Check for specific error conditions
    if (
      message.includes("commentsDisabled") ||
      message.includes("disabled comments")
    ) {
      return { comments: [], commentsDisabled: true };
    }
    if (message.includes("quotaExceeded")) {
      return { comments: [], error: "YouTube API quota exceeded" };
    }

    if (
      message.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
      message.includes("insufficientPermissions") ||
      message.includes("insufficient authentication scopes")
    ) {
      return {
        comments: [],
        error:
          "Google account is missing the YouTube comments scope. Reconnect Google (it will prompt for updated permissions), then try again.",
      };
    }

    return { comments: [], error: message };
  }
}

/**
 * Fetch video statistics in batch (for snapshotting)
 */
export async function fetchVideosStatsBatch(
  ga: GoogleAccount,
  videoIds: string[]
): Promise<
  Map<string, { viewCount: number; likeCount?: number; commentCount?: number }>
> {
  if (videoIds.length === 0) return new Map();

  // TEST_MODE: Return fixture data
  if (USE_FIXTURES) {
    return getTestModeStatsBatch(videoIds);
  }

  const results = new Map<
    string,
    { viewCount: number; likeCount?: number; commentCount?: number }
  >();

  // YouTube API allows max 50 IDs per request
  const batches: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50));
  }

  for (const batch of batches) {
    const url = new URL(`${YOUTUBE_DATA_API}/videos`);
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", batch.join(","));

    try {
      const data = await googleFetchWithAutoRefresh<{
        items?: Array<{
          id: string;
          statistics: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
          };
        }>;
      }>(ga, url.toString());

      for (const item of data.items ?? []) {
        results.set(item.id, {
          viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
          likeCount: item.statistics.likeCount
            ? parseInt(item.statistics.likeCount, 10)
            : undefined,
          commentCount: item.statistics.commentCount
            ? parseInt(item.statistics.commentCount, 10)
            : undefined,
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch stats batch:`, err);
    }
  }

  return results;
}

function getTestModeComments(videoId: string): FetchCommentsResult {
  return {
    comments: [
      {
        commentId: "comment-1",
        text: "This completely changed my approach to content. The quality vs quantity insight was exactly what I needed to hear.",
        likeCount: 342,
        authorName: "Creative Mind",
        publishedAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        replyCount: 12,
      },
      {
        commentId: "comment-2",
        text: "Can you do a follow-up video on how to decide WHICH videos to make when posting less? That's my biggest struggle.",
        likeCount: 187,
        authorName: "Aspiring Creator",
        publishedAt: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        replyCount: 8,
      },
      {
        commentId: "comment-3",
        text: "I tried this and went from 3 videos/week to 1. My watch time actually increased by 40%. Thanks for the permission to slow down!",
        likeCount: 156,
        authorName: "Growth Experimenter",
        publishedAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        replyCount: 5,
      },
      {
        commentId: "comment-4",
        text: "The data at 4:32 was mind-blowing. Never realized retention was more important than upload frequency.",
        likeCount: 98,
        authorName: "Data Driven Dave",
        publishedAt: new Date(
          Date.now() - 4 * 24 * 60 * 60 * 1000
        ).toISOString(),
        replyCount: 3,
      },
      {
        commentId: "comment-5",
        text: "Would love to see more case studies from smaller channels. Does this work for channels under 10k subs?",
        likeCount: 76,
        authorName: "Small Channel Sara",
        publishedAt: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        replyCount: 15,
      },
    ],
  };
}

function getTestModeStatsBatch(
  videoIds: string[]
): Map<
  string,
  { viewCount: number; likeCount?: number; commentCount?: number }
> {
  const results = new Map();
  for (const id of videoIds) {
    results.set(id, {
      viewCount: Math.floor(Math.random() * 500000) + 10000,
      likeCount: Math.floor(Math.random() * 20000) + 500,
      commentCount: Math.floor(Math.random() * 2000) + 50,
    });
  }
  return results;
}
