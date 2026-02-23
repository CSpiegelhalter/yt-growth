import crypto from "crypto";
import JSZip from "jszip";
import { type NextRequest, NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import {
  computeDatasetHash,
  generateIdentityTriggerWord,
  isSafeTriggerWord,
  MIN_TRAINING_PHOTOS,
  normalizeIdentityImage,
} from "@/lib/features/identity";
import {
  createModel,
  createTraining,
  uploadFileToReplicate,
  verifyModelVersion,
} from "@/lib/replicate/client";
import { getAppBaseUrl } from "@/lib/server/url";
import { createLogger } from "@/lib/shared/logger";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/prisma";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/identity/commit" });

const MIN_IMAGES = MIN_TRAINING_PHOTOS;

/**
 * Clean up a UserModel that failed to start training.
 * Unlinks assets and deletes the model record.
 */
async function cleanupFailedModel(modelId: string): Promise<void> {
  try {
    // Unlink any assets that were linked to this model
    await prisma.userTrainingAsset.updateMany({
      where: { identityModelId: modelId },
      data: { identityModelId: null },
    });
    // Delete the model
    await prisma.userModel.delete({ where: { id: modelId } });
    log.info("Cleaned up failed model", { modelId });
  } catch (error) {
    log.error("Failed to cleanup model", {
      modelId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function getTrainerVersionId(): string {
  const v = process.env.REPLICATE_IDENTITY_TRAINER_VERSION_ID;
  if (!v) {throw new Error("REPLICATE_IDENTITY_TRAINER_VERSION_ID not configured");}
  return v;
}

function getModelOwner(): string {
  const o = process.env.REPLICATE_MODEL_OWNER;
  if (!o) {throw new Error("REPLICATE_MODEL_OWNER not configured");}
  return o;
}

type TrainerRef = { owner: string; model: string; versionId: string };

function parseTrainerVersion(raw: string): TrainerRef {
  if (raw.includes(":")) {
    const [modelRef, version] = raw.split(":");
    const [ownerPart, namePart] = modelRef.split("/");
    return { owner: ownerPart, model: namePart, versionId: version };
  }
  return {
    owner: process.env.REPLICATE_IDENTITY_TRAINER_OWNER ?? "ostris",
    model: process.env.REPLICATE_IDENTITY_TRAINER_MODEL ?? "flux-dev-lora-trainer",
    versionId: raw,
  };
}

async function validateExistingModel(userId: number): Promise<void> {
  const existing = await prisma.userModel.findUnique({ where: { userId } });

  if (existing?.status === "training") {
    const stuckThreshold = 30 * 60 * 1000;
    const trainingAge = existing.trainingStartedAt
      ? Date.now() - new Date(existing.trainingStartedAt).getTime()
      : Infinity;
    const isStuck = !existing.trainingId || trainingAge > stuckThreshold;

    if (isStuck) {
      log.warn("Cleaning up stuck training model", {
        modelId: existing.id,
        trainingId: existing.trainingId,
        trainingAge: `${Math.round(trainingAge / 60_000)} minutes`,
      });
      await prisma.userTrainingAsset.updateMany({
        where: { identityModelId: existing.id },
        data: { identityModelId: null },
      });
      await prisma.userModel.delete({ where: { id: existing.id } });
    } else {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 409,
        message: "Training is already in progress. Check status and wait for completion.",
      });
    }
  }

  if (existing?.status === "ready") {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      status: 409,
      message: "You already have an identity model. Retraining is not enabled yet.",
    });
  }
}

