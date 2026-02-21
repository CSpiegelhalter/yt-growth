import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
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
  const range = (
    ["7d", "28d", "90d"].includes(search.range ?? "") ? search.range : "28d"
  ) as "7d" | "28d" | "90d";

  // Get bootstrap data (user, channels, active channel) - fast DB lookup only
  const bootstrap = await getAppBootstrap({ channelId: search.channelId });
  const channelId = bootstrap.activeChannelId ?? undefined;

  // Build back link
  const backLinkBase =
    search.from === "subscriber-insights"
      ? "/subscriber-insights"
      : "/dashboard";
  const backLink = {
    href: channelId
      ? `${backLinkBase}?channelId=${encodeURIComponent(channelId)}`
      : backLinkBase,
    label:
      search.from === "subscriber-insights"
        ? "Subscriber Insights"
        : "Dashboard",
  };

  // No channel - show error
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

  // Fetch analytics server-side
  try {
    const cookieStore = await cookies();
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

    const analyticsUrl = `${protocol}://${host}/api/me/channels/${channelId}/videos/${videoId}/insights/analytics?range=${range}`;

    const res = await fetch(analyticsUrl, {
      headers: {
        cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorObj = body?.error;
      const unifiedCode = typeof errorObj === "object" ? errorObj?.code : null;
      const detailsCode = body?.details?.code;
      const legacyCode = body?.code;
      const errorCode = detailsCode || legacyCode || unifiedCode;
      const errorMessage =
        typeof errorObj === "object"
          ? errorObj?.message
          : typeof errorObj === "string"
            ? errorObj
            : `Request failed (${res.status})`;

      const isYouTubePermissionError =
        errorCode === "youtube_permissions" ||
        errorCode === "YOUTUBE_PERMISSIONS" ||
        (typeof errorMessage === "string" &&
          errorMessage.toLowerCase().includes("google access"));

      if (isYouTubePermissionError) {
        return (
          <VideoInsightsError
            error={{ kind: "youtube_permissions", message: errorMessage }}
            channelId={channelId}
            backLink={backLink}
          />
        );
      }

      return (
        <VideoInsightsError
          error={{ kind: "generic", message: errorMessage, status: res.status }}
          channelId={channelId}
          backLink={backLink}
        />
      );
    }

    const analytics = await res.json();

    return (
      <VideoInsightsClientV2
        key={videoId}
        videoId={videoId}
        channelId={channelId}
        initialRange={range}
        from={search.from}
        analytics={analytics}
      />
    );
  } catch (err) {
    console.error("Server-side analytics fetch failed:", err);
    return (
      <VideoInsightsError
        error={{
          kind: "generic",
          message: "Failed to load video analytics. Please try again.",
          status: 500,
        }}
        channelId={channelId}
        backLink={backLink}
      />
    );
  }
}
