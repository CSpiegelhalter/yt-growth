"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./style.module.css";
import { Channel } from "@/types/api";

type ChannelCardProps = {
  channel: Channel;
  busy: boolean;
  onUnlink: () => void;
  onRefresh: () => void;
};

type ChannelStatus = "connected" | "processing" | "ready" | "error";

/**
 * Premium channel card with status chip, primary CTA, and icon actions.
 * Mobile-first design.
 */
export default function ChannelCard({
  channel,
  busy,
  onUnlink,
  onRefresh,
}: ChannelCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const status = getChannelStatus(channel);
  const hasData = channel.videoCount > 0;

  const handleUnlink = () => {
    setShowConfirm(false);
    onUnlink();
  };

  return (
    <div className={s.card}>
      {/* Header: Avatar + Name + Status */}
      <div className={s.header}>
        <div className={s.channelInfo}>
          {channel.thumbnailUrl ? (
            <img
              src={channel.thumbnailUrl}
              alt=""
              className={s.avatar}
              loading="lazy"
            />
          ) : (
            <div className={s.avatarPlaceholder}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className={s.nameWrap}>
            <h3 className={s.channelName} title={channel.title ?? undefined}>
              {channel.title ?? "Untitled Channel"}
            </h3>
            {hasData ? (
              <p className={s.videoCount}>
                {channel.videoCount} video{channel.videoCount !== 1 ? "s" : ""}{" "}
                analyzed
              </p>
            ) : (
              <p className={s.videoCountEmpty}>Ready to analyze your content</p>
            )}
          </div>
        </div>
        <StatusChip status={status} />
      </div>

      {/* Error message if any */}
      {channel.syncError && (
        <div className={s.errorBanner}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{channel.syncError}</span>
        </div>
      )}

      {/* Actions row */}
      <div className={s.actions}>
        <Link href={`/audit/${channel.channel_id}`} className={s.primaryBtn}>
          Open Insights
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        <div className={s.iconActions}>
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className={`${s.iconBtn} ${busy ? s.iconBtnDisabled : ""}`}
            disabled={busy}
            title={busy ? "Refreshing..." : "Refresh channel data"}
            aria-label="Refresh"
          >
            {busy ? (
              <span className={s.spinner} />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            )}
          </button>

          {/* Unlink button */}
          <button
            onClick={() => setShowConfirm(true)}
            className={`${s.iconBtn} ${s.iconBtnDanger}`}
            disabled={busy}
            title="Remove this channel"
            aria-label="Remove channel"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18.36 6.64a9 9 0 11-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Last updated - subtle */}
      {channel.lastSyncedAt && (
        <p className={s.lastUpdated}>
          Updated {formatRelativeTime(channel.lastSyncedAt)}
        </p>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className={s.confirmOverlay} onClick={() => setShowConfirm(false)}>
          <div className={s.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h4 className={s.confirmTitle}>Remove Channel?</h4>
            <p className={s.confirmText}>
              This will remove {channel.title ?? "this channel"} from your
              account. Your YouTube channel won&apos;t be affected.
            </p>
            <div className={s.confirmActions}>
              <button
                onClick={() => setShowConfirm(false)}
                className={s.confirmCancel}
              >
                Cancel
              </button>
              <button onClick={handleUnlink} className={s.confirmRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Status Chip ---------- */
function StatusChip({ status }: { status: ChannelStatus }) {
  const config = {
    connected: { label: "Connected", className: s.statusConnected },
    processing: { label: "Processing", className: s.statusProcessing },
    ready: { label: "Ready", className: s.statusReady },
    error: { label: "Error", className: s.statusError },
  }[status];

  return (
    <span className={`${s.statusChip} ${config.className}`}>
      {status === "processing" && <span className={s.statusDot} />}
      {config.label}
    </span>
  );
}

/* ---------- Helpers ---------- */
function getChannelStatus(channel: Channel): ChannelStatus {
  if (channel.syncError) return "error";
  if (channel.syncStatus === "running") return "processing";
  if (channel.videoCount > 0) return "ready";
  return "connected";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
