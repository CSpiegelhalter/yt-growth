import {
  getCurrentUserServer,
  getMeServer,
  getChannelsServer,
  resolveActiveChannelId,
} from "@/lib/server/bootstrap";
import { AppShellServer } from "@/components/navigation/AppShellServer";
import { getFilteredNavItems } from "@/lib/nav-config.server";
import "@/components/learn/learn-components.css";

// Plan type mapping from Me.plan to AppShell Plan type
type AppPlan = "FREE" | "PRO" | "ENTERPRISE";

function normalizePlan(plan: string): AppPlan {
  const upper = plan.toUpperCase();
  if (upper === "PRO") return "PRO";
  if (upper === "ENTERPRISE" || upper === "TEAM") return "ENTERPRISE";
  return "FREE";
}

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
        channels={[]}
        activeChannelId={null}
        userEmail={null}
        userName={null}
        plan="FREE"
        channelLimit={1}
        isAdmin={false}
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

  // Check admin status
  const adminEmails = String(
    process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? ""
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    adminEmails.length > 0 && adminEmails.includes(user.email.toLowerCase());

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
