"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { HeaderStatic } from "./HeaderStatic";

// Dynamically import the full header - only loaded when user is authenticated
const HeaderFull = dynamic(
  () => import("./Header").then((mod) => ({ default: mod.Header })),
  {
    ssr: false,
    loading: () => <HeaderStatic />,
  }
);

/**
 * @deprecated This component is no longer used in the app.
 * Layout switching is now handled by route groups:
 * - (marketing)/layout.tsx uses MarketingHeader
 * - (app)/layout.tsx uses AppShellServer
 * 
 * This component is kept for backwards compatibility only.
 */
export function HeaderWrapper() {
  const { status } = useSession();

  // Show static header while loading or if not authenticated
  if (status === "loading" || status === "unauthenticated") {
    return <HeaderStatic />;
  }

  // User is authenticated - load full header with channel selector
  return <HeaderFull />;
}
