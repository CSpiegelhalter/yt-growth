"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { safeGetItem, safeSetItem } from "@/lib/client/safeLocalStorage";
import type { SerializableNavItem } from "@/lib/server/nav-config.server";
import { useSyncActiveChannel } from "@/lib/use-sync-active-channel";

import s from "./AppShell.module.css";
import { AppSidebar } from "./AppSidebar";

type Channel = {
  channel_id: string;
  id: number;
  title: string | null;
  thumbnailUrl: string | null;
};

type AppShellServerProps = {
  children: React.ReactNode;
  channels: Channel[];
  activeChannelId: string | null;
  channelLimit: number;
  /** Filtered primary nav items (from server) */
  primaryNavItems: SerializableNavItem[];
  /** Filtered secondary nav items (from server) */
  secondaryNavItems: SerializableNavItem[];
};

const SIDEBAR_COLLAPSE_KEY = "sidebar-collapsed";

/**
 * App shell component that receives initial data from server.
 *
 * Renders sidebar + content area (no top header).
 * Manages client-side state: sidebar collapse, channel switching, URL sync.
 */
export function AppShellServer({
  children,
  channels: initialChannels,
  activeChannelId: initialActiveChannelId,
  channelLimit,
  primaryNavItems,
  secondaryNavItems,
}: AppShellServerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlChannelId = searchParams.get("channelId");

  // Channels state (can be refreshed client-side)
  const [channels, setChannels] = useState(initialChannels);

  // Centralized active channel management
  const { activeChannelId, setActiveChannelId } = useSyncActiveChannel({
    channels,
    initialActiveChannelId,
    urlChannelId,
  });

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Track if we've done initial URL sync
  const didInitialSync = useRef(false);

  // Load sidebar collapse state from localStorage
  useEffect(() => {
    const stored = safeGetItem(SIDEBAR_COLLAPSE_KEY);
    if (stored !== null) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  // Sync active channel to URL on mount
  useEffect(() => {
    if (didInitialSync.current) {return;}
    didInitialSync.current = true;

    if (activeChannelId &&
      isChannelScopedPath(pathname) && urlChannelId !== activeChannelId) {
        const next = new URLSearchParams(searchParams.toString());
        next.set("channelId", activeChannelId);
        next.delete("newChannel");
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }
  }, [activeChannelId, pathname, searchParams, router, urlChannelId]);

  // Listen for channel-removed events
  useEffect(() => {
    const handleChannelRemoved = (e: CustomEvent<{ channelId: string }>) => {
      setChannels((prev) =>
        prev.filter((c) => c.channel_id !== e.detail.channelId),
      );
    };

    window.addEventListener("channel-removed", handleChannelRemoved as EventListener);
    return () => {
      window.removeEventListener("channel-removed", handleChannelRemoved as EventListener);
    };
  }, []);

  // Listen for newChannel query param (after OAuth redirect)
  useEffect(() => {
    const isNewChannel = searchParams.get("newChannel") === "1";
    if (!isNewChannel) {return;}

    async function refreshChannels() {
      try {
        const data = await apiFetchJson<Channel[] | { channels: Channel[] }>("/api/me/channels", {
          cache: "no-store",
        });
        const channelList = Array.isArray(data) ? data : data.channels;
        setChannels(channelList);

        if (channelList.length > 0) {
          const newChannelId = channelList[0].channel_id;
          setActiveChannelId(newChannelId);

          const next = new URLSearchParams(searchParams.toString());
          next.delete("newChannel");
          if (isChannelScopedPath(pathname)) {
            next.set("channelId", newChannelId);
          }
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        }
      } catch (error) {
        if (isApiClientError(error) && error.status === 401) {
          await signOut({ callbackUrl: "/" });
        }
        console.error("Failed to refresh channels:", error);
      }
    }

    void refreshChannels();
  }, [searchParams, pathname, router, setActiveChannelId]);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      safeSetItem(SIDEBAR_COLLAPSE_KEY, String(next));
      return next;
    });
  }, []);

  const handleChannelChange = useCallback((channelId: string) => {
    setActiveChannelId(channelId);

    if (pathname.startsWith("/video/")) {
      router.push(`/videos?channelId=${channelId}`);
      return;
    }

    if (isChannelScopedPath(pathname)) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("channelId", channelId);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      router.refresh();
    }
  }, [pathname, searchParams, router, setActiveChannelId]);

  return (
    <div className={s.shell}>
      {/* Desktop Sidebar */}
      <AppSidebar
        activeChannelId={activeChannelId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        primaryNavItems={primaryNavItems}
        secondaryNavItems={secondaryNavItems}
        channels={channels}
        channelLimit={channelLimit}
        onChannelChange={handleChannelChange}
      />

      {/* Main Content Area */}
      <div className={s.main}>
        <main className={s.content} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function isChannelScopedPath(pathname: string): boolean {
  if (pathname === "/videos") {return true;}
  if (pathname === "/subscriber-insights") {return true;}
  if (pathname.startsWith("/video/")) {return true;}
  return false;
}
