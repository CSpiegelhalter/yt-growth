import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { defaultEditorState } from "@/lib/thumbnails-v2/editorState";

export const runtime = "nodejs";

const bodySchema = z.object({
  thumbnailJobId: z.string().uuid(),
  baseImageUrl: z.string().url(),
});

export const POST = createApiRoute(
  { route: "/api/thumbnails/projects" },
  withAuth(
    { mode: "required" },
    withValidation(
      { body: bodySchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const userId = api.userId!;
        const { thumbnailJobId, baseImageUrl } = validated.body!;

        const job = await prisma.thumbnailJob.findUnique({
          where: { id: thumbnailJobId },
          select: { id: true, userId: true, status: true, outputImages: true },
        });
        if (!job || job.userId !== userId) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Thumbnail job not found",
          });
        }
        if (job.status !== "succeeded") {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 409,
            message: "Job is not finished yet",
          });
        }

        // Ensure baseImageUrl is one of the job outputs (defense-in-depth)
        const allowed = Array.isArray(job.outputImages)
          ? job.outputImages.some((x: any) => x?.url === baseImageUrl)
          : false;
        if (!allowed) {
          throw new ApiError({
            code: "FORBIDDEN",
            status: 403,
            message: "Invalid base image for this job",
          });
        }

        const project = await prisma.thumbnailProject.create({
          data: {
            userId,
            thumbnailJobId,
            baseImageUrl,
            editorState: defaultEditorState(),
            exports: [],
          },
          select: { id: true },
        });

        return NextResponse.json({ projectId: project.id });
      }
    )
  )
);

