import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import {
  useSyncActiveChannel,
  resolveActiveChannelId,
} from "@/lib/use-sync-active-channel";
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
 * Active-channel state and persistence are delegated to useSyncActiveChannel.
 * This hook handles fetching, URL sync, and channel-removed events.
 */
export function useChannels({
  sessionUser,
  pathname,
  searchParams,
  router,
}: UseChannelsArgs): UseChannelsReturn {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelLimit, setChannelLimit] = useState<number>(1);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const autoSignOutTriggeredRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const lastSyncedUrlRef = useRef<string>("");

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshChannels = useCallback(() => {
    hasFetchedRef.current = false;
    setRefreshTrigger((t) => t + 1);
  }, []);

  const urlChannelId = searchParams.get("channelId");

  // Centralized active channel management
  const { activeChannelId, setActiveChannelId } = useSyncActiveChannel({
    channels,
    urlChannelId,
  });

  // ---------- Effect 1: Fetch channels when authenticated ----------
  useEffect(() => {
    if (!sessionUser) {
      setChannels([]);
      hasFetchedRef.current = false;
      return;
    }

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

        // Handle newChannel override
        const isNewChannel = searchParams.get("newChannel") === "1";
        let nextActiveId: string | null = null;

        if (isNewChannel && channelList.length > 0) {
          nextActiveId = channelList[0].channel_id;
          setActiveChannelId(nextActiveId);
        } else {
          nextActiveId = resolveActiveChannelId(channelList, urlChannelId);
        }

        // Sync URL if needed (only on initial load)
        if (
          nextActiveId &&
          isChannelScopedPath(pathname) &&
          (urlChannelId !== nextActiveId || isNewChannel)
        ) {
          const nextParams = new URLSearchParams(searchParams.toString());
          nextParams.set("channelId", nextActiveId);
          nextParams.delete("newChannel");
          const nextUrl = `${pathname}?${nextParams.toString()}`;

          lastSyncedUrlRef.current = nextUrl;
          router.replace(nextUrl, { scroll: false });
          router.refresh();
        }
      } catch (error) {
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

    fetchChannels();
  }, [sessionUser, refreshTrigger]);

  // ---------- Effect 2: URL sync on navigation (no refetch) ----------
  useEffect(() => {
    if (!sessionUser || channels.length === 0 || !activeChannelId) return;

    const isNewChannel = searchParams.get("newChannel") === "1";

    if (isNewChannel && channels.length > 0) {
      const newestChannelId = channels[0].channel_id;
      setActiveChannelId(newestChannelId);

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

    if (isChannelScopedPath(pathname) && urlChannelId !== activeChannelId) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("channelId", activeChannelId);
      const nextUrl = `${pathname}?${nextParams.toString()}`;

      if (lastSyncedUrlRef.current !== nextUrl) {
        lastSyncedUrlRef.current = nextUrl;
        router.replace(nextUrl, { scroll: false });
        router.refresh();
      }
    }
  }, [sessionUser, channels, activeChannelId, pathname, searchParams, router, setActiveChannelId, urlChannelId]);

  // ---------- Effect 3: Listen for channel-removed events ----------
  useEffect(() => {
    const handleChannelRemoved = (e: CustomEvent<{ channelId: string }>) => {
      setChannels((prev) =>
        prev.filter((c) => c.channel_id !== e.detail.channelId),
      );
      // Hook's synchronous reconciliation handles activeChannelId fallback
    };

    window.addEventListener(
      "channel-removed",
      handleChannelRemoved as EventListener,
    );
    return () => {
      window.removeEventListener(
        "channel-removed",
        handleChannelRemoved as EventListener,
      );
    };
  }, []);

  // ---------- Channel selection handler ----------
  const handleSelectChannel = useCallback(
    (channelId: string) => {
      setActiveChannelId(channelId);

      if (isVideoPath(pathname)) {
        router.push(`/dashboard?channelId=${channelId}`);
        return;
      }

      if (isChannelScopedPath(pathname)) {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("channelId", channelId);
        const nextUrl = `${pathname}?${nextParams.toString()}`;
        lastSyncedUrlRef.current = nextUrl;
        router.replace(nextUrl, { scroll: false });
        router.refresh();
      }
    },
    [pathname, searchParams, router, setActiveChannelId],
  );

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
