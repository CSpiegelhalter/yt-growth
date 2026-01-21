import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { STYLE_MODELS } from "@/lib/thumbnails-v2/styleModels";
import { buildThumbnailPrompt } from "@/lib/server/prompting/buildThumbnailPrompt";
import { runPrediction } from "@/lib/server/replicate/runPrediction";
import { verifyModelVersion } from "@/lib/replicate/client";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/thumbnails/generate" });

const bodySchema = z.object({
  style: z.enum(["compare", "subject", "object", "hold"]),
  prompt: z.string().trim().min(3).max(500),
  includeIdentity: z.boolean().optional().default(false),
  identityModelId: z.string().uuid().optional(),
  variants: z.number().int().min(1).max(4).optional().default(3),
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
  { route: "/api/thumbnails/generate" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "thumbnailGenerateV2",
        identifier: (api) => api.userId,
      },
      withValidation(
        { body: bodySchema },
        async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
          void ctx;
          const userId = api.userId!;
          const input = validated.body!;

          let identityTriggerWord: string | undefined;
          let identityModelVersionId: string | undefined;
          let identityLoraWeightsUrl: string | undefined;
          let identityModelRef: string | undefined; // Replicate model reference (owner/name)

          if (input.includeIdentity) {
            if (!input.identityModelId) {
              throw new ApiError({
                code: "VALIDATION_ERROR",
                status: 400,
                message:
                  "identityModelId is required when includeIdentity=true",
              });
            }
            if (input.style !== "subject" && input.style !== "hold") {
              throw new ApiError({
                code: "VALIDATION_ERROR",
                status: 400,
                message:
                  "Identity can currently be used only with SUBJECT or HOLD styles.",
              });
            }

            const model = await prisma.userModel.findUnique({
              where: { id: input.identityModelId },
            });
            if (!model || model.userId !== userId) {
              throw new ApiError({
                code: "NOT_FOUND",
                status: 404,
                message: "Identity model not found",
              });
            }
            if (model.status !== "ready") {
              throw new ApiError({
                code: "VALIDATION_ERROR",
                status: 409,
                message: "Identity model is not ready yet",
              });
            }
            identityTriggerWord = model.triggerWord;
            identityModelVersionId = model.replicateModelVersion ?? undefined;
            identityLoraWeightsUrl = model.loraWeightsUrl ?? undefined;
            
            // Build the Replicate model reference for extra_lora
            // Schema says format is: "<owner>/<username>/<version>" (slashes, not colons)
            // The version stored is "owner/model:versionhash" - we need to convert to "owner/model/versionhash"
            if (model.replicateModelVersion && model.replicateModelVersion.includes(":")) {
              // Convert "owner/model:version" to "owner/model/version" format
              identityModelRef = model.replicateModelVersion.replace(":", "/");
            } else if (model.replicateModelOwner && model.replicateModelName) {
              identityModelRef = `${model.replicateModelOwner}/${model.replicateModelName}`;
            }
          }

          const styleCfg = STYLE_MODELS[input.style];
          if (!styleCfg) {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: "Invalid style",
            });
          }

          // Verify the style model exists before proceeding
          const [styleOwner, styleName] = styleCfg.model.split("/");
          log.info("Verifying style model", {
            styleOwner,
            styleName,
            styleVersion: styleCfg.version.slice(0, 20) + "...",
          });
          
          const verification = await verifyModelVersion(styleOwner, styleName, styleCfg.version);
          if (!verification.valid) {
            log.error("Style model verification failed", {
              styleOwner,
              styleName,
              styleVersion: styleCfg.version,
              error: verification.error,
            });
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: `Style model not available: ${verification.error}. The "${input.style}" style model may need to be updated.`,
            });
          }

          const built = await buildThumbnailPrompt({
            style: input.style,
            styleTriggerWord: styleCfg.triggerWord,
            identityTriggerWord,
            userText: input.prompt,
            variants: input.variants ?? 3,
          });

          const job = await prisma.thumbnailJob.create({
            data: {
              userId,
              style: input.style,
              styleModelVersionId: styleCfg.version,
              identityModelVersionId,
              userPrompt: input.prompt,
              llmPrompt: JSON.stringify({
                style: input.style,
                variants: built.variants.map((v) => ({
                  variationNote: v.variationNote,
                  prompt: v.finalPrompt,
                  negative: v.negativePrompt,
                })),
              }),
              negativePrompt: built.variants[0]?.negativePrompt ?? null,
              status: "running",
              outputImages: [],
            },
            select: { id: true },
          });

          const webhookUrl = `${getAppBaseUrl(req)}/api/webhooks/replicate`;
          const predictions: Array<{
            predictionId: string;
            variationNote: string;
          }> = [];

          for (const v of built.variants) {
            // Add identity LoRA to the input if specified
            const replicateInput = { ...v.replicateInput };
            // Remove negative_prompt - FLUX models don't support it
            delete replicateInput.negative_prompt;

            if (input.includeIdentity) {
              // Log identity model configuration for debugging
              log.info("Identity model configuration", {
                triggerWord: identityTriggerWord,
                modelRef: identityModelRef,
                loraWeightsUrl: identityLoraWeightsUrl,
                modelVersionId: identityModelVersionId,
              });

              // Use the direct weights URL from replicate.delivery
              // Model references don't work for private models (they can't download the weights)
              // The weights URL is a direct CDN link that's always accessible
              if (identityLoraWeightsUrl) {
                replicateInput.extra_lora = identityLoraWeightsUrl;
                // Very high scale (1.6) for strong identity resemblance
                // This prioritizes identity over style - may have some artifacts but better likeness
                replicateInput.extra_lora_scale = 1.6;
                // Significantly lower style LoRA to let identity dominate
                replicateInput.lora_scale = 0.5;
                
                log.info("Using direct weights URL for extra_lora", {
                  extra_lora: identityLoraWeightsUrl.slice(0, 60) + "...",
                  extra_lora_scale: replicateInput.extra_lora_scale,
                });
              } else {
                log.warn("Identity model has no weights URL - LoRA cannot be applied", {
                  identityModelId: input.identityModelId,
                  triggerWord: identityTriggerWord,
                });
              }
            }

            // Log what we're sending to Replicate
            log.info("Sending prediction to Replicate", {
              styleModel: styleCfg.model,
              styleVersion: styleCfg.version.slice(0, 20) + "...",
              styleTrigger: styleCfg.triggerWord,
              identityLora: identityLoraWeightsUrl ? identityLoraWeightsUrl.slice(0, 50) : "none",
              identityTrigger: identityTriggerWord ?? "none",
              prompt: typeof replicateInput.prompt === "string" ? replicateInput.prompt.slice(0, 100) + "..." : "no prompt",
              extra_lora: replicateInput.extra_lora ? "set" : "not set",
              extra_lora_scale: replicateInput.extra_lora_scale,
              lora_scale: replicateInput.lora_scale,
            });

            const { predictionId } = await runPrediction({
              version: styleCfg.version,
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

            predictions.push({ predictionId, variationNote: v.variationNote });
          }

          await prisma.thumbnailJob.update({
            where: { id: job.id },
            data: {
              replicatePredictionId: predictions[0]?.predictionId ?? null,
            },
          });

          return NextResponse.json({
            jobId: job.id,
            status: "running",
            predictions,
          });
        }
      )
    )
  )
);
