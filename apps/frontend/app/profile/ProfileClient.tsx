"use client";

import { useEffect, useState } from "react";
import type { Me, Channel } from "@/types/api";
import AccountStats from "@/components/dashboard/AccountStats";
import BillingCTA from "@/components/dashboard/BillingCTA";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import styles from "./style.module.css";

/**
 * ProfileClient - Interactive client component for profile management
 */
export default function ProfileClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isSubscribed = me?.subscription?.isActive ?? false;

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.subtitle}>Manage your account and subscription</p>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading profile...</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.subtitle}>Manage your account and subscription</p>
      </div>

      {err && <ErrorAlert message={err} />}

      <div className={styles.grid}>
        {/* Account Info */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Account Information</h2>
          <AccountStats me={me} channelCount={channels.length} />
        </section>

        {/* Subscription */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Subscription</h2>
          <BillingCTA
            isSubscribed={isSubscribed}
            plan={me?.plan ?? "free"}
            status={me?.status ?? "inactive"}
            currentPeriodEnd={me?.subscription?.currentPeriodEnd ?? null}
          />
        </section>

        {/* Connected Channels */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Connected Channels</h2>
          {channels.length === 0 ? (
            <div className={styles.emptyChannels}>
              <div className={styles.emptyIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <p>No channels connected yet.</p>
              <a href="/dashboard" className={styles.linkBtn}>
                Go to Dashboard
              </a>
            </div>
          ) : (
            <div className={styles.channelList}>
              {channels.map((ch) => (
                <div key={ch.channel_id} className={styles.channelItem}>
                  {ch.thumbnailUrl && (
                    <img
                      src={ch.thumbnailUrl}
                      alt=""
                      className={styles.channelThumb}
                    />
                  )}
                  <div className={styles.channelInfo}>
                    <div className={styles.channelName}>
                      {ch.title ?? "Untitled Channel"}
                    </div>
                    <div className={styles.channelStats}>
                      {ch.videoCount ?? 0} videos • {ch.planCount ?? 0} plans
                    </div>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${
                      ch.syncStatus === "idle"
                        ? styles.statusSuccess
                        : styles.statusWarning
                    }`}
                  >
                    {ch.syncStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className={styles.dangerCard}>
          <h2 className={styles.dangerTitle}>Danger Zone</h2>
          <p className={styles.dangerDesc}>
            These actions are irreversible. Please be certain.
          </p>
          <button
            className={styles.dangerBtn}
            onClick={() => alert("Account deletion would be handled here")}
          >
            Delete Account
          </button>
        </section>
      </div>
    </main>
  );
}

