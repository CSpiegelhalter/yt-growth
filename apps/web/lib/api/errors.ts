import { z } from "zod";
import { logger } from "@/lib/logger";
import { DomainError } from "@/lib/shared/errors";

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

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof DomainError) {
    const mapping = DOMAIN_CODE_MAP[err.code];
    return new ApiError({
      code: mapping?.code ?? "INTERNAL",
      status: mapping?.status ?? 500,
      message: err.message,
    });
  }

  // Legacy helper used in older parts of this repo
  if (err && typeof err === "object" && (err as any).status && (err as any).message) {
    const status = Number((err as any).status);
    if (status === 401) return new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Unauthorized" });
    if (status === 403) return new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
    if (status === 404) return new ApiError({ code: "NOT_FOUND", status: 404, message: "Not found" });
  }

  if (isZodError(err)) {
    return new ApiError({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "Invalid request",
      details: err.flatten(),
    });
  }

  // Prisma "record not found" during update/delete
  const prismaCode = (err as any)?.code;
  if (prismaCode === "P2025") {
    return new ApiError({ code: "NOT_FOUND", status: 404, message: "Not found" });
  }

  // Common auth messages thrown in older helpers
  const msg = err instanceof Error ? err.message : String(err);
  if (/unauthorized/i.test(msg)) return new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Unauthorized" });
  if (/forbidden/i.test(msg)) return new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
  if (/subscription required/i.test(msg))
    return new ApiError({ code: "LIMIT_REACHED", status: 402, message: "Subscription required" });

  return new ApiError({ code: "INTERNAL", status: 500, message: "Internal error" });
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


