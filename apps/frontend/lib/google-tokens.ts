// lib/google-tokens.ts
import { prisma } from "@/prisma";

type GA = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

export async function getAccessToken(ga: GA): Promise<string> {
  const now = Date.now();
  const exp = ga.tokenExpiresAt?.getTime() ?? 0;

  // Refresh if expiring within 60s
  if (exp - now <= 60_000) {
    return await refreshAccessToken(ga);
  }

  // If you also store the current access token, return it here.
  // If you don't store it (totally fine), just refresh every time:
  return await refreshAccessToken(ga);
}

export async function refreshAccessToken(ga: GA): Promise<string> {
  if (!ga.refreshTokenEnc) throw new Error("No refresh token saved");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: ga.refreshTokenEnc,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    // 400 invalid_grant -> refresh token revoked or user removed access
    throw new Error(`refresh_failed_${res.status}`);
  }

  const tok = (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
  };
  await prisma.googleAccount.update({
    where: { id: ga.id },
    data: {
      tokenExpiresAt: new Date(Date.now() + tok.expires_in * 1000),
      scopes: tok.scope ?? undefined,
    },
  });

  return tok.access_token;
}

// Generic wrapper that auto-refreshes on 401 once.
export async function googleFetchWithAutoRefresh<T>(
  ga: GA & { id: number },
  url: string,
  init?: RequestInit
): Promise<T> {
  let accessToken = await getAccessToken(ga);

  let r = await fetch(url, {
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (r.status === 401) {
    // try refresh once
    accessToken = await refreshAccessToken(ga);
    r = await fetch(url, {
      ...(init ?? {}),
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  if (!r.ok) {
    const body = await r.text();
    throw new Error(`google_api_error_${r.status}: ${body}`);
  }
  return r.json() as Promise<T>;
}
