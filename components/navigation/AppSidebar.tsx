"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  primaryNavItems,
  secondaryNavItems,
  isNavItemActive,
  getNavHref,
  type NavItem,
} from "@/lib/nav-config";
import { NavIcon } from "./NavIcon";
import { BRAND } from "@/lib/brand";
import s from "./AppSidebar.module.css";

type AppSidebarProps = {
  activeChannelId: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

/**
 * Desktop sidebar navigation component.
 * Shows primary nav items with icons and labels.
 * Can be collapsed to icons-only mode.
 */
export function AppSidebar({
  activeChannelId,
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`${s.sidebar} ${collapsed ? s.collapsed : ""}`}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={s.logoSection}>
        <Link href="/" className={s.logo} aria-label={`${BRAND.name} - Go to home`}>
          <span className={s.logoIcon} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          {!collapsed && <span className={s.logoText}>{BRAND.name}</span>}
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className={s.nav}>
        <div className={s.navSection}>
          {!collapsed && <span className={s.navSectionLabel}>Growth</span>}
          <ul className={s.navList} role="list">
            {primaryNavItems.map((item) => (
              <NavItemLink
                key={item.id}
                item={item}
                pathname={pathname}
                activeChannelId={activeChannelId}
                collapsed={collapsed}
              />
            ))}
          </ul>
        </div>

        <div className={s.navSection}>
          {!collapsed && <span className={s.navSectionLabel}>Resources</span>}
          <ul className={s.navList} role="list">
            {secondaryNavItems.map((item) => (
              <NavItemLink
                key={item.id}
                item={item}
                pathname={pathname}
                activeChannelId={activeChannelId}
                collapsed={collapsed}
              />
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom Section: Legal links + Collapse toggle */}
      <div className={s.bottomSection}>
        {!collapsed && (
          <div className={s.legalLinks}>
            <Link href="/privacy" className={s.legalLink}>
              Privacy
            </Link>
            <span className={s.legalDivider}>·</span>
            <Link href="/terms" className={s.legalLink}>
              Terms
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
  item: NavItem;
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
      >
        <span className={s.navIcon}>
          <NavIcon type={item.icon} size={20} />
        </span>
        {!collapsed && <span className={s.navLabel}>{item.label}</span>}
      </Link>
    </li>
  );
}
