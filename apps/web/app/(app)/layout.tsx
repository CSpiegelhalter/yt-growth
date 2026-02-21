import { redirect } from "next/navigation";
import { getCurrentUserServer, getMeServer, getChannelsServer, resolveActiveChannelId, normalizePlan, isAdminEmail } from "@/lib/server/bootstrap";
import { AppShellServer } from "@/components/navigation/AppShellServer";
import { getFilteredNavItems } from "@/lib/server/nav-config.server";

/**
 * App layout for authenticated pages.
 * 
 * Server Component that:
 * 1. Checks auth server-side (no client round trip)
 * 2. Fetches user/channel data server-side
 * 3. Renders the AppShell with initial data
 * 
 * This ensures the AppShell renders with correct data from first paint,
 * eliminating layout shift from auth loading states.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const user = await getCurrentUserServer();
  
  if (!user) {
    // Redirect to login if not authenticated
    redirect("/auth/login");
  }
  
  // Fetch user data, channel data, and nav items in parallel
  const [me, channels, navItems] = await Promise.all([
    getMeServer(user),
    getChannelsServer(user.id),
    getFilteredNavItems(),
  ]);
  
  // Resolve active channel (will be used by pages)
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
