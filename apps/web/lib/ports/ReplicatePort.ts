/**
 * Replicate Port — contract for ML model inference and training.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what features need from an ML platform without specifying how.
 *
 * Imported by:
 *   - lib/features/ (to declare dependency on ML inference/training)
 *   - lib/adapters/replicate/ (to implement)
 *   - app/ or lib/server/ (to wire adapter to features)
 */

// ─── Prediction Types ───────────────────────────────────────

export type PredictionStatus =
  | "starting"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export interface Prediction {
  id: string;
  status: PredictionStatus;
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string | null;
  logs?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  webhookUrl?: string | null;
}

export interface CreatePredictionParams {
  version: string;
  input: Record<string, unknown>;
  webhookUrl?: string;
  webhookEvents?: Array<"start" | "output" | "logs" | "completed">;
}

// ─── Training Types ─────────────────────────────────────────

export type TrainingStatus =
  | "starting"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export interface Training {
  id: string;
  status: TrainingStatus;
  error?: string | null;
  output?: unknown;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  webhookUrl?: string | null;
}

export interface CreateTrainingParams {
  /** Model version reference, e.g. "owner/model:version_hash". */
  version: string;
  /** Destination for trained weights, e.g. "owner/model". */
  destination: string;
  input: Record<string, unknown>;
  webhookUrl?: string;
  webhookEvents?: Array<"start" | "output" | "logs" | "completed">;
}

// ─── Model Types ────────────────────────────────────────────

export interface ModelInfo {
  owner: string;
  name: string;
  visibility?: "public" | "private";
  description?: string | null;
}

export interface CreateModelParams {
  owner: string;
  name: string;
  description?: string;
  visibility?: "private" | "public";
  hardware?: string;
}

export interface ModelVersionCheck {
  valid: boolean;
  error?: string;
}

// ─── File Upload Types ──────────────────────────────────────

export interface FileUploadParams {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}

export interface UploadedFile {
  id: string;
  url: string;
}

// ─── Webhook Types ──────────────────────────────────────────

export interface WebhookVerificationInput {
  payload: string;
  headers: Headers;
}

// ─── Port Interface ─────────────────────────────────────────

/** @public Contract for features to declare ML inference/training dependency. */
export interface ReplicatePort {
  // ── Predictions ─────────────────────────────────────────

  /** Create a prediction (model inference) run. */
  createPrediction(params: CreatePredictionParams): Promise<Prediction>;

  /** Poll the current status of a prediction. */
  getPrediction(predictionId: string): Promise<Prediction>;

  // ── Training ────────────────────────────────────────────

  /** Start a fine-tuning training run. */
  createTraining(params: CreateTrainingParams): Promise<Training>;

  /** Poll the current status of a training run. */
  getTraining(trainingId: string): Promise<Training>;

  // ── Models ──────────────────────────────────────────────

  /** Create a new model destination for trained weights. */
  createModel(params: CreateModelParams): Promise<ModelInfo>;

  /** Verify a model version exists and is accessible. */
  verifyModelVersion(
    owner: string,
    name: string,
    version: string,
  ): Promise<ModelVersionCheck>;

  /** Delete a model. Best-effort — does not throw if the model is missing. */
  deleteModel(owner: string, name: string): Promise<void>;

  // ── File Uploads ────────────────────────────────────────

  /** Upload a file for use in training inputs. */
  uploadFile(params: FileUploadParams): Promise<UploadedFile>;

  // ── Webhooks ────────────────────────────────────────────

  /**
   * Verify a webhook request is authentic.
   * Throws if verification fails.
   */
  verifyWebhook(input: WebhookVerificationInput): void;
}
