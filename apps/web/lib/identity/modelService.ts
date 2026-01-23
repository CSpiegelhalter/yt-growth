/**
 * Identity Model Service
 *
 * Handles model lifecycle: dataset hash computation, invalidation,
 * training coalescing, and status transitions.
 */

import crypto from "crypto";
import { prisma } from "@/prisma";
import { deleteModel } from "@/lib/replicate/client";
import { createLogger } from "@/lib/logger";
import type { UserModelStatus } from "@prisma/client";

const log = createLogger({ subsystem: "identity-model" });

/**
 * Compute a deterministic hash of the user's training dataset.
 * Hash is based on sorted storage keys of all training assets.
 */
export async function computeDatasetHash(userId: number): Promise<string> {
  const assets = await prisma.userTrainingAsset.findMany({
    where: { userId, s3KeyOriginal: { not: "pending" } },
    select: { s3KeyOriginal: true },
    orderBy: { s3KeyOriginal: "asc" },
  });

  if (assets.length === 0) {
    return "empty";
  }

  const keys = assets.map((a) => a.s3KeyOriginal).join("\n");
  return crypto.createHash("sha256").update(keys, "utf8").digest("hex");
}

/**
 * Check if model needs invalidation based on current dataset vs stored hash.
 */
export async function checkNeedsInvalidation(
  userId: number
): Promise<{ needsInvalidation: boolean; currentHash: string; model: any | null }> {
  const currentHash = await computeDatasetHash(userId);

  const model = await prisma.userModel.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      datasetHash: true,
      needsRetrain: true,
      replicateModelOwner: true,
      replicateModelName: true,
    },
  });

  if (!model) {
    return { needsInvalidation: false, currentHash, model: null };
  }

  // Empty dataset = should invalidate if model exists
  if (currentHash === "empty") {
    return { needsInvalidation: model.status === "ready", currentHash, model };
  }

  // Hash mismatch = needs invalidation
  const needsInvalidation =
    model.datasetHash !== null &&
    model.datasetHash !== currentHash &&
    (model.status === "ready" || model.status === "training");

  return { needsInvalidation, currentHash, model };
}

/**
 * Handle dataset change with coalescing.
 *
 * If model is ready: invalidate and start training
 * If model is training: set needsRetrain flag (coalescing)
 * If no model: do nothing (training will be triggered on commit)
 */
export async function handleDatasetChange(userId: number): Promise<{
  action: "none" | "invalidated" | "coalesced" | "training_started";
  newHash: string;
}> {
  const { needsInvalidation, currentHash, model } = await checkNeedsInvalidation(userId);

  if (!model) {
    log.info("No model exists, dataset change noted", { userId, newHash: currentHash });
    return { action: "none", newHash: currentHash };
  }

  // Empty dataset - just mark for invalidation if ready
  if (currentHash === "empty") {
    if (model.status === "ready") {
      await invalidateModel(userId, model);
      return { action: "invalidated", newHash: currentHash };
    }
    return { action: "none", newHash: currentHash };
  }

  // No change needed
  if (!needsInvalidation && model.datasetHash === currentHash) {
    return { action: "none", newHash: currentHash };
  }

  // Coalescing: if training, just flag for retrain
  if (model.status === "training") {
    await prisma.userModel.update({
      where: { id: model.id },
      data: { needsRetrain: true },
    });
    log.info("Coalescing: set needsRetrain flag", {
      userId,
      modelId: model.id,
      currentHash,
    });
    return { action: "coalesced", newHash: currentHash };
  }

  // Model is ready and hash changed - invalidate
  if (model.status === "ready") {
    await invalidateModel(userId, model);
    return { action: "invalidated", newHash: currentHash };
  }

  return { action: "none", newHash: currentHash };
}

/**
 * Invalidate an existing model.
 * Sets status to 'deleting', attempts remote delete, then removes record.
 */
async function invalidateModel(
  userId: number,
  model: {
    id: string;
    replicateModelOwner: string;
    replicateModelName: string;
  }
): Promise<void> {
  log.info("Invalidating model", {
    userId,
    modelId: model.id,
    owner: model.replicateModelOwner,
    name: model.replicateModelName,
  });

  // Mark as deleting
  await prisma.userModel.update({
    where: { id: model.id },
    data: { status: "deleting" as UserModelStatus },
  });

  // Best-effort remote delete
  try {
    await deleteModel(model.replicateModelOwner, model.replicateModelName);
  } catch (err) {
    log.warn("Failed to delete remote model (continuing)", {
      modelId: model.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Unlink all assets from this model
  await prisma.userTrainingAsset.updateMany({
    where: { identityModelId: model.id },
    data: { identityModelId: null },
  });

  // Delete the model record
  await prisma.userModel.delete({ where: { id: model.id } });

  log.info("Model invalidated and deleted", { userId, modelId: model.id });
}

/**
 * Handle training completion with coalescing check.
 * Called by webhook when training succeeds.
 */
export async function handleTrainingComplete(
  modelId: string,
  opts: { version?: string | null; weightsUrl?: string | null }
): Promise<{ action: "completed" | "retraining"; needsRetrain: boolean }> {
  const model = await prisma.userModel.findUnique({
    where: { id: modelId },
    select: { id: true, userId: true, needsRetrain: true, datasetHash: true },
  });

  if (!model) {
    log.warn("Training complete for unknown model", { modelId });
    return { action: "completed", needsRetrain: false };
  }

  // Check if we need to retrain
  if (model.needsRetrain) {
    const currentHash = await computeDatasetHash(model.userId);

    // If hash is still different from what we started with, trigger retrain
    if (currentHash !== model.datasetHash && currentHash !== "empty") {
      log.info("Training complete but needsRetrain is set, will retrain", {
        modelId,
        oldHash: model.datasetHash,
        newHash: currentHash,
      });

      // Update model with new hash and reset needsRetrain
      // The commit endpoint will need to be called to actually start training
      await prisma.userModel.update({
        where: { id: modelId },
        data: {
          status: "pending",
          needsRetrain: false,
          datasetHash: currentHash,
          replicateModelVersion: opts.version ?? null,
          loraWeightsUrl: opts.weightsUrl ?? null,
          trainingCompletedAt: new Date(),
        },
      });

      return { action: "retraining", needsRetrain: true };
    }
  }

  // Normal completion
  await prisma.userModel.update({
    where: { id: modelId },
    data: {
      status: "ready",
      needsRetrain: false,
      replicateModelVersion: opts.version ?? null,
      loraWeightsUrl: opts.weightsUrl ?? null,
      trainingCompletedAt: new Date(),
      errorMessage: null,
    },
  });

  log.info("Training completed successfully", {
    modelId,
    version: opts.version,
    hasWeights: !!opts.weightsUrl,
  });

  return { action: "completed", needsRetrain: false };
}

/**
 * Get the minimum number of photos required for training.
 */
export const MIN_TRAINING_PHOTOS = 7;

/**
 * Check if user has enough photos to train.
 */
export async function canTrain(userId: number): Promise<{
  canTrain: boolean;
  photoCount: number;
  minRequired: number;
}> {
  const photoCount = await prisma.userTrainingAsset.count({
    where: {
      userId,
      s3KeyOriginal: { not: "pending" },
    },
  });

  return {
    canTrain: photoCount >= MIN_TRAINING_PHOTOS,
    photoCount,
    minRequired: MIN_TRAINING_PHOTOS,
  };
}
