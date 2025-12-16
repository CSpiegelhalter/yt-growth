"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./style.module.css";
import { Me, Channel, Plan } from "@/types/api";
import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import PlanCard from "@/components/dashboard/PlanCard";
import BillingCTA from "@/components/dashboard/BillingCTA";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [latestPlan, setLatestPlan] = useState<Plan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const canAddAnother = useMemo(() => {
    if (!me) return false;
    return channels.length < (me.channel_limit ?? 1) && me.subscription?.isActive !== false;
  }, [me, channels]);

  const isSubscribed = useMemo(() => {
    return me?.subscription?.isActive ?? false;
  }, [me]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/me/channels", { cache: "no-store" }),
      ]);
      if (!mRes.ok) throw new Error("Failed to load /api/me");
      if (!cRes.ok) throw new Error("Failed to load /api/me/channels");
      const [m, c] = await Promise.all([mRes.json(), cRes.json()]);
      setMe(m);
      setChannels(c);
      if (c.length > 0 && !selectedChannel) {
        setSelectedChannel(c[0]);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [selectedChannel]);

  useEffect(() => {
    load();
    
    // Check for checkout success
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setSuccess("🎉 Subscription activated! You now have full access.");
      // Clean URL
      window.history.replaceState({}, "", "/dashboard");
    } else if (checkout === "canceled") {
      setErr("Checkout was canceled. You can try again anytime.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [load, searchParams]);

  // Load latest plan when channel is selected
  useEffect(() => {
    if (!selectedChannel) return;
    
    fetch(`/api/me/channels/${selectedChannel.channel_id}/plans?limit=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.plans && data.plans.length > 0) {
          setLatestPlan(data.plans[0]);
        } else {
          setLatestPlan(null);
        }
      })
      .catch(console.error);
  }, [selectedChannel]);

  const unlink = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Failed to unlink channel");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to unlink channel");
    } finally {
      setBusy(null);
    }
  };

  const syncChannel = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}/sync`, {
        method: "POST",
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Failed to sync channel");
      }
      setSuccess("Channel synced successfully!");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to sync channel");
    } finally {
      setBusy(null);
    }
  };

  const generatePlan = async () => {
    if (!selectedChannel) return;
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${selectedChannel.channel_id}/plan/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }
      setLatestPlan(data.plan);
      setSuccess("Plan generated successfully!");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to generate plan");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Dashboard</h1>
          <p className={styles.subtle}>Manage your channels and generate content plans.</p>
        </div>
        <div>
          <button
            onClick={() => (window.location.href = "/api/integrations/google/start")}
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!me || !canAddAnother}
            title={
              canAddAnother
                ? "Connect your YouTube channel"
                : "Upgrade plan to add more channels"
            }
          >
            {canAddAnother ? "Connect YouTube" : "Channel limit reached"}
          </button>
        </div>
      </div>

      {success && (
        <div className={styles.success} onClick={() => setSuccess(null)}>
          {success}
        </div>
      )}

      {err && <ErrorAlert message={err} />}

      <div className={styles.grid}>
        {/* Left column: Channels and Plan */}
        <div className={styles.mainCol}>
          <section className={styles.section}>
            <ChannelsSection
              channels={channels}
              loading={loading}
              canAddAnother={canAddAnother}
              onConnect={() => (window.location.href = "/api/integrations/google/start")}
              onUnlink={unlink}
              onRefresh={syncChannel}
              busyId={busy}
            />
          </section>

          {selectedChannel && (
            <section className={styles.section}>
              <PlanCard
                plan={latestPlan}
                channelId={selectedChannel.channel_id}
                isSubscribed={isSubscribed}
                onGenerate={generatePlan}
                loading={loading}
              />
            </section>
          )}
        </div>

        {/* Right column: Billing */}
        <div className={styles.sideCol}>
          <BillingCTA
            isSubscribed={isSubscribed}
            plan={me?.plan ?? "free"}
            status={me?.status ?? "inactive"}
            currentPeriodEnd={me?.subscription?.currentPeriodEnd ?? null}
          />

          {selectedChannel && (
            <div className={styles.quickLinks}>
              <h3 className={styles.h3}>Quick Links</h3>
              <a
                href={`/audit/${selectedChannel.channel_id}`}
                className={styles.quickLink}
              >
                📊 View Full Audit
              </a>
              {selectedChannel.lastSyncedAt && (
                <p className={styles.lastUpdated}>
                  Last synced:{" "}
                  {new Date(selectedChannel.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
