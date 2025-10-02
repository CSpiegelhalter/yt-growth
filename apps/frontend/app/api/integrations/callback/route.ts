// apps/frontend/app/api/integrations/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export const runtime = "nodejs";

async function exchangeCodeForTokens(code: string) {
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
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    id_token?: string;
  };
}

async function getGoogleUser(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch userinfo");
  return (await res.json()) as { sub: string; email?: string; name?: string; picture?: string };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) throw new Error("Missing code/state");

    // Resolve state → userId
    const stateRow = await prisma.job.findFirst({ where: { type: "google_oauth_state", status: state } });
    if (!stateRow) throw new Error("Invalid state");
    const { userId } = JSON.parse(stateRow.payloadJSON as string) as { userId: number };
    await prisma.job.delete({ where: { id: stateRow.id } }); // consume state

    // Exchange code → tokens
    const tok = await exchangeCodeForTokens(code);
    const me = await getGoogleUser(tok.access_token);

    const providerAccountId = me.sub;
    const tokenExpiresAt = new Date(Date.now() + tok.expires_in * 1000);
    const scopes = tok.scope ?? "";

    // Upsert GoogleAccount
    await prisma.googleAccount.upsert({
      where: {
        provider_providerAccountId: { provider: "google", providerAccountId },
      },
      update: {
        userId,
        tokenExpiresAt,
        scopes,
        ...(tok.refresh_token ? { refreshTokenEnc: tok.refresh_token } : {}),
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: "google",
        providerAccountId,
        refreshTokenEnc: tok.refresh_token ?? null,
        scopes,
        tokenExpiresAt,
      },
    });

    return NextResponse.redirect(new URL("/channels", process.env.NEXT_PUBLIC_WEB_URL));
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/integrations/error?m=${encodeURIComponent(e.message || "failed")}`, process.env.NEXT_PUBLIC_WEB_URL));
  }
}
