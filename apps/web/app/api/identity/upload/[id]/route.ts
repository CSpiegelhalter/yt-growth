import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";
import { handleDatasetChange, MIN_TRAINING_PHOTOS } from "@/lib/identity/modelService";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export const DELETE = createApiRoute(
  { route: "/api/identity/upload/[id]" },
  withAuth(
    { mode: "required" },
    async (_req: NextRequest, ctx: RouteParams, api: ApiAuthContext) => {
      const userId = api.userId!;
      const { id } = await ctx.params;

      if (!id || typeof id !== "string") {
        throw new ApiError({
          code: "VALIDATION_ERROR",
          status: 400,
          message: "Invalid photo ID",
        });
      }

      // Find the asset and verify ownership
      const asset = await prisma.userTrainingAsset.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          s3KeyOriginal: true,
          s3KeyNormalized: true,
          identityModelId: true,
        },
      });

      if (!asset) {
        throw new ApiError({
          code: "NOT_FOUND",
          status: 404,
          message: "Photo not found",
        });
      }

      if (asset.userId !== userId) {
        throw new ApiError({
          code: "UNAUTHORIZED",
          status: 403,
          message: "Not authorized to delete this photo",
        });
      }

      // If photo is part of a trained model, it will trigger invalidation
      // This is now allowed - the model will be invalidated and can be retrained

      // Delete from storage
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
        // Continue to delete from DB even if storage delete fails
      }

      // If asset was committed to a model, unlink it first
      if (asset.identityModelId) {
        await prisma.userTrainingAsset.update({
          where: { id },
          data: { identityModelId: null },
        });
      }

      // Delete from database
      await prisma.userTrainingAsset.delete({ where: { id } });

      // Get updated counts
      const total = await prisma.userTrainingAsset.count({ where: { userId } });

      // Handle dataset change (invalidation + coalescing)
      const changeResult = await handleDatasetChange(userId);

      return NextResponse.json({
        deleted: true,
        counts: {
          total,
          minRequiredToTrain: MIN_TRAINING_PHOTOS,
        },
        datasetAction: changeResult.action,
      });
    }
  )
);
