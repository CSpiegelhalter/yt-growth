import "server-only";

import { prisma } from "@/prisma";
import type { CompetitorVideo } from "@/types/api";
import type { GetMoreFromChannelInput } from "../types";
import { CompetitorError } from "../errors";

const MORE_FROM_CHANNEL_RANGE_DAYS = 28;

type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

export type GetMoreFromChannelDeps = {
  getGoogleAccount: (userId: number, channelId: string) => Promise<GoogleAccount | null>;
  fetchVideoDetails: (ga: GoogleAccount, videoId: string) => Promise<{ channelId: string; channelTitle: string } | null>;
  fetchRecentChannelVideos: (
    ga: GoogleAccount,
    channelId: string,
    publishedAfter: string,
    maxResults: number,
  ) => Promise<Array<{ videoId: string; title: string; publishedAt: string; thumbnailUrl: string | null; views: number; viewsPerDay: number }>>;
};

/**
 * Fetch recent videos from a competitor's channel.
 *
 * Lightweight helper for "More from this channel" — fetches up to 4 recent
 * videos from the last 28 days, excluding the current video.
 */
export async function getMoreFromChannel(
  input: GetMoreFromChannelInput,
  deps: GetMoreFromChannelDeps,
): Promise<CompetitorVideo[]> {
  const { userId, channelId, videoId } = input;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new CompetitorError("NOT_FOUND", "Channel not found");
  }

  const ga = await deps.getGoogleAccount(userId, channelId);
  if (!ga) {
    throw new CompetitorError("INVALID_INPUT", "Google account not connected");
  }

  let competitorChannelId: string | null = null;
  let competitorChannelTitle: string | null = null;

  const dbVideo = await prisma.competitorVideo.findUnique({
    where: { videoId },
    select: { channelId: true, channelTitle: true },
  });

  if (dbVideo) {
    competitorChannelId = dbVideo.channelId;
    competitorChannelTitle = dbVideo.channelTitle;
  } else {
    const details = await deps.fetchVideoDetails(ga, videoId);
    if (!details) {
      throw new CompetitorError("NOT_FOUND", "Video not found");
    }
    competitorChannelId = details.channelId;
    competitorChannelTitle = details.channelTitle;
  }

  const now = new Date();
  const publishedAfter = new Date(
    now.getTime() - MORE_FROM_CHANNEL_RANGE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const channelVideos = await deps.fetchRecentChannelVideos(
    ga,
    competitorChannelId,
    publishedAfter,
    6,
  );

  return channelVideos
    .filter((v) => v.videoId !== videoId)
    .slice(0, 4)
    .map((v) => ({
      videoId: v.videoId,
      title: v.title,
      channelId: competitorChannelId!,
      channelTitle: competitorChannelTitle ?? "Channel",
      channelThumbnailUrl: null,
      videoUrl: `https://youtube.com/watch?v=${v.videoId}`,
      channelUrl: `https://youtube.com/channel/${competitorChannelId}`,
      thumbnailUrl: v.thumbnailUrl,
      publishedAt: v.publishedAt,
      stats: { viewCount: v.views },
      derived: { viewsPerDay: v.viewsPerDay },
    }));
}
