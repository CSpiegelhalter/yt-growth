"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "./AppShell";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";

type Channel = {
  id: number;
  channel_id: string;
  title: string | null;
  thumbnailUrl: string | null;
};

type Plan = "FREE" | "PRO" | "ENTERPRISE";

type AppShellWrapperProps = {
  children: React.ReactNode;
};

/**
 * Wrapper component that handles authentication state and data fetching
 * for the AppShell. This should be used in the layout for authenticated pages.
 */
export function AppShellWrapper({ children }: AppShellWrapperProps) {
  const { data: session, status } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelLimit, setChannelLimit] = useState<number>(1);
  const [plan, setPlan] = useState<Plan>("FREE");
  const [mounted, setMounted] = useState(false);
  const autoSignOutTriggeredRef = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mark as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load channels and active channel
  useEffect(() => {
    if (!session?.user) return;

    async function loadChannels() {
      try {
        const data = await apiFetchJson<any>("/api/me/channels", {
          cache: "no-store",
        });
        const channelList = Array.isArray(data) ? data : data.channels;
        setChannels(channelList);

        if (data.channelLimit !== undefined) {
          setChannelLimit(data.channelLimit);
        }
        if (data.plan) {
          setPlan(data.plan);
        }

        const urlChannelId = searchParams.get("channelId");
        const storedChannelId = localStorage.getItem("activeChannelId");
        const isNewChannel = searchParams.get("newChannel") === "1";
        let nextActiveChannelId: string | null = null;

        if (isNewChannel && channelList.length > 0) {
          nextActiveChannelId = channelList[0].channel_id;
        } else if (
          urlChannelId &&
          channelList.some((c: Channel) => c.channel_id === urlChannelId)
        ) {
          nextActiveChannelId = urlChannelId;
        } else if (
          storedChannelId &&
          channelList.some((c: Channel) => c.channel_id === storedChannelId)
        ) {
          nextActiveChannelId = storedChannelId;
        } else if (channelList.length > 0) {
          nextActiveChannelId = channelList[0].channel_id;
        } else {
          nextActiveChannelId = null;
        }

        setActiveChannelId(nextActiveChannelId);
        if (nextActiveChannelId) {
          localStorage.setItem("activeChannelId", nextActiveChannelId);
        } else {
          localStorage.removeItem("activeChannelId");
        }

        // Sync URL if needed
        if (
          nextActiveChannelId &&
          isChannelScopedPath(pathname) &&
          (urlChannelId !== nextActiveChannelId || isNewChannel)
        ) {
          const next = new URLSearchParams(searchParams.toString());
          next.set("channelId", nextActiveChannelId);
          next.delete("newChannel");
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
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

    loadChannels();
  }, [session?.user, searchParams, pathname, router]);

  // Listen for channel-removed events
  useEffect(() => {
    const handleChannelRemoved = (e: CustomEvent<{ channelId: string }>) => {
      const removedChannelId = e.detail.channelId;

      setChannels((prev) => {
        const updated = prev.filter((c) => c.channel_id !== removedChannelId);

        if (activeChannelId === removedChannelId) {
          if (updated.length > 0) {
            setActiveChannelId(updated[0].channel_id);
            localStorage.setItem("activeChannelId", updated[0].channel_id);
          } else {
            setActiveChannelId(null);
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

  const isAdmin = useMemo(() => {
    const email = String(session?.user?.email ?? "").toLowerCase();
    const allow = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allow.length === 0) return false;
    return allow.includes(email);
  }, [session?.user?.email]);

  const handleChannelChange = (channelId: string) => {
    setActiveChannelId(channelId);
    localStorage.setItem("activeChannelId", channelId);

    // If on a video page, redirect to dashboard
    if (isVideoPath(pathname)) {
      router.push(`/dashboard?channelId=${channelId}`);
      return;
    }

    // If on a channel-scoped page, update the URL
    if (isChannelScopedPath(pathname)) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("channelId", channelId);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      router.refresh();
    }
  };

  // Don't render shell until mounted and authenticated
  if (!mounted || status === "loading") {
    return <>{children}</>;
  }

  // If not authenticated, just render children (will redirect)
  if (status === "unauthenticated") {
    return <>{children}</>;
  }

  return (
    <AppShell
      channels={channels}
      activeChannelId={activeChannelId}
      userEmail={session?.user?.email ?? ""}
      userName={session?.user?.name ?? null}
      plan={plan}
      channelLimit={channelLimit}
      isAdmin={isAdmin}
      onChannelChange={handleChannelChange}
    >
      {children}
    </AppShell>
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
