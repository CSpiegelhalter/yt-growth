import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { prisma } from "@/prisma";
import { getStorage } from "@/lib/storage";
import { getTraining } from "@/lib/replicate/client";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/identity/status" });

export const GET = createApiRoute(
  { route: "/api/identity/status" },
  withAuth(
    { mode: "required" },
    async (_req: NextRequest, ctx, api: ApiAuthContext) => {
      void ctx;
      const userId = api.userId!;

      // Get uploaded photos (uncommitted assets that can be used for training)
      const photos = await prisma.userTrainingAsset.findMany({
        where: { userId, identityModelId: null },
        select: {
          id: true,
          s3KeyOriginal: true,
          width: true,
          height: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      // Generate public URLs for the photos
      const storage = getStorage();
      const photosWithUrls = photos.map((p) => {
        let url: string | null = null;
        if (p.s3KeyOriginal && p.s3KeyOriginal !== "pending") {
          try {
            url = storage.getPublicUrl(p.s3KeyOriginal);
          } catch {
            // Ignore errors
          }
        }
        return {
          id: p.id,
          url,
          width: p.width,
          height: p.height,
        };
      });

      const photoCount = photos.length;

      let model = await prisma.userModel.findUnique({
        where: { userId },
      });

      if (!model) {
        return NextResponse.json({ 
          status: "none", 
          photoCount,
          photos: photosWithUrls,
        });
      }

      // If training is in progress, poll Replicate directly to get real-time status
      if (model.status === "training" && model.trainingId) {
        try {
          const training = await getTraining(model.trainingId);
          log.info("Polled Replicate training status", { 
            trainingId: model.trainingId, 
            replicateStatus: training.status 
          });

          // Update our DB if Replicate status has changed
          if (training.status === "succeeded") {
            // Training completed - get the model version and weights URL from the output
            // Log full output for debugging
            log.info("Training completed, examining output", {
              modelId: model.id,
              trainingId: model.trainingId,
              outputKeys: training.output ? Object.keys(training.output) : [],
              output: training.output,
            });
            
            const version = training.output?.version;
            // Try multiple possible field names for weights URL
            const weightsUrl = 
              training.output?.weights ??
              training.output?.lora_weights ??
              training.output?.lora ??
              training.output?.model_weights ??
              null;
              
            model = await prisma.userModel.update({
              where: { id: model.id },
              data: {
                status: "ready",
                replicateModelVersion: version ?? null,
                loraWeightsUrl: weightsUrl ?? null,
                trainingCompletedAt: new Date(),
              },
            });
            log.info("Training completed, model ready", { 
              modelId: model.id, 
              version, 
              weightsUrl,
              hasWeights: !!weightsUrl,
            });
          } else if (training.status === "failed" || training.status === "canceled") {
            model = await prisma.userModel.update({
              where: { id: model.id },
              data: {
                status: training.status,
                errorMessage: training.error ?? `Training ${training.status}`,
                trainingCompletedAt: new Date(),
              },
            });
            log.warn("Training failed/canceled", { modelId: model.id, error: training.error });
          }
          // If still processing/starting, keep status as "training"
        } catch (err) {
          log.warn("Failed to poll Replicate training", { 
            trainingId: model.trainingId, 
            error: err instanceof Error ? err.message : String(err) 
          });
          // Continue with DB status if Replicate poll fails
        }
      }

      return NextResponse.json({
        status: model.status,
        identityModelId: model.id,
        replicate: {
          owner: model.replicateModelOwner,
          name: model.replicateModelName,
          version: model.replicateModelVersion,
        },
        triggerWord: model.status === "ready" ? model.triggerWord : undefined,
        // Include loraWeightsUrl so we can verify it's being captured
        loraWeightsUrl: model.status === "ready" ? model.loraWeightsUrl : undefined,
        hasLoraWeights: !!model.loraWeightsUrl,
        errorMessage: model.errorMessage ?? undefined,
        photoCount,
        photos: photosWithUrls,
      });
    }
  )
);

