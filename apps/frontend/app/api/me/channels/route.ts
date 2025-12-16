import { prisma } from "@/prisma";
import { asApiResponse } from "@/lib/http";
import { requireUserContext } from "@/lib/server-user";

export async function GET() {
  try {
    const { user } = await requireUserContext();
    const channels = await prisma.channel.findMany({
      where: { userId: user.id },
      orderBy: [{ connectedAt: "desc" }],
    });

    return Response.json(
      channels.map((c) => ({
        id: c.id,
        youtubeChannelId: c.youtubeChannelId,
        title: c.title,
        thumbnailUrl: c.thumbnailUrl,
        connectedAt: c.connectedAt,
        lastSyncedAt: c.lastSyncedAt,
        lastRetentionSyncedAt: c.lastRetentionSyncedAt,
        lastPlanGeneratedAt: c.lastPlanGeneratedAt,
        lastSubscriberAuditAt: c.lastSubscriberAuditAt,
        syncStatus: c.syncStatus,
        syncError: c.syncError,
      })),
      {
        headers: { "cache-control": "no-store" },
      }
    );
  } catch (err: any) {
    return asApiResponse(err);
  }
}
