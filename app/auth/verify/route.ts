import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * GET /auth/verify
 *
 * Initiates Google OAuth with prompt=consent for verification recordings.
 * Uses a simple state token stored in a cookie for CSRF protection.
 * The callback is handled by a custom handler that validates this state.
 */

const isDev = process.env.NODE_ENV === "development";

function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const cookieStore = await cookies();

  // Generate state for CSRF protection
  const state = generateState();

  // Store state and callback URL in cookies
  const stateData = JSON.stringify({ state, callbackUrl });
  cookieStore.set("oauth_verify_state", stateData, {
    httpOnly: true,
    secure: !isDev,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // ten minutes
  });

  // Build Google OAuth URL with YouTube scopes for verification
  // Note: We use minimal base scopes to try to get all permissions on one consent screen
  // Google's granular consent may still split them, but this gives the best chance
  const scopes = [
    "openid",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  googleAuthUrl.searchParams.set(
    "redirect_uri",
    `${baseUrl}/auth/verify/callback`
  );
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", scopes);
  googleAuthUrl.searchParams.set("state", state);

  // Force consent screen with account selection
  googleAuthUrl.searchParams.set("prompt", "select_account consent");
  googleAuthUrl.searchParams.set("access_type", "offline");

  console.log("[auth/verify] Redirecting to Google with prompt=consent");

  return NextResponse.redirect(googleAuthUrl.toString());
}
