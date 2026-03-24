/**
 * POST /api/cron/keyword-snapshot
 *
 * Weekly cron that snapshots keyword data for all active channels.
 * Creates NicheKeywordHistory records for trend tracking.
 * Protected by CRON_SECRET.
 */
import { fetchNicheKeywords } from "@/lib/features/suggestions/use-cases/fetchNicheKeywords";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const log = createLogger({ module: "cron/keyword-snapshot" });

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Get all channels that have saved competitors (active users)
    const activeChannels = await prisma.savedCompetitor.findMany({
      where: { isActive: true },
      select: { userId: true, channelId: true },
      distinct: ["channelId"],
    });

    let snapshotsCreated = 0;
    let errors = 0;

    for (const channel of activeChannels) {
      try {
        const keywords = await fetchNicheKeywords({
          userId: channel.userId,
          channelId: channel.channelId,
        });

        if (keywords.length === 0) continue;

        // Snapshot top 10 keywords
        await prisma.nicheKeywordHistory.createMany({
          data: keywords.slice(0, 10).map((kw) => ({
            channelId: channel.channelId,
            keyword: kw.keyword,
            searchVolume: kw.searchVolume,
            difficulty: kw.difficulty,
            trendDirection: kw.trendDirection,
          })),
        });

        snapshotsCreated += Math.min(keywords.length, 10);
      } catch (err) {
        errors++;
        log.warn("Keyword snapshot failed for channel", {
          channelId: channel.channelId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const duration = Date.now() - startTime;
    log.info("Keyword snapshot cron complete", {
      channels: activeChannels.length,
      snapshotsCreated,
      errors,
      durationMs: duration,
    });

    return Response.json({
      ok: true,
      channels: activeChannels.length,
      snapshotsCreated,
      errors,
      durationMs: duration,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    log.error("Keyword snapshot cron failed", {
      error: err instanceof Error ? err.message : String(err),
      durationMs: duration,
    });

    return Response.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 },
    );
  }
}
