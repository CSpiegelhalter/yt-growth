import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";
import { getTraining } from "@/lib/replicate/client";
import { createLogger } from "@/lib/shared/logger";

const log = createLogger({ subsystem: "identity-status" });

type GetIdentityStatusInput = {
  userId: number;
};

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

  const storage = getStorage();
  const photosWithUrls = photos.map((p) => {
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

  const photoCount = photos.length;

  if (!model) {
    return { status: "none" as const, photoCount, photos: photosWithUrls };
  }

  if (model.status === "training" && model.trainingId) {
    try {
      const training = await getTraining(model.trainingId);
      log.info("Polled Replicate training status", {
        trainingId: model.trainingId,
        replicateStatus: training.status,
      });

      if (training.status === "succeeded") {
        log.info("Training completed, examining output", {
          modelId: model.id,
          trainingId: model.trainingId,
          outputKeys: training.output ? Object.keys(training.output) : [],
          output: training.output,
        });

        const version = training.output?.version;
        const weightsUrl =
          training.output?.weights ??
          training.output?.lora_weights ??
          training.output?.lora ??
          training.output?.model_weights ??
          null;

        model = await prisma.userModel.update({
          where: { id: model.id },
          data: {
            status: "ready",
            replicateModelVersion: version ?? null,
            loraWeightsUrl: weightsUrl ?? null,
            trainingCompletedAt: new Date(),
          },
        });
        log.info("Training completed, model ready", {
          modelId: model.id,
          version,
          weightsUrl,
          hasWeights: !!weightsUrl,
        });
      } else if (
        training.status === "failed" ||
        training.status === "canceled"
      ) {
        model = await prisma.userModel.update({
          where: { id: model.id },
          data: {
            status: training.status,
            errorMessage: training.error ?? `Training ${training.status}`,
            trainingCompletedAt: new Date(),
          },
        });
        log.warn("Training failed/canceled", {
          modelId: model.id,
          error: training.error,
        });
      }
    } catch (err) {
      log.warn("Failed to poll Replicate training", {
        trainingId: model.trainingId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    status: model.status,
    identityModelId: model.id,
    replicate: {
      owner: model.replicateModelOwner,
      name: model.replicateModelName,
      version: model.replicateModelVersion,
    },
    triggerWord: model.status === "ready" ? model.triggerWord : undefined,
    loraWeightsUrl:
      model.status === "ready" ? model.loraWeightsUrl : undefined,
    hasLoraWeights: !!model.loraWeightsUrl,
    errorMessage: model.errorMessage ?? undefined,
    photoCount,
    photos: photosWithUrls,
  };
}
