"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { SerializableNavItem } from "@/lib/server/nav-config.server";
import { getNavHref, sidebarBottomItems } from "@/lib/shared/nav-config";

import s from "./AppSidebar.module.css";
import { Logo } from "./Logo";
import { isNavItemActive } from "./nav-utils";
import { SidebarChannelSelector } from "./SidebarChannelSelector";
import { SidebarIcon } from "./SidebarIcon";

type Channel = {
  channel_id: string;
  id: number;
  title: string | null;
  thumbnailUrl: string | null;
};

type AppSidebarProps = {
  activeChannelId: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  primaryNavItems: SerializableNavItem[];
  secondaryNavItems: SerializableNavItem[];
  channels: Channel[];
  channelLimit: number;
  onChannelChange: (channelId: string) => void;
  mobileOpen?: boolean;
};

/**
 * Desktop sidebar navigation component.
 *
 * Two modes:
 * - Guest: shows only guestAccessible items + warm sign-in footer
 * - Authenticated: shows all items + channel selector + account link
 */
export function AppSidebar({
  activeChannelId,
  collapsed = false,
  onToggleCollapse,
  primaryNavItems,
  secondaryNavItems,
  channels,
  channelLimit,
  onChannelChange,
  mobileOpen = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const isGuest = channels.length === 0;

  const visibleNavItems = isGuest
    ? primaryNavItems.filter((item) => item.guestAccessible)
    : [...primaryNavItems, ...secondaryNavItems];

  return (
    <aside
      className={`${s.sidebar} ${collapsed ? s.collapsed : ""} ${mobileOpen ? s.mobileOpen : ""}`}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={s.logoSection}>
        <Link href="/" className={s.logo} aria-label="Go to home">
          <span className={s.logoIcon} aria-hidden="true">
            <Logo size={42} />
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={s.nav}>
        <ul className={s.navList}>
          {visibleNavItems.map((item) => (
            <NavItemLink
              key={item.id}
              item={item}
              pathname={pathname}
              activeChannelId={activeChannelId}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>

      {/* Bottom section: different for guest vs authenticated */}
      <div className={s.bottomNav}>
        {isGuest ? (
          /* Guest footer: warm sign-in CTA */
          <div className={s.guestFooter}>
            {!collapsed && (
              <>
                <p className={s.guestFooterText}>
                  Have a channel? Sign in for personalized insights.
                </p>
                <Link href="/auth/login" className={s.guestFooterCta}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Channel Selector */}
            <SidebarChannelSelector
              channels={channels}
              activeChannelId={activeChannelId}
              channelLimit={channelLimit}
              collapsed={collapsed}
              onChannelChange={onChannelChange}
            />

            {/* Account link */}
            <nav aria-label="Account navigation">
              <ul className={s.navList}>
                {sidebarBottomItems.map((item) => {
                  const isActive = pathname === item.href;
                  const href = getNavHref(item, activeChannelId);

                  return (
                    <li key={item.id}>
                      <Link
                        href={href}
                        className={`${s.navLink} ${isActive ? s.navLinkActive : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        data-nav-id={item.id}
                      >
                        <span className={s.navIcon}>
                          <SidebarIcon itemId={item.id} iconType={item.icon} size={20} />
                        </span>
                        {!collapsed && <span className={s.navLabel}>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Neutral plan label (no upgrade link) */}
            {!collapsed && (
              <div className={s.planLabel}>Free plan</div>
            )}
          </>
        )}
      </div>

      {/* Footer: Legal links + Collapse toggle */}
      <div className={s.bottomSection}>
        {!collapsed && (
          <div className={s.legalLinks}>
            <Link href="/privacy" className={s.legalLink}>
              Privacy
            </Link>
            <span className={s.legalDivider}>&middot;</span>
            <Link href="/terms" className={s.legalLink}>
              Terms
            </Link>
            <span className={s.legalDivider}>&middot;</span>
            <Link href="/contact" className={s.legalLink}>
              Support
            </Link>
          </div>
        )}

        {/* Collapse Toggle (desktop only) */}
        {onToggleCollapse && (
          <button
            className={s.collapseBtn}
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={collapsed ? s.expandIcon : ""}
            >
              <path d="M11 17l-5-5 5-5" />
              <path d="M18 17l-5-5 5-5" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}

/* ---------- Nav Item Link ---------- */

type NavItemLinkProps = {
  item: SerializableNavItem;
  pathname: string;
  activeChannelId: string | null;
  collapsed: boolean;
};

function NavItemLink({ item, pathname, activeChannelId, collapsed }: NavItemLinkProps) {
  const isActive = isNavItemActive(item, pathname);
  const href = getNavHref(item, activeChannelId);

  return (
    <li>
      <Link
        href={href}
        className={`${s.navLink} ${isActive ? s.navLinkActive : ""}`}
        aria-current={isActive ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        data-nav-id={item.id}
      >
        <span className={s.navIcon}>
          <SidebarIcon itemId={item.id} iconType={item.icon} size={20} />
        </span>
        {!collapsed && <span className={s.navLabel}>{item.label}</span>}
      </Link>
    </li>
  );
}
