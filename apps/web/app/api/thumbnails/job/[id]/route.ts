import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { getPrediction } from "@/lib/replicate/client";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/thumbnails/job/[id]" });

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

        let job = await prisma.thumbnailJob.findUnique({
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

        // If job is still running, poll Replicate directly for prediction status
        // This handles cases where webhooks fail to reach localhost
        if (job.status === "running" || job.status === "queued") {
          const pendingPredictions = job.Predictions.filter(
            (p) => p.status === "starting" || p.status === "processing"
          );

          if (pendingPredictions.length > 0) {
            let allDone = true;
            let anyFailed = false;

            for (const p of job.Predictions) {
              if (
                p.status === "succeeded" ||
                p.status === "failed" ||
                p.status === "canceled"
              ) {
                if (p.status === "failed" || p.status === "canceled")
                  anyFailed = true;
                continue;
              }

              try {
                const prediction = await getPrediction(p.replicatePredictionId);
                if (prediction.status !== p.status) {
                  log.info("Polled Replicate prediction status", {
                    predictionId: p.replicatePredictionId,
                    oldStatus: p.status,
                    newStatus: prediction.status,
                  });

                  const outputImages = prediction.output
                    ? prediction.output.map((url: string) => ({
                        url,
                        width: 1280,
                        height: 720,
                        contentType: "image/png",
                      }))
                    : [];
                  await prisma.thumbnailJobPrediction.update({
                    where: { id: p.id },
                    data: {
                      status: prediction.status,
                      outputImages,
                    },
                  });
                  p.status = prediction.status;
                  p.outputImages = outputImages;
                }

                if (
                  prediction.status === "failed" ||
                  prediction.status === "canceled"
                ) {
                  anyFailed = true;
                  // Log the error from Replicate
                  log.error("Replicate prediction failed", {
                    predictionId: p.replicatePredictionId,
                    status: prediction.status,
                    error: prediction.error,
                    logs: prediction.logs?.slice(-500), // Last 500 chars of logs
                  });
                } else if (prediction.status !== "succeeded") {
                  allDone = false;
                }
              } catch (err) {
                log.warn("Failed to poll Replicate prediction", {
                  predictionId: p.replicatePredictionId,
                  error: err instanceof Error ? err.message : String(err),
                });
                allDone = false;
              }
            }

            // Update job status if all predictions are done
            if (allDone) {
              const newStatus = anyFailed ? "failed" : "succeeded";

              // Aggregate output images from all predictions
              const aggregatedImages: any[] = [];
              for (const p of job.Predictions) {
                if (Array.isArray(p.outputImages)) {
                  aggregatedImages.push(...p.outputImages);
                }
              }

              await prisma.thumbnailJob.update({
                where: { id: job.id },
                data: {
                  status: newStatus,
                  outputImages: aggregatedImages,
                },
              });
              job.status = newStatus;
              log.info("Job completed via polling", {
                jobId: job.id,
                status: newStatus,
                imageCount: aggregatedImages.length,
              });
            }
          }
        }

        // Aggregate output images across predictions
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
