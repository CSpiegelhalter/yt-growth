import { prisma } from "@/prisma";
import { ApiError, asApiResponse } from "@/lib/http";
import { ensureSubscribed, requireUserContext } from "@/lib/server-user";

export async function GET(_: Request, { params }: { params: { channelId: string } }) {
  try {
    const ctx = await requireUserContext();
    ensureSubscribed(ctx.isSubscribed);

    const channelId = Number(params.channelId);
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || channel.userId !== ctx.user.id) throw new ApiError(404, "Channel not found");

    const metrics = await prisma.videoMetric.findMany({
      where: { channelId, userId: ctx.user.id },
      orderBy: [{ fetchedAt: "desc" }],
      include: { Video: true },
      take: 50,
    });

    const latestByVideo = new Map<number, (typeof metrics)[number]>();
    for (const m of metrics) {
      if (!latestByVideo.has(m.videoId)) latestByVideo.set(m.videoId, m);
    }

    const rows = Array.from(latestByVideo.values()).map((m) => {
      const views = m.viewCount ?? 0;
      const subs = m.subscribersGained ?? 0;
      const subsPerThousand = views > 0 ? (subs / Math.max(1, views)) * 1000 : 0;
      return {
        videoId: m.Video?.youtubeVideoId,
        title: m.Video?.title ?? "Untitled",
        views,
        subscribersGained: subs,
        subsPerThousand: Number(subsPerThousand.toFixed(2)),
      };
    });

    const top = rows.sort((a, b) => b.subsPerThousand - a.subsPerThousand).slice(0, 3);
    const summary =
      top.length === 0
        ? "No data yet. Sync your channel to see subscriber magnets."
        : `Top patterns: ${top.map((r) => r.title).join(", ")}. Double down on similar hooks and intros.`;

    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastSubscriberAuditAt: new Date() },
    });

    return Response.json({ items: top, summary });
  } catch (err) {
    return asApiResponse(err);
  }
}
