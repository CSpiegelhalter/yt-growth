import { z } from "zod";

import { DomainError } from "@/lib/shared/errors";
import { logger } from "@/lib/shared/logger";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "LIMIT_REACHED"
  | "INTEGRATION_ERROR"
  | "INTERNAL"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT"
  | "RESTRICTED_CONTENT";

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: unknown;

  constructor(input: { code: ApiErrorCode; status: number; message: string; details?: unknown }) {
    super(input.message);
    this.name = "ApiError";
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
  }
}

function isZodError(err: unknown): err is z.ZodError {
  return err instanceof z.ZodError;
}

interface LegacyErrorLike {
  status?: unknown;
  message?: unknown;
}

interface ErrorWithCode {
  code?: string;
}

const DOMAIN_CODE_MAP: Record<string, { code: ApiErrorCode; status: number }> = {
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },
  LIMIT_REACHED: { code: "LIMIT_REACHED", status: 402 },
  INVALID_INPUT: { code: "VALIDATION_ERROR", status: 400 },
  EXTERNAL_FAILURE: { code: "INTEGRATION_ERROR", status: 502 },
  TIMEOUT: { code: "TIMEOUT", status: 504 },
  RATE_LIMITED: { code: "RATE_LIMITED", status: 429 },
};

const LEGACY_STATUS_MAP: Record<number, { code: ApiErrorCode; status: number; message: string }> = {
  401: { code: "UNAUTHORIZED", status: 401, message: "Unauthorized" },
  403: { code: "FORBIDDEN", status: 403, message: "Forbidden" },
  404: { code: "NOT_FOUND", status: 404, message: "Not found" },
};

const MESSAGE_PATTERNS: Array<[RegExp, { code: ApiErrorCode; status: number; message: string }]> = [
  [/unauthorized/i, { code: "UNAUTHORIZED", status: 401, message: "Unauthorized" }],
  [/forbidden/i, { code: "FORBIDDEN", status: 403, message: "Forbidden" }],
  [/subscription required/i, { code: "LIMIT_REACHED", status: 402, message: "Subscription required" }],
];

function fromLegacyError(err: unknown): ApiError | null {
  const errObj = err as LegacyErrorLike;
  if (!err || typeof err !== "object" || !errObj.status || !errObj.message) {return null;}
  const mapping = LEGACY_STATUS_MAP[Number(errObj.status)];
  return mapping ? new ApiError(mapping) : null;
}

function matchMessagePattern(msg: string): ApiError | null {
  for (const [pattern, props] of MESSAGE_PATTERNS) {
    if (pattern.test(msg)) {return new ApiError(props);}
  }
  return null;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) {return err;}

  if (err instanceof DomainError) {
    const mapping = DOMAIN_CODE_MAP[err.code];
    return new ApiError({
      code: mapping?.code ?? "INTERNAL",
      status: mapping?.status ?? 500,
      message: err.message,
    });
  }

  const legacyResult = fromLegacyError(err);
  if (legacyResult) {return legacyResult;}

  if (isZodError(err)) {
    return new ApiError({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "Invalid request",
      details: err.flatten(),
    });
  }

  if ((err as ErrorWithCode | null)?.code === "P2025") {
    return new ApiError({ code: "NOT_FOUND", status: 404, message: "Not found" });
  }

  const msg = err instanceof Error ? err.message : String(err);
  return matchMessagePattern(msg) ?? new ApiError({ code: "INTERNAL", status: 500, message: "Internal error" });
}

export function logErrorForRequest(input: {
  requestId: string;
  route: string;
  method: string;
  status: number;
  err: unknown;
  userId?: number;
}) {
  logger.error("api.request.error", {
    requestId: input.requestId,
    route: input.route,
    method: input.method,
    status: input.status,
    userId: input.userId,
    err: input.err,
  });
}
