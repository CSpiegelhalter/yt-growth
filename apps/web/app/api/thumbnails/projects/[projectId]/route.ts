import type { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import {
  ProjectParamsSchema,
  UpdateProjectBodySchema,
} from "@/lib/features/thumbnails/schemas";
import { getProject, updateProject } from "@/lib/features/thumbnails";

export const runtime = "nodejs";

export const GET = createApiRoute(
  { route: "/api/thumbnails/projects/[projectId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ProjectParamsSchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const result = await getProject({
          userId: api.userId!,
          projectId: validated.params!.projectId,
        });
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);

export const PUT = createApiRoute(
  { route: "/api/thumbnails/projects/[projectId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ProjectParamsSchema, body: UpdateProjectBodySchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const result = await updateProject({
          userId: api.userId!,
          projectId: validated.params!.projectId,
          editorState: validated.body!.editorState,
        });
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
