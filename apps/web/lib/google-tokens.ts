// lib/google-tokens.ts
import { prisma } from "@/prisma";

/**
 * Custom error for when Google token refresh fails (revoked access, invalid token, etc.)
 * This error should trigger a "Reconnect Google" prompt in the frontend.
 */
export class GoogleTokenRefreshError extends Error {
  code = "youtube_permissions" as const; // Reuse existing error code for reconnect prompt
  constructor(
    message: string = "Google access has been revoked. Please reconnect your Google account."
  ) {
    super(message);
    this.name = "GoogleTokenRefreshError";
  }
}

type GA = {
  id: number;
  refreshTokenEnc: string | null;
  accessTokenEnc?: string | null; // Cached access token from DB
  tokenExpiresAt: Date | null;
};

// Mutex to prevent concurrent refreshes for the same account (still useful within a worker)
const refreshInProgress = new Map<number, Promise<string>>();

type GoogleApiStats = {
  startedAt: string;
  totalCalls: number;
  totalEstimatedUnits: number;
  byHost: Record<string, { calls: number; estimatedUnits: number }>;
  byPath: Record<string, { calls: number; estimatedUnits: number }>;
  lastCalls: Array<{
    at: string;
    url: string;
    status: number;
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
  status: number;
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

async function getAccessToken(
  ga: GA,
  forceRefresh = false
): Promise<string> {
  const now = Date.now();
  const exp = ga.tokenExpiresAt?.getTime() ?? 0;

  // If not forcing refresh, check if we have a valid cached access token (not expiring within 60s)
  if (!forceRefresh && ga.accessTokenEnc && exp - now > 60_000) {
    return ga.accessTokenEnc;
  }

  // If a refresh is already in progress for this account (within this worker), wait for it
  // This prevents concurrent requests from triggering multiple token refreshes
  const inProgress = refreshInProgress.get(ga.id);
  if (inProgress) {
    return inProgress;
  }

  // Start a new refresh and track it to prevent concurrent refreshes within this worker
  const refreshPromise = refreshAccessToken(ga);
  refreshInProgress.set(ga.id, refreshPromise);

  try {
    return await refreshPromise;
  } finally {
    refreshInProgress.delete(ga.id);
  }
}

async function refreshAccessToken(ga: GA): Promise<string> {
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
    console.error(
      `[GoogleTokens] Token refresh failed with status ${res.status}`
    );
    throw new GoogleTokenRefreshError(
      "Your Google access has been revoked or expired. Please reconnect your Google account."
    );
  }

  const tok = (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
  };

  const expiresAt = Date.now() + tok.expires_in * 1000;

  // Store the access token in the database (so it works across Next.js workers)
  await prisma.googleAccount.update({
    where: { id: ga.id },
    data: {
      accessTokenEnc: tok.access_token,
      tokenExpiresAt: new Date(expiresAt),
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
    // Token rejected - try refresh once using mutex to prevent concurrent refreshes
    await r.text(); // consume response body before retry
    accessToken = await getAccessToken(ga, true);
    r = await fetch(url, {
      ...(init ?? {}),
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (r.status === 401) {
      // Still failing after refresh - reconstruct response for error handling below
      const retryErrorBody = await r.text();
      r = new Response(retryErrorBody, {
        status: 401,
        statusText: "Unauthorized",
      });
    }
  }

  if (!r.ok) {
    const body = await r.text();
    const units = estimateYouTubeQuotaUnits(url);
    recordGoogleApiCall({ url, status: r.status, estimatedUnits: units });

    // Check for quota exceeded
    if (r.status === 403 && body.includes('"reason": "quotaExceeded"')) {
      googleApiStats.quotaExceededSeen = true;
    }

    // Check for scope/permission errors - create a cleaner error
    const isScopeError =
      body.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
      body.includes("insufficientPermissions") ||
      body.includes("Insufficient Permission");

    // Analytics permission errors for specific metrics (e.g., monetization metrics without monetary scope)
    // This should NOT trigger reconnect - instead allow fallback to other metrics
    const isAnalyticsMetricPermError =
      (r.status === 401 || r.status === 403) &&
      body.includes("Insufficient permission to access this report");

    if (isScopeError) {
      // Scope errors should trigger reconnect prompt
      throw new GoogleTokenRefreshError(
        "Google permissions have been revoked. Please reconnect your Google account."
      );
    }

    // For analytics metric permission errors, throw a regular error with a flag
    // so the caller can catch it and try with fewer metrics
    if (isAnalyticsMetricPermError) {
      const error = new Error("Insufficient permission to access this report");
      (error as any).isAnalyticsPermError = true;
      throw error;
    }

    throw new Error(`google_api_error_${r.status}: ${body}`);
  }

  const units = estimateYouTubeQuotaUnits(url);
  recordGoogleApiCall({ url, status: r.status, estimatedUnits: units });
  return r.json() as Promise<T>;
}
