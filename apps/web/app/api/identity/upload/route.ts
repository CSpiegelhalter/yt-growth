import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { ApiError } from "@/lib/api/errors";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { handleDatasetChange, MIN_TRAINING_PHOTOS } from "@/lib/features/identity";
import { getStorage, mimeToExt } from "@/lib/storage";
import { prisma } from "@/prisma";

export const runtime = "nodejs";

const MAX_FILES_PER_REQUEST = 20;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_ASSETS_PER_USER = 30;
const MIN_DIMENSION = 256;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type FileResult = {
  filename: string;
  status: "ok" | "error";
  id?: string;
  width?: number;
  height?: number;
  error?: string;
};

function validateFileBasics(file: File, filename: string, remainingSlots: number): FileResult | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { filename, status: "error", error: `Unsupported type: ${file.type}. Use JPG, PNG, or WebP.` };
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { filename, status: "error", error: `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)` };
  }
  if (remainingSlots <= 0) {
    return { filename, status: "error", error: "Limit reached (max 30 photos)" };
  }
  return null;
}

async function readAndValidateImage(file: File, filename: string): Promise<
  | { ok: true; bytes: Buffer; width: number; height: number }
  | { ok: false; result: FileResult }
> {
  let bytes: Buffer;
  try {
    bytes = Buffer.from(await file.arrayBuffer());
  } catch {
    return { ok: false, result: { filename, status: "error", error: "Failed to read file" } };
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(bytes, { failOnError: true }).metadata();
  } catch {
    return { ok: false, result: { filename, status: "error", error: "Invalid or corrupt image" } };
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return {
      ok: false,
      result: {
        filename, status: "error", width, height,
        error: `Image too small (${width}x${height}). Minimum is ${MIN_DIMENSION}x${MIN_DIMENSION}px.`,
      },
    };
  }

  return { ok: true, bytes, width, height };
}

async function findOrCreateAsset(
  userId: number, sha256: string, width: number, height: number,
): Promise<{ id: string; isExisting: boolean } | null> {
  try {
    const asset = await prisma.userTrainingAsset
      .create({
        data: { userId, s3KeyOriginal: "pending", s3KeyNormalized: null, width, height, sha256 },
        select: { id: true },
      })
      .catch(async (error) => {
        const existing = await prisma.userTrainingAsset.findFirst({
          where: { userId, sha256 },
          select: { id: true, identityModelId: true },
        });
        if (existing) {
          if (existing.identityModelId !== null) {
            await prisma.userTrainingAsset.update({
              where: { id: existing.id },
              data: { identityModelId: null },
            });
          }
          return { id: existing.id, _existing: true as const };
        }
        throw error;
      });

    const isExisting = "_existing" in asset;
    return { id: asset.id, isExisting };
  } catch {
    return null;
  }
}

function extractFiles(form: FormData): File[] {
  return form.getAll("file").filter((v): v is File => typeof v !== "string");
}

export const POST = createApiRoute(
  { route: "/api/identity/upload" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "identityUpload",
        identifier: (api) => api.userId,
      },
      async (req: NextRequest, ctx, api: ApiAuthContext) => {
        void ctx;
        const userId = api.userId!;

        let form: FormData;
        try {
          form = await req.formData();
        } catch {
          throw new ApiError({ code: "VALIDATION_ERROR", status: 400, message: "Invalid multipart form data" });
        }

        const files = extractFiles(form);

        if (files.length === 0) {
          throw new ApiError({ code: "VALIDATION_ERROR", status: 400, message: "No files uploaded" });
        }
        if (files.length > MAX_FILES_PER_REQUEST) {
          throw new ApiError({ code: "VALIDATION_ERROR", status: 400, message: `Too many files (max ${MAX_FILES_PER_REQUEST})` });
        }

        const currentCount = await prisma.userTrainingAsset.count({ where: { userId } });
        if (currentCount >= MAX_ASSETS_PER_USER) {
          throw new ApiError({
            code: "RATE_LIMITED", status: 429,
            message: `You have reached the maximum of ${MAX_ASSETS_PER_USER} training photos. Please delete some before uploading more.`,
          });
        }

        const storage = getStorage();
        const results: FileResult[] = [];
        let successCount = 0;

        for (const file of files) {
          const filename = file.name || `file-${results.length + 1}`;
          const remainingSlots = MAX_ASSETS_PER_USER - currentCount - successCount;

          const basicError = validateFileBasics(file, filename, remainingSlots);
          if (basicError) { results.push(basicError); continue; }

          const imageResult = await readAndValidateImage(file, filename);
          if (!imageResult.ok) { results.push(imageResult.result); continue; }
          const { bytes, width, height } = imageResult;

          const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
          const assetResult = await findOrCreateAsset(userId, sha256, width, height);
          if (!assetResult) {
            results.push({ filename, status: "error", error: "Failed to save to database" });
            continue;
          }

          if (assetResult.isExisting) {
            results.push({ filename, status: "ok", id: assetResult.id, width, height });
            successCount++;
            continue;
          }

          const ext = mimeToExt(file.type);
          const key = `identity/original/u${userId}/${assetResult.id}.${ext}`;

          try {
            await storage.put(key, bytes, { contentType: file.type });
          } catch {
            await prisma.userTrainingAsset.delete({ where: { id: assetResult.id } }).catch(() => {});
            results.push({ filename, status: "error", error: "Failed to upload to storage" });
            continue;
          }

          await prisma.userTrainingAsset.update({
            where: { id: assetResult.id },
            data: { s3KeyOriginal: key, width, height },
          });

          results.push({ filename, status: "ok", id: assetResult.id, width, height });
          successCount++;
        }

        const total = await prisma.userTrainingAsset.count({ where: { userId } });
        const uncommitted = await prisma.userTrainingAsset.count({
          where: { userId, identityModelId: null },
        });

        let datasetAction: "none" | "invalidated" | "coalesced" | "training_started" = "none";
        if (successCount > 0) {
          const changeResult = await handleDatasetChange(userId);
          datasetAction = changeResult.action;
        }

        return NextResponse.json({
          results,
          counts: {
            total, uncommitted,
            uploaded: successCount,
            failed: results.length - successCount,
            minRequiredToTrain: MIN_TRAINING_PHOTOS,
            maxAllowed: MAX_ASSETS_PER_USER,
          },
          datasetAction,
          hasErrors: results.some((r) => r.status === "error"),
        });
      }
    )
  )
);

