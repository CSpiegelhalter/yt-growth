/**
 * Backward-compatibility shim — delegates to lib/adapters/replicate/.
 *
 * New code should import from "@/lib/adapters/replicate" directly.
 */

import {
  createTraining as adapterCreateTraining,
  getTraining as adapterGetTraining,
  uploadFile,
} from "@/lib/adapters/replicate";

export {
  createModel,
  verifyModelVersion,
  deleteModel,
} from "@/lib/adapters/replicate";

// ── Backward-compat wrappers ─────────────────────────────
// These translate old parameter/return shapes to the port-aligned adapter.

type TrainingOutput = {
  version?: string;
  weights?: string;
  lora_weights?: string;
  lora?: string;
  model_weights?: string;
  [key: string]: unknown;
};

type LegacyTraining = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  error?: string | null;
  output?: TrainingOutput | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  webhook?: string | null;
};

export async function createTraining(input: {
  version: string;
  destination: string;
  input: Record<string, unknown>;
  webhook?: string;
  webhook_events_filter?: Array<"start" | "output" | "logs" | "completed">;
}): Promise<LegacyTraining> {
  const result = await adapterCreateTraining({
    version: input.version,
    destination: input.destination,
    input: input.input,
    webhookUrl: input.webhook,
    webhookEvents: input.webhook_events_filter,
  });
  return {
    id: result.id,
    status: result.status,
    error: result.error,
    output: result.output as LegacyTraining["output"],
    created_at: result.createdAt,
    started_at: result.startedAt,
    completed_at: result.completedAt,
    webhook: result.webhookUrl,
  };
}

export async function getTraining(
  trainingId: string,
): Promise<LegacyTraining> {
  const result = await adapterGetTraining(trainingId);
  return {
    id: result.id,
    status: result.status,
    error: result.error,
    output: result.output as LegacyTraining["output"],
    created_at: result.createdAt,
    started_at: result.startedAt,
    completed_at: result.completedAt,
    webhook: result.webhookUrl,
  };
}

type LegacyFile = {
  id: string;
  urls: { get: string };
};

export async function uploadFileToReplicate(input: {
  filename: string;
  contentType: string;
  bytes: Uint8Array | Buffer;
}): Promise<LegacyFile> {
  const result = await uploadFile({
    filename: input.filename,
    contentType: input.contentType,
    bytes: input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes),
  });
  return {
    id: result.id,
    urls: { get: result.url },
  };
}
