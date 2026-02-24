import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { ComponentProps } from "react";

import { getAppBootstrap } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";

import VideoInsightsClientV2 from "./VideoInsightsClientV2";
import { VideoInsightsError } from "./VideoInsightsError";

export const metadata: Metadata = {
  title: `Video Insights | ${BRAND.name}`,
  description:
    "Deep dive into your video's retention, subscriber conversion, and improvement suggestions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ channelId?: string; range?: string; from?: string }>;
};

type BackLink = { href: string; label: string };

type ParsedError =
  | { kind: "youtube_permissions"; message: string }
  | { kind: "generic"; message: string; status: number };

type FetchResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: ParsedError };

/**
 * Video Insights Page - Server component
 *
 * Server-side data fetching with Suspense loading:
 * - Shows animated loading.tsx while fetching
 * - Analytics fetched server-side (fast, ~1-2s)
 * - AI Summary and deep dives fetched client-side progressively
 */
export default async function VideoPage({ params, searchParams }: Props) {
  const [{ videoId }, search] = await Promise.all([params, searchParams]);
  const range = parseRange(search.range);
  const bootstrap = await getAppBootstrap({ channelId: search.channelId });
  const channelId = bootstrap.activeChannelId ?? undefined;
  const backLink = buildBackLink(search.from, channelId);

  if (!channelId) {
    return (
      <VideoInsightsError
        error={{
          kind: "generic",
          message: "Please select a channel to view video insights.",
          status: 400,
        }}
        channelId={undefined}
        backLink={backLink}
      />
    );
  }

  const result = await fetchAndParseAnalytics(channelId, videoId, range);

  if (!result.ok) {
    return (
      <VideoInsightsError
        error={result.error}
        channelId={channelId}
        backLink={backLink}
      />
    );
  }

  return (
    <VideoInsightsClientV2
      key={videoId}
      videoId={videoId}
      channelId={channelId}
      initialRange={range}
      from={search.from}
      analytics={result.data as ComponentProps<typeof VideoInsightsClientV2>["analytics"]}
    />
  );
}

function buildBackLink(
  from: string | undefined,
  channelId: string | undefined,
): BackLink {
  const base =
    from === "subscriber-insights" ? "/subscriber-insights" : "/videos";
  return {
    href: channelId
      ? `${base}?channelId=${encodeURIComponent(channelId)}`
      : base,
    label: from === "subscriber-insights" ? "Subscriber Insights" : "Videos",
  };
}

function parseRange(raw: string | undefined): "7d" | "28d" | "90d" {
  if (raw === "7d" || raw === "28d" || raw === "90d") {return raw;}
  return "28d";
}

async function fetchAndParseAnalytics(
  channelId: string,
  videoId: string,
  range: string,
): Promise<FetchResult> {
  try {
    const res = await fetchServerAnalytics(channelId, videoId, range);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: parseAnalyticsError(body, res.status) };
    }

    const data = await res.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Server-side analytics fetch failed:", error);
    return {
      ok: false,
      error: {
        kind: "generic",
        message: "Failed to load video analytics. Please try again.",
        status: 500,
      },
    };
  }
}

async function fetchServerAnalytics(
  channelId: string,
  videoId: string,
  range: string,
) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const analyticsUrl = `${protocol}://${host}/api/me/channels/${channelId}/videos/${videoId}/insights/analytics?range=${range}`;

  return fetch(analyticsUrl, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
}

function extractErrorMessage(
  body: Record<string, unknown>,
  status: number,
): string {
  const errorObj = body?.error;
  if (typeof errorObj === "object" && errorObj != null) {
    return ((errorObj as Record<string, string>)?.message) || `Request failed (${status})`;
  }
  if (typeof errorObj === "string") {return errorObj;}
  return `Request failed (${status})`;
}

function extractErrorCode(body: Record<string, unknown>): unknown {
  const errorObj = body?.error;
  const unifiedCode =
    typeof errorObj === "object" && errorObj != null
      ? (errorObj as Record<string, unknown>)?.code
      : null;
  const detailsCode = (body?.details as Record<string, unknown> | undefined)
    ?.code;
  const legacyCode = body?.code;
  return detailsCode || legacyCode || unifiedCode;
}

function isYouTubePermission(code: unknown, message: string): boolean {
  if (code === "youtube_permissions" || code === "YOUTUBE_PERMISSIONS") {
    return true;
  }
  return typeof message === "string" && message.toLowerCase().includes("google access");
}

function parseAnalyticsError(
  body: Record<string, unknown>,
  status: number,
): ParsedError {
  const message = extractErrorMessage(body, status);
  const code = extractErrorCode(body);

  if (isYouTubePermission(code, message)) {
    return { kind: "youtube_permissions", message };
  }
  return { kind: "generic", message, status };
}
