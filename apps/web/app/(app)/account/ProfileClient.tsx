"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState } from "react";

import ErrorAlert from "@/components/dashboard/ErrorAlert";
import { PageContainer, PageHeader } from "@/components/ui";
import type { Channel,Me } from "@/types/api";

import AccountStats from "./_components/AccountStats";
import BillingCTA from "./_components/BillingCTA";
import styles from "./style.module.css";

/**
 * ProfileClient - Interactive client component for profile management
 */
export default function ProfileClient({
  initialMe,
  initialChannels,
}: {
  initialMe: Me;
  initialChannels: Channel[];
}) {
  const [me] = useState<Me>(initialMe);
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [err, setErr] = useState<string | null>(null);
  const [removingChannelId, setRemovingChannelId] = useState<string | null>(
    null
  );

  const removeChannel = async (channelId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this channel? This will delete all associated data."
      )
    ) {
      return;
    }

    setRemovingChannelId(channelId);
    setErr(null);

    try {
      const res = await fetch(`/api/me/channels/${channelId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove channel");
      }

      setChannels((prev) => prev.filter((c) => c.channel_id !== channelId));

      // Notify the Header to refresh its channel list
      window.dispatchEvent(
        new CustomEvent("channel-removed", { detail: { channelId } })
      );

      // Clear from localStorage if this was the active channel
      const activeChannelId = localStorage.getItem("activeChannelId");
      if (activeChannelId === channelId) {
        localStorage.removeItem("activeChannelId");
      }
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Failed to remove channel");
    } finally {
      setRemovingChannelId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Account"
        subtitle="Manage your account and subscription"
      />

      {err && <ErrorAlert message={err} />}

      <div className={styles.grid}>
        {/* Account Info */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Account Information</h2>
          <AccountStats me={me} channelCount={channels.length} />
        </section>

        <SubscriptionSection me={me} />

        {/* Connected Channels */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Connected Channels</h2>
          <ChannelListSection
            channels={channels}
            removingChannelId={removingChannelId}
            onRemove={removeChannel}
          />
        </section>

        <button
          type="button"
          className={styles.signOutBtn}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </div>
    </PageContainer>
  );
}

function SubscriptionSection({ me }: { me: Me }) {
  const { isActive, currentPeriodEnd, cancelAtPeriodEnd, cancelAt } = me.subscription ?? {};
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Subscription</h2>
      <BillingCTA
        isSubscribed={isActive ?? false}
        plan={me.plan ?? "free"}
        status={me.status ?? "inactive"}
        currentPeriodEnd={currentPeriodEnd ?? null}
        cancelAtPeriodEnd={cancelAtPeriodEnd ?? false}
        cancelAt={cancelAt ?? null}
      />
    </section>
  );
}

function ChannelListSection({
  channels,
  removingChannelId,
  onRemove,
}: {
  channels: Channel[];
  removingChannelId: string | null;
  onRemove: (channelId: string) => void;
}) {
  if (channels.length === 0) {
    return (
      <div className={styles.emptyChannels}>
        <div className={styles.emptyIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
        <p>No channels connected yet.</p>
        <a href="/videos" className={styles.linkBtn}>
          Go to Videos
        </a>
      </div>
    );
  }

  return (
    <div className={styles.channelList}>
      {channels.map((ch) => (
        <div key={ch.channel_id} className={styles.channelItem}>
          {ch.thumbnailUrl && (
            <Image
              src={ch.thumbnailUrl}
              alt={`${ch.title ?? "YouTube channel"} avatar`}
              width={44}
              height={44}
              className={styles.channelThumb}
              sizes="44px"
            />
          )}
          <div className={styles.channelInfo}>
            <div className={styles.channelName}>
              {ch.title ?? "Untitled Channel"}
            </div>
            <div className={styles.channelStats}>
              {ch.totalVideoCount ?? ch.videoCount ?? 0} videos • {ch.planCount ?? 0} plans
            </div>
          </div>
          <div className={styles.channelActions}>
            <button
              className={styles.removeBtn}
              onClick={() => onRemove(ch.channel_id)}
              disabled={removingChannelId === ch.channel_id}
              title="Remove channel"
            >
              {removingChannelId === ch.channel_id ? (
                <span className={styles.spinner} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
