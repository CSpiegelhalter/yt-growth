import { headers } from "next/headers";

import {
  getAppBootstrapOptional,
  GUEST_SHELL_PROPS,
} from "@/lib/server/bootstrap";
import type { SerializableNavItem } from "@/lib/server/nav-config.server";
import { getFilteredNavItems } from "@/lib/server/nav-config.server";

import { AppShellServer } from "./AppShellServer";

/**
 * Returns true if the sidebar should be shown for the given path and auth state.
 *
 * Config-driven: checks guestAccessible flag on nav items instead of hardcoded paths.
 * Respects GUEST_ACCESS_ENABLED env var as a kill switch.
 */
function shouldShowSidebar(
  pathname: string,
  isAuthenticated: boolean,
  navItems: SerializableNavItem[],
): boolean {
  if (isAuthenticated) return true;
  if (process.env.GUEST_ACCESS_ENABLED === "false") return false;
  return navItems.some(
    (item) => item.guestAccessible && pathname.startsWith(item.href),
  );
}

/**
 * Shared layout for route groups that need the AppShell with optional auth.
 *
 * Handles three states:
 * - Authenticated: full AppShell with all nav items
 * - Guest on guest-accessible route: guest AppShell with filtered nav items
 * - Guest on other routes: no sidebar (AccessGate handles sign-in)
 *
 * @param forceGuestSidebar - If true, always show guest sidebar regardless of pathname detection.
 *   Use this for layouts outside (app) that explicitly want guest sidebar (e.g., /dashboard).
 */
export async function AppShellLayout({
  children,
  forceGuestSidebar = false,
}: {
  children: React.ReactNode;
  forceGuestSidebar?: boolean;
}) {
  const headersList = await headers();

  // Extract pathname from headers — Next.js sets different headers in different contexts.
  // x-invoke-path is set by App Router, x-pathname by middleware, referer as fallback.
  let pathname =
    headersList.get("x-invoke-path") ??
    headersList.get("x-pathname") ??
    headersList.get("x-next-pathname") ??
    "/";

  // If still "/", try parsing from referer URL (local dev fallback)
  if (pathname === "/") {
    const referer = headersList.get("referer");
    if (referer) {
      try {
        pathname = new URL(referer).pathname;
      } catch {
        // ignore
      }
    }
  }

  const [bootstrap, navItems] = await Promise.all([
    getAppBootstrapOptional(),
    getFilteredNavItems(),
  ]);

  const isAuthenticated = !!bootstrap;

  if (!forceGuestSidebar && !shouldShowSidebar(pathname, isAuthenticated, navItems.primary)) {
    return <>{children}</>;
  }

  if (!bootstrap) {
    return (
      <AppShellServer
        {...GUEST_SHELL_PROPS}
        primaryNavItems={navItems.primary}
        secondaryNavItems={navItems.secondary}
      >
        {children}
      </AppShellServer>
    );
  }

  const { me, channels, activeChannelId } = bootstrap;

  return (
    <AppShellServer
      channels={channels}
      activeChannelId={activeChannelId}
      channelLimit={me.channel_limit}
      primaryNavItems={navItems.primary}
      secondaryNavItems={navItems.secondary}
    >
      {children}
    </AppShellServer>
  );
}
