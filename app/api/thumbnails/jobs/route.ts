/**
 * POST /api/thumbnails/jobs
 *
 * Create a new thumbnail generation job.
 * Returns immediately with jobId for polling.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { PrismaClient } from "@prisma/client";
import { thumbnailJobInputSchema } from "@/lib/thumbnails/schemas";
import { moderateContent } from "@/lib/thumbnails/llmPlanner";

const prisma = new PrismaClient();

// Rate limit: 10 jobs per 10 minutes per user
const THUMBNAIL_JOB_RATE_LIMIT = { limit: 10, windowSec: 600 };

export const POST = createApiRoute(
  { route: "/api/thumbnails/jobs" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "planGeneration", // Reuse existing rate limit key
        identifier: (api) => api.userId,
        config: THUMBNAIL_JOB_RATE_LIMIT,
      },
      withValidation(
        { body: thumbnailJobInputSchema },
        async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
          const userId = api.userId!;
          const input = validated.body!;

          // Moderation check on user input
          const contentToCheck = [input.title, input.topic, input.audience]
            .filter(Boolean)
            .join(" ");

          const moderation = await moderateContent(contentToCheck);
          if (!moderation.safe) {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: moderation.reason ?? "Content flagged by moderation",
            });
          }

          // Create job record
          const job = await prisma.thumbnailJob.create({
            data: {
              userId,
              inputJson: JSON.stringify(input),
              status: "queued",
              progress: 0,
            },
          });

          return NextResponse.json({
            jobId: job.id,
          });
        }
      )
    )
  )
);

/**
 * GET /api/thumbnails/jobs
 *
 * List user's recent thumbnail jobs.
 */
export const GET = createApiRoute(
  { route: "/api/thumbnails/jobs" },
  withAuth({ mode: "required" }, async (req: NextRequest, ctx, api: ApiAuthContext) => {
    const userId = api.userId!;

    const jobs = await prisma.thumbnailJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        Variants: {
          select: {
            id: true,
            finalImageKey: true,
            specJson: true,
          },
        },
      },
    });

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        phase: job.phase,
        error: job.error,
        createdAt: job.createdAt.toISOString(),
        variantCount: job.Variants.length,
      })),
    });
  })
);
