// lib/sync-youtube.ts
import { generateAndStoreNiche } from "@/lib/channel-niche";
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";
import { prisma } from "@/prisma";

type GoogleAccount = {
  id: number;
  userId: number;
  provider: string;
  providerAccountId: string;
  refreshTokenEnc: string | null;
  scopes: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type YouTubeChannelItem = {
  id: string;
  snippet: {
    title: string;
    country?: string;
    thumbnails?: {
      high?: { url: string };
      default?: { url: string };
    };
  };
  statistics?: {
    videoCount?: string;
    subscriberCount?: string;
    viewCount?: string;
    hiddenSubscriberCount?: boolean;
  };
};

type YouTubeThumbnails = {
  high?: { url: string };
  medium?: { url: string };
  default?: { url: string };
};

type YouTubeVideoItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails?: YouTubeThumbnails;
    channelId: string;
  };
};

type YouTubeVideoDetails = {
  id: string;
  contentDetails?: {
    duration?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
  };
  status?: {
    privacyStatus?: string; // "public", "unlisted", or "private"
  };
};

function pickThumbnailUrl(thumbnails?: YouTubeThumbnails): string | null {
  return (
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null
  );
}

function extractDetailFields(details: YouTubeVideoDetails | undefined) {
  const snip = details?.snippet;
  return {
    description: snip?.description ?? "",
    tags: snip?.tags?.join(",") ?? "",
    categoryId: snip?.categoryId ?? null,
    durationSec: details?.contentDetails?.duration
      ? parseDuration(details.contentDetails.duration)
      : null,
    privacyStatus: details?.status?.privacyStatus ?? null,
  };
}

function extractVideoFields(
  snippet: { title: string; publishedAt: string; thumbnails?: YouTubeThumbnails },
  details: YouTubeVideoDetails | undefined,
) {
  return {
    title: snippet.title,
    thumbnailUrl: pickThumbnailUrl(snippet.thumbnails),
    publishedAt: new Date(snippet.publishedAt),
    ...extractDetailFields(details),
  };
}

function extractMetricFields(details: YouTubeVideoDetails | undefined) {
  return {
    views: details?.statistics?.viewCount
      ? Number.parseInt(details.statistics.viewCount, 10)
      : 0,
    likes: details?.statistics?.likeCount
      ? Number.parseInt(details.statistics.likeCount, 10)
      : 0,
  };
}

async function upsertVideoAndMetrics(
  channelDbId: number,
  videoId: string,
  snippet: { title: string; publishedAt: string; thumbnails?: YouTubeThumbnails },
  details: YouTubeVideoDetails | undefined,
  cachedUntil: Date,
) {
  const videoFields = extractVideoFields(snippet, details);
  const { views, likes } = extractMetricFields(details);

  const video = await prisma.video.upsert({
    where: {
      channelId_youtubeVideoId: {
        channelId: channelDbId,
        youtubeVideoId: videoId,
      },
    },
    update: videoFields,
    create: { channelId: channelDbId, youtubeVideoId: videoId, ...videoFields },
  });

  await prisma.videoMetrics.upsert({
    where: { videoId: video.id },
    update: { views, likes, fetchedAt: new Date(), cachedUntil },
    create: { videoId: video.id, channelId: channelDbId, views, likes, cachedUntil },
  });
}

function parseChannelStats(ch: YouTubeChannelItem) {
  const totalVideoCount = ch.statistics?.videoCount
    ? Number.parseInt(ch.statistics.videoCount, 10)
    : null;
  const subscriberCount =
    ch.statistics?.subscriberCount && !ch.statistics?.hiddenSubscriberCount
      ? Number.parseInt(ch.statistics.subscriberCount, 10)
      : null;
  return { totalVideoCount, subscriberCount };
}

