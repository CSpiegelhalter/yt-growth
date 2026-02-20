/**
 * Competitor Video Detail - Timeout Utilities
 *
 * Helpers for adding timeouts to async operations.
 */

import { createLogger } from "@/lib/logger";

const logger = createLogger({ module: "video-detail.timeout" });

/**
 * Error thrown when an operation times out.
 */
export class TimeoutError extends Error {
  constructor(
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(`Operation "${operation}" timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Wrap a promise with a timeout.
 * If the promise doesn't resolve within `ms`, rejects with TimeoutError.
 *
 * @param promise - The promise to wrap
 * @param ms - Timeout in milliseconds
 * @param operation - Label for logging/error messages
 * @returns Promise that resolves/rejects based on original promise or timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  operation: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      logger.warn(`Timeout triggered`, { operation, timeoutMs: ms });
      reject(new TimeoutError(operation, ms));
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Wrap a promise with a timeout, returning a fallback value on timeout.
 * Does NOT throw - returns fallback instead.
 *
 * @param promise - The promise to wrap
 * @param ms - Timeout in milliseconds
 * @param operation - Label for logging
 * @param fallback - Value to return on timeout
 * @returns Promise that resolves to result or fallback
 */
/**
 * Execute a promise with timeout, logging the error but returning null on failure.
 * Useful for non-critical operations where we want to continue without the result.
 *
 * @param promise - The promise to execute
 * @param ms - Timeout in milliseconds
 * @param operation - Label for logging
 * @returns Promise that resolves to result or null on any failure
 */
export async function withTimeoutOptional<T>(
  promise: Promise<T>,
  ms: number,
  operation: string
): Promise<T | null> {
  try {
    return await withTimeout(promise, ms, operation);
  } catch (err) {
    const isTimeout = err instanceof TimeoutError;
    logger.warn(`Optional operation failed`, {
      operation,
      isTimeout,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
