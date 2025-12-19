"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./style.module.css";
import { Channel, SubscriberAuditResponse } from "@/types/api";
import SubscriberMagnetTable from "@/components/dashboard/SubscriberMagnetTable";

/**
 * ConvertersClient - Interactive client component for subscriber conversion analysis
 */
export default function ConvertersClient() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [auditData, setAuditData] = useState<SubscriberAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [range, setRange] = useState<"7d" | "28d">("7d");
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

  // Load subscriber audit data when channel or range changes
  useEffect(() => {
    if (!selectedChannel) return;

    setDataLoading(true);
    fetch(`/api/me/channels/${selectedChannel.channel_id}/subscriber-audit?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.videos) {
          setAuditData(data as SubscriberAuditResponse);
        } else {
          setAuditData(null);
        }
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [selectedChannel, range]);

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
          <h1 className={s.title}>Subscriber Drivers</h1>
          <p className={s.subtitle}>Find your best-converting videos</p>
        </div>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Connect a Channel First</h2>
          <p className={s.emptyDesc}>Connect your YouTube channel to analyze subscriber conversions.</p>
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
          <h1 className={s.title}>Subscriber Drivers</h1>
          <p className={s.subtitle}>These videos turn viewers into subscribers at a higher rate than average</p>
        </div>

        <div className={s.controls}>
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

          <select
            className={s.rangeSelect}
            value={range}
            onChange={(e) => setRange(e.target.value as "7d" | "28d")}
          >
            <option value="7d">Last 7 days</option>
            <option value="28d">Last 28 days</option>
          </select>
        </div>
      </div>

      {!isSubscribed && (
        <div className={s.upgradeBanner}>
          <p>Upgrade to Pro to unlock full subscriber conversion insights.</p>
          <a href="/api/integrations/stripe/checkout" className={s.upgradeBtn}>
            Upgrade
          </a>
        </div>
      )}

      <SubscriberMagnetTable
        videos={auditData?.videos ?? []}
        patternAnalysis={auditData?.patternAnalysis ?? null}
        loading={dataLoading}
        onRefresh={() => setRange(range)}
        isSubscribed={isSubscribed}
        isDemo={!isSubscribed}
      />
    </main>
  );
}

