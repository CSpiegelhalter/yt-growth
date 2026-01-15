import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import JSZip from "jszip";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";
import { normalizeIdentityImage } from "@/lib/identity/normalizeImage";
import {
  generateIdentityTriggerWord,
  isSafeTriggerWord,
} from "@/lib/identity/triggerWord";
import { createLogger } from "@/lib/logger";
import {
  createModel,
  createTraining,
  uploadFileToReplicate,
} from "@/lib/replicate/client";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/identity/commit" });

const MIN_IMAGES = 7;

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

function getAppBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  if (!u) throw new Error("NEXT_PUBLIC_APP_URL not configured");
  return u.replace(/\/$/, "");
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
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 409,
            message: "Training is already in progress. Check status and wait for completion.",
          });
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

        const identityModel = await prisma.userModel.create({
          data: {
            userId,
            replicateModelOwner: owner,
            replicateModelName: modelName,
            triggerWord,
            status: "training",
            trainingStartedAt: new Date(),
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

        // Upload training zip to Replicate Files
        const uploaded = await uploadFileToReplicate({
          filename: `identity-${identityModel.id}.zip`,
          contentType: "application/zip",
          bytes: zipBytes,
        });

        // Trainer input keys are trainer-specific; keep configurable.
        const dataKey = process.env.REPLICATE_IDENTITY_TRAINER_DATA_KEY ?? "input_images";
        const triggerKey =
          process.env.REPLICATE_IDENTITY_TRAINER_TRIGGER_KEY ?? "trigger_word";

        const training = await createTraining({
          version: getTrainerVersionId(),
          destination,
          input: {
            [dataKey]: uploaded.urls.get,
            [triggerKey]: triggerWord,
          },
          webhook: `${getAppBaseUrl()}/api/webhooks/replicate`,
          webhook_events_filter: ["completed"],
        });

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

