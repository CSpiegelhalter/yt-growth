"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback,useEffect, useRef,useState } from "react";

import { accountNavItems,getPageTitle } from "@/lib/shared/nav-config";
import { LIMITS } from "@/lib/shared/product";

import s from "./AppHeader.module.css";
import { NavIcon } from "./NavIcon";

function useDropdownDismiss(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  isOpen: boolean,
) {
  useEffect(() => {
    if (!isOpen) {return;}
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {onClose();}
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, ref, onClose]);

  useEffect(() => {
    if (!isOpen) {return;}
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {onClose();}
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);
}

type Channel = {
  id: number;
  channel_id: string;
  title: string | null;
  thumbnailUrl: string | null;
};

type Plan = "FREE" | "PRO" | "ENTERPRISE";

type AppHeaderProps = {
  channels: Channel[];
  activeChannelId: string | null;
  userEmail: string | null;
  userName: string | null;
  plan: Plan;
  channelLimit: number;
  isAdmin?: boolean;
  onChannelChange?: (channelId: string) => void;
  mobileNavSlot?: React.ReactNode;
};

/* ------------------------------------------------------------------ */
/*  Sub-components extracted to reduce cyclomatic complexity           */
/* ------------------------------------------------------------------ */

function ChannelSelector({
  channels,
  activeChannelId,
  canAddChannel,
  onChannelSelect,
  onUpgradePrompt,
}: {
  channels: Channel[];
  activeChannelId: string | null;
  canAddChannel: boolean;
  onChannelSelect: (channelId: string) => void;
  onUpgradePrompt: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const activeChannel = channels.find((c) => c.channel_id === activeChannelId);

  useDropdownDismiss(ref, close, open);

  const handleSelect = (channelId: string) => {
    setOpen(false);
    onChannelSelect(channelId);
  };

  return (
    <div ref={ref} className={s.channelSelector}>
      <button
        className={s.channelBtn}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Select channel"
        type="button"
      >
        <ChannelThumb channel={activeChannel} size={24} />
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
      </button>

      {open && (
        <div className={s.channelDropdown}>
          {channels.map((channel) => (
            <button
              key={channel.channel_id}
              className={`${s.channelOption} ${
                channel.channel_id === activeChannelId ? s.channelOptionActive : ""
              }`}
              onClick={() => handleSelect(channel.channel_id)}
              type="button"
            >
              {channel.thumbnailUrl ? (
                <Image
                  src={channel.thumbnailUrl}
                  alt={`${channel.title ?? "YouTube channel"} avatar`}
                  width={32}
                  height={32}
                  className={s.channelOptionThumb}
                  sizes="32px"
                />
              ) : (
                <div className={s.channelOptionThumbPlaceholder} />
              )}
              <span className={s.channelOptionName}>
                {channel.title ?? "Untitled Channel"}
              </span>
              {channel.channel_id === activeChannelId && (
                <svg
                  width="16"
                  height="16"
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
            onUpgradePrompt={() => { setOpen(false); onUpgradePrompt(); }}
          />
        </div>
      )}
    </div>
  );
}

function ChannelThumb({ channel, size }: { channel?: Channel; size: number }) {
  if (channel?.thumbnailUrl) {
    return (
      <Image
        src={channel.thumbnailUrl}
        alt={`${channel.title ?? "Selected channel"} avatar`}
        width={size}
        height={size}
        className={s.channelThumb}
        sizes={`${size}px`}
      />
    );
  }
  return (
    <div className={s.channelThumbPlaceholder}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );

  if (canAdd) {
    return (
      <a href="/api/integrations/google/start" className={s.addChannelLink} onClick={onClose}>
        {icon} Add Channel
      </a>
    );
  }

  return (
    <button className={s.addChannelLink} onClick={onUpgradePrompt} type="button">
      {icon} Add Channel
    </button>
  );
}

function UserDropdown({
  userEmail,
  userName,
  isAdmin,
}: {
  userEmail: string;
  userName: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const initials = getInitials(userName || userEmail);

  useDropdownDismiss(ref, close, open);

  return (
    <div ref={ref} className={s.userMenuWrapper}>
      <button
        onClick={() => setOpen(!open)}
        className={s.userMenuBtn}
        aria-label="Account menu"
        aria-expanded={open}
        type="button"
      >
        <div className={s.avatar}>{initials}</div>
        <span className={s.userName}>
          {userName || truncateEmail(userEmail)}
        </span>
        <span className={s.menuChevron}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <div className={s.backdrop} role="presentation" onClick={() => setOpen(false)} />
          <div className={s.dropdown}>
            <div className={s.dropdownEmail}>{userEmail}</div>

            {accountNavItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={s.dropdownItem}
                onClick={() => setOpen(false)}
              >
                <NavIcon type={item.icon} size={16} />
                {item.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin/youtube-usage"
                className={s.dropdownItem}
                onClick={() => setOpen(false)}
              >
                <NavIcon type="settings" size={16} />
                Admin: API Usage
              </Link>
            )}

            <div className={s.dropdownDivider} />

            <button
              className={`${s.dropdownItem} ${s.dropdownSignout}`}
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
              type="button"
            >
              <NavIcon type="logout" size={16} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function UpgradePromptModal({
  channelLimit,
  onClose,
}: {
  channelLimit: number;
  onClose: () => void;
}) {
  const canUpgrade = channelLimit < LIMITS.PRO_MAX_CONNECTED_CHANNELS;
  const description = canUpgrade
    ? `Your current plan allows ${channelLimit} channel${channelLimit === 1 ? "" : "s"}. Upgrade to Pro to connect up to ${LIMITS.PRO_MAX_CONNECTED_CHANNELS} channels.`
    : `You've reached the maximum of ${channelLimit} channels for your plan.`;

  return (
    <div className={s.modalOverlay} role="presentation" onClick={onClose}>
      <div className={s.modal} role="presentation" onClick={(e) => e.stopPropagation()}>
        <button
          className={s.modalClose}
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className={s.modalIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className={s.modalTitle}>Channel Limit Reached</h3>
        <p className={s.modalDesc}>{description}</p>
        {canUpgrade && (
          <Link
            href="/api/integrations/stripe/checkout"
            className={s.modalUpgradeBtn}
            onClick={onClose}
          >
            Upgrade to Pro
          </Link>
        )}
        <button className={s.modalDismissBtn} onClick={onClose} type="button">
          {canUpgrade ? "Maybe Later" : "Got it"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function AppHeader({
  channels,
  activeChannelId,
  userEmail,
  userName,
  plan,
  channelLimit,
  isAdmin = false,
  onChannelChange,
  mobileNavSlot,
}: AppHeaderProps) {
  void plan;
  const pathname = usePathname();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const pageTitle = getPageTitle(pathname);
  const canAddChannel = channels.length < channelLimit;

  const handleChannelSelect = (channelId: string) => {
    onChannelChange?.(channelId);
  };

  return (
    <>
      <header className={s.header}>
        <div className={s.inner}>
          <div className={s.leftSection}>
            {mobileNavSlot}
            <p className={s.pageTitle}>{pageTitle}</p>
          </div>

          <div className={s.centerSection}>
            {channels.length > 0 && (
              <ChannelSelector
                channels={channels}
                activeChannelId={activeChannelId}
                canAddChannel={canAddChannel}
                onChannelSelect={handleChannelSelect}
                onUpgradePrompt={() => setShowUpgradePrompt(true)}
              />
            )}
          </div>

          <div className={s.rightSection}>
            {userEmail ? (
              <UserDropdown
                userEmail={userEmail}
                userName={userName}
                isAdmin={isAdmin}
              />
            ) : (
              <Link href="/auth/login?redirect=/dashboard" className={s.signInBtn}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {showUpgradePrompt && (
        <UpgradePromptModal
          channelLimit={channelLimit}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getInitials(name: string): string {
  if (!name) {return "?";}
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const lastPart = parts.at(-1);
  return (parts[0][0] + (lastPart?.[0] ?? "")).toUpperCase();
}

function truncateEmail(email: string): string {
  if (!email) {return "";}
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) {return email;}
  const localPart = email.slice(0, Math.max(0, atIndex));
  if (localPart.length <= 8) {return localPart;}
  return `${localPart.slice(0, 8)  }…`;
}
