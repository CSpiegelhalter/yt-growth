import type { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";

type ProcessPredictionWebhookInput = {
  predictionId: string;
  status: string;
  output: unknown;
};

type ProcessPredictionWebhookResult = {
  ok: true;
  type: "prediction";
};

export async function processPredictionWebhook(
  input: ProcessPredictionWebhookInput,
): Promise<ProcessPredictionWebhookResult> {
  const { predictionId, status, output } = input;

  const pred = await prisma.thumbnailJobPrediction.findUnique({
    where: { replicatePredictionId: predictionId },
  });
  if (!pred) {
    throw new Error("Prediction not found");
  }

  const outputUrls: string[] = Array.isArray(output)
    ? output.filter((x) => typeof x === "string")
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
    data: { status, outputImages },
  });

  const jobPreds = await prisma.thumbnailJobPrediction.findMany({
    where: { thumbnailJobId: pred.thumbnailJobId },
  });

  const terminal = new Set(["succeeded", "failed", "canceled"]);
  const allTerminal = jobPreds.every((p) => terminal.has(p.status));
  const anySucceeded = jobPreds.some((p) => p.status === "succeeded");
  const allSucceeded = jobPreds.every((p) => p.status === "succeeded");

  const aggregated: Array<Record<string, unknown>> = [];
  for (const p of jobPreds) {
    if (Array.isArray(p.outputImages)) {
      aggregated.push(...(p.outputImages as Array<Record<string, unknown>>));
    }
  }

  let jobStatus: "running" | "succeeded" | "failed" | "canceled" = "running";
  if (allSucceeded) {jobStatus = "succeeded";}
  else if (allTerminal && !anySucceeded) {jobStatus = "failed";}

  await prisma.thumbnailJob.update({
    where: { id: pred.thumbnailJobId },
    data: {
      status: jobStatus,
      outputImages: aggregated as unknown as Prisma.InputJsonValue,
    },
  });

  return { ok: true, type: "prediction" };
}
