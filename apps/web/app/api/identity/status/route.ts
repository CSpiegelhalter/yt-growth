/**
 * GET /api/identity/status
 *
 * Get current identity model status and photos.
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import { getIdentityStatus } from "@/lib/features/identity";

export const runtime = "nodejs";

export const GET = createApiRoute(
  { route: "/api/identity/status" },
  withAuth({ mode: "required" }, async (_req, _ctx, api) => {
    const result = await getIdentityStatus({ userId: api.userId! });

    return jsonOk(result, { requestId: api.requestId });
  }),
);
