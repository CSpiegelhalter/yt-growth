import "@/components/learn/learn-components.css";

import { AppShellServer } from "@/components/navigation/AppShellServer";
import {
  getChannelsServer,
  getCurrentUserServer,
  getMeServer,
  GUEST_SHELL_PROPS,
  isAdminEmail,
  normalizePlan,
  resolveActiveChannelId,
} from "@/lib/server/bootstrap";
import { getFilteredNavItems } from "@/lib/server/nav-config.server";

/**
 * Marketing layout for public pages.
 *
 * Always renders the AppShell with navigation sidebar for consistent UX.
 * Users can explore and navigate the app easily from any page.
 *
 * - Authenticated: Full nav with user data
 * - Unauthenticated: Navigation visible, "Sign in" button in header
 *
 * Pages rendered under this layout: /, /learn/**, /privacy, /terms, /contact
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer();
  const navItems = await getFilteredNavItems();

  // Unauthenticated: Use AppShell with guest mode (null user data)
  if (!user) {
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
  const [me, channels] = await Promise.all([
    getMeServer(user),
    getChannelsServer(user.id),
  ]);

  const activeChannelId = resolveActiveChannelId(channels, null);

  const isAdmin = isAdminEmail(user.email);

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
