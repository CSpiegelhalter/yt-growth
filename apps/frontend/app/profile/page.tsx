"use client";

import { useEffect, useState } from "react";
import styles from "./style.module.css"; // duplicate or share with dashboard if you like
import { Me, Channel } from "@/types/api";
import AccountStats from "@/components/dashboard/AccountStats";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import BillingCTA from "@/components/dashboard/BillingCTA";

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      setErr(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCheckout = async () => {
    setErr(null);
    try {
      const r = await fetch("/api/integrations/stripe/checkout", { method: "POST" });
      if (!r.ok) throw new Error("Failed to start checkout");
      const { url } = await r.json();
      window.location.href = url;
    } catch (e: any) {
      setErr(e.message || "Unable to start checkout");
    }
  };

  const openBilling = async () => {
    setErr(null);
    try {
      const r = await fetch("/api/integrations/stripe/billing-portal", { method: "POST" });
      if (!r.ok) throw new Error("Failed to open billing portal");
      const { url } = await r.json();
      window.location.href = url;
    } catch (e: any) {
      setErr(e.message || "Unable to open billing portal");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Profile</h1>
          <p className={styles.subtle}>
            View your account details and connections.
          </p>
        </div>
      </div>

      {err && <ErrorAlert message={err} />}

      <section className={styles.section}>
        <h2 className={styles.h2}>Account</h2>
        <AccountStats me={me} channelCount={channels.length} />
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openBilling}>
            Manage billing
          </button>
          <button className={styles.btn} onClick={startCheckout}>
            Subscribe
          </button>
        </div>
        {me?.plan === "free" && (
          <div style={{ marginTop: 12 }}>
            <BillingCTA
              status={me.status}
              onSubscribe={startCheckout}
              text="Upgrade to access Decide-for-Me plans, retention cliffs, and subscriber audits."
            />
          </div>
        )}
      </section>

    </main>
  );
}
