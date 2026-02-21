import type { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import {
  getGoogleApiUsageStats,
  resetGoogleApiUsageStats,
} from "@/lib/google-tokens";
import { getCurrentUser } from "@/lib/server/auth";
import { isAdminUser } from "@/lib/server/auth";
import { createApiRoute } from "@/lib/api/route";

async function GETHandler(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prefer DB-backed stats (works across Next dev workers). Fall back to in-memory.
  try {
    const totals = (
      await prisma.$queryRawUnsafe<
        Array<{ totalcalls: bigint; totalunits: bigint }>
      >(
        `SELECT COUNT(*)::bigint AS totalCalls,
              COALESCE(SUM("estimatedUnits"),0)::bigint AS totalUnits
       FROM "GoogleApiCallLog"
       WHERE "at" > now() - interval '6 hours'`
      )
    )[0];

    const byHost = await prisma.$queryRawUnsafe<
      Array<{ host: string; calls: bigint; units: bigint }>
    >(
      `SELECT host, COUNT(*)::bigint AS calls, COALESCE(SUM("estimatedUnits"),0)::bigint AS units
       FROM "GoogleApiCallLog"
       WHERE "at" > now() - interval '6 hours'
       GROUP BY host
       ORDER BY units DESC, calls DESC
       LIMIT 50`
    );

    const byPath = await prisma.$queryRawUnsafe<
      Array<{ path: string; calls: bigint; units: bigint }>
    >(
      `SELECT path, COUNT(*)::bigint AS calls, COALESCE(SUM("estimatedUnits"),0)::bigint AS units
       FROM "GoogleApiCallLog"
       WHERE "at" > now() - interval '6 hours'
       GROUP BY path
       ORDER BY units DESC, calls DESC
       LIMIT 50`
    );

    const lastCalls = await prisma.$queryRawUnsafe<
      Array<{ at: Date; url: string; status: string; estimatedUnits: number }>
    >(
      `SELECT "at","url","status","estimatedUnits"
       FROM "GoogleApiCallLog"
       ORDER BY "at" DESC
       LIMIT 50`
    );

    return Response.json({
      source: "db",
      window: "6h",
      startedAt: null,
      totalCalls: Number(totals?.totalcalls ?? 0n),
      totalEstimatedUnits: Number(totals?.totalunits ?? 0n),
      byHost: Object.fromEntries(
        byHost.map((r) => [
          r.host,
          { calls: Number(r.calls), estimatedUnits: Number(r.units) },
        ])
      ),
      byPath: Object.fromEntries(
        byPath.map((r) => [
          r.path,
          { calls: Number(r.calls), estimatedUnits: Number(r.units) },
        ])
      ),
      lastCalls: lastCalls.map((r) => ({
        at: r.at.toISOString(),
        url: r.url,
        status: r.status,
        estimatedUnits: r.estimatedUnits,
      })),
      quotaExceededSeen: false,
    });
  } catch {
    return Response.json({ source: "memory", ...getGoogleApiUsageStats() });
  }
}

export const GET = createApiRoute(
  { route: "/api/dev/youtube-usage" },
  async (req) => GETHandler(req)
);

async function POSTHandler(req: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "reset";

  if (action === "reset") {
    resetGoogleApiUsageStats();
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "GoogleApiCallLog"`);
    } catch {
      // ignore if not migrated yet
    }
    return Response.json({ ok: true });
  }

  if (action === "clear-cache") {
    const cleared: string[] = [];
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "YouTubeSearchCache"`);
      cleared.push("YouTubeSearchCache");
    } catch {
      /* table may not exist */
    }
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "CompetitorFeedCache"`);
      cleared.push("CompetitorFeedCache");
    } catch {
      /* table may not exist */
    }
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "SimilarChannelsCache"`);
      cleared.push("SimilarChannelsCache");
    } catch {
      /* table may not exist */
    }
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "OwnedVideoInsightsCache"`);
      cleared.push("OwnedVideoInsightsCache");
    } catch {
      /* table may not exist */
    }
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "OwnedVideoRemixCache"`);
      cleared.push("OwnedVideoRemixCache");
    } catch {
      /* table may not exist */
    }
    return Response.json({ ok: true, cleared });
  }

  return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

export const POST = createApiRoute(
  { route: "/api/dev/youtube-usage" },
  async (req) => POSTHandler(req)
);
