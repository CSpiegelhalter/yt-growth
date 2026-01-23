import type { ApiHandler, NextRouteContext } from "./types";
import { withRequestContext } from "./withRequestContext";
import { withLogging } from "./withLogging";
import { withErrorHandling } from "./withErrorHandling";

/**
 * Create a production-hardened Next.js App Router route handler with:
 * - requestId propagation
 * - structured start/finish logs (duration, status)
 * - uniform error mapping/shape
 *
 * Compose additional wrappers (auth/validation/rate-limit) around your handler.
 */
export function createApiRoute<P>(
  opts: { route?: string },
  handler: ApiHandler<P>
) {
  return withRequestContext<P>(opts, withLogging(withErrorHandling(handler)));
}

// For routes without params, Next passes no second arg in some cases.
// This helper keeps typing sane.
export function emptyParamsContext(): NextRouteContext<Record<string, never>> {
  return { params: Promise.resolve({}) };
}
