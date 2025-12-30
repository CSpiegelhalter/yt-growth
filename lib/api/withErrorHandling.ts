import type { NextRequest } from "next/server";
import type { ApiHandler, ApiRequestContext, NextRouteContext } from "./types";
import { jsonError } from "./response";
import { logErrorForRequest, toApiError } from "./errors";

export function withErrorHandling<P>(handler: ApiHandler<P>): ApiHandler<P> {
  return async (req: NextRequest, ctx: NextRouteContext<P>, api: ApiRequestContext) => {
    try {
      return await handler(req, ctx, api);
    } catch (err: unknown) {
      const apiErr = toApiError(err);
      logErrorForRequest({
        requestId: api.requestId,
        route: api.route,
        method: api.method,
        status: apiErr.status,
        err,
        userId: api.userId,
      });

      // Only expose details for validation errors; keep everything else safe.
      const details =
        apiErr.code === "VALIDATION_ERROR" ? apiErr.details : undefined;

      return jsonError({
        status: apiErr.status,
        code: apiErr.code,
        message: apiErr.message,
        requestId: api.requestId,
        details,
      });
    }
  };
}


