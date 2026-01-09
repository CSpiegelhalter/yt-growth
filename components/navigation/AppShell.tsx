"use client";

import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { AppHeader } from "./AppHeader";
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
};

const SIDEBAR_COLLAPSE_KEY = "sidebar-collapsed";

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
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar collapse state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
    if (stored !== null) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
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
          mobileNavSlot={<MobileNav activeChannelId={activeChannelId} />}
        />

        {/* Page Content */}
        <main className={s.content} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
