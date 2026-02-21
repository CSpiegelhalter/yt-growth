import { prisma } from "@/prisma";
import { createLogger } from "@/lib/shared/logger";
import type { ReplicatePort } from "@/lib/ports/ReplicatePort";
import { ThumbnailError } from "../errors";

const log = createLogger({ subsystem: "thumbnails/getJob" });

type GetJobInput = {
  userId: number;
  jobId: string;
};

type GetJobDeps = {
  replicate: Pick<ReplicatePort, "getPrediction">;
};

type GetJobResult = {
  jobId: string;
  status: string;
  style: string;
  outputImages: Array<{
    url: string;
    width: number;
    height: number;
    contentType: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export async function getJob(
  input: GetJobInput,
  deps: GetJobDeps,
): Promise<GetJobResult> {
  const { userId, jobId } = input;

  const job = await prisma.thumbnailJob.findUnique({
    where: { id: jobId },
    include: { Predictions: true },
  });

  if (!job) {
    throw new ThumbnailError("NOT_FOUND", "Job not found");
  }
  if (job.userId !== userId) {
    throw new ThumbnailError("FORBIDDEN", "Access denied");
  }

  // Poll Replicate for pending predictions when the job is still in progress
  if (job.status === "running" || job.status === "queued") {
    const pendingPredictions = job.Predictions.filter(
      (p) => p.status === "starting" || p.status === "processing",
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
          if (p.status === "failed" || p.status === "canceled") anyFailed = true;
          continue;
        }

        try {
          const prediction = await deps.replicate.getPrediction(
            p.replicatePredictionId,
          );
          if (prediction.status !== p.status) {
            log.info("Polled Replicate prediction status", {
              predictionId: p.replicatePredictionId,
              oldStatus: p.status,
              newStatus: prediction.status,
            });

            const outputImages = Array.isArray(prediction.output)
              ? (prediction.output as string[]).map((url: string) => ({
                  url,
                  width: 1280,
                  height: 720,
                  contentType: "image/png",
                }))
              : [];

            await prisma.thumbnailJobPrediction.update({
              where: { id: p.id },
              data: { status: prediction.status, outputImages },
            });
            p.status = prediction.status;
            p.outputImages = outputImages;
          }

          if (
            prediction.status === "failed" ||
            prediction.status === "canceled"
          ) {
            anyFailed = true;
            log.error("Replicate prediction failed", {
              predictionId: p.replicatePredictionId,
              status: prediction.status,
              error: prediction.error,
              logs: prediction.logs?.slice(-500),
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

      if (allDone) {
        const newStatus = anyFailed ? "failed" : "succeeded";

        const aggregatedImages: any[] = [];
        for (const p of job.Predictions) {
          if (Array.isArray(p.outputImages)) {
            aggregatedImages.push(...p.outputImages);
          }
        }

        await prisma.thumbnailJob.update({
          where: { id: job.id },
          data: { status: newStatus, outputImages: aggregatedImages },
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

  const images: any[] = [];
  for (const p of job.Predictions) {
    if (Array.isArray(p.outputImages)) {
      images.push(...p.outputImages);
    }
  }

  return {
    jobId: job.id,
    status: job.status,
    style: job.style,
    outputImages: images,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
