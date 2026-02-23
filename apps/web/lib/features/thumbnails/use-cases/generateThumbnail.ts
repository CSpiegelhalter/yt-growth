import type {
  LlmCompletionParams,
  LlmCompletionResult,
} from "@/lib/ports/LlmPort";
import type { ReplicatePort } from "@/lib/ports/ReplicatePort";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import { STYLE_MODELS } from "../editor/styleModels";
import { ThumbnailError } from "../errors";
import type { ThumbnailStyle } from "../types";
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

type IdentityInfo = {
  triggerWord: string;
  modelVersionId: string | undefined;
  loraWeightsUrl: string | undefined;
};

async function resolveIdentityModel(
  userId: number,
  identityModelId: string | undefined,
  style: ThumbnailStyle,
): Promise<IdentityInfo> {
  if (!identityModelId) {
    throw new ThumbnailError("INVALID_INPUT", "identityModelId is required when includeIdentity=true");
  }
  if (style !== "subject" && style !== "hold") {
    throw new ThumbnailError("INVALID_INPUT", "Identity can currently be used only with SUBJECT or HOLD styles.");
  }

  const model = await prisma.userModel.findUnique({ where: { id: identityModelId } });
  if (!model || model.userId !== userId) {
    throw new ThumbnailError("NOT_FOUND", "Identity model not found");
  }
  if (model.status !== "ready") {
    throw new ThumbnailError("INVALID_INPUT", "Identity model is not ready yet");
  }

  return {
    triggerWord: model.triggerWord,
    modelVersionId: model.replicateModelVersion ?? undefined,
    loraWeightsUrl: model.loraWeightsUrl ?? undefined,
  };
}

async function verifyStyleModel(
  style: ThumbnailStyle,
  styleCfg: (typeof STYLE_MODELS)[ThumbnailStyle],
  deps: GenerateThumbnailDeps,
): Promise<void> {
  const [styleOwner, styleName] = styleCfg.model.split("/");
  log.info("Verifying style model", { styleOwner, styleName, styleVersion: `${styleCfg.version.slice(0, 20)}...` });

  const verification = await deps.replicate.verifyModelVersion(styleOwner, styleName, styleCfg.version);
  if (!verification.valid) {
    log.error("Style model verification failed", { styleOwner, styleName, styleVersion: styleCfg.version, error: verification.error });
    throw new ThumbnailError("EXTERNAL_FAILURE", `Style model not available: ${verification.error}. The "${style}" style model may need to be updated.`);
  }
}

function applyIdentityLora(
  replicateInput: Record<string, unknown>,
  identity: IdentityInfo | null,
  identityModelId: string | undefined,
): void {
  if (!identity) {
    return;
  }

  log.info("Identity model configuration", {
    triggerWord: identity.triggerWord,
    loraWeightsUrl: identity.loraWeightsUrl,
    modelVersionId: identity.modelVersionId,
  });

  if (identity.loraWeightsUrl) {
    replicateInput.extra_lora = identity.loraWeightsUrl;
    replicateInput.extra_lora_scale = 1.6;
    replicateInput.lora_scale = 0.5;
    log.info("Using direct weights URL for extra_lora", {
      extra_lora: `${identity.loraWeightsUrl.slice(0, 60)}...`,
      extra_lora_scale: replicateInput.extra_lora_scale,
    });
  } else {
    log.warn("Identity model has no weights URL - LoRA cannot be applied", {
      identityModelId,
      triggerWord: identity.triggerWord,
    });
  }
}

export async function generateThumbnail(
  input: GenerateThumbnailInput,
  deps: GenerateThumbnailDeps,
): Promise<GenerateThumbnailResult> {
  const { userId, style, prompt, includeIdentity, identityModelId, variants, webhookUrl } = input;

  const identity = includeIdentity
    ? await resolveIdentityModel(userId, identityModelId, style)
    : null;

  const styleCfg = STYLE_MODELS[style];
  if (!styleCfg) {
    throw new ThumbnailError("INVALID_INPUT", "Invalid style");
  }

  await verifyStyleModel(style, styleCfg, deps);

  const built = await buildPrompt(
    {
      style,
      styleTriggerWord: styleCfg.triggerWord,
      identityTriggerWord: identity?.triggerWord,
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
      identityModelVersionId: identity?.modelVersionId,
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
    applyIdentityLora(replicateInput, identity, identityModelId);

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
    data: { replicatePredictionId: predictions[0]?.predictionId ?? null },
  });

  return { jobId: job.id, status: "running", predictions };
}
