/**
 * LLM Port — contract for large-language-model completions.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what features need from an LLM without specifying the provider.
 *
 * Imported by:
 *   - lib/features/ (to declare dependency on LLM capabilities)
 *   - lib/adapters/openai/ (to implement)
 *   - app/ or lib/server/ (to wire adapter to features)
 */

// ─── Message Types ──────────────────────────────────────────

export type LlmRole = "system" | "user" | "assistant";

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

// ─── Completion Params ──────────────────────────────────────

export interface LlmCompletionParams {
  messages: LlmMessage[];
  /** Provider-specific model identifier (e.g. "gpt-4o-mini"). */
  model?: string;
  maxTokens?: number;
  /** Sampling temperature (0 = deterministic, higher = more creative). */
  temperature?: number;
}

// ─── Completion Result ──────────────────────────────────────

export interface LlmCompletionResult {
  content: string;
  tokensUsed: number;
  model: string;
}

// ─── Port Interface ─────────────────────────────────────────

export interface LlmPort {
  /** Run a chat completion and return the raw text response. */
  complete(params: LlmCompletionParams): Promise<LlmCompletionResult>;

  /**
   * Run a chat completion, parse the response as JSON, and return the result.
   *
   * Implementations should request structured JSON output from the provider
   * when possible and handle extraction/parsing internally.
   */
  completeJson<T>(params: LlmCompletionParams): Promise<T>;
}
