/**
 * GET /api/me/channels/[channelId]
 * DELETE /api/me/channels/[channelId]
 *
 * Get or unlink a specific channel.
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { z } from "zod";
import { getChannel, deleteChannel } from "@/lib/features/channels";

const ChannelParamsSchema = z.object({
  channelId: z.string().min(1),
});

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ChannelParamsSchema },
      async (_req, _ctx, api, validated) => {
        const { channelId } = validated.params!;

        const result = await getChannel({
          userId: api.userId!,
          channelId,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);

export const DELETE = createApiRoute(
  { route: "/api/me/channels/[channelId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ChannelParamsSchema },
      async (_req, _ctx, api, validated) => {
        const { channelId } = validated.params!;

        const result = await deleteChannel({
          userId: api.userId!,
          channelId,
        });

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
