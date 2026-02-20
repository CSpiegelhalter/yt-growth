// lib/sync-youtube.ts
import { prisma } from "@/prisma";
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";
import { generateAndStoreNiche } from "@/lib/channel-niche";

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

type YouTubeVideoItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails?: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
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

/**
 * Sync user's YouTube channels from the API
 * Called after OAuth callback
 * @param userId - The user's database ID
 * @param googleAccountId - Optional: specific GoogleAccount to sync. If not provided, syncs ALL GoogleAccounts for the user.
 */
export async function syncUserChannels(
  userId: number,
  googleAccountId?: number
): Promise<void> {
  // Get either a specific GoogleAccount or all GoogleAccounts for the user
  const googleAccounts = googleAccountId
    ? await prisma.googleAccount.findMany({
        where: { id: googleAccountId, userId },
      })
    : await prisma.googleAccount.findMany({ where: { userId } });

  if (googleAccounts.length === 0) return;

  // Mark channels as syncing
  await prisma.channel.updateMany({
    where: { userId },
    data: { syncStatus: "running" },
  });

  try {
    // Sync channels from each Google account
    for (const ga of googleAccounts) {
      // Fetch user's owned channels (includes Brand Accounts when selected during OAuth)
      // Include statistics to get video count and subscriber count
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

      // Also fetch Brand Account / managed channels
      const managedChannelsUrl = new URL(
        "https://www.googleapis.com/youtube/v3/channels"
      );
      managedChannelsUrl.search = new URLSearchParams({
        part: "id,snippet",
        managedByMe: "true",
      }).toString();

      const uniqueChannels = ownedChannelsData.items ?? [];

      for (const ch of uniqueChannels) {
        const thumb =
          ch.snippet.thumbnails?.high?.url ??
          ch.snippet.thumbnails?.default?.url ??
          null;

        // Parse statistics (YouTube returns these as strings)
        const totalVideoCount = ch.statistics?.videoCount
          ? parseInt(ch.statistics.videoCount, 10)
          : null;
        const subscriberCount =
          ch.statistics?.subscriberCount &&
          !ch.statistics?.hiddenSubscriberCount
            ? parseInt(ch.statistics.subscriberCount, 10)
            : null;

        // Upsert channel (store which GoogleAccount it belongs to)
        const channel = await prisma.channel.upsert({
          where: {
            userId_youtubeChannelId: { userId, youtubeChannelId: ch.id },
          },
          update: {
            title: ch.snippet.title,
            thumbnailUrl: thumb,
            totalVideoCount,
            subscriberCount,
            lastSyncedAt: new Date(),
            syncStatus: "idle",
            syncError: null,
            googleAccountId: ga.id,
          },
          create: {
            userId,
            youtubeChannelId: ch.id,
            title: ch.snippet.title,
            thumbnailUrl: thumb,
            totalVideoCount,
            subscriberCount,
            lastSyncedAt: new Date(),
            syncStatus: "idle",
            googleAccountId: ga.id,
          },
        });

        // Fetch recent videos for this channel (await so videos are ready when user sees dashboard)
        try {
          await fetchChannelVideos(ga, channel.id, ch.id);

          // Generate and store the channel's niche based on video titles
          // This is used by competitors page and idea generation
          try {
            await generateAndStoreNiche(channel.id);
          } catch (nicheErr) {
            console.error(
              `Failed to generate niche for channel ${ch.id}:`,
              nicheErr
            );
            // Don't throw - niche is not critical for initial sync
          }
        } catch (err) {
          console.error(`Failed to fetch videos for channel ${ch.id}:`, err);
          // Don't throw - channel is synced, videos are optional
        }
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[syncUserChannels] Error for user ${userId}:`, message);
    await prisma.channel.updateMany({
      where: { userId },
      data: { syncStatus: "error", syncError: message },
    });
    throw e;
  }
}

// Number of videos to sync (divisible by 6 for grid layout)
const SYNC_VIDEO_COUNT = 96;

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
    // Avoid search.list (expensive quota). Use uploads playlist.
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
      // Fallback for rare channels where uploads playlist isn't returned.
      // Costs more quota. Limited to 50 for search endpoint.
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
      if (videoIds.length === 0) return;

      // Fetch video details (duration, tags, description, statistics, status)
      const detailsUrl = new URL(
        "https://www.googleapis.com/youtube/v3/videos"
      );
      detailsUrl.search = new URLSearchParams({
        part: "id,contentDetails,snippet,statistics,status",
        id: videoIds.join(","),
      }).toString();

      const detailsData = await googleFetchWithAutoRefresh<{
        items: YouTubeVideoDetails[];
      }>(ga, detailsUrl.toString());

      const detailsMap = new Map(
        (detailsData.items ?? []).map((v) => [v.id, v])
      );

      // Cache expiration for metrics (12 hours)
      const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);

      for (const item of searchData.items ?? []) {
        const videoId = item.id.videoId;
        const details = detailsMap.get(videoId);
        const thumb =
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          item.snippet.thumbnails?.default?.url ??
          null;

        const durationSec = details?.contentDetails?.duration
          ? parseDuration(details.contentDetails.duration)
          : null;

        // Get tags, description, categoryId, and privacy status from video details
        const tags = details?.snippet?.tags?.join(",") ?? "";
        const description = details?.snippet?.description ?? "";
        const categoryId = details?.snippet?.categoryId ?? null;
        const privacyStatus = details?.status?.privacyStatus ?? null;

        // Parse statistics from Data API (total lifetime counts)
        const views = details?.statistics?.viewCount
          ? parseInt(details.statistics.viewCount, 10)
          : 0;
        const likes = details?.statistics?.likeCount
          ? parseInt(details.statistics.likeCount, 10)
          : 0;

        const video = await prisma.video.upsert({
          where: {
            channelId_youtubeVideoId: {
              channelId: channelDbId,
              youtubeVideoId: videoId,
            },
          },
          update: {
            title: item.snippet.title,
            description,
            thumbnailUrl: thumb,
            publishedAt: new Date(item.snippet.publishedAt),
            durationSec,
            tags,
            categoryId,
            privacyStatus,
          },
          create: {
            channelId: channelDbId,
            youtubeVideoId: videoId,
            title: item.snippet.title,
            description,
            thumbnailUrl: thumb,
            publishedAt: new Date(item.snippet.publishedAt),
            durationSec,
            tags,
            categoryId,
            privacyStatus,
          },
        });

        // Upsert VideoMetrics with Data API statistics (total views, not Analytics API)
        await prisma.videoMetrics.upsert({
          where: { videoId: video.id },
          update: {
            views,
            likes,
            fetchedAt: new Date(),
            cachedUntil,
          },
          create: {
            videoId: video.id,
            channelId: channelDbId,
            views,
            likes,
            cachedUntil,
          },
        });
      }

      // Update channel lastSyncedAt and return
      await prisma.channel.update({
        where: { id: channelDbId },
        data: { lastSyncedAt: new Date() },
      });

      return;
    }

    // Fetch videos with pagination (YouTube API max 50 per page)
    let allPlaylistItems: Array<{
      contentDetails: { videoId: string };
      snippet: { title: string; publishedAt: string; thumbnails: any };
    }> = [];
    let nextPageToken: string | undefined;

    while (allPlaylistItems.length < SYNC_VIDEO_COUNT) {
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
          snippet: { title: string; publishedAt: string; thumbnails: any };
        }>;
      }>(ga, playlistUrl.toString());

      allPlaylistItems.push(...(playlistData.items ?? []));
      nextPageToken = playlistData.nextPageToken;

      // No more pages
      if (!nextPageToken || (playlistData.items ?? []).length === 0) break;
    }

    // Trim to SYNC_VIDEO_COUNT
    allPlaylistItems = allPlaylistItems.slice(0, SYNC_VIDEO_COUNT);

    const videoIds = allPlaylistItems
      .map((v) => v.contentDetails.videoId)
      .filter(Boolean);
    if (videoIds.length === 0) return;

    // Fetch video details (duration, tags, description, statistics)
    // YouTube API allows max 50 IDs per request, so batch if needed
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

    const detailsMap = new Map(allDetails.map((v) => [v.id, v]));

    // Cache expiration for metrics (12 hours)
    const cachedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);

    for (const item of allPlaylistItems) {
      const videoId = item.contentDetails.videoId;
      const details = detailsMap.get(videoId);
      const thumb =
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        null;

      const durationSec = details?.contentDetails?.duration
        ? parseDuration(details.contentDetails.duration)
        : null;

      // Get tags, description, categoryId, and privacy status from video details
      const tags = details?.snippet?.tags?.join(",") ?? "";
      const description = details?.snippet?.description ?? "";
      const categoryId = details?.snippet?.categoryId ?? null;
      const privacyStatus = details?.status?.privacyStatus ?? null;

      // Parse statistics from Data API (total lifetime counts)
      const views = details?.statistics?.viewCount
        ? parseInt(details.statistics.viewCount, 10)
        : 0;
      const likes = details?.statistics?.likeCount
        ? parseInt(details.statistics.likeCount, 10)
        : 0;

      const video = await prisma.video.upsert({
        where: {
          channelId_youtubeVideoId: {
            channelId: channelDbId,
            youtubeVideoId: videoId,
          },
        },
        update: {
          title: item.snippet.title,
          description,
          thumbnailUrl: thumb,
          publishedAt: new Date(item.snippet.publishedAt),
          durationSec,
          tags,
          categoryId,
          privacyStatus,
        },
        create: {
          channelId: channelDbId,
          youtubeVideoId: videoId,
          title: item.snippet.title,
          description,
          thumbnailUrl: thumb,
          publishedAt: new Date(item.snippet.publishedAt),
          durationSec,
          tags,
          categoryId,
          privacyStatus,
        },
      });

      // Upsert VideoMetrics with Data API statistics (total views, not Analytics API)
      await prisma.videoMetrics.upsert({
        where: { videoId: video.id },
        update: {
          views,
          likes,
          fetchedAt: new Date(),
          cachedUntil,
        },
        create: {
          videoId: video.id,
          channelId: channelDbId,
          views,
          likes,
          cachedUntil,
        },
      });
    }

    // Update channel video count
    const videoCount = await prisma.video.count({
      where: { channelId: channelDbId },
    });

    await prisma.channel.update({
      where: { id: channelDbId },
      data: { lastSyncedAt: new Date() },
    });

    console.log(`Synced ${videoCount} videos for channel ${youtubeChannelId}`);
  } catch (err) {
    console.error(
      `Error fetching videos for channel ${youtubeChannelId}:`,
      err
    );
    // Don't throw - this is a background task
  }
}

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}
