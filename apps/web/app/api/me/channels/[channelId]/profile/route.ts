/**
 * GET/PUT /api/me/channels/[channelId]/profile
 *
 * Manages the user-defined channel profile.
 * - GET: Retrieve the current profile (input + AI)
 * - PUT: Save/update the profile input
 *
 * Auth: Required
 * Subscription: NOT required (free feature)
 */

import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";
import {
  getProfile,
  updateProfile,
  UpdateProfileBodySchema,
} from "@/lib/features/channels";

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/profile" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: channelParamsSchema },
      async (_req, _ctx, api, { params }) => {
        const profile = await getProfile({
          userId: api.userId!,
          channelId: params!.channelId,
        });
        return jsonOk({ profile }, { requestId: api.requestId });
      },
    ),
  ),
);

export const PUT = createApiRoute(
  { route: "/api/me/channels/[channelId]/profile" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: channelParamsSchema, body: UpdateProfileBodySchema },
      async (_req, _ctx, api, { params, body }) => {
        const result = await updateProfile({
          userId: api.userId!,
          channelId: params!.channelId,
          input: body!.input,
        });
        return jsonOk(
          {
            profile: result.profile,
            message: result.aiCleared
              ? "Profile saved. AI summary needs regeneration."
              : "Profile saved successfully.",
          },
          { requestId: api.requestId },
        );
      },
    ),
  ),
);
