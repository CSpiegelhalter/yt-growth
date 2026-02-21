import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { ProjectParamsSchema } from "@/lib/features/thumbnails/schemas";
import { uploadOverlay } from "@/lib/features/thumbnails";
import { getStorage } from "@/lib/adapters/storage";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/thumbnails/projects/[projectId]/upload-overlay" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: ProjectParamsSchema },
      async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;

        const form = await req.formData().catch(() => null);
        if (!form) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Invalid multipart form data",
          });
        }
        const file = form.get("file");
        if (!(file instanceof File)) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Missing file",
          });
        }

        const bytes = Buffer.from(await file.arrayBuffer());

        const result = await uploadOverlay(
          {
            userId: api.userId!,
            projectId: validated.params!.projectId,
            file: { bytes, type: file.type, size: file.size },
          },
          { storage: getStorage() },
        );
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
