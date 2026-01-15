import crypto from "crypto";
import { createLogger } from "@/lib/logger";

const log = createLogger({ subsystem: "replicate" });

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

function getReplicateApiKey(): string {
  const key = process.env.REPLICATE_API_KEY;
  if (!key) throw new Error("REPLICATE_API_KEY not configured");
  return key;
}

async function replicateFetch<T>(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<T> {
  const apiKey = getReplicateApiKey();
  const url = path.startsWith("http") ? path : `${REPLICATE_API_BASE}${path}`;
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    Authorization: `Token ${apiKey}`,
    ...(options.headers ?? {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: options.body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.error("Replicate API error", { status: res.status, url, body: text });
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

export type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  input?: Record<string, unknown>;
  output?: any;
  error?: string | null;
  logs?: string | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  webhook?: string | null;
};

export async function createPrediction(input: {
  version: string;
  input: Record<string, unknown>;
  webhook?: string;
  webhook_events_filter?: Array<"start" | "output" | "logs" | "completed">;
}): Promise<ReplicatePrediction> {
  return replicateFetch<ReplicatePrediction>("/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function getPrediction(
  predictionId: string
): Promise<ReplicatePrediction> {
  return replicateFetch<ReplicatePrediction>(`/predictions/${predictionId}`, {
    method: "GET",
  });
}

export type ReplicateModel = {
  owner: string;
  name: string;
  visibility?: "public" | "private";
  description?: string | null;
};

export async function createModel(input: {
  owner: string;
  name: string;
  description?: string;
  visibility?: "private" | "public";
  hardware?: string;
}): Promise<ReplicateModel> {
  // Replicate requires hardware field for model creation
  const payload = {
    owner: input.owner,
    name: input.name,
    description: input.description ?? "Identity LoRA model",
    visibility: input.visibility ?? "private",
    hardware: input.hardware ?? "gpu-t4-nano", // Required by Replicate API
  };
  return replicateFetch<ReplicateModel>("/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type ReplicateFile = {
  id: string;
  urls: { get: string };
};

/**
 * Upload a file to Replicate "files" and return a temporary URL for use in trainings.
 *
 * Note: Replicate accepts multipart form uploads. We use Blob for Node.js compatibility.
 */
export async function uploadFileToReplicate(input: {
  filename: string;
  contentType: string;
  bytes: Uint8Array | Buffer;
}): Promise<ReplicateFile> {
  const apiKey = getReplicateApiKey();

  // Create a fresh ArrayBuffer copy to avoid TypeScript ArrayBufferLike issues
  const len = input.bytes.byteLength;
  const ab = new ArrayBuffer(len);
  const view = new Uint8Array(ab);
  view.set(input.bytes);

  // Use Blob for Node.js FormData compatibility
  const blob = new Blob([ab], { type: input.contentType });

  const form = new FormData();
  form.append("file", blob, input.filename);

  const res = await fetch(`${REPLICATE_API_BASE}/files`, {
    method: "POST",
    headers: { Authorization: `Token ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.error("File upload failed", { status: res.status, body: text });
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }

  return (await res.json()) as ReplicateFile;
}

export type ReplicateTraining = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  error?: string | null;
  output?: any;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  webhook?: string | null;
};

export async function createTraining(input: {
  version: string;
  destination: string; // "owner/model"
  input: Record<string, unknown>;
  webhook?: string;
  webhook_events_filter?: Array<"start" | "output" | "logs" | "completed">;
}): Promise<ReplicateTraining> {
  return replicateFetch<ReplicateTraining>("/trainings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function getTraining(
  trainingId: string
): Promise<ReplicateTraining> {
  return replicateFetch<ReplicateTraining>(`/trainings/${trainingId}`, {
    method: "GET",
  });
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
}
