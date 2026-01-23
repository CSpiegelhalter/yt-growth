"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavHref } from "@/lib/nav-config";
import type { SerializableNavItem } from "@/lib/nav-config.server";
import { NavIcon } from "./NavIcon";
import { BRAND } from "@/lib/brand";
import s from "./MobileNav.module.css";

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
    case "dashboard":
      return pathname === "/dashboard" || pathname.startsWith("/video/");
    case "competitors":
      return pathname === "/competitors" || pathname.startsWith("/competitors/");
    default:
      return pathname === item.href;
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
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when opening
    firstElement?.focus();

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

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
              <svg
                width="24"
                height="24"
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
