import { prisma } from "@/prisma";
import { asApiResponse, ApiError } from "@/lib/http";
import { requireUserContext } from "@/lib/server-user";

export async function DELETE(_: Request, { params }: { params: { channelId: string } }) {
  try {
    const { user } = await requireUserContext();
    const channelId = Number(params.channelId);
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || channel.userId !== user.id) throw new ApiError(404, "Channel not found");

    await prisma.$transaction([
      prisma.retentionBlob.deleteMany({ where: { channelId } }),
      prisma.videoMetric.deleteMany({ where: { channelId } }),
      prisma.plan.deleteMany({ where: { channelId } }),
      prisma.video.deleteMany({ where: { channelId } }),
      prisma.subscription.updateMany({
        where: { channelId },
        data: { channelId: null },
      }),
      prisma.channel.delete({ where: { id: channelId } }),
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    return asApiResponse(err);
  }
}