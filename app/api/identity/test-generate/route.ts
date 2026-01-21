import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/prisma";
import { createPrediction, getPrediction } from "@/lib/replicate/client";
import { createLogger } from "@/lib/logger";
import { STYLE_MODELS } from "@/lib/thumbnails-v2/styleModels";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/identity/test-generate" });

const bodySchema = z.object({
  prompt: z.string().trim().min(3).max(500).optional().default("professional portrait photo"),
  identityModelId: z.string().uuid().optional(),
  extraLoraScale: z.number().min(0.5).max(2.0).optional().default(1.0),
});

export const POST = createApiRoute(
  { route: "/api/identity/test-generate" },
  withAuth(
    { mode: "required" },
    withValidation(
      { body: bodySchema },
      async (_req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void ctx;
        const userId = api.userId!;
        const input = validated.body!;

        // Get the user's identity model
        const model = input.identityModelId
          ? await prisma.userModel.findUnique({
              where: { id: input.identityModelId },
            })
          : await prisma.userModel.findUnique({
              where: { userId },
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

        if (!model.loraWeightsUrl) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Identity model has no weights URL",
          });
        }

        const triggerWord = model.triggerWord;
        
        // Simple prompt focused on identity - trigger word repeated for emphasis
        const fullPrompt = `${triggerWord} person, a photo of ${triggerWord}, portrait of ${triggerWord}, ${input.prompt}, looking at camera, high quality`;

        // Use one of our style models but set lora_scale=0 to disable the style
        // This way we use the same extra_lora pathway that works in main generate
        const styleModel = STYLE_MODELS.subject;

        log.info("Testing identity model (style disabled)", {
          modelId: model.id,
          triggerWord,
          loraWeightsUrl: model.loraWeightsUrl.slice(0, 80) + "...",
          extraLoraScale: input.extraLoraScale,
          prompt: fullPrompt,
          styleModel: styleModel.model,
        });

        // Create prediction using the style model infrastructure but with style LoRA disabled
        const prediction = await createPrediction({
          version: styleModel.version,
          input: {
            prompt: fullPrompt,
            // Disable the style LoRA - we only want identity
            lora_scale: 0,
            // Use extra_lora for identity - same pathway as main generate
            extra_lora: model.loraWeightsUrl,
            extra_lora_scale: input.extraLoraScale,
            aspect_ratio: "1:1",
            num_outputs: 1,
            output_format: "png",
            guidance_scale: 3.5,
            num_inference_steps: 28,
          },
        });

        log.info("Identity test prediction created", {
          predictionId: prediction.id,
          status: prediction.status,
        });

        // Poll for completion (max 90 seconds)
        let result = prediction;
        const maxAttempts = 45;
        for (let i = 0; i < maxAttempts; i++) {
          if (result.status === "succeeded" || result.status === "failed" || result.status === "canceled") {
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
          result = await getPrediction(prediction.id);
          log.info("Polling identity test prediction", {
            predictionId: prediction.id,
            status: result.status,
            attempt: i + 1,
          });
        }

        if (result.status === "failed") {
          log.error("Identity test prediction failed", {
            predictionId: prediction.id,
            error: result.error,
            logs: (result.logs as string)?.slice(-1000),
          });
          throw new ApiError({
            code: "INTERNAL",
            status: 500,
            message: `Generation failed: ${result.error}`,
          });
        }

        if (result.status !== "succeeded") {
          throw new ApiError({
            code: "INTERNAL",
            status: 500,
            message: "Generation timed out",
          });
        }

        const outputUrls = Array.isArray(result.output) ? result.output : [];

        log.info("Identity test completed", {
          predictionId: prediction.id,
          outputCount: outputUrls.length,
        });

        return NextResponse.json({
          success: true,
          predictionId: prediction.id,
          triggerWord,
          extraLoraScale: input.extraLoraScale,
          prompt: fullPrompt,
          images: outputUrls,
        });
      }
    )
  )
);
