import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { isChannelScopedPath, isVideoPath } from "../utils";

export type Channel = {
  id: number;
  channel_id: string;
  title: string | null;
  thumbnailUrl: string | null;
};

type SessionUser =
  | {
      email?: string | null;
      name?: string | null;
    }
  | null
  | undefined;

type UseChannelsArgs = {
  sessionUser: SessionUser;
  pathname: string;
  searchParams: URLSearchParams;
  router: AppRouterInstance;
};

type UseChannelsReturn = {
  channels: Channel[];
  activeChannelId: string | null;
  activeChannel: Channel | undefined;
  channelLimit: number;
  setActiveChannelId: (id: string | null) => void;
  refreshChannels: () => void;
  showUpgradePrompt: boolean;
  setShowUpgradePrompt: (b: boolean) => void;
  handleSelectChannel: (id: string) => void;
};

/**
 * Hook to manage channel list fetching, active channel selection, and URL sync.
 *
 * Key optimization: Separates fetching from URL sync to avoid refetching on every navigation.
 * - Effect 1: Fetch channels when sessionUser becomes available
 * - Effect 2: Resolve active channel and sync URL when pathname/searchParams change (no refetch)
 */
export function useChannels({
  sessionUser,
  pathname,
  searchParams,
  router,
}: UseChannelsArgs): UseChannelsReturn {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelLimit, setChannelLimit] = useState<number>(1);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Refs to prevent duplicate operations
  const autoSignOutTriggeredRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const lastSyncedUrlRef = useRef<string>("");

  // Track if we need to refresh channels (e.g., after channel-removed event)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshChannels = useCallback(() => {
    hasFetchedRef.current = false;
    setRefreshTrigger((t) => t + 1);
  }, []);

  // ---------- Effect 1: Fetch channels when authenticated ----------
  useEffect(() => {
    if (!sessionUser) {
      // Reset state when logged out
      setChannels([]);
      setActiveChannelId(null);
      hasFetchedRef.current = false;
      return;
    }

    // Skip if already fetched (unless refresh triggered)
    if (hasFetchedRef.current) return;

    async function fetchChannels() {
      try {
        const data = await apiFetchJson<any>("/api/me/channels", {
          cache: "no-store",
        });
        const channelList: Channel[] = Array.isArray(data)
          ? data
          : data.channels;
        setChannels(channelList);

        if (data.channelLimit !== undefined) {
          setChannelLimit(data.channelLimit);
        }

        hasFetchedRef.current = true;

        // Initial channel selection (only on first fetch)
        resolveInitialChannel(channelList);
      } catch (error) {
        // If session is stale, sign out so the UI doesn't get stuck.
        if (isApiClientError(error) && error.status === 401) {
          if (!autoSignOutTriggeredRef.current) {
            autoSignOutTriggeredRef.current = true;
            await signOut({ callbackUrl: "/" });
          }
          return;
        }
        console.error("Failed to load channels:", error);
      }
    }

    function resolveInitialChannel(channelList: Channel[]) {
      const urlChannelId = searchParams.get("channelId");
      const storedChannelId =
        typeof window !== "undefined"
          ? localStorage.getItem("activeChannelId")
          : null;
      const isNewChannel = searchParams.get("newChannel") === "1";

      let nextActiveChannelId: string | null = null;

      // When a new channel was just added (newChannel=1), always select the newest channel (first in list)
      if (isNewChannel && channelList.length > 0) {
        nextActiveChannelId = channelList[0].channel_id;
      } else if (
        urlChannelId &&
        channelList.some((c) => c.channel_id === urlChannelId)
      ) {
        nextActiveChannelId = urlChannelId;
      } else if (
        storedChannelId &&
        channelList.some((c) => c.channel_id === storedChannelId)
      ) {
        nextActiveChannelId = storedChannelId;
      } else if (channelList.length > 0) {
        nextActiveChannelId = channelList[0].channel_id;
      }

      setActiveChannelId(nextActiveChannelId);

      if (nextActiveChannelId) {
        localStorage.setItem("activeChannelId", nextActiveChannelId);
      } else {
        localStorage.removeItem("activeChannelId");
      }

      // Sync URL if needed (only on initial load)
      if (
        nextActiveChannelId &&
        isChannelScopedPath(pathname) &&
        (urlChannelId !== nextActiveChannelId || isNewChannel)
      ) {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("channelId", nextActiveChannelId);
        nextParams.delete("newChannel");
        const nextUrl = `${pathname}?${nextParams.toString()}`;

        // Mark as synced to prevent Effect 2 from re-syncing
        lastSyncedUrlRef.current = nextUrl;

        router.replace(nextUrl, { scroll: false });
        router.refresh();
      }
    }

    fetchChannels();
  }, [sessionUser, refreshTrigger]); // Note: NOT dependent on pathname/searchParams

  // ---------- Effect 2: URL sync on navigation (no refetch) ----------
  useEffect(() => {
    // Skip if not authenticated or no channels loaded
    if (!sessionUser || channels.length === 0 || !activeChannelId) return;

    const urlChannelId = searchParams.get("channelId");
    const isNewChannel = searchParams.get("newChannel") === "1";

    // Handle newChannel param: select newest and clear param
    if (isNewChannel && channels.length > 0) {
      const newestChannelId = channels[0].channel_id;
      setActiveChannelId(newestChannelId);
      localStorage.setItem("activeChannelId", newestChannelId);

      if (isChannelScopedPath(pathname)) {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("channelId", newestChannelId);
        nextParams.delete("newChannel");
        const nextUrl = `${pathname}?${nextParams.toString()}`;

        if (lastSyncedUrlRef.current !== nextUrl) {
          lastSyncedUrlRef.current = nextUrl;
          router.replace(nextUrl, { scroll: false });
          router.refresh();
        }
      }
      return;
    }

    // Sync URL if on channel-scoped page and channelId differs
    if (isChannelScopedPath(pathname) && urlChannelId !== activeChannelId) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("channelId", activeChannelId);
      const nextUrl = `${pathname}?${nextParams.toString()}`;

      // Prevent duplicate syncs
      if (lastSyncedUrlRef.current !== nextUrl) {
        lastSyncedUrlRef.current = nextUrl;
        router.replace(nextUrl, { scroll: false });
        router.refresh();
      }
    }
  }, [sessionUser, channels, activeChannelId, pathname, searchParams, router]);

  // ---------- Effect 3: Listen for channel-removed events ----------
  useEffect(() => {
    const handleChannelRemoved = (e: CustomEvent<{ channelId: string }>) => {
      const removedChannelId = e.detail.channelId;

      setChannels((prev) => {
        const updated = prev.filter((c) => c.channel_id !== removedChannelId);

        // If the removed channel was active, select another or clear
        if (activeChannelId === removedChannelId) {
          const nextActive = updated.length > 0 ? updated[0].channel_id : null;
          setActiveChannelId(nextActive);
          if (nextActive) {
            localStorage.setItem("activeChannelId", nextActive);
          } else {
            localStorage.removeItem("activeChannelId");
          }
        }

        return updated;
      });
    };

    window.addEventListener(
      "channel-removed",
      handleChannelRemoved as EventListener
    );
    return () => {
      window.removeEventListener(
        "channel-removed",
        handleChannelRemoved as EventListener
      );
    };
  }, [activeChannelId]);

  // ---------- Channel selection handler ----------
  const handleSelectChannel = useCallback(
    (channelId: string) => {
      setActiveChannelId(channelId);
      localStorage.setItem("activeChannelId", channelId);

      // If on a video page, redirect to dashboard (video is tied to old channel).
      if (isVideoPath(pathname)) {
        router.push(`/dashboard?channelId=${channelId}`);
        return;
      }

      // If on a channel-scoped page, update the URL (so server bootstrap + page state update).
      if (isChannelScopedPath(pathname)) {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("channelId", channelId);
        const nextUrl = `${pathname}?${nextParams.toString()}`;
        lastSyncedUrlRef.current = nextUrl;
        router.replace(nextUrl, { scroll: false });
        router.refresh();
      }
    },
    [pathname, searchParams, router]
  );

  // Derived: find active channel from list
  const activeChannel = channels.find((c) => c.channel_id === activeChannelId);

  return {
    channels,
    activeChannelId,
    activeChannel,
    channelLimit,
    setActiveChannelId,
    refreshChannels,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleSelectChannel,
  };
}
