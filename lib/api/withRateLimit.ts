import type { NextRequest } from "next/server";
import type { ApiHandler, ApiRequestContext, NextRouteContext } from "./types";
import { ApiError } from "./errors";
import { checkRateLimit, rateLimitKey, RATE_LIMITS, type RateLimitConfig } from "@/lib/rate-limit";

export function withRateLimit<P>(
  opts: {
    operation: keyof typeof RATE_LIMITS;
    identifier: (api: ApiRequestContext) => string | number | undefined;
    config?: RateLimitConfig;
  },
  handler: ApiHandler<P>
): ApiHandler<P> {
  return async (req: NextRequest, ctx: NextRouteContext<P>, api: ApiRequestContext) => {
    const id = opts.identifier(api);
    if (id === undefined || id === null) {
      return handler(req, ctx, api);
    }
    const config = opts.config ?? RATE_LIMITS[opts.operation];
    const key = rateLimitKey(opts.operation, id);
    const result = checkRateLimit(key, config);
    if (!result.success) {
      throw new ApiError({
        code: "RATE_LIMITED",
        status: 429,
        message: "Rate limit exceeded. Please try again later.",
        details: { resetAt: new Date(result.resetAt).toISOString() },
      });
    }
    return handler(req, ctx, api);
  };
}


