import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { ThumbnailJobParamsSchema } from "@/lib/features/thumbnails/schemas";
import { getJob } from "@/lib/features/thumbnails";
import { getPrediction } from "@/lib/adapters/replicate";

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
