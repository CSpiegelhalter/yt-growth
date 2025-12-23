"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import s from "./Header.module.css";

type Channel = {
  id: number;
  channel_id: string;
  title: string | null;
  thumbnailUrl: string | null;
};

type HeaderProps = {
  session?: unknown; // Legacy prop, no longer used
};

/**
 * Site header with auth-aware navigation and channel selector.
 * Mobile-first design with dropdown menu for logged-in users.
 * Uses useSession() for reactive auth state updates.
 */
export function Header(_props: HeaderProps) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
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
        const res = await fetch("/api/me/channels", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setChannels(data);

          // Set active channel from URL or localStorage or first channel
          const urlChannelId = searchParams.get("channelId");
          const storedChannelId = localStorage.getItem("activeChannelId");

          if (
            urlChannelId &&
            data.some((c: Channel) => c.channel_id === urlChannelId)
          ) {
            setActiveChannelId(urlChannelId);
            localStorage.setItem("activeChannelId", urlChannelId);
          } else if (
            storedChannelId &&
            data.some((c: Channel) => c.channel_id === storedChannelId)
          ) {
            setActiveChannelId(storedChannelId);
          } else if (data.length > 0) {
            setActiveChannelId(data[0].channel_id);
            localStorage.setItem("activeChannelId", data[0].channel_id);
          }
        }
      } catch (error) {
        console.error("Failed to load channels:", error);
      }
    }

    loadChannels();
  }, [session?.user, searchParams]);

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

    // If on a channel-specific page, update the URL
    if (
      pathname.includes("/audit/") ||
      pathname.includes("/ideas") ||
      pathname.includes("/converters") ||
      pathname.includes("/competitors")
    ) {
      router.push(`${pathname}?channelId=${channelId}`);
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
        href: "/converters",
        label: "Subscriber Drivers",
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

  return (
    <header className={s.header}>
      <div className={s.leftSection}>
        {/* Logo */}
        <Link href="/" className={s.logo}>
          <span className={s.logoIcon}>
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
          <span className={s.logoText}>YT Growth</span>
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
                <img
                  src={activeChannel.thumbnailUrl}
                  alt=""
                  className={s.channelThumb}
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
                      <img
                        src={channel.thumbnailUrl}
                        alt=""
                        className={s.channelOptionThumb}
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
                <Link
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
                </Link>
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
                <span className={s.menuChevron}>{menuOpen ? "▲" : "▼"}</span>
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
                        href={link.href}
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
                      onClick={() => setMenuOpen(false)}
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
    </header>
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
  | "logout";

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
          <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h2M18.36 4.93l.71-.71M23 12h-2M15.5 15a3.5 3.5 0 10-7 0c0 1.57.75 2.97 1.91 3.85.34.26.59.63.59 1.06V21h4v-1.09c0-.43.25-.8.59-1.06A3.98 3.98 0 0015.5 15z" />
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
    default:
      return null;
  }
}
