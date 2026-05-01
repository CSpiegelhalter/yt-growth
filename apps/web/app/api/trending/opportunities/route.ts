/**
 * GET /api/trending/opportunities?offset=N&limit=M
 *
 * Returns a paginated slice of pre-computed opportunity gaps from the TrendingCache.
 * Tier caps: guest=8, FREE=10, PRO=100. Counts stay even so the 2-column grid
 * never lands on a lone trailing card before the blurred teaser block.
 * `meta.cappedBy` is "tier" when a non-PRO user has hit their cap (more data exists,
 * but the tier blocks it), "data" when the dataset is exhausted, or null while paginating.
 * Authenticated users get competitor overlap enrichment for the returned slice.
 */

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { getPlanFromSubscription } from "@/lib/features/subscriptions/use-cases/checkEntitlement";
import type { OpportunityGap } from "@/lib/features/trending/compute-gaps";
import { enrichWithCompetitorOverlap } from "@/lib/features/trending/enrich-competitor-overlap";
import { logger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const TIER_LIMITS = { guest: 8, FREE: 10, PRO: 100 } as const;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const TEASER_COUNT = 4;

function parsePagination(url: URL): { offset: number; limit: number } {
  const rawOffset = Number(url.searchParams.get("offset"));
  const rawLimit = Number(url.searchParams.get("limit"));
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;
  return { offset, limit };
}

/**
 * Build a redacted teaser version of a gap for the "blurred preview" upsell:
 * the keyword is masked (preserving rough word count + length) and any
 * personalization is stripped. Numbers stay so the visual rhythm of the card
 * (volume, difficulty, score bar) reads as authentic — they're CSS-blurred
 * client-side anyway.
 */
function maskKeyword(keyword: string): string {
  return keyword
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => "•".repeat(Math.max(3, Math.min(12, w.length))))
    .join(" ");
}

function toTeaser(gap: OpportunityGap) {
  return {
    ...gap,
    keyword: maskKeyword(gap.keyword),
    articles: [],
    competitorMatches: { count: 0, videos: [] },
  };
}

export const GET = createApiRoute(
  { route: "/api/trending/opportunities" },
  withAuth(
    { mode: "optional" },
    async (req, _ctx, api) => {
      try {
        const { offset, limit } = parsePagination(new URL(req.url));

        const cached = await prisma.trendingCache.findUnique({
          where: { key: "opportunities" },
        });

        if (!cached) {
          return jsonOk(
            {
              opportunities: [],
              meta: {
                status: "initializing",
                tier: "guest",
                totalFound: 0,
                tierMax: TIER_LIMITS.guest,
                offset,
                limit,
                returned: 0,
                hasMore: false,
                cappedBy: null,
              },
            },
            { requestId: api.requestId },
          );
        }

        const gaps = cached.data as unknown as OpportunityGap[];
        const isStale = cached.expiresAt.getTime() < Date.now();

        // Determine tier
        let tier: "guest" | "FREE" | "PRO" = "guest";
        let activeChannelId: number | null = null;

        if (api.userId) {
          const subscription = await prisma.subscription.findFirst({
            where: { userId: api.userId },
            select: { status: true, plan: true, currentPeriodEnd: true },
          });
          const plan = getPlanFromSubscription(
            subscription ? { isActive: subscription.status === "active", plan: subscription.plan, currentPeriodEnd: subscription.currentPeriodEnd } : null,
          );
          tier = plan;

          // Get user's active channel for competitor overlap
          const channel = await prisma.channel.findFirst({
            where: { userId: api.userId },
            select: { id: true },
            orderBy: { connectedAt: "desc" },
          });
          activeChannelId = channel?.id ?? null;
        }

        const tierMax = TIER_LIMITS[tier];
        const reachable = Math.min(tierMax, gaps.length);
        const start = Math.min(offset, reachable);
        const end = Math.min(offset + limit, reachable);
        const sliced = gaps.slice(start, end);

        const hasMore = end < reachable;
        // cappedBy is "tier" when the user could see more (gaps.length > tierMax)
        // but their plan blocks it; "data" when they've genuinely seen everything.
        const cappedBy: "tier" | "data" | null = hasMore
          ? null
          : reachable < gaps.length
            ? "tier"
            : "data";

        // Enrich with competitor overlap for authenticated users
        const result = api.userId && activeChannelId
          ? await enrichWithCompetitorOverlap(sliced, api.userId, activeChannelId)
          : sliced.map((g) => ({ ...g, competitorMatches: { count: 0, videos: [] } }));

        // When the user is capped by their tier, attach a few redacted teaser
        // cards from beyond the cap so the UI can render a blurred preview.
        const teasers = cappedBy === "tier"
          ? gaps.slice(reachable, reachable + TEASER_COUNT).map(toTeaser)
          : [];

        return jsonOk(
          {
            opportunities: result,
            teasers,
            meta: {
              totalFound: gaps.length,
              tier,
              tierMax,
              offset: start,
              limit,
              returned: result.length,
              hasMore,
              cappedBy,
              stale: isStale,
              updatedAt: cached.updatedAt.toISOString(),
            },
          },
          {
            requestId: api.requestId,
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
          },
        );
      } catch (error) {
        logger.error("trending_opportunities.error", {
          error: error instanceof Error ? error.message : String(error),
        });
        return jsonOk(
          { opportunities: [], meta: { status: "error" } },
          { requestId: api.requestId },
        );
      }
    },
  ),
);
