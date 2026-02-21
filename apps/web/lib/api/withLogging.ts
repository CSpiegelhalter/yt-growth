import type { NextRequest } from "next/server";
import { logger } from "@/lib/shared/logger";
import type { ApiHandler, ApiRequestContext, NextRouteContext } from "./types";
import { jsonError } from "./response";
import type { ApiErrorCode } from "./errors";

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
        const maybeErrObj = (body as any)?.error;
        const alreadyUnified =
          maybeErrObj &&
          typeof maybeErrObj === "object" &&
          typeof maybeErrObj.code === "string" &&
          typeof maybeErrObj.requestId === "string";
        if (!alreadyUnified) {
          const legacyError =
            typeof maybeErrObj === "string" ? maybeErrObj : undefined;

          const codeFromStatus = (status: number): ApiErrorCode => {
            if (status === 400) return "VALIDATION_ERROR";
            if (status === 401) return "UNAUTHORIZED";
            if (status === 403) return "FORBIDDEN";
            if (status === 404) return "NOT_FOUND";
            if (status === 429) return "RATE_LIMITED";
            if (status >= 500) return "INTERNAL";
            return "INTERNAL";
          };

          let code = codeFromStatus(res.status);
          if (
            legacyError === "limit_reached" ||
            legacyError === "upgrade_required" ||
            legacyError === "channel_limit_reached"
          ) {
            code = "LIMIT_REACHED";
          }

          const message =
            legacyError === "limit_reached"
              ? "Limit reached"
              : legacyError === "upgrade_required"
              ? "Upgrade required"
              : legacyError === "channel_limit_reached"
              ? "Channel limit reached"
              : typeof (body as any)?.message === "string"
              ? (body as any).message
              : typeof legacyError === "string"
              ? legacyError
              : "Request failed";

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
