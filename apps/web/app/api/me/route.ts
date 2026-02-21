/**
 * GET /api/me
 *
 * Get current user profile with subscription status and usage info.
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import { getUserProfile } from "@/lib/features/subscriptions";

export const GET = createApiRoute(
  { route: "/api/me" },
  withAuth({ mode: "required" }, async (_req, _ctx, api) => {
    const user = api.user!;

    const payload = await getUserProfile({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return jsonOk(payload, {
      headers: { "cache-control": "no-store" },
      requestId: api.requestId,
    });
  }),
);

export const runtime = "nodejs";
