/**
 * POST /api/dev/reset-subscription
 *
 * DEV-ONLY admin helper: reset a user's subscription row to FREE/inactive.
 * Blocked in production.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { isAdminUser } from "@/lib/admin";
import { LIMITS } from "@/lib/product";

export const runtime = "nodejs";

const BodySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
});

export const POST = createApiRoute(
  { route: "/api/dev/reset-subscription" },
  withAuth({ mode: "required" },
    withValidation({ body: BodySchema }, async (_req: NextRequest, _ctx, api, v) => {
      if (process.env.NODE_ENV === "production") {
        throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Not found" });
      }

      const caller = (api as ApiAuthContext).user!;
      if (!isAdminUser(caller)) {
        throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
      }

      const targetUserId = v.body?.userId ?? caller.id;
      await prisma.subscription.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          status: "inactive",
          plan: "free",
          channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          cancelAt: null,
          canceledAt: null,
        },
        update: {
          status: "inactive",
          plan: "free",
          channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          cancelAt: null,
          canceledAt: null,
        },
      });

      return jsonOk({ ok: true, userId: targetUserId }, { requestId: api.requestId });
    })
  )
);


