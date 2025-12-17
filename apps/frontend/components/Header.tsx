"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import s from "./Header.module.css";

type HeaderProps = {
  session: Session | null;
};

/**
 * Site header with auth-aware navigation.
 * Mobile-first design with dropdown menu for logged-in users.
 */
export function Header({ session: serverSession }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(serverSession);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mark as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with server session on prop change
  useEffect(() => {
    setSession(serverSession);
  }, [serverSession]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Close menu on escape key
  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const isLoggedIn = session !== null;
  const userEmail = session?.user?.email ?? "";
  const userInitials = getInitials(session?.user?.name || userEmail);

  return (
    <header className={s.header}>
      {/* Logo */}
      <Link href="/" className={s.logo}>
        <span className={s.logoIcon}>📈</span>
        <span className={s.logoText}>YT Growth</span>
      </Link>

      {/* Desktop Nav Links (only when logged in) */}
      {mounted && isLoggedIn && (
        <nav className={s.desktopNav}>
          <Link href="/dashboard" className={s.navLink}>
            Dashboard
          </Link>
          <Link href="/profile" className={s.navLink}>
            Profile
          </Link>
        </nav>
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
              <span className={s.userName}>{session?.user?.name || truncateEmail(userEmail)}</span>
              <span className={s.menuChevron}>{menuOpen ? "▲" : "▼"}</span>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div className={s.backdrop} onClick={() => setMenuOpen(false)} />
                <div className={s.dropdown}>
                  <div className={s.dropdownEmail}>{userEmail}</div>
                  <Link
                    href="/dashboard"
                    className={s.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={s.dropdownItemIcon}>📊</span>
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className={s.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={s.dropdownItemIcon}>👤</span>
                    Profile
                  </Link>
                  <div className={s.dropdownDivider} />
                  <Link
                    href="/api/auth/signout"
                    className={`${s.dropdownItem} ${s.dropdownSignout}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={s.dropdownItemIcon}>🚪</span>
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
