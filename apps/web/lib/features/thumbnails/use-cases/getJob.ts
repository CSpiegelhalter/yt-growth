import type { Prisma, ThumbnailJobStatusV2 } from "@prisma/client";

import type { ReplicatePort } from "@/lib/ports/ReplicatePort";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import { ThumbnailError } from "../errors";

const log = createLogger({ subsystem: "thumbnails/getJob" });

type OutputImage = { url: string; [key: string]: unknown };

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

type PredictionRecord = {
  id: string;
  replicatePredictionId: string;
  status: string;
  outputImages: unknown;
};

const TERMINAL_STATUSES = new Set(["succeeded", "failed", "canceled"]);
const FAILED_STATUSES = new Set(["failed", "canceled"]);

function parseOutputImages(output: unknown): OutputImage[] {
  if (!Array.isArray(output)) {
    return [];
  }
  return (output as string[]).map((url: string) => ({
    url,
    width: 1280,
    height: 720,
    contentType: "image/png",
  }));
}

function collectImages(predictions: PredictionRecord[]): OutputImage[] {
  const images: OutputImage[] = [];
  for (const p of predictions) {
    if (Array.isArray(p.outputImages)) {
      images.push(...(p.outputImages as OutputImage[]));
    }
  }
  return images;
}

async function pollSinglePrediction(
  p: PredictionRecord,
  deps: GetJobDeps,
): Promise<{ done: boolean; failed: boolean }> {
  try {
    const prediction = await deps.replicate.getPrediction(p.replicatePredictionId);
    if (prediction.status !== p.status) {
      log.info("Polled Replicate prediction status", {
        predictionId: p.replicatePredictionId,
        oldStatus: p.status,
        newStatus: prediction.status,
      });
      const outputImages = parseOutputImages(prediction.output);
      await prisma.thumbnailJobPrediction.update({
        where: { id: p.id },
        data: { status: prediction.status, outputImages: outputImages as unknown as Prisma.InputJsonValue },
      });
      p.status = prediction.status;
      p.outputImages = outputImages;
    }

    if (FAILED_STATUSES.has(prediction.status)) {
      log.error("Replicate prediction failed", {
        predictionId: p.replicatePredictionId,
        status: prediction.status,
        error: prediction.error,
        logs: prediction.logs?.slice(-500),
      });
      return { done: true, failed: true };
    }
    return { done: prediction.status === "succeeded", failed: false };
  } catch (error) {
    log.warn("Failed to poll Replicate prediction", {
      predictionId: p.replicatePredictionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { done: false, failed: false };
  }
}

async function pollAndSyncPredictions(
  predictions: PredictionRecord[],
  deps: GetJobDeps,
): Promise<{ allDone: boolean; anyFailed: boolean }> {
  let allDone = true;
  let anyFailed = false;

  for (const p of predictions) {
    if (TERMINAL_STATUSES.has(p.status)) {
      if (FAILED_STATUSES.has(p.status)) {
        anyFailed = true;
      }
      continue;
    }
    const result = await pollSinglePrediction(p, deps);
    if (result.failed) {
      anyFailed = true;
    }
    if (!result.done) {
      allDone = false;
    }
  }

  return { allDone, anyFailed };
}

async function finalizeCompletedJob(
  jobId: string,
  predictions: PredictionRecord[],
  anyFailed: boolean,
): Promise<ThumbnailJobStatusV2> {
  const newStatus: ThumbnailJobStatusV2 = anyFailed ? "failed" : "succeeded";
  const aggregatedImages = collectImages(predictions);

  await prisma.thumbnailJob.update({
    where: { id: jobId },
    data: {
      status: newStatus,
      outputImages: aggregatedImages as unknown as Prisma.InputJsonValue,
    },
  });

  log.info("Job completed via polling", { jobId, status: newStatus, imageCount: aggregatedImages.length });
  return newStatus;
}

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

  if (job.status === "running" || job.status === "queued") {
    const hasPending = job.Predictions.some((p) => p.status === "starting" || p.status === "processing");
    if (hasPending) {
      const { allDone, anyFailed } = await pollAndSyncPredictions(job.Predictions, deps);
      if (allDone) {
        job.status = await finalizeCompletedJob(job.id, job.Predictions, anyFailed);
      }
    }
  }

  return {
    jobId: job.id,
    status: job.status,
    style: job.style,
    outputImages: collectImages(job.Predictions) as GetJobResult["outputImages"],
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
