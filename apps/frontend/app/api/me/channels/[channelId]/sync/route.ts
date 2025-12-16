import { prisma } from "@/prisma";
import { ApiError, asApiResponse } from "@/lib/http";
import { requireUserContext } from "@/lib/server-user";
import { listRecentVideos, fetchVideoMetrics } from "@/lib/google-client";
import { z } from "zod";

const bodySchema = z.object({ force: z.boolean().optional() }).optional();

export async function POST(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const { user } = await requireUserContext();
    const channelId = Number(params.channelId);
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || channel.userId !== user.id) throw new ApiError(404, "Channel not found");

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({} as any)));
    const force = parsed.success ? parsed.data?.force : false;
    const now = new Date();
    if (!force && channel.lastSyncedAt && now.getTime() - channel.lastSyncedAt.getTime() < 12 * 60 * 60 * 1000) {
      return Response.json({ cached: true, lastSyncedAt: channel.lastSyncedAt });
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: { syncStatus: "running", syncError: null },
    });

    const videos = await listRecentVideos(user.id, channel.youtubeChannelId);

    const videoRecords = [];
    for (const v of videos) {
      const record = await prisma.video.upsert({
        where: { channelId_youtubeVideoId: { channelId: channel.id, youtubeVideoId: v.videoId } },
        update: {
          title: v.title,
          publishedAt: v.publishedAt ?? undefined,
          durationSec: v.durationSec ?? undefined,
          tags: v.tags ?? undefined,
          thumbnailUrl: v.thumbnailUrl ?? undefined,
          userId: user.id,
          updatedAt: now,
        },
        create: {
          channelId: channel.id,
          userId: user.id,
          youtubeVideoId: v.videoId,
          title: v.title,
          publishedAt: v.publishedAt ?? undefined,
          durationSec: v.durationSec ?? undefined,
          tags: v.tags ?? undefined,
          thumbnailUrl: v.thumbnailUrl ?? undefined,
          lastMetricsSyncedAt: now,
        },
      });
      videoRecords.push(record);
    }

    const videoIds = videoRecords.map((v) => v.youtubeVideoId);
    const metrics = await fetchVideoMetrics(user.id, channel.youtubeChannelId, videoIds);
    for (const m of metrics) {
      const video = videoRecords.find((v) => v.youtubeVideoId === m.videoId);
      if (!video) continue;
      await prisma.videoMetric.upsert({
        where: {
          videoId_periodStart_periodEnd: {
            videoId: video.id,
            periodStart: m.periodStart,
            periodEnd: m.periodEnd,
          },
        },
        update: {
          viewCount: m.viewCount,
          likeCount: m.likeCount,
          commentCount: m.commentCount,
          subscribersGained: m.subscribersGained,
          estimatedMinutesWatched: m.estimatedMinutesWatched,
          averageViewDuration: m.averageViewDuration,
          fetchedAt: now,
        },
        create: {
          userId: user.id,
          channelId: channel.id,
          videoId: video.id,
          viewCount: m.viewCount,
          likeCount: m.likeCount,
          commentCount: m.commentCount,
          subscribersGained: m.subscribersGained,
          estimatedMinutesWatched: m.estimatedMinutesWatched,
          averageViewDuration: m.averageViewDuration,
          periodStart: m.periodStart,
          periodEnd: m.periodEnd,
          fetchedAt: now,
        },
      });
      await prisma.video.update({
        where: { id: video.id },
        data: { lastMetricsSyncedAt: now },
      });
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastSyncedAt: now, syncStatus: "idle", syncError: null },
    });

    return Response.json({ synced: videos.length, metrics: metrics.length, lastSyncedAt: now });
  } catch (err) {
    const channelId = Number(params.channelId);
    if (Number.isFinite(channelId)) {
      await prisma.channel.updateMany({
        where: { id: channelId },
        data: { syncStatus: "error", syncError: err instanceof Error ? err.message : String(err) },
      });
    }
    return asApiResponse(err);
  }
}
