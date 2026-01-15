import { createPrediction } from "@/lib/replicate/client";

export async function runPrediction(input: {
  version: string;
  replicateInput: Record<string, unknown>;
  webhookUrl: string;
}): Promise<{ predictionId: string }> {
  const pred = await createPrediction({
    version: input.version,
    input: input.replicateInput,
    webhook: input.webhookUrl,
    webhook_events_filter: ["completed"],
  });
  return { predictionId: pred.id };
}

