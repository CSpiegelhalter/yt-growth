/**
 * Base error class for domain-level errors.
 *
 * Features throw DomainError subclasses. Route handlers catch them
 * and map to ApiError via toApiError() in lib/api/errors.ts.
 *
 * Standard domain error codes (used by toApiError for HTTP mapping):
 *   NOT_FOUND        → 404
 *   UNAUTHORIZED     → 401
 *   FORBIDDEN        → 403
 *   LIMIT_REACHED    → 402
 *   INVALID_INPUT    → 400
 *   EXTERNAL_FAILURE → 502
 *   TIMEOUT          → 504
 *   RATE_LIMITED     → 429
 */
export class DomainError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(code: string, message: string, cause?: unknown) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.cause = cause;
  }
}
