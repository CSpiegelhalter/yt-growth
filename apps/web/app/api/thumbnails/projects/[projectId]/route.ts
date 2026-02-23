import type { NextRequest } from "next/server";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { getProject, updateProject } from "@/lib/features/thumbnails";
import {
  ProjectParamsSchema,
  UpdateProjectBodySchema,
} from "@/lib/features/thumbnails/schemas";

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
