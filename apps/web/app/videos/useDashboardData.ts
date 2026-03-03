"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import {
  getJSONWithExpiry,
  safeSessionGetItem,
  safeSessionRemoveItem,
  setJSONWithExpiry,
  STORAGE_KEYS,
} from "@/lib/client/safeLocalStorage";
import type { Channel } from "@/types/api";

import {
  buildPublishedAfter,
  DASHBOARD_VIDEOS_CACHE_VERSION,
  DASHBOARD_VIDEOS_TTL_MS,
} from "./dashboard-helpers";
import type { Video, VideosApiResponse } from "./dashboard-types";

// ── Small hooks ──────────────────────────────────────────────

export function useCheckoutStatus(
  status: string | undefined,
  setSuccess: (msg: string | null) => void,
  setErr: (msg: string | null) => void,
): void {
  useEffect(() => {
    if (status === "success") {
      setSuccess("Subscription activated! You now have full access.");
      window.history.replaceState({}, "", "/videos");
    } else if (status === "canceled") {
      setErr("Checkout was canceled. You can try again anytime.");
      window.history.replaceState({}, "", "/videos");
    }
  }, [status, setSuccess, setErr]);
}

export function useChannelRemovedListener(
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
): void {
  useEffect(() => {
    const handler = (e: CustomEvent<{ channelId: string }>) => {
      setChannels((prev) =>
        prev.filter((c) => c.channel_id !== e.detail.channelId),
      );
    };
    window.addEventListener("channel-removed", handler as EventListener);
    return () => {
      window.removeEventListener("channel-removed", handler as EventListener);
    };
  }, [setChannels]);
}

export function useVisibilityRefresh(
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
): void {
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") {return;}
      try {
        const res = await fetch("/api/me/channels", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setChannels(Array.isArray(data) ? data : data.channels);
        }
      } catch (error) {
        console.error("Failed to refresh channels:", error);
      }
    };
    const handler = () => {
      void handleVisibilityChange();
    };
    document.addEventListener("visibilitychange", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
    };
  }, [setChannels]);
}

export function useOAuthReturnRedirect(
  searchParams: ReadonlyURLSearchParams,
): void {
  useEffect(() => {
    if (searchParams.get("reconnected") !== "1") {return;}
    const returnTo = safeSessionGetItem("oauthReturnTo");
    if (returnTo) {
      safeSessionRemoveItem("oauthReturnTo");
      window.location.href = returnTo;
    }
  }, [searchParams]);
}

// ── Video loader ─────────────────────────────────────────────

type VideoLoaderReturn = {
  videos: Video[];
  videosLoading: boolean;
  loadVideos: (channelId: string) => Promise<void>;
};

export function useVideoLoader(): VideoLoaderReturn {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);

  const loadVideos = useCallback(async function loadVideos(channelId: string) {
    setVideosLoading(true);
    try {
      const publishedAfter = buildPublishedAfter();
      const cacheKey = `${STORAGE_KEYS.DASHBOARD_VIDEOS}:${DASHBOARD_VIDEOS_CACHE_VERSION}:${channelId}:30d`;
      const cached = getJSONWithExpiry<VideosApiResponse>(cacheKey);
      if (cached?.videos) {
        setVideos(cached.videos);
        return;
      }
      const data = await apiFetchJson<VideosApiResponse>(
        `/api/me/channels/${channelId}/videos?publishedAfter=${encodeURIComponent(publishedAfter)}`,
        { cache: "no-store" },
      );
      setVideos(data.videos || []);
      setJSONWithExpiry(cacheKey, data, DASHBOARD_VIDEOS_TTL_MS);
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setVideosLoading(false);
    }
  }, []);

  return { videos, videosLoading, loadVideos };
}