async function upsertAndSyncChannel(
  ga: GoogleAccount,
  ch: YouTubeChannelItem,
  userId: number,
): Promise<void> {
  const thumb =
    ch.snippet.thumbnails?.high?.url ??
    ch.snippet.thumbnails?.default?.url ??
    null;
  const { totalVideoCount, subscriberCount } = parseChannelStats(ch);

  const channelFields = {
    title: ch.snippet.title,
    thumbnailUrl: thumb,
    totalVideoCount,
    subscriberCount,
    lastSyncedAt: new Date(),
    syncStatus: "idle" as const,
    googleAccountId: ga.id,
  };

  const channel = await prisma.channel.upsert({
    where: {
      userId_youtubeChannelId: { userId, youtubeChannelId: ch.id },
    },
    update: { ...channelFields, syncError: null },
    create: { userId, youtubeChannelId: ch.id, ...channelFields },
  });

  try {
    await fetchChannelVideos(ga, channel.id, ch.id);
    try {
      await generateAndStoreNiche(channel.id);
    } catch (error) {
      console.error(`Failed to generate niche for channel ${ch.id}:`, error);
    }
  } catch (error) {
    console.error(`Failed to fetch videos for channel ${ch.id}:`, error);
  }
}

async function syncGoogleAccountChannels(
  ga: GoogleAccount,
  userId: number,
): Promise<void> {
  const ownedChannelsUrl = new URL(
    "https://www.googleapis.com/youtube/v3/channels"
  );
  ownedChannelsUrl.search = new URLSearchParams({
    part: "id,snippet,statistics",
    mine: "true",
  }).toString();

  const ownedChannelsData = await googleFetchWithAutoRefresh<{
    items?: YouTubeChannelItem[];
  }>(ga, ownedChannelsUrl.toString());

  console.log(
    `[syncUserChannels] Found ${
      ownedChannelsData.items?.length ?? 0
    } channel(s) for GoogleAccount ${ga.id}`
  );

  for (const ch of ownedChannelsData.items ?? []) {
    await upsertAndSyncChannel(ga, ch, userId);
  }
}

