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
  onUnlink: (id: string) => void;
  onSync: (id: string) => void;
  busyId: string | null;
};

/**
 * Section displaying the user's connected YouTube channels.
 */
export default function ChannelsSection({
  channels,
  loading,
  canAddAnother,
  onConnect,
  onUnlink,
  onSync,
  busyId,
}: ChannelsSectionProps) {
  return (
    <>
      <div className={s.rowBetween}>
        <h2 className={s.h2}>Your channels</h2>
        <button
          onClick={onConnect}
          className={`${s.btn} ${
            canAddAnother ? s.btnSecondary : s.btnDisabled
          }`}
          disabled={!canAddAnother}
        >
          Add channel
        </button>
      </div>

      {loading ? (
        <div className={s.card}>
          <p>Loading…</p>
        </div>
      ) : channels.length === 0 ? (
        <EmptyState onConnect={onConnect} canAdd={!!canAddAnother} />
      ) : (
        <div className={s.cardGrid}>
          {channels.map((ch) => (
            <ChannelCard
              key={ch.id}
              channel={ch}
              busy={busyId === String(ch.id)}
              onUnlink={() => onUnlink(String(ch.id))}
              onSync={() => onSync(String(ch.id))}
            />
          ))}
        </div>
      )}
    </>
  );
}
