/**
 * Server-side fetch helpers for competitor video detail page.
 * These run only on the server and should not be imported in client components.
 */
import { headers } from "next/headers";
import type { CompetitorVideoAnalysis, CompetitorVideo } from "@/types/api";

/**
 * Get the base URL for internal API calls.
 * Prefers env vars, falls back to request headers.
 */
export async function getBaseUrl(): Promise<string> {
  // Check environment variables first
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fall back to request headers
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  // Last resort fallback for local development
  return "http://localhost:3000";
}

/**
 * Parse error from API response.
 * Supports { error: { message } }, { error: "string" }, and fallback.
 */
export function parseErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Failed to load analysis";
  }

  const obj = data as Record<string, unknown>;

  // Handle { error: { message: "..." } }
  if (typeof obj.error === "object" && obj.error !== null) {
    const errorObj = obj.error as Record<string, unknown>;
    if (typeof errorObj.message === "string") {
      return errorObj.message;
    }
  }

  // Handle { error: "string" }
  if (typeof obj.error === "string") {
    return obj.error;
  }

  // Handle { message: "..." }
  if (typeof obj.message === "string") {
    return obj.message;
  }

  return "Failed to load analysis";
}

export type FetchAnalysisResult =
  | { ok: true; data: CompetitorVideoAnalysis }
  | { ok: false; error: string };

/**
 * Fetch competitor video analysis from the API route.
 * This is called server-side to eliminate client-side critical-path fetch.
 */
export async function fetchCompetitorVideoAnalysis(
  videoId: string,
  channelId: string
): Promise<FetchAnalysisResult> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/api/competitors/video/${encodeURIComponent(
    videoId
  )}?channelId=${encodeURIComponent(channelId)}&includeMoreFromChannel=0`;

  try {
    // Forward cookies for authentication
    const headersList = await headers();
    const cookie = headersList.get("cookie") ?? "";

    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        cookie,
      },
      // force-dynamic route means no caching needed
    });

    if (!res.ok) {
      let errorData: unknown;
      try {
        errorData = await res.json();
      } catch {
        errorData = null;
      }
      return { ok: false, error: parseErrorMessage(errorData) };
    }

    const data = (await res.json()) as CompetitorVideoAnalysis;
    return { ok: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load analysis";
    return { ok: false, error: message };
  }
}

export type FetchMoreResult =
  | { ok: true; data: CompetitorVideo[] }
  | { ok: false; error: string };

/**
 * Fetch "more from this channel" videos.
 * Non-critical - failures should not break the page.
 */
export async function fetchMoreFromChannel(
  videoId: string,
  channelId: string
): Promise<FetchMoreResult> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/api/competitors/video/${encodeURIComponent(
    videoId
  )}/more?channelId=${encodeURIComponent(channelId)}`;

  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") ?? "";

    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        cookie,
      },
    });

    if (!res.ok) {
      return { ok: false, error: "Failed to fetch more videos" };
    }

    const data = (await res.json()) as CompetitorVideo[];
    if (!Array.isArray(data)) {
      return { ok: false, error: "Invalid response" };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, error: "Failed to fetch more videos" };
  }
}
