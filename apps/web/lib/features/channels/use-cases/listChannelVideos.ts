import { prisma } from "@/prisma";
import { ChannelError } from "../errors";

const DEFAULT_PAGE_SIZE = 24;

type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

type YouTubeVideoRow = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSec: number;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
};

export type ListChannelVideosDeps = {
  getGoogleAccount: (userId: number, channelId: string) => Promise<GoogleAccount | null>;
  fetchChannelVideos: (ga: GoogleAccount, channelId: string, maxResults: number) => Promise<YouTubeVideoRow[]>;
};

type ListChannelVideosInput = {
  userId: number;
  channelId: string;
  offset?: number;
  limit?: number;
};

type ChannelVideoItem = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSec: number;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: null;
  subscribersGained: null;
  subscribersLost: null;
  estimatedMinutesWatched: null;
  avgViewDuration: null;
  avgViewPercentage: null;
};

type ListChannelVideosResult = {
  channelId: string;
  videos: ChannelVideoItem[];
  pagination: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
};

export async function listChannelVideos(
  input: ListChannelVideosInput,
  deps: ListChannelVideosDeps,
): Promise<ListChannelVideosResult> {
  const { userId, channelId } = input;
  const offset = Math.max(0, input.offset ?? 0);
  const limit = Math.min(
    100,
    Math.max(6, input.limit ?? DEFAULT_PAGE_SIZE),
  );

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
    select: { id: true },
  });
  if (!channel) {
    throw new ChannelError("NOT_FOUND", "Channel not found");
  }

  const ga = await deps.getGoogleAccount(userId, channelId);
  if (!ga) {
    throw new ChannelError(
      "INVALID_INPUT",
      "Google account not found for this channel",
    );
  }

  const maxNeededWithSentinel = offset + limit + 1;
  const allVideos = await deps.fetchChannelVideos(
    ga,
    channelId,
    maxNeededWithSentinel,
  );
  const pageVideos = allVideos.slice(offset, offset + limit);

  const videos: ChannelVideoItem[] = pageVideos.map((v) => ({
    videoId: v.videoId,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    durationSec: v.durationSec,
    publishedAt: v.publishedAt,
    views: v.views ?? 0,
    likes: v.likes ?? 0,
    comments: v.comments ?? 0,
    shares: null,
    subscribersGained: null,
    subscribersLost: null,
    estimatedMinutesWatched: null,
    avgViewDuration: null,
    avgViewPercentage: null,
  }));

  return {
    channelId,
    videos,
    pagination: {
      offset,
      limit,
      hasMore: allVideos.length > offset + limit,
    },
  };
}
