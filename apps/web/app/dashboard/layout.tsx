import {
  getAppBootstrapOptional,
  normalizePlan,
  isAdminEmail,
  GUEST_SHELL_PROPS,
} from "@/lib/server/bootstrap";
import { AppShellServer } from "@/components/navigation/AppShellServer";
import { getFilteredNavItems } from "@/lib/server/nav-config.server";

/**
 * Dashboard layout that handles both authenticated and unauthenticated states.
 *
 * Always renders the AppShell with navigation sidebar for consistent UX.
 * - Authenticated: Full dashboard with user data
 * - Unauthenticated: Navigation visible, "Sign in" button in header
 *
 * This allows /dashboard to be accessible without redirects for SEO,
 * while keeping navigation consistent so users can explore the app.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bootstrap = await getAppBootstrapOptional();
  const navItems = await getFilteredNavItems();

  // Unauthenticated: Use AppShell with guest mode (null user data)
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

  // Authenticated: Use full AppShell with user data
  const { me, channels, activeChannelId } = bootstrap;

  const isAdmin = isAdminEmail(bootstrap.me.email);

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
