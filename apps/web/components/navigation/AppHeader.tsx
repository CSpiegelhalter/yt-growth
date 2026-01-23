"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { getPageTitle, accountNavItems } from "@/lib/nav-config";
import { NavIcon } from "./NavIcon";
import { LIMITS } from "@/lib/product";
import s from "./AppHeader.module.css";

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
  userEmail: string;
  userName: string | null;
  plan: Plan;
  channelLimit: number;
  isAdmin?: boolean;
  onChannelChange?: (channelId: string) => void;
  mobileNavSlot?: React.ReactNode;
};

/**
 * App header for authenticated pages.
 * Contains:
 * - Mobile nav trigger (hamburger)
 * - Page title
 * - Channel selector
 * - User dropdown (account actions only)
 */
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
  const searchParams = useSearchParams();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);

  const pageTitle = getPageTitle(pathname);
  const activeChannel = channels.find((c) => c.channel_id === activeChannelId);
  const userInitials = getInitials(userName || userEmail);
  const canAddChannel = channels.length < channelLimit;

  // Close dropdowns on outside click
  useEffect(() => {
    if (!menuOpen && !channelDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (channelRef.current && !channelRef.current.contains(e.target as Node)) {
        setChannelDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, channelDropdownOpen]);

  // Close dropdowns on escape
  useEffect(() => {
    if (!menuOpen && !channelDropdownOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setChannelDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen, channelDropdownOpen]);

  const handleChannelSelect = (channelId: string) => {
    setChannelDropdownOpen(false);
    
    if (onChannelChange) {
      onChannelChange(channelId);
      return;
    }

    // Default channel change behavior
    localStorage.setItem("activeChannelId", channelId);

    // If on a video page, redirect to dashboard
    if (isVideoPath(pathname)) {
      router.push(`/dashboard?channelId=${channelId}`);
      return;
    }

    // If on a channel-scoped page, update the URL
    if (isChannelScopedPath(pathname)) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("channelId", channelId);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      router.refresh();
    }
  };

  return (
    <>
      <header className={s.header}>
        <div className={s.inner}>
          {/* Left: Mobile nav + Page title */}
          <div className={s.leftSection}>
            {mobileNavSlot}
            <h1 className={s.pageTitle}>{pageTitle}</h1>
          </div>

          {/* Center: Channel selector */}
          <div className={s.centerSection}>
            {channels.length > 0 && (
              <div ref={channelRef} className={s.channelSelector}>
                <button
                  className={s.channelBtn}
                  onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
                  aria-expanded={channelDropdownOpen}
                  aria-label="Select channel"
                  type="button"
                >
                  {activeChannel?.thumbnailUrl ? (
                    <Image
                      src={activeChannel.thumbnailUrl}
                      alt={`${activeChannel.title ?? "Selected channel"} avatar`}
                      width={24}
                      height={24}
                      className={s.channelThumb}
                      sizes="24px"
                    />
                  ) : (
                    <div className={s.channelThumbPlaceholder}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                      </svg>
                    </div>
                  )}
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
                    className={channelDropdownOpen ? s.chevronUp : ""}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Channel Dropdown */}
                {channelDropdownOpen && (
                  <div className={s.channelDropdown}>
                    {channels.map((channel) => (
                      <button
                        key={channel.channel_id}
                        className={`${s.channelOption} ${
                          channel.channel_id === activeChannelId ? s.channelOptionActive : ""
                        }`}
                        onClick={() => handleChannelSelect(channel.channel_id)}
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
                    {canAddChannel ? (
                      <a
                        href="/api/integrations/google/start"
                        className={s.addChannelLink}
                        onClick={() => setChannelDropdownOpen(false)}
                      >
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
                        Add Channel
                      </a>
                    ) : (
                      <button
                        className={s.addChannelLink}
                        onClick={() => {
                          setChannelDropdownOpen(false);
                          setShowUpgradePrompt(true);
                        }}
                        type="button"
                      >
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
                        Add Channel
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: User menu */}
          <div className={s.rightSection}>
            <div ref={menuRef} className={s.userMenuWrapper}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={s.userMenuBtn}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                type="button"
              >
                <div className={s.avatar}>{userInitials}</div>
                <span className={s.userName}>
                  {userName || truncateEmail(userEmail)}
                </span>
                <span className={s.menuChevron}>{menuOpen ? "▲" : "▼"}</span>
              </button>

              {menuOpen && (
                <>
                  <div className={s.backdrop} onClick={() => setMenuOpen(false)} />
                  <div className={s.dropdown}>
                    <div className={s.dropdownEmail}>{userEmail}</div>

                    {accountNavItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={s.dropdownItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <NavIcon type={item.icon} size={16} />
                        {item.label}
                      </Link>
                    ))}

                    {isAdmin && (
                      <Link
                        href="/admin/youtube-usage"
                        className={s.dropdownItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <NavIcon type="settings" size={16} />
                        Admin: API Usage
                      </Link>
                    )}

                    <div className={s.dropdownDivider} />

                    <button
                      className={`${s.dropdownItem} ${s.dropdownSignout}`}
                      onClick={() => {
                        setMenuOpen(false);
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
          </div>
        </div>
      </header>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className={s.modalOverlay} onClick={() => setShowUpgradePrompt(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={s.modalClose}
              onClick={() => setShowUpgradePrompt(false)}
              type="button"
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className={s.modalIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className={s.modalTitle}>Channel Limit Reached</h3>
            <p className={s.modalDesc}>
              {channelLimit < LIMITS.PRO_MAX_CONNECTED_CHANNELS
                ? `Your current plan allows ${channelLimit} channel${channelLimit === 1 ? "" : "s"}. Upgrade to Pro to connect up to ${LIMITS.PRO_MAX_CONNECTED_CHANNELS} channels.`
                : `You've reached the maximum of ${channelLimit} channels for your plan.`}
            </p>
            {channelLimit < LIMITS.PRO_MAX_CONNECTED_CHANNELS && (
              <Link
                href="/api/integrations/stripe/checkout"
                className={s.modalUpgradeBtn}
                onClick={() => setShowUpgradePrompt(false)}
              >
                Upgrade to Pro
              </Link>
            )}
            <button
              className={s.modalDismissBtn}
              onClick={() => setShowUpgradePrompt(false)}
              type="button"
            >
              {channelLimit < LIMITS.PRO_MAX_CONNECTED_CHANNELS ? "Maybe Later" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Helpers ---------- */

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function truncateEmail(email: string): string {
  if (!email) return "";
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return email;
  const localPart = email.substring(0, atIndex);
  if (localPart.length <= 8) return localPart;
  return localPart.substring(0, 8) + "…";
}

function isChannelScopedPath(pathname: string): boolean {
  if (pathname === "/dashboard") return true;
  if (pathname === "/ideas") return true;
  if (pathname === "/goals") return true;
  if (pathname === "/subscriber-insights") return true;
  if (pathname === "/competitors") return true;
  if (pathname.startsWith("/video/")) return true;
  if (pathname.startsWith("/competitors/video/")) return true;
  return false;
}

function isVideoPath(pathname: string): boolean {
  return pathname.startsWith("/video/") || pathname.startsWith("/competitors/video/");
}
