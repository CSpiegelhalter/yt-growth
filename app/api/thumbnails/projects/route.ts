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
          select: {
            id: true,
            userId: true,
            status: true,
            outputImages: true,
            Predictions: { select: { outputImages: true } },
          },
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

        // Collect all valid output URLs (from job.outputImages or predictions as fallback)
        const allOutputUrls = new Set<string>();
        if (Array.isArray(job.outputImages)) {
          for (const img of job.outputImages) {
            if ((img as any)?.url) allOutputUrls.add((img as any).url);
          }
        }
        // Fallback: also check predictions (for jobs that completed before fix)
        for (const pred of job.Predictions) {
          if (Array.isArray(pred.outputImages)) {
            for (const img of pred.outputImages) {
              if ((img as any)?.url) allOutputUrls.add((img as any).url);
            }
          }
        }

        // Ensure baseImageUrl is one of the job outputs (defense-in-depth)
        if (!allOutputUrls.has(baseImageUrl)) {
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

