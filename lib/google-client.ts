import { prisma } from "@/prisma";
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";
import { ApiError } from "@/lib/http";

function parseISODuration(iso: string | undefined | null) {
  if (!iso) return null;
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i.exec(iso);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

async function getGoogleAccount(userId: number) {
  const ga = await prisma.googleAccount.findFirst({ where: { userId } });
  if (!ga) throw new ApiError(400, "Google account not connected");
  if (!ga.refreshTokenEnc)
    throw new ApiError(400, "Missing Google refresh token");
  return ga;
}

export async function listRecentVideos(userId: number, channelId: string) {
  const ga = await getGoogleAccount(userId);
  // Avoid search.list (expensive quota). Use uploads playlist instead.
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.search = new URLSearchParams({
    part: "contentDetails",
    id: channelId,
  }).toString();

  const channelData = await googleFetchWithAutoRefresh<{
    items: Array<{ contentDetails: { relatedPlaylists: { uploads: string } } }>;
  }>(ga, channelUrl.toString());
  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    // Fallback for rare channels where uploads playlist isn't returned.
    // Costs more quota.
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.search = new URLSearchParams({
      part: "snippet",
      channelId,
      order: "date",
      maxResults: "25",
      type: "video",
    }).toString();

    const search = await googleFetchWithAutoRefresh<{
      items: Array<{
        id: { videoId: string };
        snippet: { title: string; publishedAt?: string; thumbnails?: any };
      }>;
    }>(ga, searchUrl.toString());
    const videoIds = (search.items ?? [])
      .map((i) => i.id.videoId)
      .filter(Boolean);
    if (videoIds.length === 0) return [];

    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.search = new URLSearchParams({
      part: "snippet,contentDetails",
      id: videoIds.join(","),
    }).toString();

    const videos = await googleFetchWithAutoRefresh<{
      items: Array<{
        id: string;
        snippet: {
          title: string;
          publishedAt?: string;
          tags?: string[];
          thumbnails?: any;
        };
        contentDetails?: { duration?: string };
      }>;
    }>(ga, videosUrl.toString());

    return (videos.items ?? []).map((v) => ({
      videoId: v.id,
      title: v.snippet?.title ?? "Untitled",
      publishedAt: v.snippet?.publishedAt
        ? new Date(v.snippet.publishedAt)
        : null,
      durationSec: parseISODuration(v.contentDetails?.duration),
      tags: (v.snippet?.tags ?? []).join(","),
      thumbnailUrl:
        v.snippet?.thumbnails?.maxres?.url ||
        v.snippet?.thumbnails?.high?.url ||
        v.snippet?.thumbnails?.default?.url ||
        null,
    }));
  }

  const playlistUrl = new URL(
    "https://www.googleapis.com/youtube/v3/playlistItems"
  );
  playlistUrl.search = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: "25",
  }).toString();

  const playlist = await googleFetchWithAutoRefresh<{
    items: Array<{
      contentDetails: { videoId: string };
      snippet: { title: string; publishedAt?: string; thumbnails?: any };
    }>;
  }>(ga, playlistUrl.toString());

  const videoIds = (playlist.items ?? [])
    .map((i) => i.contentDetails.videoId)
    .filter(Boolean);
  if (videoIds.length === 0) return [];

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.search = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoIds.join(","),
  }).toString();

  const videos = await googleFetchWithAutoRefresh<{
    items: Array<{
      id: string;
      snippet: {
        title: string;
        publishedAt?: string;
        tags?: string[];
        thumbnails?: any;
      };
      contentDetails?: { duration?: string };
    }>;
  }>(ga, videosUrl.toString());

  return (videos.items ?? []).map((v) => ({
    videoId: v.id,
    title: v.snippet?.title ?? "Untitled",
    publishedAt: v.snippet?.publishedAt
      ? new Date(v.snippet.publishedAt)
      : null,
    durationSec: parseISODuration(v.contentDetails?.duration),
    tags: (v.snippet?.tags ?? []).join(","),
    thumbnailUrl:
      v.snippet?.thumbnails?.maxres?.url ||
      v.snippet?.thumbnails?.high?.url ||
      v.snippet?.thumbnails?.default?.url ||
      null,
  }));
}

export async function fetchVideoMetrics(
  userId: number,
  channelId: string,
  videoIds: string[],
  lookbackDays = 28
) {
  if (!videoIds.length) return [];
  const ga = await getGoogleAccount(userId);
  const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const endDate = new Date();
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  url.search = new URLSearchParams({
    dimensions: "video",
    metrics:
      "views,likes,comments,subscribersGained,estimatedMinutesWatched,averageViewDuration",
    filters: `video==${videoIds.join(",")}`,
    ids: `channel==${channelId}`,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    sort: "-views",
    maxResults: "10",
  }).toString();

  const data = await googleFetchWithAutoRefresh<{
    columnHeaders: any[];
    rows?: any[];
  }>(ga, url.toString());

  const headers = (data.columnHeaders ?? []).map((h: any) => h.name);
  const idx = (name: string) => headers.indexOf(name);

  return (data.rows ?? []).map((row) => ({
    videoId: row[idx("video")],
    viewCount: Number(row[idx("views")] ?? 0),
    likeCount: Number(row[idx("likes")] ?? 0),
    commentCount: Number(row[idx("comments")] ?? 0),
    subscribersGained: Number(row[idx("subscribersGained")] ?? 0),
    estimatedMinutesWatched: Number(row[idx("estimatedMinutesWatched")] ?? 0),
    averageViewDuration: Number(row[idx("averageViewDuration")] ?? 0),
    periodStart: startDate,
    periodEnd: endDate,
  }));
}

export async function fetchRetentionPoints(
  userId: number,
  channelId: string,
  videoId: string
) {
  const ga = await getGoogleAccount(userId);
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  const endDate = new Date();
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  url.search = new URLSearchParams({
    dimensions: "elapsedVideoTimeRatio",
    metrics: "audienceWatchRatio",
    filters: `video==${videoId}`,
    ids: `channel==${channelId}`,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    sort: "elapsedVideoTimeRatio",
  }).toString();

  const data = await googleFetchWithAutoRefresh<{ rows?: any[] }>(
    ga,
    url.toString()
  );
  return (data.rows ?? []).map((row) => ({
    elapsedRatio: Number(row[0]),
    audienceWatchRatio: Number(row[1]),
  }));
}
