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

    const plans = await prisma.plan.findMany({
      where: { channelId, userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return Response.json({ plans });
  } catch (err) {
    return asApiResponse(err);
  }
}
