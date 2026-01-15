import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export const GET = createApiRoute(
  { route: "/api/thumbnails/job/[id]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const userId = api.userId!;
        const { id } = validated.params!;

        const job = await prisma.thumbnailJob.findUnique({
          where: { id },
          include: { Predictions: true },
        });

        if (!job) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Job not found",
          });
        }
        if (job.userId !== userId) {
          throw new ApiError({
            code: "FORBIDDEN",
            status: 403,
            message: "Access denied",
          });
        }

        // Aggregate output images across predictions (if webhook filled them)
        const images: any[] = [];
        for (const p of job.Predictions) {
          if (Array.isArray(p.outputImages)) {
            images.push(...p.outputImages);
          }
        }

        return NextResponse.json({
          jobId: job.id,
          status: job.status,
          style: job.style,
          outputImages: images,
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
        });
      }
    )
  )
);

