/**
 * Replicate AI Client
 *
 * Simple wrapper for Flux Thumbnails model - generates YouTube-style thumbnails.
 */

const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const FLUX_MODEL = "justmalhar/flux-thumbnails-v2";

// Cache for model version
let fluxVersionCache: string | null = null;

// ============================================
// TYPES
// ============================================

export interface GenerateFluxOptions {
  /** Text prompt describing the thumbnail */
  prompt: string;
  /** Number of images to generate */
  numOutputs?: number;
  /** Seed for reproducibility */
  seed?: number;
}

export interface ReplicateResult {
  /** Generated image URLs */
  images: string[];
  /** Time taken in seconds */
  duration: number;
}

// ============================================
// API HELPERS
// ============================================

function getApiKey(): string {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    throw new Error("REPLICATE_API_KEY environment variable is not set");
  }
  return apiKey;
}

async function getFluxVersion(apiKey: string): Promise<string> {
  if (fluxVersionCache) {
    return fluxVersionCache;
  }

  console.log(`[replicate] Fetching version for ${FLUX_MODEL}...`);
  const response = await fetch(`${REPLICATE_API_BASE}/models/${FLUX_MODEL}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch model ${FLUX_MODEL}: ${response.status}`);
  }

  const data = await response.json();
  const version = data.latest_version?.id;

  if (!version) {
    throw new Error(`No version found for model ${FLUX_MODEL}`);
  }

  fluxVersionCache = version;
  console.log(`[replicate] Using version ${version.slice(0, 12)}...`);

  return version;
}

async function pollPrediction(
  predictionId: string,
  apiKey: string,
  maxWaitMs = 120000
): Promise<{ output: string[] | null }> {
  const startTime = Date.now();
  const pollInterval = 1000;

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `${REPLICATE_API_BASE}/predictions/${predictionId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!response.ok) {
      throw new Error(`Failed to poll prediction: ${response.status}`);
    }

    const prediction = await response.json();

    if (prediction.status === "succeeded") {
      return { output: prediction.output };
    }

    if (prediction.status === "failed") {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    if (prediction.status === "canceled") {
      throw new Error("Prediction was canceled");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Prediction timed out");
}

// ============================================
// MAIN API FUNCTION
// ============================================

/**
 * Generate a thumbnail using Flux Thumbnails model.
 */
export async function generateFluxThumbnail(
  options: GenerateFluxOptions
): Promise<ReplicateResult> {
  const apiKey = getApiKey();
  const startTime = Date.now();

  // Build thumbnail prompt with trigger word
  const thumbnailPrompt = `a youtube thumbnail in the style of YTTHUMBNAIL, ${options.prompt}`;
  console.log(`[replicate] Generating Flux thumbnail`);
  console.log(`[replicate] ========== FULL PROMPT ==========`);
  console.log(`[replicate] ${thumbnailPrompt}`);
  console.log(`[replicate] ==================================`);

  const modelVersion = await getFluxVersion(apiKey);

  const response = await fetch(`${REPLICATE_API_BASE}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: modelVersion,
      input: {
        model: "dev",
        prompt: thumbnailPrompt,
        lora_scale: 1,
        num_outputs: options.numOutputs ?? 1,
        aspect_ratio: "16:9",
        output_format: "png",
        guidance_scale: 3.5,
        output_quality: 100,
        prompt_strength: 0.8,
        extra_lora_scale: 1,
        num_inference_steps: 50,
        ...(options.seed !== undefined && { seed: options.seed }),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    console.error(`[replicate] API error ${response.status}:`, error);
    throw new Error(`Replicate API error ${response.status}: ${error}`);
  }

  const prediction = await response.json();
  console.log(`[replicate] Prediction started: ${prediction.id}`);

  const result = await pollPrediction(prediction.id, apiKey);
  const duration = (Date.now() - startTime) / 1000;

  console.log(`[replicate] Completed in ${duration.toFixed(1)}s`);

  return {
    images: result.output ?? [],
    duration,
  };
}

/**
 * Check if Replicate API is configured.
 */
export function isReplicateAvailable(): boolean {
  return !!process.env.REPLICATE_API_KEY;
}
