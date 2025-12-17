"use client";

import Link from "next/link";
import s from "./style.module.css";
import { Channel } from "@/types/api";

type ChannelCardProps = {
  channel: Channel;
  busy: boolean;
  onUnlink: () => void;
  onSync: () => void;
};

/**
 * Card displaying a single YouTube channel with sync/unlink actions.
 */
export default function ChannelCard({
  channel,
  busy,
  onUnlink,
  onSync,
}: ChannelCardProps) {
  return (
    <div className={s.card}>
      <div className={s.header}>
        <div className={s.channelInfo}>
          {channel.thumbnailUrl && (
            <img
              src={channel.thumbnailUrl}
              alt=""
              className={s.thumbnail}
            />
          )}
          <div className={s.titleWrap}>
            <div className={s.title} title={channel.title ?? undefined}>
              {channel.title ?? "Untitled Channel"}
            </div>
            <div className={s.stats}>
              {channel.videoCount ?? 0} videos • {channel.planCount ?? 0} plans
            </div>
          </div>
        </div>
        <span className={`${s.badge} ${getSyncBadgeClass(channel.syncStatus, s)}`}>
          {channel.syncStatus}
        </span>
      </div>

      {channel.lastSyncedAt && (
        <div className={s.lastSynced}>
          Last synced: {new Date(channel.lastSyncedAt).toLocaleString()}
        </div>
      )}

      {channel.syncError && (
        <div className={s.error}>
          ⚠️ {channel.syncError}
        </div>
      )}

      <div className={s.actions}>
        <Link
          href={`/audit/${channel.channel_id}`}
          className={`${s.btn} ${s.btnLink}`}
        >
          View audit →
        </Link>
        <div className={s.actionButtons}>
          <button
            onClick={onSync}
            className={`${s.btn} ${s.btnSecondary}`}
            disabled={busy}
          >
            {busy ? "Syncing…" : "Sync"}
          </button>
          <button
            onClick={onUnlink}
            className={`${s.btn} ${s.btnDanger}`}
            disabled={busy}
            title="Remove this channel from your account"
          >
            Unlink
          </button>
        </div>
      </div>
    </div>
  );
}

function getSyncBadgeClass(status: string, s: Record<string, string>): string {
  switch (status) {
    case "idle":
      return s.badgeSuccess;
    case "running":
      return s.badgeInfo;
    case "error":
      return s.badgeDanger;
    case "stale":
      return s.badgeWarning;
    default:
      return "";
  }
}
