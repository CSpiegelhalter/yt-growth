/**
 * GET /api/me/badges
 *
 * Fetch badge collection progress for the current user/channel.
 * Returns all badges with progress, unlocked status, and recent unlocks.
 *
 * POST /api/me/badges
 * Mark badges as seen (dismiss "NEW" indicator).
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  BadgesQuerySchema,
  MarkBadgesSeenBodySchema,
  getBadgesProgress,
  markBadgesSeen,
} from "@/lib/features/badges";

export const GET = createApiRoute(
  { route: "/api/me/badges" },
  withAuth(
    { mode: "required" },
    withValidation(
      { query: BadgesQuerySchema },
      async (_req, _ctx, api, validated) => {
        const result = await getBadgesProgress({
          userId: api.userId!,
          channelId: validated.query?.channelId,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);

export const POST = createApiRoute(
  { route: "/api/me/badges" },
  withAuth(
    { mode: "required" },
    withValidation(
      { body: MarkBadgesSeenBodySchema },
      async (_req, _ctx, api, validated) => {
        const { badgeIds, channelId } = validated.body!;

        const result = await markBadgesSeen({
          userId: api.userId!,
          badgeIds,
          channelId,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
