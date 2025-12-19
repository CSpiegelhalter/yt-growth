"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import type { Session } from "next-auth";
import s from "./Header.module.css";

type Channel = {
  id: number;
  channel_id: string;
  title: string | null;
  thumbnailUrl: string | null;
};

type HeaderProps = {
  session: Session | null;
};

/**
 * Site header with auth-aware navigation and channel selector.
 * Mobile-first design with dropdown menu for logged-in users.
 */
export function Header({ session: serverSession }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(serverSession);
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

  // Sync with server session on prop change
  useEffect(() => {
    setSession(serverSession);
  }, [serverSession]);

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
          
          if (urlChannelId && data.some((c: Channel) => c.channel_id === urlChannelId)) {
            setActiveChannelId(urlChannelId);
            localStorage.setItem("activeChannelId", urlChannelId);
          } else if (storedChannelId && data.some((c: Channel) => c.channel_id === storedChannelId)) {
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
      if (channelRef.current && !channelRef.current.contains(e.target as Node)) {
        setChannelDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, channelDropdownOpen]);

  // Close menu on escape key
  useEffect(() => {
    if (!menuOpen && !mobileNavOpen && !channelDropdownOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileNavOpen(false);
        setChannelDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen, mobileNavOpen, channelDropdownOpen]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId);
    localStorage.setItem("activeChannelId", channelId);
    setChannelDropdownOpen(false);
    
    // If on a channel-specific page, update the URL
    if (pathname.includes("/audit/") || pathname.includes("/ideas") || pathname.includes("/drop-offs") || pathname.includes("/competitors")) {
      router.push(`${pathname}?channelId=${channelId}`);
    }
  };

  const isLoggedIn = session !== null;
  const userEmail = session?.user?.email ?? "";
  const userInitials = getInitials(session?.user?.name || userEmail);
  const activeChannel = channels.find((c) => c.channel_id === activeChannelId);

  // Simplified nav links - channel-centric navigation
  const navLinks = [
    { href: "/dashboard", label: "Videos" },
    { href: "/ideas", label: "Ideas" },
    { href: "/competitors", label: "Competitor Winners" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className={s.header}>
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

      {/* Channel Selector (only when logged in and has channels) */}
      {mounted && isLoggedIn && channels.length > 0 && (
        <div ref={channelRef} className={s.channelSelector}>
          <button
            className={s.channelBtn}
            onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
            aria-expanded={channelDropdownOpen}
            aria-label="Select channel"
          >
            {activeChannel?.thumbnailUrl ? (
              <img
                src={activeChannel.thumbnailUrl}
                alt=""
                className={s.channelThumb}
              />
            ) : (
              <div className={s.channelThumbPlaceholder}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Channel
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Desktop Nav Links (only when logged in) */}
      {mounted && isLoggedIn && (
        <nav className={s.desktopNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${s.navLink} ${
                isActive(link.href) ? s.navLinkActive : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Right Section */}
      <div className={s.rightSection}>
        {/* Mobile Nav Toggle (only when logged in) */}
        {mounted && isLoggedIn && (
          <button
            className={s.mobileNavToggle}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        )}

        {/* Auth Section */}
        <div className={s.authSection}>
          {!mounted ? (
            /* Placeholder during SSR to prevent layout shift */
            <div className={s.placeholder} />
          ) : isLoggedIn ? (
            /* User Menu (logged in) */
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={s.userMenuBtn}
                aria-label="User menu"
                aria-expanded={menuOpen}
              >
                <div className={s.avatar}>{userInitials}</div>
                <span className={s.userName}>
                  {session?.user?.name || truncateEmail(userEmail)}
                </span>
                <span className={s.menuChevron}>{menuOpen ? "▲" : "▼"}</span>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <>
                  <div
                    className={s.backdrop}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className={s.dropdown}>
                    <div className={s.dropdownEmail}>{userEmail}</div>
                    <Link
                      href="/profile"
                      className={s.dropdownItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <div className={s.dropdownDivider} />
                    <Link
                      href="/api/auth/signout"
                      className={`${s.dropdownItem} ${s.dropdownSignout}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign out
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Auth Buttons (logged out) */
            <>
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

      {/* Mobile Navigation */}
      {mounted && isLoggedIn && mobileNavOpen && (
        <>
          <div
            className={s.mobileBackdrop}
            onClick={() => setMobileNavOpen(false)}
          />
          <nav className={s.mobileNav}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${s.mobileNavLink} ${
                  isActive(link.href) ? s.mobileNavLinkActive : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      )}
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
