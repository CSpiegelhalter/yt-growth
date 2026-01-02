"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./style.module.css";
import { Channel } from "@/types/api";
import ChannelCard from "@/components/dashboard/ChannelCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { LIMITS } from "@/lib/product";

type ChannelsSectionProps = {
  channels: Channel[];
  loading: boolean;
  canAddAnother: boolean;
  onConnect: () => void;
  onUnlink: (channelId: string) => void;
  onRefresh: (channelId: string) => void;
  busyId: string | null;
};

/**
 * Section displaying the user's connected YouTube channels.
 * Mobile-first design with premium channel cards.
 */
export default function ChannelsSection({
  channels,
  loading,
  canAddAnother,
  onConnect,
  onUnlink,
  onRefresh,
  busyId,
}: ChannelsSectionProps) {
  const [showLimitModal, setShowLimitModal] = useState(false);

  const handleAddClick = () => {
    if (canAddAnother) {
      onConnect();
    } else {
      setShowLimitModal(true);
    }
  };

  if (loading) {
    return (
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h2 className={s.sectionTitle}>Your Channels</h2>
        </div>
        <div className={s.loadingCard}>
          <div className={s.loadingAvatar} />
          <div className={s.loadingContent}>
            <div className={s.loadingLine} style={{ width: "60%" }} />
            <div className={s.loadingLine} style={{ width: "40%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className={s.section}>
        <EmptyState onConnect={onConnect} canAdd={canAddAnother} />
      </div>
    );
  }

  return (
    <div className={s.section}>
      <div className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>Your Channels</h2>
        {channels.length > 0 && (
          <button onClick={handleAddClick} className={s.addBtn}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add
          </button>
        )}
      </div>

      <div className={s.channelGrid}>
        {channels.map((ch) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            busy={busyId === ch.channel_id}
            onUnlink={() => onUnlink(ch.channel_id)}
            onRefresh={() => onRefresh(ch.channel_id)}
          />
        ))}
      </div>

      {/* Channel Limit Modal */}
      {showLimitModal && (
        <div className={s.modalOverlay} onClick={() => setShowLimitModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={s.modalClose}
              onClick={() => setShowLimitModal(false)}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className={s.modalIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className={s.modalTitle}>Channel Limit Reached</h3>
            <p className={s.modalText}>
              You've reached the maximum number of channels on your current plan.
              Upgrade to Pro to connect up to {LIMITS.PRO_MAX_CONNECTED_CHANNELS} channels.
            </p>
            <div className={s.modalActions}>
              <Link href="/api/integrations/stripe/checkout" className={s.modalPrimaryBtn}>
                Upgrade to Pro
              </Link>
              <button
                onClick={() => setShowLimitModal(false)}
                className={s.modalSecondaryBtn}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
