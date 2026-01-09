/**
 * GET /api/thumbnails/jobs/:jobId
 *
 * Get job status and variants with concept metadata.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { parseSpecJson } from "@/lib/thumbnails/schemas";
import { getConceptMeta } from "@/lib/thumbnails/concepts";
import { getStorage } from "@/lib/storage";
import type { ThumbnailJobResponse, ThumbnailVariantResponse, ConceptSpec } from "@/lib/thumbnails/types";

const prisma = new PrismaClient();

const paramsSchema = z.object({
  jobId: z.string().uuid(),
});

export const GET = createApiRoute(
  { route: "/api/thumbnails/jobs/[jobId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema },
      async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void req;
        void ctx;
        const userId = api.userId!;
        const { jobId } = validated.params!;

        const job = await prisma.thumbnailJob.findUnique({
          where: { id: jobId },
          include: {
            Variants: {
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!job) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Job not found",
          });
        }

        // Verify ownership
        if (job.userId !== userId) {
          throw new ApiError({
            code: "FORBIDDEN",
            status: 403,
            message: "Access denied",
          });
        }

        const storage = getStorage();

        // Build variant responses with concept metadata
        const variants: ThumbnailVariantResponse[] = job.Variants.map((v) => {
          const spec = parseSpecJson(v.specJson) as ConceptSpec | null;

          // Extract metadata from planJson if available
          let conceptName: string | undefined;
          let score: number | undefined;

          try {
            const planData = JSON.parse(v.planJson);
            if (planData._meta) {
              conceptName = planData._meta.conceptName;
              score = planData._meta.score;
            }
            // Fallback: get concept name from plan
            if (!conceptName && spec?.plan?.conceptId) {
              const meta = getConceptMeta(spec.plan.conceptId);
              conceptName = meta.name;
            }
          } catch {
            // Ignore parsing errors
          }

          return {
            variantId: v.id,
            previewUrl: v.finalImageKey ? storage.getPublicUrl(v.finalImageKey) : "",
            spec: spec ?? ({} as ConceptSpec),
            conceptName,
            score,
          };
        }).filter((v) => v.previewUrl); // Only include variants with images

        const response: ThumbnailJobResponse = {
          jobId: job.id,
          status: job.status as ThumbnailJobResponse["status"],
          progress: job.progress,
          phase: job.phase ?? undefined,
          error: job.error ?? undefined,
          variants,
        };

        return NextResponse.json(response);
      }
    )
  )
);

/**
 * DELETE /api/thumbnails/jobs/:jobId
 *
 * Delete a job and all its variants.
 */
export const DELETE = createApiRoute(
  { route: "/api/thumbnails/jobs/[jobId]" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema },
      async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void req;
        void ctx;
        const userId = api.userId!;
        const { jobId } = validated.params!;

        const job = await prisma.thumbnailJob.findUnique({
          where: { id: jobId },
          include: { Variants: true },
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

        // Delete stored images
        const storage = getStorage();
        for (const variant of job.Variants) {
          if (variant.baseImageKey) {
            await storage.delete(variant.baseImageKey).catch(() => {});
          }
          if (variant.finalImageKey) {
            await storage.delete(variant.finalImageKey).catch(() => {});
          }
        }

        // Delete job (cascades to variants)
        await prisma.thumbnailJob.delete({
          where: { id: jobId },
        });

        return NextResponse.json({ success: true });
      }
    )
  )
);
