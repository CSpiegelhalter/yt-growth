import { redirect } from "next/navigation";
import { getCurrentUserServer, getMeServer, getChannelsServer, resolveActiveChannelId } from "@/lib/server/bootstrap";
import { AppShellServer } from "@/components/navigation/AppShellServer";

// Plan type mapping from Me.plan to AppShell Plan type
type AppPlan = "FREE" | "PRO" | "ENTERPRISE";

function normalizePlan(plan: string): AppPlan {
  const upper = plan.toUpperCase();
  if (upper === "PRO") return "PRO";
  if (upper === "ENTERPRISE" || upper === "TEAM") return "ENTERPRISE";
  return "FREE";
}

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
  
  // Fetch user and channel data in parallel
  const [me, channels] = await Promise.all([
    getMeServer(user),
    getChannelsServer(user.id),
  ]);
  
  // Resolve active channel (will be used by pages)
  const activeChannelId = resolveActiveChannelId(channels, null);
  
  // Check admin status
  const adminEmails = String(process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(user.email.toLowerCase());
  
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
