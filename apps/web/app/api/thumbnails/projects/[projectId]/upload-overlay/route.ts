import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { getStorage, mimeToExt } from "@/lib/storage";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const POST = createApiRoute(
  { route: "/api/thumbnails/projects/[projectId]/upload-overlay" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema },
      async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const userId = api.userId!;
        const { projectId } = validated.params!;

        const project = await prisma.thumbnailProject.findUnique({
          where: { id: projectId },
          select: { id: true, userId: true },
        });
        if (!project || project.userId !== userId) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Project not found",
          });
        }

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
        if (!ALLOWED_TYPES.has(file.type)) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Unsupported file type",
          });
        }
        if (file.size <= 0 || file.size > MAX_BYTES) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "File too large",
          });
        }

        const bytes = Buffer.from(await file.arrayBuffer());
        const meta = await sharp(bytes).metadata();
        if ((meta.width ?? 0) < 16 || (meta.height ?? 0) < 16) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Image too small",
          });
        }

        const ext = mimeToExt(file.type);
        const key = `thumbnails/projects/${projectId}/overlays/${crypto.randomUUID()}.${ext}`;
        const storage = getStorage();
        await storage.put(key, bytes, { contentType: file.type });

        return NextResponse.json({ url: storage.getPublicUrl(key) });
      }
    )
  )
);

