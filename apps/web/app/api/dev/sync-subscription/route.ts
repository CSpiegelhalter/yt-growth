/**
 * POST /api/dev/sync-subscription
 *
 * DEV-ONLY admin helper: triggers a subscription refresh (same idea as /api/integrations/stripe/sync).
 * Blocked in production.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { isAdminUser } from "@/lib/admin";

export const runtime = "nodejs";

const BodySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
});

export const POST = createApiRoute(
  { route: "/api/dev/sync-subscription" },
  withAuth(
    { mode: "required" },
    withValidation({ body: BodySchema }, async (_req: NextRequest, _ctx, api, v) => {
      if (process.env.NODE_ENV === "production") {
        throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Not found" });
      }

      const caller = (api as ApiAuthContext).user!;
      if (!isAdminUser(caller)) {
        throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
      }

      // Keep this endpoint intentionally simple; use the primary route for real logic.
      // This exists as a stable "dev" surface that won't accidentally run in prod.
      const targetUserId = v.body?.userId ?? caller.id;
      return jsonOk(
        {
          ok: false,
          message: "Use /api/integrations/stripe/sync for subscription sync.",
          userId: targetUserId,
        },
        { requestId: api.requestId, status: 400 }
      );
    })
  )
);


