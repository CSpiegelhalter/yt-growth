/**
 * YouTube API Transport Layer
 *
 * Central request wrapper supporting two auth modes:
 *   - OAuth (per-user): uses GoogleAccount with auto token refresh
 *   - API Key (anonymous): uses system YOUTUBE_API_KEY query param
 *
 *   ┌──────────────────────────┐
 *   │    youtubeFetch(cred)    │
 *   │                          │
 *   │  kind:"oauth"  ──▶ googleFetchWithAutoRefresh  │
 *   │  kind:"apiKey" ──▶ fetch with ?key= param      │
 *   └──────────────────────────┘
 */

import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";
import { createLogger } from "@/lib/shared/logger";

import type { GoogleAccount, YouTubeCredential } from "./types";

const DEBUG = process.env.YT_DEBUG === "1";
const logger = createLogger({ module: "youtube.transport" });

const API_KEY_MAX_RETRIES = 2;
const API_KEY_RETRY_DELAY_MS = 500;

/** Strip API key from URLs before logging/error messages. */
function sanitizeUrl(url: string): string {
  return url.replace(/([?&])key=[^&]+/, "$1key=[REDACTED]");
}

/**
 * Make a request to YouTube APIs using the appropriate auth mode.
 *
 * - OAuth: delegates to googleFetchWithAutoRefresh (handles token refresh, 401 retry)
 * - API Key: appends ?key= param, retries on 500/timeout (parity with OAuth retry behavior)
 */
/**
 * Accepts YouTubeCredential (tagged union) OR GoogleAccount directly
 * for backward compatibility with existing OAuth callers.
 */
export async function youtubeFetch<T>(
  cred: YouTubeCredential | GoogleAccount,
  url: string,
): Promise<T> {
  if (DEBUG) {
    console.log(`[YouTube API] ${sanitizeUrl(url)}`);
  }

  // Auto-wrap bare GoogleAccount for backward compatibility
  const resolved: YouTubeCredential =
    "kind" in cred ? cred : { kind: "oauth", account: cred };

  if (resolved.kind === "oauth") {
    return googleFetchWithAutoRefresh<T>(resolved.account, url);
  }

  // API Key path — append key as query param
  const separator = url.includes("?") ? "&" : "?";
  const authedUrl = `${url}${separator}key=${resolved.apiKey}`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= API_KEY_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(authedUrl, {
        signal: AbortSignal.timeout(15_000),
      });

      if (res.status === 403) {
        const body = await res.text().catch(() => "");
        throw new YouTubeApiKeyError(
          `YouTube API key error (403): ${body.slice(0, 200)}`,
          403,
        );
      }

      if (res.status === 404) {
        const body = await res.text().catch(() => "");
        throw new YouTubeApiKeyError(
          `YouTube API not found (404): ${body.slice(0, 200)}`,
          404,
        );
      }

      if (res.status >= 500 && attempt < API_KEY_MAX_RETRIES) {
        lastError = new Error(`YouTube API server error: ${res.status}`);
        await new Promise((r) => setTimeout(r, API_KEY_RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new YouTubeApiKeyError(
          `YouTube API error (${res.status}): ${body.slice(0, 200)}`,
          res.status,
        );
      }

      const data = await res.json() as T;
      return data;
    } catch (error) {
      if (error instanceof YouTubeApiKeyError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "TimeoutError") {
        lastError = new Error("YouTube API request timed out");
        if (attempt < API_KEY_MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, API_KEY_RETRY_DELAY_MS * (attempt + 1)));
          continue;
        }
      }
      if (attempt >= API_KEY_MAX_RETRIES) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("YouTube API key fetch failed after retries", {
          url: sanitizeUrl(url),
          error: msg,
          attempts: attempt + 1,
        });
        throw lastError ?? error;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("YouTube API key fetch failed");
}

/** Error from YouTube API key requests (non-OAuth). */
export class YouTubeApiKeyError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "YouTubeApiKeyError";
    this.status = status;
  }
}
