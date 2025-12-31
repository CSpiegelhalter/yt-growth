// lib/sync-youtube.ts
import { prisma } from "@/prisma";
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";

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

/**
 * Fetch recent videos for a channel
 * Stores the last 20 videos in the database
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
      // Costs more quota.
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.search = new URLSearchParams({
        part: "id,snippet",
        channelId: youtubeChannelId,
        order: "date",
        type: "video",
        maxResults: "25",
      }).toString();

      const searchData = await googleFetchWithAutoRefresh<{
        items: YouTubeVideoItem[];
      }>(ga, searchUrl.toString());

      const videoIds = (searchData.items ?? [])
        .map((v) => v.id.videoId)
        .filter(Boolean);
      if (videoIds.length === 0) return;

      // Fetch video details (duration, tags, description)
      const detailsUrl = new URL(
        "https://www.googleapis.com/youtube/v3/videos"
      );
      detailsUrl.search = new URLSearchParams({
        part: "id,contentDetails,snippet",
        id: videoIds.join(","),
      }).toString();

      const detailsData = await googleFetchWithAutoRefresh<{
        items: YouTubeVideoDetails[];
      }>(ga, detailsUrl.toString());

      const detailsMap = new Map(
        (detailsData.items ?? []).map((v) => [v.id, v])
      );

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

        // Get tags, description, and categoryId from video details
        const tags = details?.snippet?.tags?.join(",") ?? "";
        const description = details?.snippet?.description ?? "";
        const categoryId = details?.snippet?.categoryId ?? null;

        await prisma.video.upsert({
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

    const playlistUrl = new URL(
      "https://www.googleapis.com/youtube/v3/playlistItems"
    );
    playlistUrl.search = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: "25",
    }).toString();

    const playlistData = await googleFetchWithAutoRefresh<{
      items: Array<{
        contentDetails: { videoId: string };
        snippet: { title: string; publishedAt: string; thumbnails: any };
      }>;
    }>(ga, playlistUrl.toString());

    const videoIds = (playlistData.items ?? [])
      .map((v) => v.contentDetails.videoId)
      .filter(Boolean);
    if (videoIds.length === 0) return;

    // Fetch video details (duration, tags, description)
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.search = new URLSearchParams({
      part: "id,contentDetails,snippet",
      id: videoIds.join(","),
    }).toString();

    const detailsData = await googleFetchWithAutoRefresh<{
      items: YouTubeVideoDetails[];
    }>(ga, detailsUrl.toString());

    const detailsMap = new Map((detailsData.items ?? []).map((v) => [v.id, v]));

    for (const item of playlistData.items ?? []) {
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

      // Get tags, description, and categoryId from video details
      const tags = details?.snippet?.tags?.join(",") ?? "";
      const description = details?.snippet?.description ?? "";
      const categoryId = details?.snippet?.categoryId ?? null;

      await prisma.video.upsert({
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

/**
 * Trigger a full sync for a specific channel
 * Called from the "Refresh" button
 */
export async function syncSingleChannel(
  userId: number,
  channelId: string
): Promise<{ success: boolean; videosCount: number }> {
  const ga = await prisma.googleAccount.findFirst({ where: { userId } });
  if (!ga) {
    throw new Error("No Google account connected");
  }

  const channel = await prisma.channel.findFirst({
    where: { userId, youtubeChannelId: channelId },
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  // Mark as syncing
  await prisma.channel.update({
    where: { id: channel.id },
    data: { syncStatus: "running", syncError: null },
  });

  try {
    // Fetch videos
    await fetchChannelVideos(ga, channel.id, channelId);

    // Update status
    const videoCount = await prisma.video.count({
      where: { channelId: channel.id },
    });

    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        syncStatus: "idle",
        syncError: null,
        lastSyncedAt: new Date(),
      },
    });

    return { success: true, videosCount: videoCount };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    await prisma.channel.update({
      where: { id: channel.id },
      data: { syncStatus: "error", syncError: message },
    });
    throw e;
  }
}
