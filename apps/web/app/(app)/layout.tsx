import { AppShellLayout } from "@/components/navigation/AppShellLayout";

/**
 * App layout for pages that require authentication.
 *
 * No redirects — pages use AccessGate to show sign-in/connect prompts.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
