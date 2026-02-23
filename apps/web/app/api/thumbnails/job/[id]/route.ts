import type { NextRequest } from "next/server";

import { getPrediction } from "@/lib/adapters/replicate";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { getJob } from "@/lib/features/thumbnails";
import { ThumbnailJobParamsSchema } from "@/lib/features/thumbnails/schemas";

export const runtime = "nodejs";

export const GET = createApiRoute(
  { route: "/api/thumbnails/job/[id]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ThumbnailJobParamsSchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const result = await getJob(
          {
            userId: api.userId!,
            jobId: validated.params!.id,
          },
          { replicate: { getPrediction } },
        );
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
