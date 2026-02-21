import type { NextRequest } from "next/server";
import type { ApiHandler, ApiRequestContext, NextRouteContext } from "./types";

function getOrCreateRequestId(req: NextRequest) {
  const incoming = req.headers.get("x-request-id");
  if (incoming && incoming.length >= 8 && incoming.length <= 128) {return incoming;}
  // Node runtime: crypto.randomUUID exists in Node 20+
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}

function getIp(req: NextRequest): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) {return undefined;}
  return xff.split(",")[0]?.trim() || undefined;
}

export function withRequestContext<P>(
  opts: { route?: string },
  handler: ApiHandler<P>
) {
  return async (req: NextRequest, ctx: NextRouteContext<P>) => {
    const requestId = getOrCreateRequestId(req);
    const route = opts.route ?? new URL(req.url).pathname;
    const method = req.method;

    // Best-effort extract common ids from params for logging (do not await unless needed)
    let channelId: string | undefined;
    let videoId: string | undefined;
    try {
      const params = await (ctx as NextRouteContext<Record<string, string>>).params;
      if (params && typeof params === "object") {
        channelId = typeof params.channelId === "string" ? params.channelId : undefined;
        videoId = typeof params.videoId === "string" ? params.videoId : undefined;
      }
    } catch {
      // ignore
    }

    const api: ApiRequestContext = {
      requestId,
      startedAtMs: Date.now(),
      route,
      method,
      ip: getIp(req),
      channelId,
      videoId,
    };

    return handler(req, ctx, api);
  };
}


