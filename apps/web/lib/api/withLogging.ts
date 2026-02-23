import type { NextRequest } from "next/server";

import { logger } from "@/lib/shared/logger";

import type { ApiErrorCode } from "./errors";
import { jsonError } from "./response";
import type { ApiHandler, ApiRequestContext, NextRouteContext } from "./types";

type LegacyErrorBody = {
  error?: string | { code?: string; requestId?: string; message?: string };
  message?: string;
};

// ─── Extracted helpers ────────────────────────────────────────

const STATUS_TO_CODE: Partial<Record<number, ApiErrorCode>> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "RATE_LIMITED",
};

function codeFromStatus(status: number): ApiErrorCode {
  return STATUS_TO_CODE[status] ?? "INTERNAL";
}

const LEGACY_LIMIT_ERRORS = new Set([
  "limit_reached",
  "upgrade_required",
  "channel_limit_reached",
]);

const LEGACY_ERROR_LABELS: Record<string, string> = {
  limit_reached: "Limit reached",
  upgrade_required: "Upgrade required",
  channel_limit_reached: "Channel limit reached",
};

function resolveLegacyMessage(
  legacyError: string | undefined,
  bodyObj: LegacyErrorBody | undefined,
): string {
  if (legacyError && LEGACY_ERROR_LABELS[legacyError]) {
    return LEGACY_ERROR_LABELS[legacyError];
  }
  if (typeof bodyObj?.message === "string") {return bodyObj.message;}
  if (typeof legacyError === "string") {return legacyError;}
  return "Request failed";
}

// ─── Middleware ────────────────────────────────────────────────

export function withLogging<P>(handler: ApiHandler<P>): ApiHandler<P> {
  return async (
    req: NextRequest,
    ctx: NextRouteContext<P>,
    api: ApiRequestContext
  ) => {
    logger.info("api.request.start", {
      requestId: api.requestId,
      route: api.route,
      method: api.method,
      userId: api.userId,
      channelId: api.channelId,
      videoId: api.videoId,
    });

    const res = await handler(req, ctx, api);

    const durationMs = Date.now() - api.startedAtMs;
    logger.info("api.request.finish", {
      requestId: api.requestId,
      route: api.route,
      method: api.method,
      status: res.status,
      durationMs,
      userId: api.userId,
      channelId: api.channelId,
      videoId: api.videoId,
    });

    // Normalize common legacy error shapes into the uniform API error contract.
    // This lets us migrate routes incrementally without breaking production safety.
    const contentType = res.headers.get("content-type") ?? "";
    if (res.status >= 400 && contentType.includes("application/json")) {
      try {
        const body = await res.clone().json();
        const bodyObj = body as LegacyErrorBody;
        const maybeErrObj = bodyObj?.error;
        const alreadyUnified =
          maybeErrObj &&
          typeof maybeErrObj === "object" &&
          typeof maybeErrObj.code === "string" &&
          typeof maybeErrObj.requestId === "string";
        if (!alreadyUnified) {
          const legacyError =
            typeof maybeErrObj === "string" ? maybeErrObj : undefined;

          const code =
            legacyError && LEGACY_LIMIT_ERRORS.has(legacyError)
              ? ("LIMIT_REACHED" as ApiErrorCode)
              : codeFromStatus(res.status);

          const message = resolveLegacyMessage(legacyError, bodyObj);

          return jsonError({
            status: res.status,
            code,
            message,
            requestId: api.requestId,
            details: body,
            headers: res.headers,
          });
        }
      } catch {
        // fall through
      }
    }

    // Ensure x-request-id always present on response (even for redirects).
    const headers = new Headers(res.headers);
    headers.set("x-request-id", api.requestId);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  };
}
