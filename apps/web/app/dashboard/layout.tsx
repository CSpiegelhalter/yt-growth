import { AppShellLayout } from "@/components/navigation/AppShellLayout";

/**
 * Dashboard layout — handles both authenticated and unauthenticated states.
 *
 * Shares the same AppShell pattern as the (app) layout.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
