import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import type { ChannelInsightsDeps } from "@/lib/features/channel-audit";
import {
  AuditParamsSchema,
  ChannelInsightsBodySchema,
  generateChannelInsights,
} from "@/lib/features/channel-audit";
import { callLLM } from "@/lib/llm";
import { prisma } from "@/prisma";

export const dynamic = "force-dynamic";

const llmDeps: ChannelInsightsDeps = {
  callLlm: callLLM,
};

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/overview/insights" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: AuditParamsSchema, body: ChannelInsightsBodySchema },
      async (_req, _ctx, api, { params, body }) => {
        const channel = await prisma.channel.findFirst({
          where: { youtubeChannelId: params!.channelId, userId: api.userId! },
          select: { subscriberCount: true },
        });

        const insights = await generateChannelInsights(
          { ...body!, channelSubscribers: channel?.subscriberCount ?? null },
          llmDeps,
        );
        return jsonOk({ insights }, { requestId: api.requestId });
      },
    ),
  ),
);
