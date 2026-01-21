import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { verifyReplicateWebhook } from "@/lib/replicate/webhook";
import { handleTrainingComplete } from "@/lib/identity/modelService";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/webhooks/replicate" });

type ReplicateWebhookPayload = {
  id?: string;
  status?: string;
  error?: string | null;
  output?: any;
  // Other fields ignored
};

function getOutputVersionId(output: any): string | null {
  if (!output) return null;
  // Common patterns seen across trainers
  if (typeof output.version === "string") return output.version;
  if (typeof output.version_id === "string") return output.version_id;
  if (typeof output.model_version === "string") return output.model_version;
  if (typeof output?.version?.id === "string") return output.version.id;
  return null;
}

export async function POST(req: NextRequest) {
  // Raw body required for signature verification
  const payloadText = await req.text();
  try {
    verifyReplicateWebhook({ payload: payloadText, headers: req.headers });
  } catch (err) {
    log.warn("Webhook verification failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: ReplicateWebhookPayload;
  try {
    payload = JSON.parse(payloadText) as ReplicateWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const id = payload.id;
  const status = payload.status;
  if (!id || !status) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventId = `replicate:${id}:${status}`;
  const already = await prisma.replicateWebhookEvent
    .create({ data: { id: eventId } })
    .then(() => false)
    .catch(() => true);

  if (already) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  // Training webhook?
  const model = await prisma.userModel.findFirst({
    where: { trainingId: id },
  });
  if (model) {
    if (status === "succeeded") {
      // Log the full output to understand what the trainer returns
      log.info("Training succeeded, examining output", {
        modelId: model.id,
        trainingId: id,
        outputKeys: payload.output ? Object.keys(payload.output) : [],
        output: payload.output,
      });
      
      const versionId = getOutputVersionId(payload.output);
      
      // Try multiple possible field names for weights URL
      const weightsUrl = 
        payload.output?.weights ??
        payload.output?.lora_weights ??
        payload.output?.lora ??
        payload.output?.model_weights ??
        payload.output?.safetensors ??
        null;
      
      log.info("Extracted training output", {
        modelId: model.id,
        versionId,
        weightsUrl,
        hasWeights: !!weightsUrl,
      });
      
      // Use the model service for coalescing logic
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
          errorMessage: payload.error ?? "Training failed",
        },
      });
    } else if (status === "canceled") {
      await prisma.userModel.update({
        where: { id: model.id },
        data: {
          status: "canceled",
          trainingCompletedAt: new Date(),
          errorMessage: payload.error ?? null,
        },
      });
    } else {
      // starting/processing — best-effort status update
      await prisma.userModel.update({
        where: { id: model.id },
        data: { status: "training" },
      });
    }

    return NextResponse.json({ ok: true, type: "training" });
  }

  // Prediction webhook?
  const pred = await prisma.thumbnailJobPrediction.findUnique({
    where: { replicatePredictionId: id },
  });
  if (pred) {
    const outputUrls: string[] = Array.isArray(payload.output)
      ? payload.output.filter((x) => typeof x === "string")
      : [];

    const outputImages =
      status === "succeeded"
        ? outputUrls.map((url) => ({
            url,
            width: 1280,
            height: 720,
            contentType: "image/png",
          }))
        : [];

    await prisma.thumbnailJobPrediction.update({
      where: { id: pred.id },
      data: {
        status,
        outputImages,
      },
    });

    // Recompute parent job status and aggregate images
    const jobPreds = await prisma.thumbnailJobPrediction.findMany({
      where: { thumbnailJobId: pred.thumbnailJobId },
    });

    const terminal = new Set(["succeeded", "failed", "canceled"]);
    const allTerminal = jobPreds.every((p) => terminal.has(p.status));
    const anySucceeded = jobPreds.some((p) => p.status === "succeeded");
    const allSucceeded = jobPreds.every((p) => p.status === "succeeded");

    const aggregated: any[] = [];
    for (const p of jobPreds) {
      if (Array.isArray(p.outputImages)) aggregated.push(...p.outputImages);
    }

    let jobStatus: "running" | "succeeded" | "failed" | "canceled" = "running";
    if (allSucceeded) jobStatus = "succeeded";
    else if (allTerminal && !anySucceeded) jobStatus = "failed";

    await prisma.thumbnailJob.update({
      where: { id: pred.thumbnailJobId },
      data: {
        status: jobStatus,
        outputImages: aggregated,
      },
    });

    return NextResponse.json({ ok: true, type: "prediction" });
  }

  return NextResponse.json({ ok: true, type: "unknown" });
}

