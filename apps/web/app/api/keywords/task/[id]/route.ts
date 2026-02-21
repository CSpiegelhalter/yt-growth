/**
 * GET /api/keywords/task/:id
 *
 * Poll for keyword research task results.
 *
 * Used when the initial research request returns { pending: true, taskId }.
 * Client polls this endpoint every ~2 seconds until results are ready.
 *
 * Auth: Required (task must belong to authenticated user's session)
 */

import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { TaskIdParamsSchema, pollKeywordTask } from "@/lib/features/keywords";

export const GET = createApiRoute(
  { route: "/api/keywords/task/:id" },
  withAuth(
    { mode: "required" },
    withValidation({ params: TaskIdParamsSchema }, async (_req, _ctx, api: ApiAuthContext, validated) => {
      const user = api.user!;
      const { id: taskId } = validated.params!;

      const result = await pollKeywordTask({
        userId: user.id,
        taskId,
      });

      return jsonOk(result.body, { requestId: api.requestId });
    }),
  ),
);

export const runtime = "nodejs";
