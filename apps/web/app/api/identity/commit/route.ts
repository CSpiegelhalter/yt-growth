import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import JSZip from "jszip";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";
import {
  normalizeIdentityImage,
  generateIdentityTriggerWord,
  isSafeTriggerWord,
  computeDatasetHash,
  MIN_TRAINING_PHOTOS,
} from "@/lib/features/identity";
import { createLogger } from "@/lib/shared/logger";
import {
  createModel,
  createTraining,
  uploadFileToReplicate,
  verifyModelVersion,
} from "@/lib/replicate/client";
import { getAppBaseUrl } from "@/lib/server/url";

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
  } catch (err) {
    log.error("Failed to cleanup model", {
      modelId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function getTrainerVersionId(): string {
  const v = process.env.REPLICATE_IDENTITY_TRAINER_VERSION_ID;
  if (!v) throw new Error("REPLICATE_IDENTITY_TRAINER_VERSION_ID not configured");
  return v;
}

function getModelOwner(): string {
  const o = process.env.REPLICATE_MODEL_OWNER;
  if (!o) throw new Error("REPLICATE_MODEL_OWNER not configured");
  return o;
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

        // Ensure user does not already have an in-progress or ready model
        const existing = await prisma.userModel.findUnique({
          where: { userId },
        });
        
        if (existing?.status === "training") {
          // Check if training is stuck (no trainingId or very old)
          const stuckThreshold = 30 * 60 * 1000; // 30 minutes
          const trainingAge = existing.trainingStartedAt 
            ? Date.now() - new Date(existing.trainingStartedAt).getTime()
            : Infinity;
          const isStuck = !existing.trainingId || trainingAge > stuckThreshold;
          
          if (isStuck) {
            log.warn("Cleaning up stuck training model", { 
              modelId: existing.id, 
              trainingId: existing.trainingId,
              trainingAge: Math.round(trainingAge / 60000) + " minutes"
            });
            // Reset any committed assets
            await prisma.userTrainingAsset.updateMany({
              where: { identityModelId: existing.id },
              data: { identityModelId: null },
            });
            // Delete the stuck model
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
            message:
              "You already have an identity model. Retraining is not enabled yet.",
          });
        }

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
        
        // Compute dataset hash before starting training
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

        const storage = getStorage();
        const zip = new JSZip();

        for (let i = 0; i < assets.length; i++) {
          const a = assets[i];
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
          await storage.put(normalizedKey, normalized.bytes, {
            contentType: normalized.contentType,
          });

          await prisma.userTrainingAsset.update({
            where: { id: a.id },
            data: {
              identityModelId: identityModel.id,
              s3KeyNormalized: normalizedKey,
              width: normalized.width,
              height: normalized.height,
            },
          });

          zip.file(`${String(i + 1).padStart(2, "0")}.jpg`, normalized.bytes);
        }

        const zipBytes = await zip.generateAsync({
          type: "uint8array",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        // Create destination model (best-effort; may already exist)
        const destination = `${owner}/${modelName}`;
        try {
          await createModel({
            owner,
            name: modelName,
            visibility: "private",
            description: `Private identity LoRA for user ${userId}`,
          });
        } catch (err) {
          log.warn("createModel failed (continuing)", {
            destination,
            err: err instanceof Error ? err.message : String(err),
          });
        }

        // Parse trainer version - can be "owner/model:version" or just "version"
        const rawTrainerVersion = getTrainerVersionId();
        let trainerOwner: string;
        let trainerModel: string;
        let trainerVersionId: string;
        
        if (rawTrainerVersion.includes(":")) {
          // Full format: "owner/model:version"
          const [modelRef, version] = rawTrainerVersion.split(":");
          const [ownerPart, namePart] = modelRef.split("/");
          trainerOwner = ownerPart;
          trainerModel = namePart;
          trainerVersionId = version;
        } else {
          // Just version hash - use env vars or defaults for owner/model
          trainerOwner = process.env.REPLICATE_IDENTITY_TRAINER_OWNER ?? "ostris";
          trainerModel = process.env.REPLICATE_IDENTITY_TRAINER_MODEL ?? "flux-dev-lora-trainer";
          trainerVersionId = rawTrainerVersion;
        }
        
        log.info("Verifying trainer model", { 
          trainerOwner, 
          trainerModel, 
          trainerVersionId: trainerVersionId.slice(0, 20) + "..." 
        });
        
        const verification = await verifyModelVersion(trainerOwner, trainerModel, trainerVersionId);
        if (!verification.valid) {
          log.error("Trainer model verification failed", {
            trainerOwner,
            trainerModel,
            trainerVersionId,
            error: verification.error,
          });
          // Clean up the model we just created since training won't start
          await cleanupFailedModel(identityModel.id);
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: `Identity trainer model not available: ${verification.error}. Check your REPLICATE_IDENTITY_TRAINER_VERSION_ID environment variable.`,
          });
        }

        // Upload training zip to Replicate Files
        let uploaded;
        try {
          uploaded = await uploadFileToReplicate({
            filename: `identity-${identityModel.id}.zip`,
            contentType: "application/zip",
            bytes: zipBytes,
          });
        } catch (err) {
          log.error("Failed to upload training zip", {
            modelId: identityModel.id,
            error: err instanceof Error ? err.message : String(err),
          });
          await cleanupFailedModel(identityModel.id);
          throw err;
        }

        // Trainer input keys are trainer-specific; keep configurable.
        const dataKey = process.env.REPLICATE_IDENTITY_TRAINER_DATA_KEY ?? "input_images";
        const triggerKey =
          process.env.REPLICATE_IDENTITY_TRAINER_TRIGGER_KEY ?? "trigger_word";

        let training;
        try {
          // Training parameters for better identity fidelity
          // These can be configured via environment variables
          // Default 2500 steps for strong identity capture (was 1500)
          const trainingSteps = parseInt(process.env.REPLICATE_IDENTITY_TRAINING_STEPS ?? "2500", 10);
          const learningRate = parseFloat(process.env.REPLICATE_IDENTITY_LEARNING_RATE ?? "0.0004");
          
          training = await createTraining({
            version: rawTrainerVersion, // Pass full format, createTraining will parse it
            destination,
            input: {
              [dataKey]: uploaded.urls.get,
              [triggerKey]: triggerWord,
              // Training type - "subject" for identity/person training
              lora_type: "subject",
              // More steps = better identity capture (default ~1000, we use 1500)
              steps: trainingSteps,
              // Learning rate - slightly higher for better convergence
              learning_rate: learningRate,
              // LoRA rank - higher rank captures more detail (16-32 is good for faces)
              lora_rank: 32,
              // Resolution - train at higher resolution for face detail
              resolution: "1024",
              // Autocaption to help the model understand the subject
              autocaption: true,
              autocaption_prefix: `a photo of ${triggerWord},`,
            },
            webhook: `${getAppBaseUrl()}/api/webhooks/replicate`,
            webhook_events_filter: ["completed"],
          });
          
          log.info("Training started with enhanced parameters", {
            modelId: identityModel.id,
            steps: trainingSteps,
            learningRate,
            loraRank: 32,
            resolution: "1024",
          });
        } catch (err) {
          log.error("Failed to create training", {
            modelId: identityModel.id,
            error: err instanceof Error ? err.message : String(err),
          });
          await cleanupFailedModel(identityModel.id);
          throw err;
        }

        await prisma.userModel.update({
          where: { id: identityModel.id },
          data: {
            trainingId: training.id,
            status: "training",
          },
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

