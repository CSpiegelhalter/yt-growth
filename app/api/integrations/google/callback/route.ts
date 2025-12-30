export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { syncUserChannels } from "@/lib/sync-youtube";
import { checkChannelLimit } from "@/lib/with-entitlements";
import { createApiRoute } from "@/lib/api/route";

async function exchangeCode(code: string) {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_OAUTH_REDIRECT!;
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("Token exchange failed");
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    id_token?: string;
  }>;
}

async function getUserInfo(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("userinfo fetch failed");
  return res.json() as Promise<{ sub: string; email?: string; name?: string }>;
}

export const GET = createApiRoute(
  { route: "/api/integrations/google/callback" },
  async (req: NextRequest, _ctx, api) => {
    const url = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || url.origin;
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const redirect = (path: string) => {
      const res = NextResponse.redirect(new URL(path, baseUrl));
      res.headers.set("x-request-id", api.requestId);
      return res;
    };

    try {
      if (!code || !state) {
        return redirect(`/integrations/error?m=missing&rid=${api.requestId}`);
      }

      const row = await prisma.oAuthState.findUnique({ where: { state } });
      if (!row || row.expiresAt < new Date()) {
        return redirect(`/integrations/error?m=state&rid=${api.requestId}`);
      }

      // Check channel limit before proceeding
      const channelCheck = await checkChannelLimit(row.userId);
      if (!channelCheck.allowed) {
        await prisma.oAuthState.delete({ where: { state } });
        const limitMsg =
          channelCheck.plan === "FREE"
            ? `Free plan allows ${channelCheck.limit} channel. Upgrade to Pro for more.`
            : `You have reached the maximum of ${channelCheck.limit} channels.`;
        return redirect(
          `/dashboard?error=channel_limit&message=${encodeURIComponent(
            limitMsg
          )}&rid=${api.requestId}`
        );
      }

      // consume state
      await prisma.oAuthState.delete({ where: { state } });

      const tok = await exchangeCode(code);
      const me = await getUserInfo(tok.access_token);
      const providerAccountId = me.sub;
      const tokenExpiresAt = new Date(Date.now() + tok.expires_in * 1000);
      const scopes = tok.scope ?? "";

      const googleAccount = await prisma.googleAccount.upsert({
        where: {
          provider_providerAccountId: { provider: "google", providerAccountId },
        },
        update: {
          userId: row.userId,
          tokenExpiresAt,
          scopes,
          ...(tok.refresh_token ? { refreshTokenEnc: tok.refresh_token } : {}),
          updatedAt: new Date(),
        },
        create: {
          userId: row.userId,
          provider: "google",
          providerAccountId,
          refreshTokenEnc: tok.refresh_token ?? null,
          scopes,
          tokenExpiresAt,
        },
      });

      await syncUserChannels(row.userId, googleAccount.id);

      return redirect(`/dashboard?rid=${api.requestId}`);
    } catch {
      return redirect(`/integrations/error?m=oauth&rid=${api.requestId}`);
    }
  }
);
