"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import s from "./style.module.css";
import { Me, Channel, IdeaBoardData } from "@/types/api";
import IdeaBoard from "@/components/dashboard/IdeaBoard";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import { useToast } from "@/components/ui/Toast";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

/**
 * IdeasClient - Interactive client component for the Idea Engine.
 * Receives bootstrap data from server, handles interactions client-side.
 */
export default function IdeasClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
}: Props) {
  const { toast } = useToast();

  // State initialized from server props
  const [channels] = useState<Channel[]>(initialChannels);
  const [activeChannelId] = useState<string | null>(initialActiveChannelId);

  // Idea board state
  const [ideaBoard, setIdeaBoard] = useState<IdeaBoardData | null>(null);
  const [ideaBoardLoading, setIdeaBoardLoading] = useState(false);

  const activeChannel = useMemo(
    () => channels.find((c) => c.channel_id === activeChannelId) ?? null,
    [channels, activeChannelId]
  );

  const isSubscribed = useMemo(
    () => initialMe.subscription?.isActive ?? false,
    [initialMe]
  );

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  // Load idea board when channel changes
  useEffect(() => {
    if (!activeChannelId) return;

    setIdeaBoardLoading(true);
    fetch(`/api/me/channels/${activeChannelId}/idea-board?range=7d`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ideas) {
          setIdeaBoard(data as IdeaBoardData);
        } else {
          setIdeaBoard(null);
        }
      })
      .catch((err) => {
        console.error(err);
        toast("Failed to load idea board. Please refresh.", "error");
      })
      .finally(() => setIdeaBoardLoading(false));
  }, [activeChannelId, toast]);

  const handleGenerate = useCallback(
    async (options?: { mode?: "default" | "more"; range?: "7d" | "28d" }) => {
      if (!activeChannelId) {
        toast("Select a channel first.", "info");
        return;
      }

      const mode = options?.mode ?? "default";
      const range = options?.range ?? "7d";

      try {
        const r = await fetch(`/api/me/channels/${activeChannelId}/idea-board`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, range }),
        });

        const data = await r.json().catch(() => ({}));

        if (!r.ok) {
          if (r.status === 401) {
            toast("Session expired. Please log in again.", "error");
            return;
          }
          if (r.status === 403) {
            toast(
              data?.code === "SUBSCRIPTION_REQUIRED"
                ? "Subscription required to generate ideas."
                : "Not allowed to generate ideas for this channel.",
              "error"
            );
            return;
          }
          if (r.status === 429) {
            toast("Rate limit hit. Try again a bit later.", "error");
            return;
          }
          toast(data?.error ?? "Failed to generate ideas.", "error");
          return;
        }

        if (data.ideas) {
          setIdeaBoard(data as IdeaBoardData);
        } else {
          toast("No ideas returned. Please try again.", "error");
        }
      } catch (err) {
        console.error(err);
        toast("Failed to generate ideas. Please try again.", "error");
      }
    },
    [activeChannelId, toast]
  );

  const handleRefresh = useCallback(
    (range: "7d" | "28d") => {
      if (!activeChannelId) {
        toast("Select a channel first.", "info");
        return;
      }

      setIdeaBoardLoading(true);
      fetch(`/api/me/channels/${activeChannelId}/idea-board?range=${range}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ideas) {
            setIdeaBoard(data as IdeaBoardData);
          }
        })
        .catch((err) => {
          console.error(err);
          toast("Failed to refresh ideas. Please try again.", "error");
        })
        .finally(() => setIdeaBoardLoading(false));
    },
    [activeChannelId, toast]
  );

  // No channels state
  if (!activeChannel) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <h1 className={s.title}>Idea Engine</h1>
          <p className={s.subtitle}>
            Get video ideas based on what's working in your niche
          </p>
        </div>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Connect a Channel First</h2>
          <p className={s.emptyDesc}>
            Connect your YouTube channel to start generating ideas.
          </p>
          <a href="/dashboard" className={s.emptyBtn}>
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <IdeaBoard
        data={ideaBoard}
        channelId={activeChannelId ?? undefined}
        channelName={activeChannel.title ?? undefined}
        loading={ideaBoardLoading}
        isSubscribed={isSubscribed}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
      />
    </main>
  );
}
