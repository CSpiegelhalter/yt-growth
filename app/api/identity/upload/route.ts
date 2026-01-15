import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { getStorage, mimeToExt } from "@/lib/storage";

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

        // Parse multipart form data
        let form: FormData;
        try {
          form = await req.formData();
        } catch {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Invalid multipart form data",
          });
        }

        const files = form
          .getAll("file")
          .filter((v): v is File => typeof v !== "string");

        if (files.length === 0) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "No files uploaded",
          });
        }

        if (files.length > MAX_FILES_PER_REQUEST) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: `Too many files (max ${MAX_FILES_PER_REQUEST})`,
          });
        }

        const currentCount = await prisma.userTrainingAsset.count({
          where: { userId },
        });
        if (currentCount >= MAX_ASSETS_PER_USER) {
          throw new ApiError({
            code: "RATE_LIMITED",
            status: 429,
            message: `You have reached the maximum of ${MAX_ASSETS_PER_USER} training photos. Please delete some before uploading more.`,
          });
        }

        const storage = getStorage();
        const results: FileResult[] = [];
        let successCount = 0;

        for (const file of files) {
          const filename = file.name || `file-${results.length + 1}`;

          // Validate file type
          if (!ALLOWED_TYPES.has(file.type)) {
            results.push({
              filename,
              status: "error",
              error: `Unsupported type: ${file.type}. Use JPG, PNG, or WebP.`,
            });
            continue;
          }

          // Validate file size
          if (file.size <= 0 || file.size > MAX_BYTES) {
            results.push({
              filename,
              status: "error",
              error: `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)`,
            });
            continue;
          }

          // Enforce max per user with headroom for this request
          if (currentCount + successCount >= MAX_ASSETS_PER_USER) {
            results.push({
              filename,
              status: "error",
              error: "Limit reached (max 30 photos)",
            });
            continue;
          }

          let bytes: Buffer;
          try {
            bytes = Buffer.from(await file.arrayBuffer());
          } catch {
            results.push({ filename, status: "error", error: "Failed to read file" });
            continue;
          }

          // Read dimensions early to enforce minimum quality
          let meta: sharp.Metadata;
          try {
            meta = await sharp(bytes, { failOnError: true }).metadata();
          } catch {
            results.push({ filename, status: "error", error: "Invalid or corrupt image" });
            continue;
          }

          const width = meta.width ?? 0;
          const height = meta.height ?? 0;
          if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
            results.push({
              filename,
              status: "error",
              width,
              height,
              error: `Image too small (${width}×${height}). Minimum is ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
            });
            continue;
          }

          const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");

          // Create DB row first (dedupe by userId+sha256)
          let asset: { id: string };
          try {
            asset = await prisma.userTrainingAsset
              .create({
                data: {
                  userId,
                  s3KeyOriginal: "pending",
                  s3KeyNormalized: null,
                  width,
                  height,
                  sha256,
                },
                select: { id: true },
              })
              .catch(async (err) => {
                // Unique constraint: already uploaded
                const existing = await prisma.userTrainingAsset.findFirst({
                  where: { userId, sha256 },
                  select: { id: true },
                });
                if (existing) return existing;
                throw err;
              });
          } catch {
            results.push({ filename, status: "error", error: "Failed to save to database" });
            continue;
          }

          const ext = mimeToExt(file.type);
          const key = `identity/original/u${userId}/${asset.id}.${ext}`;

          try {
            await storage.put(key, bytes, { contentType: file.type });
          } catch {
            results.push({ filename, status: "error", error: "Failed to upload to storage" });
            continue;
          }

          // Patch the key onto the row
          await prisma.userTrainingAsset.update({
            where: { id: asset.id },
            data: { s3KeyOriginal: key, width, height },
          });

          results.push({ filename, status: "ok", id: asset.id, width, height });
          successCount++;
        }

        const total = await prisma.userTrainingAsset.count({ where: { userId } });
        const uncommitted = await prisma.userTrainingAsset.count({
          where: { userId, identityModelId: null },
        });

        const hasErrors = results.some((r) => r.status === "error");

        return NextResponse.json({
          results,
          counts: {
            total,
            uncommitted,
            uploaded: successCount,
            failed: results.length - successCount,
            minRequiredToTrain: 7,
            maxAllowed: MAX_ASSETS_PER_USER,
          },
          // If some succeeded and some failed, return 200 with partial success info
          // Frontend will show which failed
          hasErrors,
        });
      }
    )
  )
);

