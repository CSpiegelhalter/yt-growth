import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { prisma } from "@/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

export const GET = createApiRoute(
  { route: "/api/integrations/google/start" },
  withAuth({ mode: "required" }, async (req: NextRequest, _ctx, api) => {
    const user = (api as ApiAuthContext).user!;
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || new URL(req.url).origin;

    try {
      const state = crypto.randomBytes(24).toString("hex");

      await prisma.oAuthState.create({
        data: {
          state,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
        },
      });

      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_OAUTH_REDIRECT!;
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: [
          "openid",
          "email",
          "profile",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/yt-analytics.readonly",
        ].join(" "),
        state,
      });

      const res = NextResponse.redirect(
        "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString()
      );
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
