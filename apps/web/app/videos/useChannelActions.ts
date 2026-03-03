"use client";

import type { Channel, Me } from "@/types/api";

// ── Types ────────────────────────────────────────────────────

type ChannelActionsInput = {
  setMe: React.Dispatch<React.SetStateAction<Me>>;
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setErr: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
  setBusy: (id: string | null) => void;
  activeChannelId: string | null;
  channels: Channel[];
  setActiveChannelId: (id: string | null) => void;
  loadVideos: (id: string) => Promise<void>;
};

type ChannelActionsReturn = {
  unlink: (channelId: string) => Promise<void>;
  refreshChannel: (channelId: string) => Promise<void>;
};

// ── Hook ─────────────────────────────────────────────────────

export function useChannelActions({
  setMe,
  setChannels,
  setErr,
  setSuccess,
  setBusy,
  activeChannelId,
  channels,
  setActiveChannelId,
  loadVideos,
}: ChannelActionsInput): ChannelActionsReturn {
  async function refreshData() {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/me/channels", { cache: "no-store" }),
      ]);
      if (mRes.ok && cRes.ok) {
        const [m, cData] = await Promise.all([mRes.json(), cRes.json()]);
        setMe(m);
        setChannels(Array.isArray(cData) ? cData : cData.channels);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }

  async function unlink(channelId: string) {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove channel");
      }
      setSuccess("Channel removed successfully");
      setChannels((prev) =>
        prev.filter((c) => c.channel_id !== channelId),
      );
      if (activeChannelId === channelId) {
        const remaining = channels.find(
          (c) => c.channel_id !== channelId,
        );
        setActiveChannelId(remaining?.channel_id ?? null);
      }
    } catch (error: unknown) {
      setErr(
        error instanceof Error
          ? error.message
          : "Failed to remove channel",
      );
    } finally {
      setBusy(null);
    }
  }

  async function refreshChannel(channelId: string) {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}/sync`, {
        method: "POST",
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Failed to refresh channel");
      }
      setSuccess("Channel data refreshed!");
      await refreshData();
      if (activeChannelId === channelId) {await loadVideos(channelId);}
    } catch (error: unknown) {
      setErr(
        error instanceof Error
          ? error.message
          : "Failed to refresh channel",
      );
    } finally {
      setBusy(null);
    }
  }

  return { unlink, refreshChannel };
}
