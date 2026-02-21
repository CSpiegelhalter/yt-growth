"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { AppHeader } from "./AppHeader";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { safeGetItem, safeSetItem } from "@/lib/client/safeLocalStorage";
import { useSyncActiveChannel } from "@/lib/use-sync-active-channel";
import type { SerializableNavItem } from "@/lib/server/nav-config.server";
import s from "./AppShell.module.css";

type Channel = {
  channel_id: string;
  id: number;
  title: string | null;
  thumbnailUrl: string | null;
};

type Plan = "FREE" | "PRO" | "ENTERPRISE";

type AppShellServerProps = {
  children: React.ReactNode;
  channels: Channel[];
  activeChannelId: string | null;
  /** User email - null for unauthenticated users */
  userEmail: string | null;
  /** User name - null for unauthenticated users */
  userName: string | null;
  plan: Plan;
  channelLimit: number;
  isAdmin?: boolean;
  /** Filtered primary nav items (from server) */
  primaryNavItems: SerializableNavItem[];
  /** Filtered secondary nav items (from server) */
  secondaryNavItems: SerializableNavItem[];
};

const SIDEBAR_COLLAPSE_KEY = "sidebar-collapsed";

/**
 * App shell component that receives initial data from server.
 * 
 * Key differences from AppShellWrapper:
 * - No auth checking (done server-side in layout)
 * - Receives initial channel/user data as props
 * - Still manages client-side state (sidebar collapse, channel switching)
 * - Can refresh channel list on certain events (channel added/removed)
 * 
 * This eliminates layout shift by having stable shell from first paint.
 */
export function AppShellServer({
  children,
  channels: initialChannels,
  activeChannelId: initialActiveChannelId,
  userEmail,
  userName,
  plan,
  channelLimit,
  isAdmin = false,
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
    if (didInitialSync.current) return;
    didInitialSync.current = true;
    
    if (activeChannelId) {
      // Sync URL if on a channel-scoped page and URL doesn't match
      if (isChannelScopedPath(pathname) && urlChannelId !== activeChannelId) {
        const next = new URLSearchParams(searchParams.toString());
        next.set("channelId", activeChannelId);
        next.delete("newChannel");
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }
    }
  }, [activeChannelId, pathname, searchParams, router, urlChannelId]);

  // Listen for channel-removed events
  useEffect(() => {
    const handleChannelRemoved = (e: CustomEvent<{ channelId: string }>) => {
      setChannels((prev) =>
        prev.filter((c) => c.channel_id !== e.detail.channelId),
      );
      // Hook's synchronous reconciliation handles activeChannelId fallback
    };

    window.addEventListener("channel-removed", handleChannelRemoved as EventListener);
    return () => {
      window.removeEventListener("channel-removed", handleChannelRemoved as EventListener);
    };
  }, []);
  
  // Listen for newChannel query param (after OAuth redirect)
  useEffect(() => {
    const isNewChannel = searchParams.get("newChannel") === "1";
    if (!isNewChannel) return;
    
    async function refreshChannels() {
      try {
        const data = await apiFetchJson<any>("/api/me/channels", {
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
    
    refreshChannels();
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

    if (isVideoPath(pathname)) {
      router.push(`/dashboard?channelId=${channelId}`);
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
      />

      {/* Main Content Area */}
      <div className={s.main}>
        {/* App Header */}
        <AppHeader
          channels={channels}
          activeChannelId={activeChannelId}
          userEmail={userEmail}
          userName={userName}
          plan={plan}
          channelLimit={channelLimit}
          isAdmin={isAdmin}
          onChannelChange={handleChannelChange}
          mobileNavSlot={
            <MobileNav
              activeChannelId={activeChannelId}
              primaryNavItems={primaryNavItems}
              secondaryNavItems={secondaryNavItems}
            />
          }
        />

        {/* Page Content */}
        <main className={s.content} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function isChannelScopedPath(pathname: string): boolean {
  if (pathname === "/dashboard") return true;
  if (pathname === "/ideas") return true;
  if (pathname === "/goals") return true;
  if (pathname === "/subscriber-insights") return true;
  if (pathname === "/competitors") return true;
  if (pathname.startsWith("/video/")) return true;
  if (pathname.startsWith("/competitors/video/")) return true;
  return false;
}

function isVideoPath(pathname: string): boolean {
  return pathname.startsWith("/video/") || pathname.startsWith("/competitors/video/");
}
