import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";
import { deleteModel } from "@/lib/replicate/client";
import { createLogger } from "@/lib/shared/logger";
import { IdentityError } from "../errors";

const log = createLogger({ subsystem: "identity-reset" });

type ResetModelInput = {
  userId: number;
  deletePhotos?: boolean;
};

type ResetModelResult = {
  reset: true;
  photoCount: number;
  message: string;
};

export async function resetModel(
  input: ResetModelInput,
): Promise<ResetModelResult> {
  const { userId, deletePhotos = false } = input;

  const model = await prisma.userModel.findUnique({
    where: { userId },
    select: {
      id: true,
      replicateModelOwner: true,
      replicateModelName: true,
      status: true,
    },
  });

  if (!model) {
    throw new IdentityError("NOT_FOUND", "No identity model found to reset");
  }

  if (model.status === "training") {
    throw new IdentityError(
      "INVALID_INPUT",
      "Cannot reset while training is in progress. Please wait for training to complete or fail.",
    );
  }

  log.info("Resetting identity model", {
    userId,
    modelId: model.id,
    status: model.status,
    deletePhotos,
  });

  if (model.replicateModelOwner && model.replicateModelName) {
    await deleteModel(model.replicateModelOwner, model.replicateModelName);
  }

  await prisma.userTrainingAsset.updateMany({
    where: { identityModelId: model.id },
    data: { identityModelId: null },
  });

  await prisma.userModel.delete({
    where: { id: model.id },
  });

  if (deletePhotos) {
    const storage = getStorage();
    const allAssets = await prisma.userTrainingAsset.findMany({
      where: { userId, identityModelId: null },
      select: { id: true, s3KeyOriginal: true, s3KeyNormalized: true },
    });

    for (const asset of allAssets) {
      try {
        if (asset.s3KeyOriginal && asset.s3KeyOriginal !== "pending") {
          await storage.delete(asset.s3KeyOriginal);
        }
        if (asset.s3KeyNormalized) {
          await storage.delete(asset.s3KeyNormalized);
        }
      } catch (err) {
        log.warn("Failed to delete asset from storage", {
          assetId: asset.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await prisma.userTrainingAsset.deleteMany({
      where: { userId, identityModelId: null },
    });

    log.info("Deleted all training photos", { userId, count: allAssets.length });
  }

  const photoCount = await prisma.userTrainingAsset.count({
    where: { userId, identityModelId: null },
  });

  return {
    reset: true,
    photoCount,
    message: deletePhotos
      ? "Identity model reset and all photos deleted. Upload new photos to retrain."
      : "Identity model reset. You can now upload new photos or retrain with existing ones.",
  };
}
