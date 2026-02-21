import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";
import { handleDatasetChange, MIN_TRAINING_PHOTOS } from "./manageModel";
import { IdentityError } from "../errors";

type DeletePhotoInput = {
  userId: number;
  photoId: string;
};

type DeletePhotoResult = {
  deleted: true;
  counts: {
    total: number;
    minRequiredToTrain: number;
  };
  datasetAction: string;
};

export async function deletePhoto(
  input: DeletePhotoInput,
): Promise<DeletePhotoResult> {
  const { userId, photoId } = input;

  if (!photoId || typeof photoId !== "string") {
    throw new IdentityError("INVALID_INPUT", "Invalid photo ID");
  }

  const asset = await prisma.userTrainingAsset.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      userId: true,
      s3KeyOriginal: true,
      s3KeyNormalized: true,
      identityModelId: true,
    },
  });

  if (!asset) {
    throw new IdentityError("NOT_FOUND", "Photo not found");
  }

  if (asset.userId !== userId) {
    throw new IdentityError(
      "FORBIDDEN",
      "Not authorized to delete this photo",
    );
  }

  const storage = getStorage();
  try {
    if (asset.s3KeyOriginal && asset.s3KeyOriginal !== "pending") {
      await storage.delete(asset.s3KeyOriginal);
    }
    if (asset.s3KeyNormalized) {
      await storage.delete(asset.s3KeyNormalized);
    }
  } catch (err) {
    console.error("[identity:delete] Storage delete error:", err);
  }

  if (asset.identityModelId) {
    await prisma.userTrainingAsset.update({
      where: { id: photoId },
      data: { identityModelId: null },
    });
  }

  await prisma.userTrainingAsset.delete({ where: { id: photoId } });

  const total = await prisma.userTrainingAsset.count({ where: { userId } });
  const changeResult = await handleDatasetChange(userId);

  return {
    deleted: true,
    counts: { total, minRequiredToTrain: MIN_TRAINING_PHOTOS },
    datasetAction: changeResult.action,
  };
}
