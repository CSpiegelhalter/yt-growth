/**
 * POST /api/cron/competitor-monitor
 *
 * Cron job that monitors saved competitors for new videos.
 * Uses YouTube RSS (free) + Data API for stats.
 * Detects breakouts (>3x niche average).
 *
 * Protected by CRON_SECRET header.
 */
import { monitorCompetitors } from "@/lib/features/competitors/use-cases/monitorCompetitors";
import { createLogger } from "@/lib/shared/logger";

const log = createLogger({ module: "cron/competitor-monitor" });

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await monitorCompetitors();

    const duration = Date.now() - startTime;
    log.info("Cron completed", { ...result, durationMs: duration });

    return Response.json({ ok: true, ...result, durationMs: duration });
  } catch (err) {
    const duration = Date.now() - startTime;
    log.error("Cron failed", {
      error: err instanceof Error ? err.message : String(err),
      durationMs: duration,
    });

    return Response.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 },
    );
  }
}
