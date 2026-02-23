import { getTraining } from "@/lib/replicate/client";
import { createLogger } from "@/lib/shared/logger";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/prisma";

const log = createLogger({ subsystem: "identity-status" });

type GetIdentityStatusInput = {
  userId: number;
};

type UserModel = Awaited<ReturnType<typeof prisma.userModel.findUnique>>;

function resolvePhotoUrls(
  photos: { id: string; s3KeyOriginal: string; width: number; height: number }[],
) {
  const storage = getStorage();
  return photos.map((p) => {
    let url: string | null = null;
    if (p.s3KeyOriginal && p.s3KeyOriginal !== "pending") {
      try {
        url = storage.getPublicUrl(p.s3KeyOriginal);
      } catch {
        // Ignore
      }
    }
    return { id: p.id, url, width: p.width, height: p.height };
  });
}

function extractWeightsUrl(output: Record<string, unknown> | null | undefined): string | null {
  if (!output) { return null; }
  return (output.weights ?? output.lora_weights ?? output.lora ?? output.model_weights ?? null) as string | null;
}

async function handleTrainingSucceeded(
  modelId: string,
  trainingId: string,
  training: Awaited<ReturnType<typeof getTraining>>,
): Promise<UserModel> {
  log.info("Training completed, examining output", {
    modelId,
    trainingId,
    outputKeys: training.output ? Object.keys(training.output) : [],
    output: training.output,
  });

  const version = training.output?.version as string | undefined;
  const weightsUrl = extractWeightsUrl(training.output as Record<string, unknown> | null);

  const updated = await prisma.userModel.update({
    where: { id: modelId },
    data: {
      status: "ready",
      replicateModelVersion: version ?? null,
      loraWeightsUrl: weightsUrl,
      trainingCompletedAt: new Date(),
    },
  });
  log.info("Training completed, model ready", {
    modelId,
    version,
    weightsUrl,
    hasWeights: !!weightsUrl,
  });
  return updated;
}

async function handleTrainingTerminated(
  modelId: string,
  training: Awaited<ReturnType<typeof getTraining>>,
): Promise<UserModel> {
  const mappedStatus = training.status === "canceled" ? "canceled" as const : "failed" as const;
  const updated = await prisma.userModel.update({
    where: { id: modelId },
    data: {
      status: mappedStatus,
      errorMessage: training.error ?? `Training ${training.status}`,
      trainingCompletedAt: new Date(),
    },
  });
  log.warn("Training failed/canceled", {
    modelId,
    error: training.error,
  });
  return updated;
}

async function pollTrainingStatus(model: NonNullable<UserModel>): Promise<NonNullable<UserModel>> {
  if (model.status !== "training" || !model.trainingId) { return model; }

  try {
    const training = await getTraining(model.trainingId);
    log.info("Polled Replicate training status", {
      trainingId: model.trainingId,
      replicateStatus: training.status,
    });

    if (training.status === "succeeded") {
      return (await handleTrainingSucceeded(model.id, model.trainingId, training))!;
    }
    if (training.status === "failed" || training.status === "canceled") {
      return (await handleTrainingTerminated(model.id, training))!;
    }
  } catch (error) {
    log.warn("Failed to poll Replicate training", {
      trainingId: model.trainingId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return model;
}

function buildModelResponse(
  model: NonNullable<UserModel>,
  photoCount: number,
  photos: ReturnType<typeof resolvePhotoUrls>,
) {
  return {
    status: model.status,
    identityModelId: model.id,
    replicate: {
      owner: model.replicateModelOwner,
      name: model.replicateModelName,
      version: model.replicateModelVersion,
    },
    triggerWord: model.status === "ready" ? model.triggerWord : undefined,
    loraWeightsUrl: model.status === "ready" ? model.loraWeightsUrl : undefined,
    hasLoraWeights: !!model.loraWeightsUrl,
    errorMessage: model.errorMessage ?? undefined,
    photoCount,
    photos,
  };
}

export async function getIdentityStatus(input: GetIdentityStatusInput) {
  const { userId } = input;

  let model = await prisma.userModel.findUnique({
    where: { userId },
  });

  const photos = await prisma.userTrainingAsset.findMany({
    where: {
      userId,
      identityModelId: model ? model.id : null,
    },
    select: {
      id: true,
      s3KeyOriginal: true,
      width: true,
      height: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const photosWithUrls = resolvePhotoUrls(photos);
  const photoCount = photos.length;

  if (!model) {
    return { status: "none" as const, photoCount, photos: photosWithUrls };
  }

  model = await pollTrainingStatus(model);

  return buildModelResponse(model, photoCount, photosWithUrls);
}
