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

export const runtime = "nodejs";

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

          if (input.includeIdentity) {
            if (!input.identityModelId) {
              throw new ApiError({
                code: "VALIDATION_ERROR",
                status: 400,
                message: "identityModelId is required when includeIdentity=true",
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
          }

          const styleCfg = STYLE_MODELS[input.style];
          if (!styleCfg) {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: "Invalid style",
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
          const predictions: Array<{ predictionId: string; variationNote: string }> =
            [];

          for (const v of built.variants) {
            const { predictionId } = await runPrediction({
              version: styleCfg.version,
              replicateInput: v.replicateInput,
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
            data: { replicatePredictionId: predictions[0]?.predictionId ?? null },
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

