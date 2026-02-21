/**
 * Replicate Adapter — ML inference, training, and model management I/O.
 *
 * Handles all HTTP communication with the Replicate API and SDK.
 * Maps raw Replicate response shapes to port-defined types.
 *
 * Must NOT contain business decisions — those belong in lib/features/.
 */

import "server-only";
import Replicate from "replicate";
import { createLogger } from "@/lib/shared/logger";
import type {
  Prediction,
  CreatePredictionParams,
  Training,
  CreateTrainingParams,
  ModelInfo,
  CreateModelParams,
  ModelVersionCheck,
  FileUploadParams,
  UploadedFile,
} from "@/lib/ports/ReplicatePort";

const log = createLogger({ subsystem: "replicate" });

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

function getReplicateApiKey(): string {
  const key = process.env.REPLICATE_API_KEY;
  if (!key) {throw new Error("REPLICATE_API_KEY not configured");}
  return key;
}

function getReplicateClient(): Replicate {
  return new Replicate({ auth: getReplicateApiKey() });
}

async function replicateFetch<T>(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): Promise<T> {
  const apiKey = getReplicateApiKey();
  const url = path.startsWith("http") ? path : `${REPLICATE_API_BASE}${path}`;
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    Authorization: `Token ${apiKey}`,
    ...(options.headers ?? {}),
  };

  const requestBody = options.body ? JSON.parse(options.body) : undefined;
  log.info("Replicate API request", {
    method,
    url,
    hasBody: !!options.body,
    version: requestBody?.version?.slice(0, 20),
    inputKeys: requestBody?.input ? Object.keys(requestBody.input) : undefined,
  });

  const res = await fetch(url, {
    method,
    headers,
    body: options.body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.error("Replicate API error", {
      status: res.status,
      statusText: res.statusText,
      url,
      method,
      responseBody: text,
      requestVersion: requestBody?.version,
      requestInputKeys: requestBody?.input
        ? Object.keys(requestBody.input)
        : undefined,
    });
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as T;
  log.info("Replicate API success", {
    method,
    url,
    responseId: (json as Record<string, unknown>)?.id,
  });

  return json;
}

// ── Raw API Response Types ────────────────────────────────

type RawPrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string | null;
  logs?: string | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  webhook?: string | null;
};

type RawTraining = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  error?: string | null;
  output?: unknown;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  webhook?: string | null;
};

type RawModel = {
  owner: string;
  name: string;
  visibility?: "public" | "private";
  description?: string | null;
};

// ── Mapping ───────────────────────────────────────────────

function mapPrediction(raw: RawPrediction): Prediction {
  return {
    id: raw.id,
    status: raw.status,
    input: raw.input,
    output: raw.output,
    error: raw.error,
    logs: raw.logs,
    createdAt: raw.created_at,
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    webhookUrl: raw.webhook,
  };
}

function mapTraining(raw: RawTraining): Training {
  return {
    id: raw.id,
    status: raw.status,
    error: raw.error,
    output: raw.output,
    createdAt: raw.created_at,
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    webhookUrl: raw.webhook,
  };
}

// ── Predictions ───────────────────────────────────────────

export async function createPrediction(
  params: CreatePredictionParams,
): Promise<Prediction> {
  const raw = await replicateFetch<RawPrediction>("/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      version: params.version,
      input: params.input,
      webhook: params.webhookUrl,
      webhook_events_filter: params.webhookEvents,
    }),
  });
  return mapPrediction(raw);
}

export async function getPrediction(
  predictionId: string,
): Promise<Prediction> {
  const raw = await replicateFetch<RawPrediction>(
    `/predictions/${predictionId}`,
  );
  return mapPrediction(raw);
}

// ── Training ──────────────────────────────────────────────

