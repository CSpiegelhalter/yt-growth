"use client";

import s from "./style.module.css";
import { Channel } from "@/types/api";
import ChannelCard from "@/components/dashboard/ChannelCard";
import EmptyState from "@/components/dashboard/EmptyState";

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
        {canAddAnother && channels.length > 0 && (
          <button onClick={onConnect} className={s.addBtn}>
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
    </div>
  );
}
