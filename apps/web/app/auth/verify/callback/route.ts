import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

import { logger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const isDev = process.env.NODE_ENV === "development";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function loginRedirect(baseUrl: string, errorCode: string) {
  return NextResponse.redirect(new URL(`/auth/login?error=${errorCode}`, baseUrl));
}

type OAuthTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
};

async function exchangeCodeForTokens(code: string, baseUrl: string): Promise<OAuthTokens | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${baseUrl}/auth/verify/callback`,
    }),
  });

  if (!response.ok) {
    console.error("[auth/verify/callback] Token exchange failed:", await response.text());
    return null;
  }

  return response.json();
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error("[auth/verify/callback] Failed to get user info");
    return null;
  }

  return response.json();
}

async function findOrCreateUser(userInfo: GoogleUserInfo) {
  const existing = await prisma.user.findUnique({ where: { email: userInfo.email } });
  if (existing) {return existing;}

  const user = await prisma.user.create({
    data: { email: userInfo.email, name: userInfo.name },
  });
  logger.info("auth.verify.new_user", { userId: user.id });
  return user;
}

async function upsertGoogleAccount(userId: number, userInfo: GoogleUserInfo, tokens: OAuthTokens) {
  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await prisma.googleAccount.upsert({
    where: {
      provider_providerAccountId: { provider: "google", providerAccountId: userInfo.id },
    },
    update: {
      userId,
      ...(tokens.refresh_token ? { refreshTokenEnc: tokens.refresh_token } : {}),
      tokenExpiresAt,
      scopes: tokens.scope || "",
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider: "google",
      providerAccountId: userInfo.id,
      refreshTokenEnc: tokens.refresh_token || null,
      tokenExpiresAt,
      scopes: tokens.scope || "",
    },
  });
}

function buildSessionRedirect(
  sessionToken: string,
  callbackUrl: string,
  baseUrl: string,
): NextResponse {
  const response = NextResponse.redirect(new URL(callbackUrl, baseUrl));
  const cookieName = isDev ? "next-auth.session-token" : "__Secure-next-auth.session-token";

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: !isDev,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

function validateStateCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  state: string,
): { state: string; callbackUrl: string } | null {
  const stateDataCookie = cookieStore.get("oauth_verify_state");
  if (!stateDataCookie?.value) {
    console.error("[auth/verify/callback] No state cookie found");
    return null;
  }

  let stateData: { state: string; callbackUrl: string };
  try {
    stateData = JSON.parse(stateDataCookie.value);
  } catch {
    console.error("[auth/verify/callback] Invalid state cookie");
    return null;
  }

  if (stateData.state !== state) {
    console.error("[auth/verify/callback] State mismatch");
    return null;
  }

  return stateData;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cookieStore = await cookies();

  if (error) {
    return loginRedirect(baseUrl, error);
  }

  if (!code || !state) {
    return loginRedirect(baseUrl, "MissingParams");
  }

  const stateData = validateStateCookie(cookieStore, state);
  if (!stateData) {
    return loginRedirect(baseUrl, "InvalidState");
  }

  cookieStore.delete("oauth_verify_state");

  try {
    const tokens = await exchangeCodeForTokens(code, baseUrl);
    if (!tokens) {
      return loginRedirect(baseUrl, "TokenExchangeFailed");
    }

    const userInfo = await fetchGoogleUserInfo(tokens.access_token);
    if (!userInfo) {
      return loginRedirect(baseUrl, "UserInfoFailed");
    }

    const user = await findOrCreateUser(userInfo);
    await upsertGoogleAccount(user.id, userInfo, tokens);

    logger.info("auth.verify.success", {
      userId: user.id,
      hasRefreshToken: !!tokens.refresh_token,
      scopes: tokens.scope,
    });

    const sessionToken = await encode({
      token: { uid: String(user.id), email: user.email, name: user.name },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: SESSION_MAX_AGE,
    });

    return buildSessionRedirect(sessionToken, stateData.callbackUrl, baseUrl);
  } catch (error_) {
    console.error("[auth/verify/callback] Error:", error_);
    return loginRedirect(baseUrl, "CallbackError");
  }
}
