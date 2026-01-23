import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";
import { deleteModel } from "@/lib/replicate/client";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/identity/reset" });

/**
 * POST /api/identity/reset
 *
 * Resets the user's identity model, allowing them to retrain with new photos.
 * This will:
 * 1. Delete the Replicate model (best effort)
 * 2. Unlink all training assets from the model
 * 3. Delete the UserModel record
 * 4. Optionally delete uncommitted training assets
 */
export const POST = createApiRoute(
  { route: "/api/identity/reset" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "identityReset",
        identifier: (api) => api.userId,
      },
      async (req: NextRequest, ctx, api: ApiAuthContext) => {
        void ctx;
        const userId = api.userId!;

        // Parse optional body
        let deletePhotos = false;
        try {
          const body = await req.json().catch(() => ({}));
          deletePhotos = body.deletePhotos === true;
        } catch {
          // ignore
        }

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
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "No identity model found to reset",
          });
        }

        // Don't allow reset while training is in progress
        if (model.status === "training") {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 409,
            message: "Cannot reset while training is in progress. Please wait for training to complete or fail.",
          });
        }

        log.info("Resetting identity model", {
          userId,
          modelId: model.id,
          status: model.status,
          deletePhotos,
        });

        // 1. Delete the Replicate model (best effort)
        if (model.replicateModelOwner && model.replicateModelName) {
          await deleteModel(model.replicateModelOwner, model.replicateModelName);
        }

        // 2. Unlink all assets from the model (set identityModelId = null)
        await prisma.userTrainingAsset.updateMany({
          where: { identityModelId: model.id },
          data: { identityModelId: null },
        });

        // 3. Delete the UserModel
        await prisma.userModel.delete({
          where: { id: model.id },
        });

        // 4. Optionally delete all uncommitted photos
        if (deletePhotos) {
          const storage = getStorage();
          const allAssets = await prisma.userTrainingAsset.findMany({
            where: { userId, identityModelId: null },
            select: { id: true, s3KeyOriginal: true, s3KeyNormalized: true },
          });

          // Delete from storage
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

          // Delete from database
          await prisma.userTrainingAsset.deleteMany({
            where: { userId, identityModelId: null },
          });

          log.info("Deleted all training photos", {
            userId,
            count: allAssets.length,
          });
        }

        // Get updated counts
        const photoCount = await prisma.userTrainingAsset.count({
          where: { userId, identityModelId: null },
        });

        return NextResponse.json({
          reset: true,
          photoCount,
          message: deletePhotos
            ? "Identity model reset and all photos deleted. Upload new photos to retrain."
            : "Identity model reset. You can now upload new photos or retrain with existing ones.",
        });
      }
    )
  )
);
