import { prisma } from "@/prisma";
import { ApiError, asApiResponse } from "@/lib/http";
import { ensureSubscribed, requireUserContext } from "@/lib/server-user";
import { fetchRetentionPoints } from "@/lib/google-client";
import { computeRetentionCliff } from "@/lib/retention";
import { generateRetentionHypotheses } from "@/lib/llm";

export async function GET(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const { user, isSubscribed } = await requireUserContext();
    ensureSubscribed(isSubscribed);

    const channelIdNum = Number(params.channelId);
    const channel = await prisma.channel.findUnique({ where: { id: channelIdNum } });
    if (!channel || channel.userId !== user.id) throw new ApiError(404, "Channel not found");

    const force = new URL(req.url).searchParams.get("force") === "1";
    const now = new Date();
    const cachedFresh =
      channel.lastRetentionSyncedAt &&
      now.getTime() - channel.lastRetentionSyncedAt.getTime() < 12 * 60 * 60 * 1000;

    // Use cached blobs when fresh
    if (cachedFresh && !force) {
      const cached = await prisma.retentionBlob.findMany({
        where: { channelId: channel.id },
        orderBy: { fetchedAt: "desc" },
        take: 10,
        include: { Video: true },
      });
      return Response.json({
        cached: true,
        items: cached.map((r) => ({
          videoId: r.Video.youtubeVideoId,
          title: r.Video.title,
          durationSec: r.Video.durationSec,
          cliffTimeSec: r.cliffTimeSec,
          cliffReason: r.cliffReason,
          slope: r.slope,
          context: r.contextJson,
          fetchedAt: r.fetchedAt,
        })),
      });
    }

    const videos = await prisma.video.findMany({
      where: { channelId: channel.id },
      orderBy: [{ publishedAt: "desc" }],
      take: 10,
    });

    const results: Array<{
      videoId: string;
      title: string | null;
      durationSec: number | null;
      cliffTimeSec: number | null;
      cliffReason: string | null;
      slope: number | null;
      context: any;
      fetchedAt: Date;
    }> = [];

    for (const video of videos) {
      const points = await fetchRetentionPoints(
        user.id,
        channel.youtubeChannelId,
        video.youtubeVideoId
      );
      const cliff = computeRetentionCliff(video.durationSec ?? 0, points);
      const existing = await prisma.retentionBlob.findFirst({
        where: { videoId: video.id },
      });
      const blob = existing
        ? await prisma.retentionBlob.update({
            where: { id: existing.id },
            data: {
              points,
              cliffTimeSec: cliff?.cliffTimeSec ?? null,
              cliffReason: cliff?.cliffReason ?? null,
              slope: cliff?.slope ?? null,
              contextJson: cliff?.context ?? null,
              fetchedAt: now,
              userId: user.id,
              channelId: channel.id,
            },
          })
        : await prisma.retentionBlob.create({
            data: {
              userId: user.id,
              channelId: channel.id,
              videoId: video.id,
              points,
              cliffTimeSec: cliff?.cliffTimeSec ?? null,
              cliffReason: cliff?.cliffReason ?? null,
              slope: cliff?.slope ?? null,
              contextJson: cliff?.context ?? null,
              fetchedAt: now,
            },
          });
      results.push({
        videoId: video.youtubeVideoId,
        title: video.title,
        durationSec: video.durationSec,
        cliffTimeSec: blob.cliffTimeSec,
        cliffReason: blob.cliffReason,
        slope: blob.slope,
        context: blob.contextJson,
        fetchedAt: blob.fetchedAt,
      });
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastRetentionSyncedAt: now },
    });

    const hypothesis = results.length
      ? await generateRetentionHypotheses(
          results.map((r) => ({ title: r.title ?? undefined, cliffTimeSec: r.cliffTimeSec ?? undefined, cliffReason: r.cliffReason ?? undefined }))
        )
      : "";

    return Response.json({ cached: false, items: results, hypothesis });
  } catch (err) {
    return asApiResponse(err);
  }
}
