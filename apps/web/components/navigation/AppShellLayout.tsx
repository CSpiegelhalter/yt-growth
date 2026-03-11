import { headers } from "next/headers";

import {
  getAppBootstrapOptional,
  GUEST_SHELL_PROPS,
  isAdminEmail,
  normalizePlan,
} from "@/lib/server/bootstrap";
import { getFilteredNavItems } from "@/lib/server/nav-config.server";

import { AppShellServer } from "./AppShellServer";

/**
 * Returns true if the sidebar should be shown for the given path and auth state.
 *
 * Rules:
 * - Always show sidebar if the user is authenticated
 * - Show sidebar for signed-out users only on /tags and /keywords (public tools)
 * - Hide sidebar on all other pages when signed out (Dashboard, Videos, Profile, etc.)
 */
function shouldShowSidebar(pathname: string, isAuthenticated: boolean): boolean {
  if (isAuthenticated) {return true;}
  return pathname.startsWith("/tags") || pathname.startsWith("/keywords");
}

/**
 * Shared layout for route groups that need the AppShell with optional auth.
 *
 * Handles both authenticated and unauthenticated states:
 * - Authenticated: full AppShell with sidebar and user data
 * - Unauthenticated on Tags/Keywords: guest AppShell with sidebar
 * - Unauthenticated on other pages: no sidebar, just page content (AccessGate handles sign-in)
 */
export async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? "/";

  const [bootstrap, navItems] = await Promise.all([
    getAppBootstrapOptional(),
    getFilteredNavItems(),
  ]);

  const isAuthenticated = !!bootstrap;

  if (!shouldShowSidebar(pathname, isAuthenticated)) {
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
  const isAdmin = isAdminEmail(me.email);

  return (
    <AppShellServer
      channels={channels}
      activeChannelId={activeChannelId}
      userEmail={me.email}
      userName={me.name}
      plan={normalizePlan(me.plan)}
      channelLimit={me.channel_limit}
      isAdmin={isAdmin}
      primaryNavItems={navItems.primary}
      secondaryNavItems={navItems.secondary}
    >
      {children}
    </AppShellServer>
  );
}
