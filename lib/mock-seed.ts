import { prisma } from "@/prisma";
import { fetchChannelVideos } from "@/lib/youtube-api";

// Minimal GA type to satisfy fetchChannelVideos in mock mode.
type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

/**
 * In YT_MOCK_MODE we want the app to "just work" even if the user hasn't synced yet.
 * This helper ensures the channel exists and has a minimum number of videos in DB,
 * using mocked YouTube API responses (no quota).
 */
export async function ensureMockChannelSeeded(input: {
  userId: number;
  youtubeChannelId: string;
  minVideos: number;
  ga: GoogleAccount;
}) {
  // Upsert the Channel row (safe for dev; keeps ownership mapping stable).
  const channel = await prisma.channel.upsert({
    where: {
      userId_youtubeChannelId: {
        userId: input.userId,
        youtubeChannelId: input.youtubeChannelId,
      },
    },
    create: {
      userId: input.userId,
      youtubeChannelId: input.youtubeChannelId,
      title: "Mock Channel",
      syncStatus: "idle",
      lastSyncedAt: new Date(),
    },
    update: {
      lastSyncedAt: new Date(),
    },
  });

  const existingCount = await prisma.video.count({
    where: { channelId: channel.id },
  });
  // Skip if we already have enough videos seeded (works in both real and mock mode)
  if (existingCount >= input.minVideos) {
    return channel;
  }

  const videos = await fetchChannelVideos(
    input.ga,
    input.youtubeChannelId,
    Math.max(25, input.minVideos)
  );

  for (const v of videos) {
    await prisma.video.upsert({
      where: {
        channelId_youtubeVideoId: {
          channelId: channel.id,
          youtubeVideoId: v.videoId,
        },
      },
      update: {
        title: v.title,
        description: v.description,
        publishedAt: new Date(v.publishedAt),
        durationSec: v.durationSec,
        tags: v.tags,
        thumbnailUrl: v.thumbnailUrl,
      },
      create: {
        channelId: channel.id,
        youtubeVideoId: v.videoId,
        title: v.title,
        description: v.description,
        publishedAt: new Date(v.publishedAt),
        durationSec: v.durationSec,
        tags: v.tags,
        thumbnailUrl: v.thumbnailUrl,
      },
    });
  }

  await prisma.channel.update({
    where: { id: channel.id },
    data: { lastSyncedAt: new Date(), syncStatus: "idle" },
  });

  return channel;
}
