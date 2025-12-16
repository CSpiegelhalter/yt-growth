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
export async function getGoogleAccount(userId: number): Promise<GoogleAccount | null> {
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

  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
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

  const videoIds = playlistData.items?.map((i) => i.contentDetails.videoId) ?? [];
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
    thumbnailUrl: v.snippet.thumbnails?.high?.url ?? v.snippet.thumbnails?.default?.url ?? null,
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
  url.searchParams.set("metrics", "views,likes,comments,shares,subscribersGained,subscribersLost,estimatedMinutesWatched,averageViewDuration,averageViewPercentage");
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
      description: "I challenged myself to build a complete SaaS product in 24 hours...",
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
      description: "My complete VS Code configuration for maximum productivity...",
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
    retention = Math.max(0.1, Math.min(1.0, retention + (Math.random() - 0.5) * 0.05));
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

