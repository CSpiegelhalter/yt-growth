"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef,useState } from "react";
import { createPortal } from "react-dom";

import { useBodyScrollLock } from "@/lib/client/use-body-scroll-lock";
import { useFocusTrap } from "@/lib/client/use-focus-trap";
import type { SerializableNavItem } from "@/lib/server/nav-config.server";
import { BRAND } from "@/lib/shared/brand";
import { getNavHref } from "@/lib/shared/nav-config";

import s from "./MobileNav.module.css";
import { NavIcon } from "./NavIcon";

type MobileNavProps = {
  activeChannelId: string | null;
  /** Filtered primary nav items (from server) */
  primaryNavItems: SerializableNavItem[];
  /** Filtered secondary nav items (from server) */
  secondaryNavItems: SerializableNavItem[];
};

/**
 * Check if a nav item is active based on current pathname.
 */
function isNavItemActive(item: SerializableNavItem, pathname: string): boolean {
  switch (item.matchPattern) {
    case "dashboard": {
      return pathname === "/dashboard" || pathname.startsWith("/video/");
    }
    case "competitors": {
      return pathname === "/competitors" || pathname.startsWith("/competitors/");
    }
    default: {
      return pathname === item.href;
    }
  }
}

/**
 * Mobile navigation component with hamburger menu and slide-in drawer.
 * Includes:
 * - Focus trap when open
 * - Escape key closes drawer
 * - Click outside closes drawer
 * - Proper ARIA attributes
 *
 * Nav items are passed in from the server after being filtered
 * by feature flags.
 */
export function MobileNav({
  activeChannelId,
  primaryNavItems,
  secondaryNavItems,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) {return;}

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  useFocusTrap(drawerRef, isOpen);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // State to track if we can use portal (client-side only)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render drawer content via portal to escape header stacking context
  const drawerContent = isOpen ? (
    <>
      {/* Backdrop */}
      <div
        className={s.backdrop}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer Header */}
        <div className={s.drawerHeader}>
          <Link
            href="/"
            className={s.logo}
            onClick={handleClose}
            aria-label={`${BRAND.name} - Go to home`}
          >
            <span className={s.logoIcon} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40.2546 21C41.2185 21 42.0075 21.7828 41.9275 22.7435C41.6327 26.2822 40.4442 29.6987 38.4609 32.667C36.1534 36.1204 32.8736 38.812 29.0364 40.4015C25.1991 41.9909 20.9767 42.4068 16.9031 41.5965C12.8295 40.7862 9.08766 38.7861 6.15076 35.8492C3.21385 32.9123 1.2138 29.1705 0.403509 25.0969C-0.406781 21.0233 0.00908955 16.8009 1.59853 12.9636C3.18797 9.1264 5.87959 5.84665 9.33302 3.53914C12.3013 1.55579 15.7178 0.367275 19.2565 0.0724872C20.2172 -0.0075384 21 0.781453 21 1.74542C21 2.7094 20.2166 3.48183 19.2574 3.57777C16.4101 3.86255 13.6664 4.84206 11.2724 6.44167C8.39307 8.3656 6.14888 11.1002 4.82365 14.2995C3.49843 17.4989 3.15169 21.0194 3.82728 24.4159C4.50288 27.8123 6.17046 30.9321 8.61916 33.3808C11.0679 35.8295 14.1877 37.4971 17.5841 38.1727C20.9806 38.8483 24.5011 38.5016 27.7005 37.1763C30.8998 35.8511 33.6344 33.6069 35.5583 30.7276C37.1579 28.3336 38.1375 25.5899 38.4222 22.7426C38.5182 21.7834 39.2906 21 40.2546 21Z" fill="url(#mobileLogoGrad)"/>
                <path d="M25 20.75V27C25 27 28.7875 26.3125 30 24.5C31.35 22.475 30 18.25 30 18.25" fill="#222A68" stroke="#222A68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.625 22.6252C13.75 24.2002 2 39.5 2 39.5C2 39.5 17.8 28.2502 19.375 26.3752C20.2625 25.3252 20.25 23.7127 19.2625 22.7377C18.7766 22.2739 18.1366 22.006 17.4653 21.9852C16.7939 21.9644 16.1386 22.1923 15.625 22.6252Z" fill="#222A68" stroke="#222A68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21.25 16.9998C21.9152 15.2741 22.7528 13.6199 23.75 12.0623C25.2065 9.73355 27.2345 7.81613 29.6413 6.49244C32.048 5.16874 34.7533 4.48279 37.5 4.49982C37.5 7.89982 36.525 13.8748 30 18.2498C28.4209 19.2479 26.7459 20.0854 25 20.7498L21.25 16.9998Z" fill="#222A68" stroke="#222A68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21.25 17.0002H15C15 17.0002 15.6875 13.2127 17.5 12.0002C19.525 10.6502 23.75 12.0627 23.75 12.0627" fill="#222A68" stroke="#222A68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="mobileLogoGrad" x1="2.5" y1="14" x2="31" y2="42.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#CA1F7B"/><stop offset="0.456731" stopColor="white"/><stop offset="1" stopColor="#35A7FF"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className={s.logoText}>{BRAND.name}</span>
          </Link>
          <button
            className={s.closeBtn}
            onClick={handleClose}
            aria-label="Close navigation menu"
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className={s.nav}>
          <div className={s.navSection}>
            <span className={s.navSectionLabel}>Growth</span>
            <ul className={s.navList} role="list">
              {primaryNavItems.map((item) => (
                <MobileNavItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  activeChannelId={activeChannelId}
                  onNavigate={handleClose}
                />
              ))}
            </ul>
          </div>

          <div className={s.navSection}>
            <span className={s.navSectionLabel}>Resources</span>
            <ul className={s.navList} role="list">
              {secondaryNavItems.map((item) => (
                <MobileNavItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  activeChannelId={activeChannelId}
                  onNavigate={handleClose}
                />
              ))}
            </ul>
          </div>
        </nav>

        {/* Legal Links */}
        <div className={s.legalSection}>
          <Link href="/privacy" className={s.legalLink} onClick={handleClose}>
            Privacy
          </Link>
          <span className={s.legalDivider}>·</span>
          <Link href="/terms" className={s.legalLink} onClick={handleClose}>
            Terms
          </Link>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        ref={triggerRef}
        className={s.hamburger}
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        aria-label="Open navigation menu"
        type="button"
      >
        <span className={s.hamburgerLine} />
        <span className={s.hamburgerLine} />
        <span className={s.hamburgerLine} />
      </button>

      {/* Portal the drawer to body to escape stacking context */}
      {mounted && drawerContent && createPortal(drawerContent, document.body)}
    </>
  );
}

/* ---------- Mobile Nav Item ---------- */

type MobileNavItemProps = {
  item: SerializableNavItem;
  pathname: string;
  activeChannelId: string | null;
  onNavigate: () => void;
};

function MobileNavItem({
  item,
  pathname,
  activeChannelId,
  onNavigate,
}: MobileNavItemProps) {
  const isActive = isNavItemActive(item, pathname);
  const href = getNavHref(item, activeChannelId);

  return (
    <li>
      <Link
        href={href}
        className={`${s.navLink} ${isActive ? s.navLinkActive : ""}`}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
      >
        <span className={s.navIcon}>
          <NavIcon type={item.icon} size={20} />
        </span>
        <span className={s.navLabel}>{item.label}</span>
      </Link>
    </li>
  );
}
