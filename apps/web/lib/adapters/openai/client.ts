/**
 * OpenAI Chat Completion Adapter
 *
 * Wraps the OpenAI chat completions API with retry logic, rate-limit
 * handling, and error wrapping. Implements (and extends) the LlmPort
 * contract from lib/ports/LlmPort.ts.
 *
 * Allowed imports: lib/ports/, lib/shared/
 */

import "server-only";

import type {
  LlmPort,
  LlmCompletionParams,
  LlmCompletionResult,
} from "@/lib/ports/LlmPort";
import { logger } from "@/lib/shared/logger";

// ─── Configuration ───────────────────────────────────────────

const API_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;

// ─── Error ───────────────────────────────────────────────────

class OpenAiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null,
    public readonly isRetryable: boolean,
    cause?: unknown
  ) {
    super(message);
    this.name = "OpenAiError";
    if (cause) {this.cause = cause;}
  }
}

// ─── Params (extends port with OpenAI-specific options) ──────

type OpenAiCompletionParams = LlmCompletionParams & {
  responseFormat?: "json_object";
};

// ─── Internals ───────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new OpenAiError("OPENAI_API_KEY not configured", null, false);
  }
  return key;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!Number.isNaN(seconds) && seconds > 0) {return seconds * 1000;}
  }
  return BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
}

/**
 * Low-level fetch with retry loop. All public methods delegate here.
 */
async function fetchChatCompletion(
  params: OpenAiCompletionParams
): Promise<LlmCompletionResult> {
  const apiKey = getApiKey();
  const model = params.model ?? DEFAULT_MODEL;
  const maxTokens = params.maxTokens ?? DEFAULT_MAX_TOKENS;
  const temperature = params.temperature ?? DEFAULT_TEMPERATURE;

  const body: Record<string, unknown> = {
    model,
    messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: maxTokens,
    temperature,
    store: false,
  };

  if (params.responseFormat) {
    body.response_format = { type: params.responseFormat };
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          const delay = retryDelay(
            attempt,
            response.headers.get("retry-after")
          );
          logger.warn("[OpenAI] retryable error", {
            status: response.status,
            attempt: attempt + 1,
            maxAttempts: MAX_RETRIES + 1,
            retryInMs: delay,
          });
          lastError = new OpenAiError(
            `OpenAI API error ${response.status}: ${errorText}`,
            response.status,
            true
          );
          await sleep(delay);
          continue;
        }

        throw new OpenAiError(
          `OpenAI API error ${response.status}: ${errorText}`,
          response.status,
          false
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content ?? "",
        tokensUsed: data.usage?.total_tokens ?? 0,
        model,
      };
    } catch (err) {
      if (err instanceof OpenAiError) {throw err;}

      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn("[OpenAI] network error, retrying", {
          attempt: attempt + 1,
          maxAttempts: MAX_RETRIES + 1,
          retryInMs: delay,
        });
        lastError = err;
        await sleep(delay);
        continue;
      }

      throw new OpenAiError(
        `OpenAI request failed after ${MAX_RETRIES + 1} attempts`,
        null,
        false,
        err
      );
    }
  }

  throw lastError instanceof OpenAiError
    ? lastError
    : new OpenAiError(
        `OpenAI request failed after ${MAX_RETRIES + 1} attempts`,
        null,
        false,
        lastError
      );
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Run a chat completion and return the raw text response.
 *
 * Accepts an optional `responseFormat` beyond the LlmPort contract so
 * callers can request JSON-mode output while still receiving the raw
 * text (useful when the caller does its own parsing).
 */
export async function complete(
  params: OpenAiCompletionParams
): Promise<LlmCompletionResult> {
  return fetchChatCompletion(params);
}

/**
 * Run a chat completion with JSON-mode enabled, extract the JSON
 * object from the response, parse it, and return the typed result.
 */
async function completeJson<T>(
  params: LlmCompletionParams
): Promise<T> {
  const result = await fetchChatCompletion({
    ...params,
    responseFormat: "json_object",
  });

  const jsonMatch = result.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new OpenAiError(
      "Failed to extract JSON from completion response",
      null,
      false
    );
  }
  return JSON.parse(jsonMatch[0]) as T;
}

/**
 * Object conforming to the LlmPort interface.
 * Use the standalone `complete` / `completeJson` exports for direct
 * calls, or pass this object where code expects an `LlmPort`.
 *
 * Not yet exported — will be promoted to a public export when
 * lib/features/ consumers are wired through LlmPort (Phase 3).
 */
const _openAiAdapter: LlmPort = { complete, completeJson };
void _openAiAdapter;
