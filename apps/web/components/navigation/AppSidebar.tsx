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
};

/**
 * Desktop sidebar navigation component.
 * Shows primary nav items with icons and labels.
 * Can be collapsed to icons-only mode.
 * Includes channel selector and account link at the bottom.
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
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`${s.sidebar} ${collapsed ? s.collapsed : ""}`}
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
          {[...primaryNavItems, ...secondaryNavItems].map((item) => (
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

      {/* Bottom section: Channel selector + Account nav */}
      <div className={s.bottomNav}>
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
