"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./style.module.css";
import { Me, Channel } from "@/types/api";
import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import { useRouter } from "next/navigation";
import BillingCTA from "@/components/dashboard/BillingCTA";

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  const canAddAnother = useMemo(() => {
    if (!me) return false;
    const active = ["active", "trialing", "past_due"].includes(me.status);
    return channels.length < (me.channel_limit ?? 1) && active;
  }, [me, channels]);

  const load = async () => {
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
    } catch (e: any) {
      setErr(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unlink = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Failed to unlink channel");
      await load();
    } catch (e: any) {
      setErr(e.message || "Failed to unlink channel");
    } finally {
      setBusy(null);
    }
  };

  const syncChannel = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}/sync`, { method: "POST" });
      if (!r.ok) throw new Error("Failed to sync channel");
      await load();
    } catch (e: any) {
      setErr(e.message || "Failed to sync channel");
    } finally {
      setBusy(null);
    }
  };

  const generatePlan = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}/plan/generate`, {
        method: "POST",
      });
      if (r.status === 402) throw new Error("Subscription required for plans");
      if (!r.ok) throw new Error("Failed to generate plan");
      await load();
      router.push(`/audit/${channelId}`);
    } catch (e: any) {
      setErr(e.message || "Failed to generate plan");
    } finally {
      setBusy(null);
    }
  };

  const goSubscriberAudit = (channelId: string) => {
    router.push(`/audit/${channelId}?tab=subscribers`);
  };

  const subscribe = async () => {
    setErr(null);
    setBusy("billing");
    try {
      const r = await fetch("/api/integrations/stripe/checkout", { method: "POST" });
      if (!r.ok) throw new Error("Failed to start checkout");
      const { url } = await r.json();
      window.location.href = url;
    } catch (e: any) {
      setErr(e.message || "Unable to start checkout");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Dashboard</h1>
          <p className={styles.subtle}>Manage your channels and run audits.</p>
        </div>
        <div>
          <button
            onClick={() =>
              (window.location.href = "/api/integrations/google/start")
            }
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

      {err && <ErrorAlert message={err} />}

      {!loading && me && me.plan === "free" && (
        <BillingCTA
          status={me.status}
          onSubscribe={subscribe}
          busy={busy === "billing"}
          text="Decide-for-Me, retention cliffs, and subscriber audits are gated. Unlock with Pro."
        />
      )}

      <section className={styles.section}>
        <ChannelsSection
          channels={channels}
          loading={loading}
          canAddAnother={canAddAnother}
          onConnect={() =>
            (window.location.href = "/api/integrations/google/start")
          }
          onUnlink={unlink}
          onSync={syncChannel}
          onGeneratePlan={generatePlan}
          onSubscriberAudit={goSubscriberAudit}
          busyId={busy}
        />
      </section>
    </main>
  );
}
