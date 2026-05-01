import { AppShellLayout } from "@/components/navigation/AppShellLayout";

/**
 * Dashboard layout — handles both authenticated and unauthenticated states.
 *
 * forceGuestSidebar: always show sidebar, even for guests.
 * The dashboard has a public mode (DashboardPublicClient) that guests can use.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellLayout forceGuestSidebar>{children}</AppShellLayout>;
}
