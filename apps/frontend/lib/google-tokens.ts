// lib/google-tokens.ts
import { prisma } from "@/prisma";
import { mockYouTubeApiResponse } from "@/lib/youtube-mock";

type GA = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

type GoogleApiStats = {
  startedAt: string;
  totalCalls: number;
  totalEstimatedUnits: number;
  byHost: Record<string, { calls: number; estimatedUnits: number }>;
  byPath: Record<string, { calls: number; estimatedUnits: number }>;
  lastCalls: Array<{
    at: string;
    url: string;
    status: number | "mock";
    estimatedUnits: number;
  }>;
  quotaExceededSeen: boolean;
};

const googleApiStats: GoogleApiStats = {
  startedAt: new Date().toISOString(),
  totalCalls: 0,
  totalEstimatedUnits: 0,
  byHost: {},
  byPath: {},
  lastCalls: [],
  quotaExceededSeen: false,
};

function estimateYouTubeQuotaUnits(urlStr: string): number {
  try {
    const url = new URL(urlStr);
    if (!url.pathname.includes("/youtube/v3/")) return 0;
    const resource = url.pathname.split("/youtube/v3/")[1] ?? "";
    const r = resource.split("/")[0] ?? "";
    // Current documented values: search.list = 100 units, most reads = 1 unit.
    if (r === "search") return 100;
    return 1;
  } catch {
    return 0;
  }
}

function recordGoogleApiCall(input: {
  url: string;
  status: number | "mock";
  estimatedUnits: number;
}) {
  const at = new Date().toISOString();
  googleApiStats.totalCalls += 1;
  googleApiStats.totalEstimatedUnits += input.estimatedUnits;

  let host = "unknown";
  let path = "unknown";
  try {
    const u = new URL(input.url);
    host = u.host;
    path = u.pathname;
  } catch {
    // ignore
  }

  googleApiStats.byHost[host] ??= { calls: 0, estimatedUnits: 0 };
  googleApiStats.byHost[host]!.calls += 1;
  googleApiStats.byHost[host]!.estimatedUnits += input.estimatedUnits;

  googleApiStats.byPath[path] ??= { calls: 0, estimatedUnits: 0 };
  googleApiStats.byPath[path]!.calls += 1;
  googleApiStats.byPath[path]!.estimatedUnits += input.estimatedUnits;

  googleApiStats.lastCalls.push({
    at,
    url: input.url,
    status: input.status,
    estimatedUnits: input.estimatedUnits,
  });
  if (googleApiStats.lastCalls.length > 50) {
    googleApiStats.lastCalls.shift();
  }

  // Persist to DB so stats work across Next dev workers/processes.
  // Best-effort: ignore if table/migrations not applied yet.
  try {
    const logModel = (prisma as any).googleApiCallLog;
    if (logModel?.create) {
      logModel
        .create({
          data: {
            url: input.url,
            host,
            path,
            status: String(input.status),
            estimatedUnits: input.estimatedUnits,
          },
        })
        .catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function getGoogleApiUsageStats(): GoogleApiStats {
  return googleApiStats;
}

export function resetGoogleApiUsageStats() {
  googleApiStats.startedAt = new Date().toISOString();
  googleApiStats.totalCalls = 0;
  googleApiStats.totalEstimatedUnits = 0;
  googleApiStats.byHost = {};
  googleApiStats.byPath = {};
  googleApiStats.lastCalls = [];
  googleApiStats.quotaExceededSeen = false;
}

function isYouTubeOrAnalyticsUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.host.includes("youtubeanalytics.googleapis.com")) return true;
    if (
      u.host.includes("googleapis.com") &&
      u.pathname.includes("/youtube/v3/")
    )
      return true;
    return false;
  } catch {
    return false;
  }
}

function shouldMockYouTubeRequests(): boolean {
  // YT_MOCK_MODE: forces returning raw YouTube-shaped JSON without network calls.
  // YT_AUTO_MOCK_ON_QUOTA: after we see quotaExceeded once, we'll auto-mock further YouTube calls.
  if (process.env.YT_MOCK_MODE === "1") {
    console.log("[YouTube] MOCK MODE ACTIVE (YT_MOCK_MODE=1)");
    return true;
  }
  if (
    process.env.YT_AUTO_MOCK_ON_QUOTA === "1" &&
    googleApiStats.quotaExceededSeen
  ) {
    console.log("[YouTube] MOCK MODE ACTIVE (quota exceeded previously)");
    return true;
  }
  // Log when we're using real API
  return false;
}

// Log env vars on module load
console.log("[YouTube] Config:", {
  YT_MOCK_MODE: process.env.YT_MOCK_MODE ?? "not set",
  YT_AUTO_MOCK_ON_QUOTA: process.env.YT_AUTO_MOCK_ON_QUOTA ?? "not set",
  DEMO_MODE: process.env.DEMO_MODE ?? "not set",
});

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
  // Mock YouTube APIs at the transport layer so the rest of the app runs unmodified.
  if (isYouTubeOrAnalyticsUrl(url) && shouldMockYouTubeRequests()) {
    const units = estimateYouTubeQuotaUnits(url);
    recordGoogleApiCall({ url, status: "mock", estimatedUnits: units });
    return mockYouTubeApiResponse(url) as T;
  }

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
    const units = estimateYouTubeQuotaUnits(url);
    recordGoogleApiCall({ url, status: r.status, estimatedUnits: units });

    // Check for quota exceeded
    if (r.status === 403 && body.includes('"reason": "quotaExceeded"')) {
      googleApiStats.quotaExceededSeen = true;
      if (
        process.env.YT_AUTO_MOCK_ON_QUOTA === "1" &&
        isYouTubeOrAnalyticsUrl(url)
      ) {
        recordGoogleApiCall({ url, status: "mock", estimatedUnits: units });
        return mockYouTubeApiResponse(url) as T;
      }
    }

    // Check for scope/permission errors - create a cleaner error
    const isScopeError =
      body.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
      body.includes("insufficientPermissions") ||
      body.includes("Insufficient Permission");

    const isAnalyticsPermError =
      r.status === 401 &&
      body.includes("Insufficient permission to access this report");

    if (isScopeError || isAnalyticsPermError) {
      const err = new Error(
        `SCOPE_ERROR: User denied required permissions for this feature`
      );
      (err as any).isScopeError = true;
      (err as any).status = r.status;
      throw err;
    }

    throw new Error(`google_api_error_${r.status}: ${body}`);
  }

  const units = estimateYouTubeQuotaUnits(url);
  recordGoogleApiCall({ url, status: r.status, estimatedUnits: units });
  return r.json() as Promise<T>;
}
