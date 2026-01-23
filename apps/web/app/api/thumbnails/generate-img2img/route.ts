import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { runPrediction } from "@/lib/server/replicate/runPrediction";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/thumbnails/generate-img2img" });

const bodySchema = z.object({
  inputImageUrl: z.string().url(),
  parentJobId: z.string().uuid(),
  prompt: z.string().trim().min(3).max(500).optional(),
  strength: z.number().min(0.1).max(1.0).optional().default(0.75),
});

function getAppBaseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) throw new Error("Cannot determine base URL for webhooks");
  return `${proto}://${host}`;
}

export const POST = createApiRoute(
  { route: "/api/thumbnails/generate-img2img" },
  withAuth(
    { mode: "required" },
      withRateLimit(
      {
        operation: "thumbnailImg2Img",
        identifier: (api) => api.userId,
      },
      withValidation(
        { body: bodySchema },
        async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
          void ctx;
          const userId = api.userId!;
          const input = validated.body!;

          // Verify parent job exists and belongs to user
          const parentJob = await prisma.thumbnailJob.findUnique({
            where: { id: input.parentJobId },
            select: {
              id: true,
              userId: true,
              status: true,
              style: true,
              styleModelVersionId: true,
              identityModelVersionId: true,
              userPrompt: true,
              outputImages: true,
            },
          });

          if (!parentJob || parentJob.userId !== userId) {
            throw new ApiError({
              code: "NOT_FOUND",
              status: 404,
              message: "Parent job not found",
            });
          }

          if (parentJob.status !== "succeeded") {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: "Parent job must be completed before creating variants",
            });
          }

          // Verify the input image is from the parent job or one of its projects
          const outputImages = (parentJob.outputImages as any[]) ?? [];
          const isFromParent = outputImages.some(
            (img) => img?.url === input.inputImageUrl
          );

          // Also check if it's an exported image from a project
          const project = await prisma.thumbnailProject.findFirst({
            where: {
              userId,
              thumbnailJobId: parentJob.id,
            },
            select: { exports: true },
          });

          const exports = (project?.exports as any[]) ?? [];
          const isFromExport = exports.some(
            (exp) => exp?.url === input.inputImageUrl
          );

          if (!isFromParent && !isFromExport) {
            throw new ApiError({
              code: "FORBIDDEN",
              status: 403,
              message: "Input image must be from the parent job or its exports",
            });
          }

          // Use the same prompt as parent if not provided, with variation modifier
          const prompt = input.prompt ?? `${parentJob.userPrompt} (variation)`;

          // Create the img2img job
          const job = await prisma.thumbnailJob.create({
            data: {
              userId,
              source: "img2img",
              style: parentJob.style,
              styleModelVersionId: parentJob.styleModelVersionId,
              identityModelVersionId: parentJob.identityModelVersionId,
              userPrompt: prompt,
              llmPrompt: JSON.stringify({
                type: "img2img",
                parentJobId: parentJob.id,
                prompt,
                strength: input.strength,
              }),
              negativePrompt: null,
              parentJobId: parentJob.id,
              inputImageUrl: input.inputImageUrl,
              status: "running",
              outputImages: [],
            },
            select: { id: true },
          });

          const webhookUrl = `${getAppBaseUrl(req)}/api/webhooks/replicate`;

          // Use FLUX redux/img2img model for variations
          // This model takes an input image and creates variations
          const replicateInput = {
            image: input.inputImageUrl,
            prompt,
            num_outputs: 1,
            output_format: "png",
            output_quality: 90,
            // For img2img, we use a denoising strength / prompt strength
            prompt_strength: input.strength,
          };

          log.info("Creating img2img prediction", {
            jobId: job.id,
            parentJobId: parentJob.id,
            inputImageUrl: input.inputImageUrl.slice(0, 50) + "...",
            strength: input.strength,
          });

          try {
            // Use the same style model as the parent for consistency
            const { predictionId } = await runPrediction({
              version: parentJob.styleModelVersionId,
              replicateInput,
              webhookUrl,
            });

            await prisma.thumbnailJobPrediction.create({
              data: {
                thumbnailJobId: job.id,
                replicatePredictionId: predictionId,
                status: "starting",
                outputImages: [],
              },
            });

            await prisma.thumbnailJob.update({
              where: { id: job.id },
              data: { replicatePredictionId: predictionId },
            });

            return NextResponse.json({
              jobId: job.id,
              status: "running",
              parentJobId: parentJob.id,
              predictionId,
            });
          } catch (err) {
            // Mark job as failed
            await prisma.thumbnailJob.update({
              where: { id: job.id },
              data: {
                status: "failed",
              },
            });

            log.error("Failed to create img2img prediction", {
              jobId: job.id,
              error: err instanceof Error ? err.message : String(err),
            });

            throw new ApiError({
              code: "INTERNAL",
              status: 500,
              message: "Failed to start image variation",
            });
          }
        }
      )
    )
  )
);
