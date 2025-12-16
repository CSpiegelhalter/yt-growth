"use client";

import Link from "next/link";
import s from "./style.module.css";
import { Channel } from "@/types/api";

export default function ChannelCard({
  channel,
  busy,
  onUnlink,
  onSync,
  onGeneratePlan,
  onSubscriberAudit,
}: {
  channel: Channel;
  busy: boolean;
  onUnlink: () => void;
  onSync: () => void;
  onGeneratePlan: () => void;
  onSubscriberAudit: () => void;
}) {
  return (
    <div className={s.card}>
      <div className={s.header}>
        <div className={s.titleWrap}>
          <div className={s.title} title={channel.title}>
            {channel.title}
          </div>
          <div className={s.subtle}>{channel.youtubeChannelId}</div>
        </div>
        <Link
          href={`/audit/${channel.id}`}
          className={`${s.btn} ${s.btnLink}`}
        >
          View audit →
        </Link>
      </div>

      <div className={s.meta}>
        <div>Last sync: {channel.lastSyncedAt ? new Date(channel.lastSyncedAt).toLocaleString() : "—"}</div>
        <div>Last plan: {channel.lastPlanGeneratedAt ? new Date(channel.lastPlanGeneratedAt).toLocaleString() : "—"}</div>
      </div>

      <div className={s.actions}>
        <button
          onClick={onSync}
          className={`${s.btn} ${s.btnSecondary}`}
          disabled={busy}
        >
          {busy ? "Syncing…" : "Sync videos"}
        </button>
        <button
          onClick={onGeneratePlan}
          className={`${s.btn} ${s.btnPrimary}`}
          disabled={busy}
        >
          {busy ? "Working…" : "Generate plan"}
        </button>
        <button
          onClick={onSubscriberAudit}
          className={`${s.btn} ${s.btnSecondary}`}
          disabled={busy}
        >
          Subscriber audit
        </button>
        <button
          onClick={onUnlink}
          className={`${s.btn} ${s.btnDanger}`}
          disabled={busy}
          title="Remove this channel from your account"
        >
          {busy ? "Working…" : "Unlink"}
        </button>
      </div>
    </div>
  );
}
