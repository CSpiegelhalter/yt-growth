import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { getGoogleAccount } from "@/lib/adapters/youtube";
import { fetchChannelAuditMetrics } from "@/lib/adapters/youtube/owned-analytics";
import {
  AuditParamsSchema,
  AuditQuerySchema,
  ChannelAuditError,
  runChannelAudit,
} from "@/lib/features/channel-audit";
import type { RunAuditDeps } from "@/lib/features/channel-audit";

export const dynamic = "force-dynamic";

const auditDeps: RunAuditDeps = {
  fetchChannelMetrics: async (userId, channelId, range) => {
    const ga = await getGoogleAccount(userId, channelId);
    if (!ga) {
      throw new ChannelAuditError(
        "EXTERNAL_FAILURE",
        "Google account not connected",
      );
    }
    return fetchChannelAuditMetrics(ga, channelId, range);
  },
};

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/audit" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: AuditParamsSchema, query: AuditQuerySchema },
      async (_req, _ctx, api, { params, query }) => {
        const result = await runChannelAudit(
          {
            userId: api.userId!,
            channelId: params!.channelId,
            range: query!.range,
          },
          auditDeps,
        );
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
