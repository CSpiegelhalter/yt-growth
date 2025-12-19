"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./style.module.css";
import { Channel, VideoWithRetention } from "@/types/api";
import RetentionTable from "@/components/dashboard/RetentionTable";

/**
 * DropOffsClient - Interactive client component for retention analysis
 */
export default function DropOffsClient() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<VideoWithRetention[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Load channels
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
        setChannels(channelsData);

        if (channelsData.length > 0) {
          setSelectedChannel(channelsData[0]);
        }
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Load retention data when channel changes
  useEffect(() => {
    if (!selectedChannel) return;

    setDataLoading(true);
    fetch(`/api/me/channels/${selectedChannel.channel_id}/retention`)
      .then((r) => r.json())
      .then((data) => {
        setVideos(data.videos ?? []);
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [selectedChannel]);

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

  if (channels.length === 0) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <h1 className={s.title}>Drop-off Analysis</h1>
          <p className={s.subtitle}>See where viewers leave your videos and why</p>
        </div>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Connect a Channel First</h2>
          <p className={s.emptyDesc}>Connect your YouTube channel to analyze viewer drop-offs.</p>
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
          <h1 className={s.title}>Drop-off Analysis</h1>
          <p className={s.subtitle}>See where viewers leave your videos and get actionable fixes</p>
        </div>

        {channels.length > 1 && (
          <select
            className={s.channelSelect}
            value={selectedChannel?.channel_id ?? ""}
            onChange={(e) => {
              const ch = channels.find((c) => c.channel_id === e.target.value);
              if (ch) setSelectedChannel(ch);
            }}
          >
            {channels.map((ch) => (
              <option key={ch.channel_id} value={ch.channel_id}>
                {ch.title ?? "Untitled Channel"}
              </option>
            ))}
          </select>
        )}
      </div>

      {!isSubscribed && (
        <div className={s.upgradeBanner}>
          <p>Upgrade to Pro to unlock full drop-off analysis with AI-powered fixes.</p>
          <a href="/api/integrations/stripe/checkout" className={s.upgradeBtn}>
            Upgrade
          </a>
        </div>
      )}

      <RetentionTable
        videos={videos}
        loading={dataLoading}
        isDemo={!isSubscribed}
      />
    </main>
  );
}

