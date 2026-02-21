import { prisma } from "@/prisma";
import { createLogger } from "@/lib/shared/logger";
import type { ReplicatePort } from "@/lib/ports/ReplicatePort";
import type {
  LlmCompletionParams,
  LlmCompletionResult,
} from "@/lib/ports/LlmPort";
import { ThumbnailError } from "../errors";
import type { ThumbnailStyle } from "../types";
import { STYLE_MODELS } from "../editor/styleModels";
import { buildPrompt } from "./buildPrompt";

const log = createLogger({ subsystem: "thumbnails/generate" });

type GenerateThumbnailInput = {
  userId: number;
  style: ThumbnailStyle;
  prompt: string;
  includeIdentity: boolean;
  identityModelId?: string;
  variants: number;
  webhookUrl: string;
};

type GenerateThumbnailDeps = {
  replicate: Pick<ReplicatePort, "createPrediction" | "verifyModelVersion">;
  llm: {
    complete(params: LlmCompletionParams): Promise<LlmCompletionResult>;
  };
};

type GenerateThumbnailResult = {
  jobId: string;
  status: string;
  predictions: Array<{ predictionId: string; variationNote: string }>;
};

export async function generateThumbnail(
  input: GenerateThumbnailInput,
  deps: GenerateThumbnailDeps,
): Promise<GenerateThumbnailResult> {
  const { userId, style, prompt, includeIdentity, identityModelId, variants, webhookUrl } = input;

  let identityTriggerWord: string | undefined;
  let identityModelVersionId: string | undefined;
  let identityLoraWeightsUrl: string | undefined;

  if (includeIdentity) {
    if (!identityModelId) {
      throw new ThumbnailError(
        "INVALID_INPUT",
        "identityModelId is required when includeIdentity=true",
      );
    }
    if (style !== "subject" && style !== "hold") {
      throw new ThumbnailError(
        "INVALID_INPUT",
        "Identity can currently be used only with SUBJECT or HOLD styles.",
      );
    }

    const model = await prisma.userModel.findUnique({
      where: { id: identityModelId },
    });
    if (!model || model.userId !== userId) {
      throw new ThumbnailError("NOT_FOUND", "Identity model not found");
    }
    if (model.status !== "ready") {
      throw new ThumbnailError("INVALID_INPUT", "Identity model is not ready yet");
    }

    identityTriggerWord = model.triggerWord;
    identityModelVersionId = model.replicateModelVersion ?? undefined;
    identityLoraWeightsUrl = model.loraWeightsUrl ?? undefined;
  }

  const styleCfg = STYLE_MODELS[style];
  if (!styleCfg) {
    throw new ThumbnailError("INVALID_INPUT", "Invalid style");
  }

  const [styleOwner, styleName] = styleCfg.model.split("/");
  log.info("Verifying style model", {
    styleOwner,
    styleName,
    styleVersion: `${styleCfg.version.slice(0, 20)  }...`,
  });

  const verification = await deps.replicate.verifyModelVersion(
    styleOwner,
    styleName,
    styleCfg.version,
  );
  if (!verification.valid) {
    log.error("Style model verification failed", {
      styleOwner,
      styleName,
      styleVersion: styleCfg.version,
      error: verification.error,
    });
    throw new ThumbnailError(
      "EXTERNAL_FAILURE",
      `Style model not available: ${verification.error}. The "${style}" style model may need to be updated.`,
    );
  }

  const built = await buildPrompt(
    {
      style,
      styleTriggerWord: styleCfg.triggerWord,
      identityTriggerWord,
      userText: prompt,
      variants,
    },
    deps,
  );

  const job = await prisma.thumbnailJob.create({
    data: {
      userId,
      style,
      styleModelVersionId: styleCfg.version,
      identityModelVersionId,
      userPrompt: prompt,
      llmPrompt: JSON.stringify({
        style,
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

  const predictions: Array<{ predictionId: string; variationNote: string }> = [];

  for (const v of built.variants) {
    const replicateInput = { ...v.replicateInput };
    delete replicateInput.negative_prompt;

    if (includeIdentity) {
      log.info("Identity model configuration", {
        triggerWord: identityTriggerWord,
        loraWeightsUrl: identityLoraWeightsUrl,
        modelVersionId: identityModelVersionId,
      });

      if (identityLoraWeightsUrl) {
        replicateInput.extra_lora = identityLoraWeightsUrl;
        replicateInput.extra_lora_scale = 1.6;
        replicateInput.lora_scale = 0.5;

        log.info("Using direct weights URL for extra_lora", {
          extra_lora: `${identityLoraWeightsUrl.slice(0, 60)  }...`,
          extra_lora_scale: replicateInput.extra_lora_scale,
        });
      } else {
        log.warn("Identity model has no weights URL - LoRA cannot be applied", {
          identityModelId,
          triggerWord: identityTriggerWord,
        });
      }
    }

    log.info("Sending prediction to Replicate", {
      styleModel: styleCfg.model,
      styleVersion: `${styleCfg.version.slice(0, 20)  }...`,
      styleTrigger: styleCfg.triggerWord,
      identityLora: identityLoraWeightsUrl ? identityLoraWeightsUrl.slice(0, 50) : "none",
      identityTrigger: identityTriggerWord ?? "none",
      prompt: typeof replicateInput.prompt === "string"
        ? `${replicateInput.prompt.slice(0, 100)  }...`
        : "no prompt",
      extra_lora: replicateInput.extra_lora ? "set" : "not set",
      extra_lora_scale: replicateInput.extra_lora_scale,
      lora_scale: replicateInput.lora_scale,
    });

    const prediction = await deps.replicate.createPrediction({
      version: styleCfg.version,
      input: replicateInput,
      webhookUrl,
      webhookEvents: ["completed"],
    });

    await prisma.thumbnailJobPrediction.create({
      data: {
        thumbnailJobId: job.id,
        replicatePredictionId: prediction.id,
        status: "starting",
        outputImages: [],
      },
    });

    predictions.push({ predictionId: prediction.id, variationNote: v.variationNote });
  }

  await prisma.thumbnailJob.update({
    where: { id: job.id },
    data: {
      replicatePredictionId: predictions[0]?.predictionId ?? null,
    },
  });

  return {
    jobId: job.id,
    status: "running",
    predictions,
  };
}