export async function createTraining(
  params: CreateTrainingParams,
): Promise<Training> {
  const replicate = getReplicateClient();

  let modelOwner: string;
  let modelName: string;
  let versionId: string;

  if (params.version.includes(":")) {
    const [modelRef, version] = params.version.split(":");
    const [owner, name] = modelRef.split("/");
    modelOwner = owner;
    modelName = name;
    versionId = version;
  } else {
    modelOwner =
      process.env.REPLICATE_IDENTITY_TRAINER_OWNER ?? "ostris";
    modelName =
      process.env.REPLICATE_IDENTITY_TRAINER_MODEL ?? "flux-dev-lora-trainer";
    versionId = params.version;
  }

  log.info("Creating training request", {
    modelOwner,
    modelName,
    versionId,
    destination: params.destination,
    webhook: params.webhookUrl,
    inputKeys: Object.keys(params.input),
  });

  try {
    const training = await replicate.trainings.create(
      modelOwner,
      modelName,
      versionId,
      {
        destination: params.destination as `${string}/${string}`,
        input: params.input,
        webhook: params.webhookUrl,
        webhook_events_filter: params.webhookEvents,
      },
    );

    log.info("Training created successfully", {
      trainingId: training.id,
      status: training.status,
    });

    return {
      id: training.id,
      status: training.status as Training["status"],
      error: typeof training.error === "string" ? training.error : null,
      output: training.output,
      createdAt: training.created_at,
      startedAt: training.started_at ?? null,
      completedAt: training.completed_at ?? null,
      webhookUrl: training.webhook ?? null,
    };
  } catch (err) {
    log.error("Training creation failed", {
      errorMessage: err instanceof Error ? err.message : String(err),
      modelOwner,
      modelName,
      versionId,
      destination: params.destination,
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}

export async function getTraining(trainingId: string): Promise<Training> {
  const raw = await replicateFetch<RawTraining>(`/trainings/${trainingId}`);
  return mapTraining(raw);
}

// ── Models ────────────────────────────────────────────────

export async function createModel(
  params: CreateModelParams,
): Promise<ModelInfo> {
  const payload = {
    owner: params.owner,
    name: params.name,
    description: params.description ?? "Identity LoRA model",
    visibility: params.visibility ?? "private",
    hardware: params.hardware ?? "gpu-t4",
  };
  const raw = await replicateFetch<RawModel>("/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return {
    owner: raw.owner,
    name: raw.name,
    visibility: raw.visibility,
    description: raw.description,
  };
}

export async function verifyModelVersion(
  owner: string,
  name: string,
  version: string,
): Promise<ModelVersionCheck> {
  const url = `/models/${owner}/${name}/versions/${version}`;
  try {
    await replicateFetch<unknown>(url);
    return { valid: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404")) {
      return {
        valid: false,
        error: `Model version not found: ${owner}/${name}@${version}`,
      };
    }
    if (msg.includes("401") || msg.includes("403")) {
      return {
        valid: false,
        error: `Not authorized to access model: ${owner}/${name}`,
      };
    }
    return {
      valid: false,
      error: `Cannot verify model (Replicate error): ${msg}`,
    };
  }
}

export async function deleteModel(
  owner: string,
  name: string,
): Promise<void> {
  try {
    await replicateFetch<void>(`/models/${owner}/${name}`, {
      method: "DELETE",
    });
    log.info("Model deleted from Replicate", { owner, name });
  } catch (err) {
    log.warn("Failed to delete model from Replicate (continuing)", {
      owner,
      name,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── File Uploads ──────────────────────────────────────────

export async function uploadFile(
  params: FileUploadParams,
): Promise<UploadedFile> {
  log.info("Uploading file to Replicate", {
    filename: params.filename,
    size: params.bytes.byteLength,
    contentType: params.contentType,
  });

  if (params.bytes.byteLength === 0) {
    throw new Error("Cannot upload empty file");
  }

  const replicate = getReplicateClient();

  const uint8Bytes = new Uint8Array(
    Buffer.isBuffer(params.bytes) ? params.bytes : Buffer.from(params.bytes),
  );
  const file = new File([uint8Bytes], params.filename, {
    type: params.contentType,
  });

  const uploaded = await replicate.files.create(file);

  log.info("File uploaded successfully", {
    fileId: uploaded.id,
    url: uploaded.urls.get,
  });

  return {
    id: uploaded.id,
    url: uploaded.urls.get,
  };
}
