import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { CreateProjectBodySchema } from "@/lib/features/thumbnails/schemas";
import { createProject } from "@/lib/features/thumbnails";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/thumbnails/projects" },
  withAuth(
    { mode: "required" },
    withValidation(
      { body: CreateProjectBodySchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const body = validated.body!;
        const result = await createProject({
          userId: api.userId!,
          thumbnailJobId: body.thumbnailJobId,
          baseImageUrl: body.baseImageUrl,
        });
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
