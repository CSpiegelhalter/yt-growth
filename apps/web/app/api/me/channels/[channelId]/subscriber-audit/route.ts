import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import {
  runSubscriberAudit,
  SubscriberAuditParamsSchema,
  SubscriberAuditQuerySchema,
} from "@/lib/features/subscriber-insights";
import { callLLM } from "@/lib/llm";
import type { LlmPort } from "@/lib/ports/LlmPort";
import { hasActiveSubscription } from "@/lib/server/auth";

const llmAdapter: LlmPort = {
  complete: (p) =>
    callLLM(p.messages, { model: p.model, maxTokens: p.maxTokens, temperature: p.temperature }),
  completeJson: () => {
    throw new Error("Not implemented");
  },
};

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/subscriber-audit" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: SubscriberAuditParamsSchema, query: SubscriberAuditQuerySchema },
      async (_req, _ctx, api, { params, query }) => {
        if (!hasActiveSubscription(api.user?.subscription ?? null)) {
          throw new ApiError({ code: "FORBIDDEN", status: 403, message: "Subscription required" });
        }
        const result = await runSubscriberAudit(
          { userId: api.userId!, channelId: params!.channelId, limit: query!.limit },
          { llm: llmAdapter },
        );
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
