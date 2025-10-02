// apps/frontend/app/api/integrations/google/callback/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

async function exchangeCode(code: string) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT!,
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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return NextResponse.redirect(new URL("/integrations/error?m=missing", process.env.NEXT_PUBLIC_WEB_URL));

  const row = await prisma.oAuthState.findUnique({ where: { state } });
  if (!row || row.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/integrations/error?m=state", process.env.NEXT_PUBLIC_WEB_URL));
  }
  // consume state
  await prisma.oAuthState.delete({ where: { state } });

  const tok = await exchangeCode(code);
  const me  = await getUserInfo(tok.access_token);
  const providerAccountId = me.sub;
  const tokenExpiresAt = new Date(Date.now() + tok.expires_in * 1000);
  const scopes = tok.scope ?? "";

  await prisma.googleAccount.upsert({
    where: { provider_providerAccountId: { provider: "google", providerAccountId } },
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

  return NextResponse.redirect(new URL("/channels", process.env.NEXT_PUBLIC_WEB_URL));
}
