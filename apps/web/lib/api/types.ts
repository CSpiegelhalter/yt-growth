import type { NextRequest } from "next/server";

export type ApiRequestContext = {
  requestId: string;
  startedAtMs: number;
  route: string;
  method: string;
  ip?: string;
  userId?: number;
  channelId?: string;
  videoId?: string;
  /** Populated by withRateLimit — use to read remaining count without re-incrementing */
  rateLimitResult?: { success: boolean; remaining: number; resetAt: number };
};

export type NextRouteContext<P> = {
  params: Promise<P>;
};

export type ApiHandler<P> = (
  req: NextRequest,
  ctx: NextRouteContext<P>,
  api: ApiRequestContext
) => Promise<Response>;


