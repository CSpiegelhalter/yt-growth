/**
 * GET /api/trending/youtube-rising
 *
 * Returns YouTube's most popular videos from TrendingCache.
 * Tier-based: guest=15, free=30, pro=all.
 * Optional ?category= filter by YouTube category ID.
 */

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { getPlanFromSubscription } from "@/lib/features/subscriptions/use-cases/checkEntitlement";
import { logger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import type { TrendingVideo } from "@/lib/adapters/youtube/data-api";

const TIER_LIMITS = { guest: 15, FREE: 30, PRO: 50 } as const;

export const GET = createApiRoute(
  { route: "/api/trending/youtube-rising" },
  withAuth(
    { mode: "optional" },
    async (req, _ctx, api) => {
      try {
        const cached = await prisma.trendingCache.findUnique({
          where: { key: "youtube-rising" },
        });

        if (!cached) {
          return jsonOk(
            { videos: [], meta: { status: "initializing" } },
            { requestId: api.requestId },
          );
        }

        let videos = cached.data as unknown as TrendingVideo[];
        const isStale = cached.expiresAt.getTime() < Date.now();

        // Optional category filter
        const url = new URL(req.url);
        const categoryFilter = url.searchParams.get("category");
        if (categoryFilter) {
          videos = videos.filter((v) => v.categoryId === categoryFilter);
        }

        // Determine tier
        let tier: "guest" | "FREE" | "PRO" = "guest";
        if (api.userId) {
          const subscription = await prisma.subscription.findFirst({
            where: { userId: api.userId },
            select: { status: true, plan: true, currentPeriodEnd: true },
          });
          tier = getPlanFromSubscription(
            subscription ? { isActive: subscription.status === "active", plan: subscription.plan, currentPeriodEnd: subscription.currentPeriodEnd } : null,
          );
        }

        const limit = TIER_LIMITS[tier];
        const sliced = videos.slice(0, limit);

        return jsonOk(
          {
            videos: sliced,
            meta: {
              totalFound: videos.length,
              tier,
              stale: isStale,
              updatedAt: cached.updatedAt.toISOString(),
              category: categoryFilter,
            },
          },
          {
            requestId: api.requestId,
            headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
          },
        );
      } catch (error) {
        logger.error("trending_youtube_rising.error", {
          error: error instanceof Error ? error.message : String(error),
        });
        return jsonOk(
          { videos: [], meta: { status: "error" } },
          { requestId: api.requestId },
        );
      }
    },
  ),
);
