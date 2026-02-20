"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { AppHeader } from "./AppHeader";
import {
  primaryNavItems as staticPrimaryNavItems,
  secondaryNavItems as staticSecondaryNavItems,
} from "@/lib/nav-config";
import { safeGetItem, safeSetItem } from "@/lib/storage/safeLocalStorage";
import type { SerializableNavItem } from "@/lib/nav-config.server";
import s from "./AppShell.module.css";

type Channel = {
  id: number;
  channel_id: string;
  title: string | null;
  thumbnailUrl: string | null;
};

type Plan = "FREE" | "PRO" | "ENTERPRISE";

type AppShellProps = {
  children: React.ReactNode;
  channels: Channel[];
  activeChannelId: string | null;
  userEmail: string;
  userName: string | null;
  plan: Plan;
  channelLimit: number;
  isAdmin?: boolean;
  onChannelChange?: (channelId: string) => void;
  /** Filtered primary nav items (from server). Falls back to static items if not provided. */
  primaryNavItems?: SerializableNavItem[];
  /** Filtered secondary nav items (from server). Falls back to static items if not provided. */
  secondaryNavItems?: SerializableNavItem[];
};

const SIDEBAR_COLLAPSE_KEY = "sidebar-collapsed";

/**
 * Convert static nav items to serializable format for backward compatibility.
 */
function toSerializableNavItems(items: typeof staticPrimaryNavItems): SerializableNavItem[] {
  return items.map((item) => {
    const serializable: SerializableNavItem = {
      id: item.id,
      label: item.label,
      href: item.href,
      icon: item.icon,
      channelScoped: item.channelScoped,
    };
    if (item.id === "dashboard") serializable.matchPattern = "dashboard";
    if (item.id === "competitors") serializable.matchPattern = "competitors";
    return serializable;
  });
}

/**
 * Main app shell layout component for authenticated users.
 * Provides:
 * - Desktop: Left sidebar + top header
 * - Mobile: Hamburger menu + header
 * - Channel selector in header
 * - User dropdown for account actions
 */
export function AppShell({
  children,
  channels,
  activeChannelId,
  userEmail,
  userName,
  plan,
  channelLimit,
  isAdmin = false,
  onChannelChange,
  primaryNavItems,
  secondaryNavItems,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Convert static items to serializable format if not provided
  const resolvedPrimaryNavItems = useMemo(
    () => primaryNavItems ?? toSerializableNavItems(staticPrimaryNavItems),
    [primaryNavItems]
  );
  const resolvedSecondaryNavItems = useMemo(
    () => secondaryNavItems ?? toSerializableNavItems(staticSecondaryNavItems),
    [secondaryNavItems]
  );

  // Load sidebar collapse state from localStorage
  useEffect(() => {
    const stored = safeGetItem(SIDEBAR_COLLAPSE_KEY);
    if (stored !== null) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      safeSetItem(SIDEBAR_COLLAPSE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <div className={s.shell}>
      {/* Desktop Sidebar */}
      <AppSidebar
        activeChannelId={activeChannelId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        primaryNavItems={resolvedPrimaryNavItems}
        secondaryNavItems={resolvedSecondaryNavItems}
      />

      {/* Main Content Area */}
      <div className={s.main}>
        {/* App Header */}
        <AppHeader
          channels={channels}
          activeChannelId={activeChannelId}
          userEmail={userEmail}
          userName={userName}
          plan={plan}
          channelLimit={channelLimit}
          isAdmin={isAdmin}
          onChannelChange={onChannelChange}
          mobileNavSlot={
            <MobileNav
              activeChannelId={activeChannelId}
              primaryNavItems={resolvedPrimaryNavItems}
              secondaryNavItems={resolvedSecondaryNavItems}
            />
          }
        />

        {/* Page Content */}
        <main className={s.content} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
