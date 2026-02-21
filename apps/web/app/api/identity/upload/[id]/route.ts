/**
 * DELETE /api/identity/upload/[id]
 *
 * Delete a training photo.
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import { deletePhoto } from "@/lib/features/identity";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export const DELETE = createApiRoute(
  { route: "/api/identity/upload/[id]" },
  withAuth(
    { mode: "required" },
    async (_req: NextRequest, ctx: RouteParams, api: ApiAuthContext) => {
      const { id } = await ctx.params;

      const result = await deletePhoto({
        userId: api.userId!,
        photoId: id,
      });

      return jsonOk(result, { requestId: api.requestId });
    },
  ),
);
