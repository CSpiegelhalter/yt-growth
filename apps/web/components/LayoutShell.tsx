"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { HeaderStatic } from "./HeaderStatic";
import { Footer } from "./Footer";
import { AppShellWrapper } from "./navigation";

type LayoutShellProps = {
  children: React.ReactNode;
};

/**
 * Pages that should use the public layout (header + footer) even when authenticated.
 * These are typically marketing/content pages that don't need the app shell.
 */
const PUBLIC_LAYOUT_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/learn",
  "/privacy",
  "/terms",
  "/contact",
];

/**
 * Check if a path should use public layout
 */
function shouldUsePublicLayout(pathname: string): boolean {
  // Exact matches
  if (PUBLIC_LAYOUT_PATHS.includes(pathname)) {
    return true;
  }
  
  // Learn articles should use public layout
  if (pathname.startsWith("/learn/")) {
    return true;
  }
  
  // Integration error page
  if (pathname.startsWith("/integrations/error")) {
    return true;
  }
  
  return false;
}

/**
 * @deprecated This component is no longer used in the app.
 * Layout switching is now handled by route groups:
 * - (marketing)/layout.tsx for public pages
 * - (app)/layout.tsx for authenticated app pages
 * 
 * This component is kept for backwards compatibility only.
 */
export function LayoutShell({ children }: LayoutShellProps) {
  const { status } = useSession();
  const pathname = usePathname();

  const isPublicPage = shouldUsePublicLayout(pathname);
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  // For unauthenticated users or while loading, use static header
  if (!isAuthenticated || isLoading) {
    return (
      <div className="appShell">
        <HeaderStatic />
        <div className="appMain">{children}</div>
        <Footer />
      </div>
    );
  }

  // For authenticated users on public pages, use dynamic header (shows profile)
  if (isPublicPage) {
    return (
      <div className="appShell">
        <Header />
        <div className="appMain">{children}</div>
        <Footer />
      </div>
    );
  }

  // For authenticated app pages, use the app shell
  return <AppShellWrapper>{children}</AppShellWrapper>;
}
