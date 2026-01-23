import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { editorStateV1Schema } from "@/lib/thumbnails-v2/editorState";

export const runtime = "nodejs";

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

const putBodySchema = z.object({
  editorState: editorStateV1Schema,
});

export const GET = createApiRoute(
  { route: "/api/thumbnails/projects/[projectId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const userId = api.userId!;
        const { projectId } = validated.params!;

        const project = await prisma.thumbnailProject.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Project not found",
          });
        }
        if (project.userId !== userId) {
          throw new ApiError({
            code: "FORBIDDEN",
            status: 403,
            message: "Access denied",
          });
        }

        return NextResponse.json({
          projectId: project.id,
          thumbnailJobId: project.thumbnailJobId,
          baseImageUrl: project.baseImageUrl,
          editorState: project.editorState,
          exports: project.exports,
          updatedAt: project.updatedAt.toISOString(),
        });
      }
    )
  )
);

export const PUT = createApiRoute(
  { route: "/api/thumbnails/projects/[projectId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema, body: putBodySchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const userId = api.userId!;
        const { projectId } = validated.params!;
        const { editorState } = validated.body!;

        const project = await prisma.thumbnailProject.findUnique({
          where: { id: projectId },
          select: { id: true, userId: true },
        });
        if (!project) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Project not found",
          });
        }
        if (project.userId !== userId) {
          throw new ApiError({
            code: "FORBIDDEN",
            status: 403,
            message: "Access denied",
          });
        }

        await prisma.thumbnailProject.update({
          where: { id: projectId },
          data: { editorState },
        });

        return NextResponse.json({ ok: true });
      }
    )
  )
);

