"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import s from "./style.module.css";
import { Channel, IdeaBoardData } from "@/types/api";
import IdeaBoard from "@/components/dashboard/IdeaBoard";

/**
 * IdeasClient - Interactive client component for the Idea Engine
 * Reads active channel from URL query or localStorage (set by header selector)
 */
export default function IdeasClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [ideaBoard, setIdeaBoard] = useState<IdeaBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ideaBoardLoading, setIdeaBoardLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Load active channel from URL/localStorage
  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, channelsRes] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch("/api/me/channels", { cache: "no-store" }),
        ]);

        if (!meRes.ok) {
          router.push("/auth/login");
          return;
        }

        const me = await meRes.json();
        const channelsData = await channelsRes.json();

        setIsSubscribed(me.subscription?.isActive ?? false);

        if (channelsData.length === 0) {
          setLoading(false);
          return;
        }

        // Get active channel from URL, then localStorage, then first channel
        const urlChannelId = searchParams.get("channelId");
        const storedChannelId = typeof window !== "undefined" 
          ? localStorage.getItem("activeChannelId") 
          : null;

        let channel: Channel | null = null;
        if (urlChannelId) {
          channel = channelsData.find((c: Channel) => c.channel_id === urlChannelId) || null;
        }
        if (!channel && storedChannelId) {
          channel = channelsData.find((c: Channel) => c.channel_id === storedChannelId) || null;
        }
        if (!channel && channelsData.length > 0) {
          channel = channelsData[0];
        }

        setActiveChannel(channel);
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, searchParams]);

  // Load idea board when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    setIdeaBoardLoading(true);
    fetch(`/api/me/channels/${activeChannel.channel_id}/idea-board?range=7d`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ideas) {
          setIdeaBoard(data as IdeaBoardData);
        } else {
          setIdeaBoard(null);
        }
      })
      .catch(console.error)
      .finally(() => setIdeaBoardLoading(false));
  }, [activeChannel]);

  const handleGenerate = useCallback(
    async (options?: { mode?: "default" | "more"; range?: "7d" | "28d" }) => {
      if (!activeChannel) return;

      const mode = options?.mode ?? "default";
      const range = options?.range ?? "7d";

      const r = await fetch(
        `/api/me/channels/${activeChannel.channel_id}/idea-board`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, range }),
        }
      );

      const data = await r.json();
      if (r.ok && data.ideas) {
        setIdeaBoard(data as IdeaBoardData);
      }
    },
    [activeChannel]
  );

  const handleRefresh = useCallback(
    (range: "7d" | "28d") => {
      if (!activeChannel) return;

      setIdeaBoardLoading(true);
      fetch(`/api/me/channels/${activeChannel.channel_id}/idea-board?range=${range}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ideas) {
            setIdeaBoard(data as IdeaBoardData);
          }
        })
        .catch(console.error)
        .finally(() => setIdeaBoardLoading(false));
    },
    [activeChannel]
  );

  if (loading) {
    return (
      <main className={s.page}>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!activeChannel) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <h1 className={s.title}>Idea Engine</h1>
          <p className={s.subtitle}>Get AI-powered video ideas based on what&apos;s working</p>
        </div>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Connect a Channel First</h2>
          <p className={s.emptyDesc}>Connect your YouTube channel to start generating ideas.</p>
          <a href="/dashboard" className={s.emptyBtn}>
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Idea Engine</h1>
          <p className={s.subtitle}>
            AI-powered video ideas for <strong>{activeChannel.title}</strong>
          </p>
        </div>
        {/* Channel selector removed - use header dropdown */}
      </div>

      <IdeaBoard
        data={ideaBoard}
        channelName={activeChannel.title ?? undefined}
        loading={ideaBoardLoading}
        isSubscribed={isSubscribed}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
      />
    </main>
  );
}
