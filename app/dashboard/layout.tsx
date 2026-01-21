import {
  getCurrentUserServer,
  getMeServer,
  getChannelsServer,
  resolveActiveChannelId,
} from "@/lib/server/bootstrap";
import { AppShellServer } from "@/components/navigation/AppShellServer";
import { MarketingHeader } from "@/components/marketing";
import { Footer } from "@/components/Footer";

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
 * - Authenticated: Renders the full AppShell with navigation
 * - Unauthenticated: Renders marketing layout (header + footer)
 *
 * This allows /dashboard to be accessible without redirects for SEO.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer();

  // Unauthenticated: Use marketing layout
  if (!user) {
    return (
      <div className="appShell">
        <MarketingHeader user={null} />
        <div className="appMain">{children}</div>
        <Footer />
      </div>
    );
  }

  // Authenticated: Use full AppShell
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
    >
      {children}
    </AppShellServer>
  );
}
