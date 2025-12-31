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
 * Smart header that shows:
 * - Static header (no JS) for unauthenticated users
 * - Full header (with channel selector, menus) for authenticated users
 * 
 * This reduces JS bundle on public pages significantly.
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
