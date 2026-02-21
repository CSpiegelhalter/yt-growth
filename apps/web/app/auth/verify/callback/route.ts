import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/prisma";
import { logger } from "@/lib/shared/logger";
import { encode } from "next-auth/jwt";

/**
 * GET /auth/verify/callback
 *
 * Handles the OAuth callback for the verification flow.
 * Validates state, exchanges code for tokens, and creates session.
 */

const isDev = process.env.NODE_ENV === "development";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cookieStore = await cookies();

  // Handle OAuth errors
  if (error) {
    console.error("[auth/verify/callback] OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${error}`, baseUrl)
    );
  }

  // Validate required params
  if (!code || !state) {
    console.error("[auth/verify/callback] Missing code or state");
    return NextResponse.redirect(
      new URL("/auth/login?error=MissingParams", baseUrl)
    );
  }

  // Validate state
  const stateDataCookie = cookieStore.get("oauth_verify_state");
  if (!stateDataCookie?.value) {
    console.error("[auth/verify/callback] No state cookie found");
    return NextResponse.redirect(
      new URL("/auth/login?error=StateMissing", baseUrl)
    );
  }

  let stateData: { state: string; callbackUrl: string };
  try {
    stateData = JSON.parse(stateDataCookie.value);
  } catch {
    console.error("[auth/verify/callback] Invalid state cookie");
    return NextResponse.redirect(
      new URL("/auth/login?error=InvalidState", baseUrl)
    );
  }

  if (stateData.state !== state) {
    console.error("[auth/verify/callback] State mismatch");
    return NextResponse.redirect(
      new URL("/auth/login?error=StateMismatch", baseUrl)
    );
  }

  // Clear the state cookie
  cookieStore.delete("oauth_verify_state");

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("[auth/verify/callback] Token exchange failed:", error);
      return NextResponse.redirect(
        new URL("/auth/login?error=TokenExchangeFailed", baseUrl)
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      console.error("[auth/verify/callback] Failed to get user info");
      return NextResponse.redirect(
        new URL("/auth/login?error=UserInfoFailed", baseUrl)
      );
    }

    const userInfo = await userInfoResponse.json();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
        },
      });
      logger.info("auth.verify.new_user", { userId: user.id });
    }

    // Upsert Google account
    await prisma.googleAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: userInfo.id,
        },
      },
      update: {
        userId: user.id,
        ...(tokens.refresh_token
          ? { refreshTokenEnc: tokens.refresh_token }
          : {}),
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scopes: tokens.scope || "",
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        provider: "google",
        providerAccountId: userInfo.id,
        refreshTokenEnc: tokens.refresh_token || null,
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scopes: tokens.scope || "",
      },
    });

    logger.info("auth.verify.success", {
      userId: user.id,
      hasRefreshToken: !!tokens.refresh_token,
      scopes: tokens.scope, // Log scopes for verification (no sensitive data)
    });

    // Create NextAuth-compatible session token
    const sessionToken = await encode({
      token: {
        uid: String(user.id),
        email: user.email,
        name: user.name,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(stateData.callbackUrl, baseUrl)
    );

    // Set session cookie (same format as NextAuth)
    const cookieName = isDev
      ? "next-auth.session-token"
      : "__Secure-next-auth.session-token";

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: !isDev,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("[auth/verify/callback] Error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=CallbackError", baseUrl)
    );
  }
}
