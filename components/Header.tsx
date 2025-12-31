"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import s from "./Header.module.css";
import { BRAND } from "@/lib/brand";
import { LIMITS, SUBSCRIPTION, formatUsd } from "@/lib/product";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import type { ApiErrorResponse } from "@/lib/client/api";

type Channel = {
  id: number;
  channel_id: string;
  title: string | null;
  thumbnailUrl: string | null;
};

type Plan = "FREE" | "PRO" | "ENTERPRISE";

/**
 * Site header with auth-aware navigation and channel selector.
 * Mobile-first design with dropdown menu for logged-in users.
 * Uses useSession() for reactive auth state updates.
 */
export function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelLimit, setChannelLimit] = useState<number>(1);
  const [plan, setPlan] = useState<Plan>("FREE");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [mounted, setMounted] = useState(false);
  const autoSignOutTriggeredRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mark as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load channels and active channel
  useEffect(() => {
    if (!session?.user) return;

    async function loadChannels() {
      try {
        const data = await apiFetchJson<any>("/api/me/channels", {
          cache: "no-store",
        });
        const channelList = Array.isArray(data) ? data : data.channels;
        setChannels(channelList);

        if (data.channelLimit !== undefined) {
          setChannelLimit(data.channelLimit);
        }
        if (data.plan) {
          setPlan(data.plan);
        }

        const urlChannelId = searchParams.get("channelId");
        const storedChannelId = localStorage.getItem("activeChannelId");
        let nextActiveChannelId: string | null = null;

        if (
          urlChannelId &&
          channelList.some((c: Channel) => c.channel_id === urlChannelId)
        ) {
          nextActiveChannelId = urlChannelId;
        } else if (
          storedChannelId &&
          channelList.some((c: Channel) => c.channel_id === storedChannelId)
        ) {
          nextActiveChannelId = storedChannelId;
        } else if (channelList.length > 0) {
          nextActiveChannelId = channelList[0].channel_id;
        } else {
          // No channels - clear active channel
          nextActiveChannelId = null;
        }

        setActiveChannelId(nextActiveChannelId);
        if (nextActiveChannelId) {
          localStorage.setItem("activeChannelId", nextActiveChannelId);
        } else {
          localStorage.removeItem("activeChannelId");
        }

        // Server bootstrap resolves active channel ONLY from the URL.
        // If we're on a channel-scoped page and have a valid active channel,
        // keep `?channelId=` in sync so page data matches the header selection.
        if (
          nextActiveChannelId &&
          isChannelScopedPath(pathname) &&
          urlChannelId !== nextActiveChannelId
        ) {
          const next = new URLSearchParams(searchParams.toString());
          next.set("channelId", nextActiveChannelId);
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
          router.refresh();
        }
      } catch (error) {
        // If session is stale, sign out so the UI doesn't get stuck.
        if (isApiClientError(error) && error.status === 401) {
          if (!autoSignOutTriggeredRef.current) {
            autoSignOutTriggeredRef.current = true;
            await signOut({ callbackUrl: "/" });
          }
          return;
        }
        console.error("Failed to load channels:", error);
      }
    }

    loadChannels();
  }, [session?.user, searchParams, pathname, router]);

  // Listen for channel-removed events (from Profile page)
  useEffect(() => {
    const handleChannelRemoved = (e: CustomEvent<{ channelId: string }>) => {
      const removedChannelId = e.detail.channelId;

      setChannels((prev) => {
        const updated = prev.filter((c) => c.channel_id !== removedChannelId);

        // If the removed channel was active, select another or clear
        if (activeChannelId === removedChannelId) {
          if (updated.length > 0) {
            setActiveChannelId(updated[0].channel_id);
            localStorage.setItem("activeChannelId", updated[0].channel_id);
          } else {
            setActiveChannelId(null);
            localStorage.removeItem("activeChannelId");
          }
        }

        return updated;
      });
    };

    window.addEventListener(
      "channel-removed",
      handleChannelRemoved as EventListener
    );
    return () => {
      window.removeEventListener(
        "channel-removed",
        handleChannelRemoved as EventListener
      );
    };
  }, [activeChannelId]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen && !channelDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (
        channelRef.current &&
        !channelRef.current.contains(e.target as Node)
      ) {
        setChannelDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, channelDropdownOpen]);

  // Close menu on escape key
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
    setActiveChannelId(channelId);
    localStorage.setItem("activeChannelId", channelId);
    setChannelDropdownOpen(false);

    // If on a video page, redirect to dashboard (video is tied to old channel).
    if (isVideoPath(pathname)) {
      router.push(`/dashboard?channelId=${channelId}`);
      return;
    }

    // If on a channel-scoped page, update the URL (so server bootstrap + page state update).
    if (isChannelScopedPath(pathname)) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("channelId", channelId);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      router.refresh();
    }
  };

  const isLoggedIn = status === "authenticated" && session !== null;
  const isLoading = status === "loading";
  const userEmail = session?.user?.email ?? "";
  const userInitials = getInitials(session?.user?.name || userEmail);
  const activeChannel = channels.find((c) => c.channel_id === activeChannelId);

  const navLinks = useMemo(
    () => [
      { href: "/dashboard", label: "Videos", icon: "video" as const },
      { href: "/ideas", label: "Ideas", icon: "lightbulb" as const },
      {
        href: "/subscriber-insights",
        label: "Subscriber Insights",
        icon: "trending" as const,
      },
      { href: "/competitors", label: "Competitors", icon: "trophy" as const },
    ],
    []
  );

  const isAdmin = useMemo(() => {
    const email = String(session?.user?.email ?? "").toLowerCase();
    const allow = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allow.length === 0) return false;
    return allow.includes(email);
  }, [session?.user?.email]);

  // Helper to determine if user can add more channels
  const canAddChannel = channels.length < channelLimit;

  return (
    <>
      <header className={s.header}>
        <div className={s.inner}>
          <div className={s.leftSection}>
            {/* Logo */}
            <Link
              href="/"
              className={s.logo}
              aria-label={`${BRAND.name} - Go to homepage`}
            >
              <span className={s.logoIcon} aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              <span className={s.logoText}>{BRAND.name}</span>
            </Link>
          </div>

          <div className={s.centerSection}>
            {/* Channel Selector (only when logged in and has channels) */}
            {mounted && isLoggedIn && channels.length > 0 && (
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
                      alt={`${
                        activeChannel.title ?? "Selected channel"
                      } avatar`}
                      width={24}
                      height={24}
                      className={s.channelThumb}
                      sizes="24px"
                    />
                  ) : (
                    <div className={s.channelThumbPlaceholder}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
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
                          channel.channel_id === activeChannelId
                            ? s.channelOptionActive
                            : ""
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
                    {channels.length < channelLimit ? (
                      // IMPORTANT: Use a plain <a> (hard navigation) for API redirect endpoints.
                      // Using next/link here triggers a client-side navigation/prefetch attempt that can
                      // briefly throw a navigation/fetch error before the browser follows the redirect
                      // to accounts.google.com.
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

          <div className={s.rightSection}>
            {/* Auth Section */}
            <div className={s.authSection}>
              {!mounted || isLoading ? (
                <div className={s.placeholder} />
              ) : isLoggedIn ? (
                <div ref={menuRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={s.userMenuBtn}
                    aria-label="User menu"
                    aria-expanded={menuOpen}
                    type="button"
                  >
                    <div className={s.avatar}>{userInitials}</div>
                    <span className={s.userName}>
                      {session?.user?.name || truncateEmail(userEmail)}
                    </span>
                    <span className={s.menuChevron}>
                      {menuOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {menuOpen && (
                    <>
                      <div
                        className={s.backdrop}
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className={s.dropdown}>
                        <div className={s.dropdownEmail}>{userEmail}</div>

                        {navLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={withChannelId(link.href, activeChannelId)}
                            className={s.dropdownItem}
                            onClick={() => setMenuOpen(false)}
                          >
                            <DropdownIcon type={link.icon} />
                            {link.label}
                          </Link>
                        ))}

                        <div className={s.dropdownDivider} />

                        <Link
                          href="/saved-ideas"
                          className={s.dropdownItem}
                          onClick={() => setMenuOpen(false)}
                        >
                          <DropdownIcon type="bookmark" />
                          Saved Ideas
                        </Link>

                        <Link
                          href="/profile"
                          className={s.dropdownItem}
                          onClick={() => setMenuOpen(false)}
                        >
                          <DropdownIcon type="user" />
                          Profile
                        </Link>

                        <Link
                          href="/contact"
                          className={s.dropdownItem}
                          onClick={() => setMenuOpen(false)}
                        >
                          <DropdownIcon type="mail" />
                          Contact
                        </Link>

                        <Link
                          href="/learn"
                          className={s.dropdownItem}
                          onClick={() => setMenuOpen(false)}
                        >
                          <DropdownIcon type="book" />
                          Learn
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/admin/youtube-usage"
                            className={s.dropdownItem}
                            onClick={() => setMenuOpen(false)}
                          >
                            <DropdownIcon type="settings" />
                            Admin: API Usage
                          </Link>
                        )}

                        <div className={s.dropdownDivider} />

                        <Link
                          href="/api/auth/signout"
                          className={`${s.dropdownItem} ${s.dropdownSignout}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setMenuOpen(false);
                            void signOut({ callbackUrl: "/" });
                          }}
                        >
                          <DropdownIcon type="logout" />
                          Sign out
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/contact" className={s.contactBtn}>
                    Contact
                  </Link>
                  <Link href="/auth/login" className={s.loginBtn}>
                    Log in
                  </Link>
                  <Link href="/auth/signup" className={s.signupBtn}>
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div
          className={s.modalOverlay}
          onClick={() => setShowUpgradePrompt(false)}
        >
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
              {plan === "FREE"
                ? `Free accounts can connect ${
                    LIMITS.FREE_MAX_CONNECTED_CHANNELS
                  } YouTube channel. Upgrade to Pro to connect up to ${
                    LIMITS.PRO_MAX_CONNECTED_CHANNELS
                  } channels for ${formatUsd(
                    SUBSCRIPTION.PRO_MONTHLY_PRICE_USD
                  )}/${SUBSCRIPTION.PRO_INTERVAL}.`
                : `You've reached the maximum of ${channelLimit} channels for your plan.`}
            </p>
            {plan === "FREE" && (
              <Link
                href="/api/integrations/stripe/checkout"
                className={s.modalUpgradeBtn}
                onClick={() => setShowUpgradePrompt(false)}
              >
                Upgrade to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}
                /{SUBSCRIPTION.PRO_INTERVAL}
              </Link>
            )}
            <button
              className={s.modalDismissBtn}
              onClick={() => setShowUpgradePrompt(false)}
              type="button"
            >
              {plan === "FREE" ? "Maybe later" : "Got it"}
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

/* ---------- Dropdown Icon Component ---------- */

type IconType =
  | "video"
  | "lightbulb"
  | "trending"
  | "trophy"
  | "bookmark"
  | "user"
  | "mail"
  | "settings"
  | "logout"
  | "book";

function DropdownIcon({ type }: { type: IconType }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "video":
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M10 9l5 3-5 3V9z" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg {...props}>
          <path d="M12 2a7 7 0 0 0-4 12.88V17h8v-2.12A7 7 0 0 0 12 2z" />
          <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
          <path d="M9.5 21h5" />
        </svg>
      );
    case "trending":
      return (
        <svg {...props}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...props}>
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 1012 0V2z" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...props}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 00-16 0" />
        </svg>
      );
    case "mail":
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 6l-10 7L2 6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    default:
      return null;
  }
}

function isChannelScopedPath(pathname: string): boolean {
  // Pages where data is scoped to the "active channel" and should respond to channel changes.
  if (pathname === "/dashboard") return true;
  if (pathname === "/ideas") return true;
  if (pathname === "/subscriber-insights") return true;
  if (pathname === "/competitors") return true;
  if (pathname.startsWith("/video/")) return true;
  if (pathname.startsWith("/competitors/video/")) return true;
  return false;
}

function isVideoPath(pathname: string): boolean {
  // Video detail pages - should redirect to dashboard on channel switch.
  return pathname.startsWith("/video/") || pathname.startsWith("/competitors/video/");
}

function withChannelId(href: string, channelId: string | null): string {
  if (!channelId) return href;
  // Only append channelId for channel-scoped pages.
  if (!isChannelScopedPath(href)) return href;

  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("channelId", channelId);
  return `${path}?${params.toString()}`;
}
