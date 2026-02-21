import type { NextRequest } from "next/server";
import type { ApiHandler, ApiRequestContext, NextRouteContext } from "./types";
import { ApiError } from "./errors";
import { getCurrentUserWithSubscription, type AuthUserWithSubscription } from "@/lib/server/auth";

type AuthMode = "required" | "optional";

export type ApiAuthContext = ApiRequestContext & {
  user?: AuthUserWithSubscription;
};

export function withAuth<P>(
  opts: { mode: AuthMode },
  handler: (
    req: NextRequest,
    ctx: NextRouteContext<P>,
    api: ApiAuthContext
  ) => Promise<Response>
): ApiHandler<P> {
  return async (req, ctx, api) => {
    const user = await getCurrentUserWithSubscription();
    if (!user && opts.mode === "required") {
      throw new ApiError({ code: "UNAUTHORIZED", status: 401, message: "Unauthorized" });
    }
    const userId = user?.id;
    return handler(req, ctx, { ...api, userId, user: user ?? undefined });
  };
}


