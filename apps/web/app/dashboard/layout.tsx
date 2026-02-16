import {
  getAppBootstrapOptional,
} from "@/lib/server/bootstrap";
import { AppShellServer } from "@/components/navigation/AppShellServer";
import { getFilteredNavItems } from "@/lib/nav-config.server";

// Plan type mapping from Me.plan to AppShell Plan type
type AppPlan = "FREE" | "PRO" | "ENTERPRISE";

function normalizePlan(plan: string): AppPlan {
  const upper = plan.toUpperCase();
  if (upper === "PRO") return "PRO";
  if (upper === "ENTERPRISE" || upper === "TEAM") return "ENTERPRISE";
  return "FREE";
}

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
  const { me, channels, activeChannelId } = bootstrap;

  // Check admin status
  const adminEmails = String(
    process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? ""
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    adminEmails.length > 0 &&
    adminEmails.includes(bootstrap.me.email.toLowerCase());

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
