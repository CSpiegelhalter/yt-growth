"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { LIMITS } from "@/lib/shared/product";

import s from "./SidebarChannelSelector.module.css";

type Channel = {
  channel_id: string;
  id: number;
  title: string | null;
  thumbnailUrl: string | null;
};

type SidebarChannelSelectorProps = {
  channels: Channel[];
  activeChannelId: string | null;
  channelLimit: number;
  collapsed: boolean;
  onChannelChange: (channelId: string) => void;
};

export function SidebarChannelSelector({
  channels,
  activeChannelId,
  channelLimit,
  collapsed,
  onChannelChange,
}: SidebarChannelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((c) => c.channel_id === activeChannelId);
  const canAddChannel = channels.length < channelLimit;

  // Close on outside click
  useEffect(() => {
    if (!open) {return;}
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {setOpen(false);}
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) {return;}
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {setOpen(false);}
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = useCallback((channelId: string) => {
    setOpen(false);
    onChannelChange(channelId);
  }, [onChannelChange]);

  if (channels.length === 0) {return null;}

  return (
    <div ref={ref} className={s.wrapper}>
      <button
        className={s.trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Select channel"
        title={collapsed ? (activeChannel?.title ?? "Select Channel") : undefined}
        type="button"
      >
        <ChannelThumb channel={activeChannel} />
        {!collapsed && (
          <>
            <span className={s.channelName}>
              {activeChannel?.title ?? "Select Channel"}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={open ? s.chevronUp : ""}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className={s.dropdown}>
          {channels.map((channel) => (
            <button
              key={channel.channel_id}
              className={`${s.option} ${channel.channel_id === activeChannelId ? s.optionActive : ""}`}
              onClick={() => handleSelect(channel.channel_id)}
              type="button"
            >
              {channel.thumbnailUrl ? (
                <Image
                  src={channel.thumbnailUrl}
                  alt={`${channel.title ?? "Channel"} avatar`}
                  width={24}
                  height={24}
                  className={s.optionThumb}
                  sizes="24px"
                />
              ) : (
                <div className={s.optionThumbPlaceholder} />
              )}
              <span className={s.optionName}>
                {channel.title ?? "Untitled Channel"}
              </span>
              {channel.channel_id === activeChannelId && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={s.checkIcon}
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
          <AddChannelAction
            canAdd={canAddChannel}
            onClose={() => setOpen(false)}
            onUpgradePrompt={() => { setOpen(false); setShowUpgrade(true); }}
          />
        </div>
      )}

      {showUpgrade && (
        <UpgradePrompt
          channelLimit={channelLimit}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function ChannelThumb({ channel }: { channel?: Channel }) {
  if (channel?.thumbnailUrl) {
    return (
      <Image
        src={channel.thumbnailUrl}
        alt={`${channel.title ?? "Channel"} avatar`}
        width={20}
        height={20}
        className={s.thumb}
        sizes="20px"
      />
    );
  }
  return (
    <div className={s.thumbPlaceholder}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
      </svg>
    </div>
  );
}

function AddChannelAction({
  canAdd,
  onClose,
  onUpgradePrompt,
}: {
  canAdd: boolean;
  onClose: () => void;
  onUpgradePrompt: () => void;
}) {
  const icon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );

  if (canAdd) {
    return (
      <a href="/api/integrations/google/start" className={s.addChannel} onClick={onClose}>
        {icon} Add Channel
      </a>
    );
  }

  return (
    <button className={s.addChannel} onClick={onUpgradePrompt} type="button">
      {icon} Add Channel
    </button>
  );
}

function UpgradePrompt({
  channelLimit,
  onClose,
}: {
  channelLimit: number;
  onClose: () => void;
}) {
  const canUpgrade = channelLimit < LIMITS.PRO_MAX_CONNECTED_CHANNELS;
  const description = canUpgrade
    ? `Your plan allows ${channelLimit} channel${channelLimit === 1 ? "" : "s"}. Upgrade to Pro for up to ${LIMITS.PRO_MAX_CONNECTED_CHANNELS}.`
    : `You've reached the maximum of ${channelLimit} channels.`;

  return (
    <div className={s.upgradeOverlay} role="presentation" onClick={onClose}>
      <div className={s.upgradeCard} role="presentation" onClick={(e) => e.stopPropagation()}>
        <p className={s.upgradeText}>{description}</p>
        {canUpgrade && (
          <a href="/api/integrations/stripe/checkout" className={s.upgradeBtn} onClick={onClose}>
            Upgrade to Pro
          </a>
        )}
        <button className={s.upgradeDismiss} onClick={onClose} type="button">
          {canUpgrade ? "Maybe Later" : "Got it"}
        </button>
      </div>
    </div>
  );
}
