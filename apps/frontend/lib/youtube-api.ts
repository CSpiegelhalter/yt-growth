/**
 * YouTube Data API and Analytics API helpers
 *
 * Uses stored Google OAuth tokens to make authenticated requests.
 * Includes TEST_MODE fixtures for local development.
 */
import { prisma } from "@/prisma";
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";

const YOUTUBE_DATA_API = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2";

type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

/**
 * Get Google account for a user
 */
export async function getGoogleAccount(
  userId: number
): Promise<GoogleAccount | null> {
  return prisma.googleAccount.findFirst({ where: { userId } });
}

/**
 * Fetch videos for a channel (last N uploads)
 */
export async function fetchChannelVideos(
  ga: GoogleAccount,
  channelId: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  // TEST_MODE: Return fixture data
  if (process.env.TEST_MODE === "1") {
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
  playlistUrl.searchParams.set("maxResults", String(maxResults));

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
    title: v.snippet.title,
    description: v.snippet.description,
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
  if (process.env.TEST_MODE === "1") {
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
  if (process.env.TEST_MODE === "1") {
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
  if (process.env.TEST_MODE === "1") {
    return getTestModeCompetitors(query);
  }

  const url = new URL(`${YOUTUBE_DATA_API}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
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

  return (data.items ?? []).map((i) => ({
    videoId: i.id.videoId,
    title: i.snippet.title,
    channelTitle: i.snippet.channelTitle,
    publishedAt: i.snippet.publishedAt,
  }));
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
  if (process.env.TEST_MODE === "1") {
    return getTestModeSimilarChannels(keywords);
  }

  const query = keywords.slice(0, 3).join(" ");
  const url = new URL(`${YOUTUBE_DATA_API}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "channel");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
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

  return (data.items ?? []).map((i) => ({
    channelId: i.id.channelId,
    channelTitle: i.snippet.title,
    description: i.snippet.description,
    thumbnailUrl:
      i.snippet.thumbnails?.medium?.url ??
      i.snippet.thumbnails?.default?.url ??
      null,
  }));
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
  if (process.env.TEST_MODE === "1") {
    return getTestModeRecentVideos(channelId);
  }

  const url = new URL(`${YOUTUBE_DATA_API}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("publishedAfter", publishedAfter);
  url.searchParams.set("order", "viewCount");
  url.searchParams.set("maxResults", String(maxResults));

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

  // Fetch view counts
  const videosUrl = new URL(`${YOUTUBE_DATA_API}/videos`);
  videosUrl.searchParams.set("part", "statistics");
  videosUrl.searchParams.set("id", videoIds.join(","));

  const statsData = await googleFetchWithAutoRefresh<{
    items: Array<{
      id: string;
      statistics: { viewCount: string };
    }>;
  }>(ga, videosUrl.toString());

  const statsMap = new Map<string, number>();
  (statsData.items ?? []).forEach((item) => {
    statsMap.set(item.id, parseInt(item.statistics.viewCount ?? "0", 10));
  });

  return (searchData.items ?? []).map((i) => {
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
      title: i.snippet.title,
      publishedAt,
      thumbnailUrl:
        i.snippet.thumbnails?.medium?.url ??
        i.snippet.thumbnails?.default?.url ??
        null,
      views,
      viewsPerDay: Math.round(views / daysSince),
    };
  });
}

/**
 * Fetch details for a single video by ID
 */
export async function fetchVideoDetails(
  ga: GoogleAccount,
  videoId: string
): Promise<VideoDetails | null> {
  // TEST_MODE: Return fixture data
  if (process.env.TEST_MODE === "1") {
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
        thumbnails: { maxres?: { url: string }; high?: { url: string }; default?: { url: string } };
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
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
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
    description: "In this video, I share the single most important change I made to my content strategy that doubled my channel growth...",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    channelId: "demo-channel",
    channelTitle: "Creator Academy",
    tags: ["youtube growth", "content strategy", "creator tips", "upload schedule"],
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
  if (process.env.TEST_MODE === "1") {
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
      return { comments: [], error: data.error?.message || "No comments found" };
    }

    const comments: YouTubeComment[] = data.items.map((item) => ({
      commentId: item.snippet.topLevelComment.id,
      text: item.snippet.topLevelComment.snippet.textOriginal,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
      authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId?.value,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      replyCount: item.snippet.totalReplyCount,
    }));

    return { comments };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    
    // Check for specific error conditions
    if (message.includes("commentsDisabled") || message.includes("disabled comments")) {
      return { comments: [], commentsDisabled: true };
    }
    if (message.includes("quotaExceeded")) {
      return { comments: [], error: "YouTube API quota exceeded" };
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
): Promise<Map<string, { viewCount: number; likeCount?: number; commentCount?: number }>> {
  if (videoIds.length === 0) return new Map();

  // TEST_MODE: Return fixture data
  if (process.env.TEST_MODE === "1") {
    return getTestModeStatsBatch(videoIds);
  }

  const results = new Map<string, { viewCount: number; likeCount?: number; commentCount?: number }>();
  
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
          likeCount: item.statistics.likeCount ? parseInt(item.statistics.likeCount, 10) : undefined,
          commentCount: item.statistics.commentCount ? parseInt(item.statistics.commentCount, 10) : undefined,
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
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        replyCount: 12,
      },
      {
        commentId: "comment-2",
        text: "Can you do a follow-up video on how to decide WHICH videos to make when posting less? That's my biggest struggle.",
        likeCount: 187,
        authorName: "Aspiring Creator",
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        replyCount: 8,
      },
      {
        commentId: "comment-3",
        text: "I tried this and went from 3 videos/week to 1. My watch time actually increased by 40%. Thanks for the permission to slow down!",
        likeCount: 156,
        authorName: "Growth Experimenter",
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        replyCount: 5,
      },
      {
        commentId: "comment-4",
        text: "The data at 4:32 was mind-blowing. Never realized retention was more important than upload frequency.",
        likeCount: 98,
        authorName: "Data Driven Dave",
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        replyCount: 3,
      },
      {
        commentId: "comment-5",
        text: "Would love to see more case studies from smaller channels. Does this work for channels under 10k subs?",
        likeCount: 76,
        authorName: "Small Channel Sara",
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        replyCount: 15,
      },
    ],
  };
}

function getTestModeStatsBatch(videoIds: string[]): Map<string, { viewCount: number; likeCount?: number; commentCount?: number }> {
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
