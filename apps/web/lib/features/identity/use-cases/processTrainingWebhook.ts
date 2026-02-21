import { prisma } from "@/prisma";
import { createLogger } from "@/lib/shared/logger";
import { handleTrainingComplete } from "./manageModel";

const log = createLogger({ subsystem: "identity-webhook" });

function getOutputVersionId(output: unknown): string | null {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  if (typeof o.version === "string") return o.version;
  if (typeof o.version_id === "string") return o.version_id;
  if (typeof o.model_version === "string") return o.model_version;
  if (
    typeof o.version === "object" &&
    o.version !== null &&
    typeof (o.version as Record<string, unknown>).id === "string"
  ) {
    return (o.version as Record<string, unknown>).id as string;
  }
  return null;
}

function getWeightsUrl(output: unknown): string | null {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  return (
    (typeof o.weights === "string" ? o.weights : null) ??
    (typeof o.lora_weights === "string" ? o.lora_weights : null) ??
    (typeof o.lora === "string" ? o.lora : null) ??
    (typeof o.model_weights === "string" ? o.model_weights : null) ??
    (typeof o.safetensors === "string" ? o.safetensors : null) ??
    null
  );
}

type ProcessTrainingWebhookInput = {
  trainingId: string;
  status: string;
  error?: string | null;
  output?: unknown;
};

type ProcessTrainingWebhookResult = {
  ok: true;
  type: "training";
};

export async function processTrainingWebhook(
  input: ProcessTrainingWebhookInput,
): Promise<ProcessTrainingWebhookResult> {
  const { trainingId, status, error, output } = input;

  const model = await prisma.userModel.findFirst({
    where: { trainingId },
  });
  if (!model) {
    log.warn("Training complete for unknown model", { trainingId });
    return { ok: true, type: "training" };
  }

  if (status === "succeeded") {
    log.info("Training succeeded, examining output", {
      modelId: model.id,
      trainingId,
      outputKeys: output && typeof output === "object" ? Object.keys(output) : [],
    });

    const versionId = getOutputVersionId(output);
    const weightsUrl = getWeightsUrl(output);

    log.info("Extracted training output", {
      modelId: model.id,
      versionId,
      weightsUrl,
      hasWeights: !!weightsUrl,
    });

    const result = await handleTrainingComplete(model.id, {
      version: versionId,
      weightsUrl,
    });

    log.info("Training webhook processed", {
      modelId: model.id,
      action: result.action,
      needsRetrain: result.needsRetrain,
    });
  } else if (status === "failed") {
    await prisma.userModel.update({
      where: { id: model.id },
      data: {
        status: "failed",
        trainingCompletedAt: new Date(),
        errorMessage: error ?? "Training failed",
      },
    });
  } else if (status === "canceled") {
    await prisma.userModel.update({
      where: { id: model.id },
      data: {
        status: "canceled",
        trainingCompletedAt: new Date(),
        errorMessage: error ?? null,
      },
    });
  } else {
    await prisma.userModel.update({
      where: { id: model.id },
      data: { status: "training" },
    });
  }

  return { ok: true, type: "training" };
}
