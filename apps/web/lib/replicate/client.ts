import Replicate from "replicate";
import { createLogger } from "@/lib/logger";

const log = createLogger({ subsystem: "replicate" });

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

function getReplicateApiKey(): string {
  const key = process.env.REPLICATE_API_KEY;
  if (!key) throw new Error("REPLICATE_API_KEY not configured");
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

  // Log the outgoing request (redact sensitive data)
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
      requestInputKeys: requestBody?.input ? Object.keys(requestBody.input) : undefined,
    });
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as T;
  log.info("Replicate API success", { 
    method, 
    url,
    responseId: (json as any)?.id,
  });
  
  return json;
}

type ReplicatePrediction = {
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

/**
 * Verify a model version exists on Replicate.
 * Returns the version info if found, or throws with a descriptive error.
 */
export async function verifyModelVersion(
  owner: string,
  name: string,
  version: string
): Promise<{ valid: boolean; error?: string }> {
  const url = `/models/${owner}/${name}/versions/${version}`;
  try {
    await replicateFetch<unknown>(url, { method: "GET" });
    return { valid: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404")) {
      return { valid: false, error: `Model version not found: ${owner}/${name}@${version}` };
    }
    if (msg.includes("401") || msg.includes("403")) {
      return { valid: false, error: `Not authorized to access model: ${owner}/${name}` };
    }
    // For 5xx errors, the model might exist but Replicate is having issues
    return { valid: false, error: `Cannot verify model (Replicate error): ${msg}` };
  }
}

type ReplicateModel = {
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
    hardware: input.hardware ?? "gpu-t4", // Required by Replicate API
  };
  return replicateFetch<ReplicateModel>("/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

type ReplicateFile = {
  id: string;
  urls: { get: string };
};

/**
 * Upload a file to Replicate "files" and return a temporary URL for use in trainings.
 *
 * Uses the official Replicate SDK for reliable multipart uploads.
 */
export async function uploadFileToReplicate(input: {
  filename: string;
  contentType: string;
  bytes: Uint8Array | Buffer;
}): Promise<ReplicateFile> {
  // Log the size for debugging
  log.info("Uploading file to Replicate", { 
    filename: input.filename, 
    size: input.bytes.byteLength,
    contentType: input.contentType
  });

  if (input.bytes.byteLength === 0) {
    throw new Error("Cannot upload empty file");
  }

  const replicate = getReplicateClient();
  
  // Create a File object for the SDK
  // Convert to Uint8Array for proper BlobPart compatibility
  const uint8Bytes = new Uint8Array(
    Buffer.isBuffer(input.bytes) ? input.bytes : Buffer.from(input.bytes)
  );
  const file = new File([uint8Bytes], input.filename, { type: input.contentType });
  
  // Use the SDK's files.create method
  const uploaded = await replicate.files.create(file);
  
  log.info("File uploaded successfully", { fileId: uploaded.id, url: uploaded.urls.get });
  
  return {
    id: uploaded.id,
    urls: { get: uploaded.urls.get },
  };
}

type ReplicateTraining = {
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
  version: string; // Format: "owner/model:version_hash" (e.g., "ostris/flux-dev-lora-trainer:abc123")
  destination: string; // "owner/model" - where to push the trained model
  input: Record<string, unknown>;
  webhook?: string;
  webhook_events_filter?: Array<"start" | "output" | "logs" | "completed">;
}): Promise<ReplicateTraining> {
  // Use the official Replicate SDK for creating trainings
  const replicate = getReplicateClient();
  
  // Parse version - expect format "owner/model:version_hash"
  // If no colon, assume it's just version hash and use default trainer
  let modelOwner: string;
  let modelName: string;
  let versionId: string;
  
  if (input.version.includes(":")) {
    const [modelRef, version] = input.version.split(":");
    const [owner, name] = modelRef.split("/");
    modelOwner = owner;
    modelName = name;
    versionId = version;
  } else {
    // Default to ostris flux trainer if only version hash provided
    modelOwner = process.env.REPLICATE_IDENTITY_TRAINER_OWNER ?? "ostris";
    modelName = process.env.REPLICATE_IDENTITY_TRAINER_MODEL ?? "flux-dev-lora-trainer";
    versionId = input.version;
  }
  
  log.info("Creating training request", { 
    modelOwner,
    modelName,
    versionId,
    destination: input.destination,
    webhook: input.webhook,
    inputKeys: Object.keys(input.input),
    trainingUrl: `https://api.replicate.com/v1/models/${modelOwner}/${modelName}/versions/${versionId}/trainings`,
  });

  try {
    const training = await replicate.trainings.create(
      modelOwner,
      modelName,
      versionId,
      {
        destination: input.destination as `${string}/${string}`,
        input: input.input,
        webhook: input.webhook,
        webhook_events_filter: input.webhook_events_filter,
      }
    );
    
    log.info("Training created successfully", { 
      trainingId: training.id, 
      status: training.status 
    });
    
    return {
      id: training.id,
      status: training.status as ReplicateTraining["status"],
      error: typeof training.error === "string" ? training.error : null,
      output: training.output,
      created_at: training.created_at,
      started_at: training.started_at ?? null,
      completed_at: training.completed_at ?? null,
      webhook: training.webhook ?? null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : "Unknown";
    
    log.error("Training creation failed", {
      errorName,
      errorMessage,
      modelOwner,
      modelName,
      versionId,
      destination: input.destination,
      // Log full error object for debugging
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    
    throw err;
  }
}

export async function getTraining(
  trainingId: string
): Promise<ReplicateTraining> {
  return replicateFetch<ReplicateTraining>(`/trainings/${trainingId}`, {
    method: "GET",
  });
}

/**
 * Delete a model from Replicate.
 * Best-effort cleanup - won't throw if model doesn't exist.
 */
export async function deleteModel(owner: string, name: string): Promise<void> {
  try {
    await replicateFetch<void>(`/models/${owner}/${name}`, {
      method: "DELETE",
    });
    log.info("Model deleted from Replicate", { owner, name });
  } catch (err) {
    // 404 is expected if model doesn't exist or was never created
    log.warn("Failed to delete model from Replicate (continuing)", {
      owner,
      name,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}