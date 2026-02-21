/**
 * POST /api/identity/reset
 *
 * Resets the user's identity model, allowing them to retrain with new photos.
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { jsonOk } from "@/lib/api/response";
import { resetModel } from "@/lib/features/identity";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/identity/reset" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      { operation: "identityReset", identifier: (api) => api.userId },
      async (req: NextRequest, _ctx, api) => {
        let deletePhotos = false;
        try {
          const body = await req.json().catch(() => ({}));
          deletePhotos = body.deletePhotos === true;
        } catch {
          // ignore
        }

        const result = await resetModel({
          userId: api.userId!,
          deletePhotos,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
