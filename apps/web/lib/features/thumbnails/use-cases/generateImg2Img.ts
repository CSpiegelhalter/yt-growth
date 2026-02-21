import { prisma } from "@/prisma";
import { createLogger } from "@/lib/shared/logger";
import type { ReplicatePort } from "@/lib/ports/ReplicatePort";
import { ThumbnailError } from "../errors";

const log = createLogger({ subsystem: "thumbnails/generate-img2img" });

type OutputImage = { url?: string; [key: string]: unknown };

type GenerateImg2ImgInput = {
  userId: number;
  inputImageUrl: string;
  parentJobId: string;
  prompt?: string;
  strength: number;
  webhookUrl: string;
};

type GenerateImg2ImgDeps = {
  replicate: Pick<ReplicatePort, "createPrediction">;
};

type GenerateImg2ImgResult = {
  jobId: string;
  status: string;
  parentJobId: string;
  predictionId: string;
};

export async function generateImg2Img(
  input: GenerateImg2ImgInput,
  deps: GenerateImg2ImgDeps,
): Promise<GenerateImg2ImgResult> {
  const { userId, inputImageUrl, parentJobId, strength, webhookUrl } = input;

  const parentJob = await prisma.thumbnailJob.findUnique({
    where: { id: parentJobId },
    select: {
      id: true,
      userId: true,
      status: true,
      style: true,
      styleModelVersionId: true,
      identityModelVersionId: true,
      userPrompt: true,
      outputImages: true,
    },
  });

  if (!parentJob || parentJob.userId !== userId) {
    throw new ThumbnailError("NOT_FOUND", "Parent job not found");
  }

  if (parentJob.status !== "succeeded") {
    throw new ThumbnailError(
      "INVALID_INPUT",
      "Parent job must be completed before creating variants",
    );
  }

  const outputImages = (parentJob.outputImages as OutputImage[]) ?? [];
  const isFromParent = outputImages.some(
    (img) => img?.url === inputImageUrl,
  );

  const project = await prisma.thumbnailProject.findFirst({
    where: { userId, thumbnailJobId: parentJob.id },
    select: { exports: true },
  });

  const exports = (project?.exports as OutputImage[]) ?? [];
  const isFromExport = exports.some(
    (exp) => exp?.url === inputImageUrl,
  );

  if (!isFromParent && !isFromExport) {
    throw new ThumbnailError(
      "FORBIDDEN",
      "Input image must be from the parent job or its exports",
    );
  }

  const prompt = input.prompt ?? `${parentJob.userPrompt} (variation)`;

  const job = await prisma.thumbnailJob.create({
    data: {
      userId,
      source: "img2img",
      style: parentJob.style,
      styleModelVersionId: parentJob.styleModelVersionId,
      identityModelVersionId: parentJob.identityModelVersionId,
      userPrompt: prompt,
      llmPrompt: JSON.stringify({
        type: "img2img",
        parentJobId: parentJob.id,
        prompt,
        strength,
      }),
      negativePrompt: null,
      parentJobId: parentJob.id,
      inputImageUrl,
      status: "running",
      outputImages: [],
    },
    select: { id: true },
  });

  log.info("Creating img2img prediction", {
    jobId: job.id,
    parentJobId: parentJob.id,
    inputImageUrl: `${inputImageUrl.slice(0, 50)  }...`,
    strength,
  });

  try {
    const replicateInput = {
      image: inputImageUrl,
      prompt,
      num_outputs: 1,
      output_format: "png",
      output_quality: 90,
      prompt_strength: strength,
    };

    const prediction = await deps.replicate.createPrediction({
      version: parentJob.styleModelVersionId,
      input: replicateInput,
      webhookUrl,
      webhookEvents: ["completed"],
    });

    await prisma.thumbnailJobPrediction.create({
      data: {
        thumbnailJobId: job.id,
        replicatePredictionId: prediction.id,
        status: "starting",
        outputImages: [],
      },
    });

    await prisma.thumbnailJob.update({
      where: { id: job.id },
      data: { replicatePredictionId: prediction.id },
    });

    return {
      jobId: job.id,
      status: "running",
      parentJobId: parentJob.id,
      predictionId: prediction.id,
    };
  } catch (err) {
    await prisma.thumbnailJob.update({
      where: { id: job.id },
      data: { status: "failed" },
    });

    log.error("Failed to create img2img prediction", {
      jobId: job.id,
      error: err instanceof Error ? err.message : String(err),
    });

    throw new ThumbnailError(
      "EXTERNAL_FAILURE",
      "Failed to start image variation",
      err,
    );
  }
}
