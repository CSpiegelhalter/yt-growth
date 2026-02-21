/**
 * Google OAuth Adapter
 *
 * Pure I/O implementation of GoogleOAuthPort.
 * Handles HTTP calls to Google's OAuth and user info endpoints.
 * No database access, no business logic.
 */

import type {
  GoogleOAuthPort,
  OAuthTokenSet,
  OAuthRefreshResult,
  OAuthUserInfo,
  AnalyticsAccessResult,
} from "@/lib/ports/GoogleOAuthPort";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";
const ANALYTICS_ENDPOINT = "https://youtubeanalytics.googleapis.com/v2/reports";

const OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

function getClientCredentials() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  };
}

async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<OAuthTokenSet> {
  const { clientId, clientSecret } = getClientCredentials();

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed with status ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

async function refreshToken(
  refreshTokenValue: string,
): Promise<OAuthRefreshResult> {
  const { clientId, clientSecret } = getClientCredentials();

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshTokenValue,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(
      `Token refresh failed with status ${res.status}`,
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

async function getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`User info fetch failed with status ${res.status}`);
  }

  const data = (await res.json()) as {
    sub: string;
    email?: string;
    name?: string;
  };

  return {
    providerAccountId: data.sub,
    email: data.email,
    name: data.name,
  };
}

async function verifyAnalyticsAccess(
  accessToken: string,
  channelId: string,
): Promise<AnalyticsAccessResult> {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = new URL(ANALYTICS_ENDPOINT);
  url.searchParams.set("ids", `channel==${channelId}`);
  url.searchParams.set("startDate", weekAgo!);
  url.searchParams.set("endDate", today!);
  url.searchParams.set("metrics", "views");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return { ok: res.status === 200 };
}

function buildAuthUrl(redirectUri: string, state: string): string {
  const { clientId } = getClientCredentials();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "select_account consent",
    scope: OAUTH_SCOPES.join(" "),
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export const googleOAuthAdapter: GoogleOAuthPort & {
  buildAuthUrl: typeof buildAuthUrl;
} = {
  exchangeCode,
  refreshToken,
  getUserInfo,
  verifyAnalyticsAccess,
  buildAuthUrl,
};
