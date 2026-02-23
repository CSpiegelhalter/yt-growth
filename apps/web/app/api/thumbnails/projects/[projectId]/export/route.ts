import type { NextRequest } from "next/server";

import { getStorage } from "@/lib/adapters/storage";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { exportProject } from "@/lib/features/thumbnails";
import {
  ExportProjectBodySchema,
  ProjectParamsSchema,
} from "@/lib/features/thumbnails/schemas";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/thumbnails/projects/[projectId]/export" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ProjectParamsSchema, body: ExportProjectBodySchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const result = await exportProject(
          {
            userId: api.userId!,
            projectId: validated.params!.projectId,
            dataUrl: validated.body!.dataUrl,
            format: validated.body!.format,
          },
          { storage: getStorage() },
        );
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
