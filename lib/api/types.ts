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
};

export type NextRouteContext<P> = {
  params: Promise<P>;
};

export type ApiHandler<P> = (
  req: NextRequest,
  ctx: NextRouteContext<P>,
  api: ApiRequestContext
) => Promise<Response>;