async function buildTrainingZip(
  assets: Array<{ id: string; s3KeyOriginal: string }>,
  userId: number,
  modelId: string,
): Promise<Uint8Array> {
  const storage = getStorage();
  const zip = new JSZip();

  for (const [i, a] of assets.entries()) {
    const original = await storage.get(a.s3KeyOriginal);
    if (!original) {
      throw new ApiError({
        code: "NOT_FOUND",
        status: 404,
        message: "One of your uploaded photos could not be found. Re-upload and try again.",
      });
    }

    const normalized = await normalizeIdentityImage(original.buffer);
    const normalizedKey = `identity/normalized/u${userId}/${a.id}.jpg`;
    await storage.put(normalizedKey, normalized.bytes, { contentType: normalized.contentType });

    await prisma.userTrainingAsset.update({
      where: { id: a.id },
      data: {
        identityModelId: modelId,
        s3KeyNormalized: normalizedKey,
        width: normalized.width,
        height: normalized.height,
      },
    });

    zip.file(`${String(i + 1).padStart(2, "0")}.jpg`, normalized.bytes);
  }

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

async function verifyTrainer(trainer: TrainerRef, modelId: string): Promise<void> {
  log.info("Verifying trainer model", {
    trainerOwner: trainer.owner,
    trainerModel: trainer.model,
    trainerVersionId: `${trainer.versionId.slice(0, 20)}...`,
  });

  const verification = await verifyModelVersion(trainer.owner, trainer.model, trainer.versionId);
  if (!verification.valid) {
    log.error("Trainer model verification failed", {
      trainerOwner: trainer.owner,
      trainerModel: trainer.model,
      trainerVersionId: trainer.versionId,
      error: verification.error,
    });
    await cleanupFailedModel(modelId);
    throw new ApiError({
      code: "VALIDATION_ERROR",
      status: 400,
      message: `Identity trainer model not available: ${verification.error}. Check your REPLICATE_IDENTITY_TRAINER_VERSION_ID environment variable.`,
    });
  }
}

function getTrainingParams(triggerWord: string) {
  return {
    steps: Number.parseInt(process.env.REPLICATE_IDENTITY_TRAINING_STEPS ?? "2500", 10),
    learningRate: Number.parseFloat(process.env.REPLICATE_IDENTITY_LEARNING_RATE ?? "0.0004"),
    dataKey: process.env.REPLICATE_IDENTITY_TRAINER_DATA_KEY ?? "input_images",
    triggerKey: process.env.REPLICATE_IDENTITY_TRAINER_TRIGGER_KEY ?? "trigger_word",
    loraRank: 32,
    resolution: "1024",
    autocaptionPrefix: `a photo of ${triggerWord},`,
  };
}

export const POST = createApiRoute(
  { route: "/api/identity/commit" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "identityCommit",
        identifier: (api) => api.userId,
      },
      async (_req: NextRequest, ctx, api: ApiAuthContext) => {
        void ctx;
        const userId = api.userId!;

        await validateExistingModel(userId);

        const assets = await prisma.userTrainingAsset.findMany({
          where: { userId, identityModelId: null },
          orderBy: { createdAt: "asc" },
          take: 30,
        });

        if (assets.length < MIN_IMAGES) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: `Upload at least ${MIN_IMAGES} photos before training.`,
          });
        }

        const triggerWord = generateIdentityTriggerWord();
        if (!isSafeTriggerWord(triggerWord)) {
          throw new Error("Generated unsafe trigger word");
        }

        const owner = getModelOwner();
        const modelName = `user-${crypto.randomUUID()}-identity`;
        const datasetHash = await computeDatasetHash(userId);

        const identityModel = await prisma.userModel.create({
          data: {
            userId,
            replicateModelOwner: owner,
            replicateModelName: modelName,
            triggerWord,
            status: "training",
            trainingStartedAt: new Date(),
            datasetHash,
            needsRetrain: false,
          },
        });

        const zipBytes = await buildTrainingZip(assets, userId, identityModel.id);

        const destination = `${owner}/${modelName}`;
        try {
          await createModel({
            owner, name: modelName, visibility: "private",
            description: `Private identity LoRA for user ${userId}`,
          });
        } catch (error) {
          log.warn("createModel failed (continuing)", {
            destination, err: error instanceof Error ? error.message : String(error),
          });
        }

        const rawTrainerVersion = getTrainerVersionId();
        const trainer = parseTrainerVersion(rawTrainerVersion);
        await verifyTrainer(trainer, identityModel.id);

        let uploaded;
        try {
          uploaded = await uploadFileToReplicate({
            filename: `identity-${identityModel.id}.zip`,
            contentType: "application/zip",
            bytes: zipBytes,
          });
        } catch (error) {
          log.error("Failed to upload training zip", {
            modelId: identityModel.id,
            error: error instanceof Error ? error.message : String(error),
          });
          await cleanupFailedModel(identityModel.id);
          throw error;
        }

        const params = getTrainingParams(triggerWord);
        let training;
        try {
          training = await createTraining({
            version: rawTrainerVersion,
            destination,
            input: {
              [params.dataKey]: uploaded.urls.get,
              [params.triggerKey]: triggerWord,
              lora_type: "subject",
              steps: params.steps,
              learning_rate: params.learningRate,
              lora_rank: params.loraRank,
              resolution: params.resolution,
              autocaption: true,
              autocaption_prefix: params.autocaptionPrefix,
            },
            webhook: `${getAppBaseUrl()}/api/webhooks/replicate`,
            webhook_events_filter: ["completed"],
          });

          log.info("Training started with enhanced parameters", {
            modelId: identityModel.id,
            steps: params.steps,
            learningRate: params.learningRate,
            loraRank: params.loraRank,
            resolution: params.resolution,
          });
        } catch (error) {
          log.error("Failed to create training", {
            modelId: identityModel.id,
            error: error instanceof Error ? error.message : String(error),
          });
          await cleanupFailedModel(identityModel.id);
          throw error;
        }

        await prisma.userModel.update({
          where: { id: identityModel.id },
          data: { trainingId: training.id, status: "training" },
        });

        return NextResponse.json({
          status: "training",
          identityModelId: identityModel.id,
          triggerWord,
          trainingId: training.id,
        });
      }
    )
  )
);

