// lib/sync-youtube.ts
import { prisma } from "@/prisma";
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";

export async function syncUserChannels(userId: number) {
  const ga = await prisma.googleAccount.findFirst({ where: { userId } });
  if (!ga) return;

  // mark status
  await prisma.channel.updateMany({
    where: { userId },
    data: { syncStatus: "running" },
  });

  try {
    const base = new URL("https://www.googleapis.com/youtube/v3/channels");
    base.search = new URLSearchParams({
      part: "id,snippet",
      mine: "true",
    }).toString();

    const data = await googleFetchWithAutoRefresh<{
      items: Array<{
        id: string;
        snippet: { title: string; country?: string; thumbnails?: any };
      }>;
    }>(ga, base.toString());

    for (const it of data.items ?? []) {
      const thumb =
        it.snippet.thumbnails?.high?.url ??
        it.snippet.thumbnails?.default?.url ??
        null;
      await prisma.channel.upsert({
        where: { userId_youtubeChannelId: { userId, youtubeChannelId: it.id } },
        update: {
          title: it.snippet.title,
          thumbnailUrl: thumb,
          lastSyncedAt: new Date(),
          syncStatus: "idle",
          syncError: null,
        },
        create: {
          userId,
          youtubeChannelId: it.id,
          title: it.snippet.title,
          thumbnailUrl: thumb,
          lastSyncedAt: new Date(),
          syncStatus: "idle",
        },
      });
    }
  } catch (e: any) {
    await prisma.channel.updateMany({
      where: { userId },
      data: { syncStatus: "error", syncError: String(e?.message ?? e) },
    });
    throw e;
  }
}
