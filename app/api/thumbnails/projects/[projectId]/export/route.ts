import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

const bodySchema = z.object({
  dataUrl: z.string().min(32),
  format: z.enum(["png", "jpg"]),
});

function decodeDataUrl(dataUrl: string): { mime: string; bytes: Buffer } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid data URL");
  const mime = m[1];
  const bytes = Buffer.from(m[2], "base64");
  return { mime, bytes };
}

export const POST = createApiRoute(
  { route: "/api/thumbnails/projects/[projectId]/export" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema, body: bodySchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const userId = api.userId!;
        const { projectId } = validated.params!;
        const { dataUrl, format } = validated.body!;

        const project = await prisma.thumbnailProject.findUnique({
          where: { id: projectId },
          select: { id: true, userId: true, exports: true },
        });
        if (!project || project.userId !== userId) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Project not found",
          });
        }

        let decoded: { mime: string; bytes: Buffer };
        try {
          decoded = decodeDataUrl(dataUrl);
        } catch {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Invalid export payload",
          });
        }

        // Validate exact dimensions (hard requirement)
        const meta = await sharp(decoded.bytes).metadata();
        if (meta.width !== 1280 || meta.height !== 720) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Export must be exactly 1280x720",
          });
        }

        const key = `thumbnails/projects/${projectId}/exports/${crypto.randomUUID()}.${format}`;
        const storage = getStorage();
        await storage.put(key, decoded.bytes, {
          contentType: format === "png" ? "image/png" : "image/jpeg",
          cacheControl: "public, max-age=31536000, immutable",
        });

        const url = storage.getPublicUrl(key);

        const existing = Array.isArray(project.exports) ? project.exports : [];
        const updated = [
          ...existing,
          { url, format, width: 1280, height: 720, createdAt: new Date().toISOString() },
        ];

        await prisma.thumbnailProject.update({
          where: { id: projectId },
          data: { exports: updated },
        });

        return NextResponse.json({ url });
      }
    )
  )
);