export async function syncUserChannels(
  userId: number,
  googleAccountId?: number
): Promise<void> {
  const googleAccounts = googleAccountId
    ? await prisma.googleAccount.findMany({
        where: { id: googleAccountId, userId },
      })
    : await prisma.googleAccount.findMany({ where: { userId } });

  if (googleAccounts.length === 0) {return;}

  await prisma.channel.updateMany({
    where: { userId },
    data: { syncStatus: "running" },
  });

  try {
    for (const ga of googleAccounts) {
      await syncGoogleAccountChannels(ga, userId);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[syncUserChannels] Error for user ${userId}:`, message);
    await prisma.channel.updateMany({
      where: { userId },
      data: { syncStatus: "error", syncError: message },
    });
    throw error;
  }
}

// Number of videos to sync (divisible by 6 for grid layout)
const SYNC_VIDEO_COUNT = 96;

async function fetchVideoDetailsBatched(
  ga: GoogleAccount,
  videoIds: string[],
): Promise<Map<string, YouTubeVideoDetails>> {
  const VIDEO_BATCH_SIZE = 50;
  const allDetails: YouTubeVideoDetails[] = [];

  for (let i = 0; i < videoIds.length; i += VIDEO_BATCH_SIZE) {
    const batchIds = videoIds.slice(i, i + VIDEO_BATCH_SIZE);
    const detailsUrl = new URL(
      "https://www.googleapis.com/youtube/v3/videos"
    );
    detailsUrl.search = new URLSearchParams({
      part: "id,contentDetails,snippet,statistics,status",
      id: batchIds.join(","),
    }).toString();

    const detailsData = await googleFetchWithAutoRefresh<{
      items: YouTubeVideoDetails[];
    }>(ga, detailsUrl.toString());

    allDetails.push(...(detailsData.items ?? []));
  }

  return new Map(allDetails.map((v) => [v.id, v]));
}

async function upsertVideoBatch(
  channelDbId: number,
  items: Array<{ videoId: string; snippet: { title: string; publishedAt: string; thumbnails?: YouTubeThumbnails } }>,
  detailsMap: Map<string, YouTubeVideoDetails>,
  cachedUntil: Date,
): Promise<void> {
  for (const { videoId, snippet } of items) {
    await upsertVideoAndMetrics(channelDbId, videoId, snippet, detailsMap.get(videoId), cachedUntil);
  }
}

async function fetchViaSearch(
  ga: GoogleAccount,
  channelDbId: number,
  youtubeChannelId: string,
): Promise<void> {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.search = new URLSearchParams({
    part: "id,snippet",
    channelId: youtubeChannelId,
    order: "date",
    type: "video",
    maxResults: "50",
  }).toString();

  const searchData = await googleFetchWithAutoRefresh<{
    items: YouTubeVideoItem[];
  }>(ga, searchUrl.toString());

  const videoIds = (searchData.items ?? [])
    .map((v) => v.id.videoId)
    .filter(Boolean);
  if (videoIds.length === 0) {return;}

  const detailsMap = await fetchVideoDetailsBatched(ga, videoIds);
  const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const items = (searchData.items ?? []).map((item) => ({
    videoId: item.id.videoId,
    snippet: item.snippet,
  }));

  await upsertVideoBatch(channelDbId, items, detailsMap, cachedUntil);

  await prisma.channel.update({
    where: { id: channelDbId },
    data: { lastSyncedAt: new Date() },
  });
}

async function fetchPlaylistItems(
  ga: GoogleAccount,
  uploadsPlaylistId: string,
): Promise<Array<{
  contentDetails: { videoId: string };
  snippet: { title: string; publishedAt: string; thumbnails: YouTubeThumbnails };
}>> {
  const allItems: Array<{
    contentDetails: { videoId: string };
    snippet: { title: string; publishedAt: string; thumbnails: YouTubeThumbnails };
  }> = [];
  let nextPageToken: string | undefined;

  while (allItems.length < SYNC_VIDEO_COUNT) {
    const playlistUrl = new URL(
      "https://www.googleapis.com/youtube/v3/playlistItems"
    );
    const params: Record<string, string> = {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
    };
    if (nextPageToken) {
      params.pageToken = nextPageToken;
    }
    playlistUrl.search = new URLSearchParams(params).toString();

    const playlistData = await googleFetchWithAutoRefresh<{
      nextPageToken?: string;
      items: Array<{
        contentDetails: { videoId: string };
        snippet: { title: string; publishedAt: string; thumbnails: YouTubeThumbnails };
      }>;
    }>(ga, playlistUrl.toString());

    allItems.push(...(playlistData.items ?? []));
    nextPageToken = playlistData.nextPageToken;

    if (!nextPageToken || (playlistData.items ?? []).length === 0) {break;}
  }

  return allItems.slice(0, SYNC_VIDEO_COUNT);
}

async function fetchViaUploadsPlaylist(
  ga: GoogleAccount,
  channelDbId: number,
  youtubeChannelId: string,
  uploadsPlaylistId: string,
): Promise<void> {
  const allPlaylistItems = await fetchPlaylistItems(ga, uploadsPlaylistId);

  const videoIds = allPlaylistItems
    .map((v) => v.contentDetails.videoId)
    .filter(Boolean);
  if (videoIds.length === 0) {return;}

  const detailsMap = await fetchVideoDetailsBatched(ga, videoIds);
  const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const items = allPlaylistItems.map((item) => ({
    videoId: item.contentDetails.videoId,
    snippet: item.snippet,
  }));

  await upsertVideoBatch(channelDbId, items, detailsMap, cachedUntil);

  const videoCount = await prisma.video.count({
    where: { channelId: channelDbId },
  });

  await prisma.channel.update({
    where: { id: channelDbId },
    data: { lastSyncedAt: new Date() },
  });

  console.log(`Synced ${videoCount} videos for channel ${youtubeChannelId}`);
}

/**
 * Fetch recent videos for a channel
 * Stores recent videos (up to SYNC_VIDEO_COUNT) in the database
 */
async function fetchChannelVideos(
  ga: GoogleAccount,
  channelDbId: number,
  youtubeChannelId: string
): Promise<void> {
  try {
    const channelUrl = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );
    channelUrl.search = new URLSearchParams({
      part: "contentDetails",
      id: youtubeChannelId,
    }).toString();

    const channelData = await googleFetchWithAutoRefresh<{
      items: Array<{
        contentDetails: { relatedPlaylists: { uploads: string } };
      }>;
    }>(ga, channelUrl.toString());

    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      await fetchViaSearch(ga, channelDbId, youtubeChannelId);
      return;
    }

    await fetchViaUploadsPlaylist(ga, channelDbId, youtubeChannelId, uploadsPlaylistId);
  } catch (error) {
    console.error(
      `Error fetching videos for channel ${youtubeChannelId}:`,
      error
    );
  }
}

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {return 0;}
  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}
