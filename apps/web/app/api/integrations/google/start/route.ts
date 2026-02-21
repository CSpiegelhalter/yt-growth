import { type NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { prisma } from "@/prisma";
import crypto from "crypto";
import { googleOAuthAdapter } from "@/lib/adapters/google";

export const runtime = "nodejs";

export const GET = createApiRoute(
  { route: "/api/integrations/google/start" },
  withAuth({ mode: "required" }, async (req: NextRequest, _ctx, api) => {
    const user = (api as ApiAuthContext).user!;
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || new URL(req.url).origin;

    // Get optional channelId - if provided, we're reconnecting a specific channel
    const url = new URL(req.url);
    const reconnectChannelId = url.searchParams.get("channelId");

    try {
      // Encode reconnect channel ID in state (format: randomHex:channelId or just randomHex)
      const stateRandom = crypto.randomBytes(24).toString("hex");
      const state = reconnectChannelId 
        ? `${stateRandom}:${reconnectChannelId}` 
        : stateRandom;

      await prisma.oAuthState.create({
        data: {
          state: stateRandom, // Store just the random part for lookup
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
        },
      });

      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_OAUTH_REDIRECT!;
      const authUrl = googleOAuthAdapter.buildAuthUrl(redirectUri, state);

      const res = NextResponse.redirect(authUrl);
      res.headers.set("x-request-id", api.requestId);
      return res;
    } catch {
      const res = NextResponse.redirect(
        new URL(`/dashboard?error=google_oauth&rid=${api.requestId}`, baseUrl)
      );
      res.headers.set("x-request-id", api.requestId);
      return res;
    }
  })
);
