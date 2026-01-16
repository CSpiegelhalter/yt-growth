"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Logo } from "./Logo";
import { AuthArea } from "./AuthArea";
import { ChannelSelector } from "./ChannelSelector";
import { UpgradeModal } from "./UpgradeModal";
import { useChannels } from "./hooks/useChannels";
import { getInitials } from "./utils";
import s from "../Header.module.css";

/**
 * Site header with auth-aware navigation and channel selector.
 * Mobile-first design with dropdown menu for logged-in users.
 *
 * Refactored for maintainability and performance:
 * - Stateful islands (menus, dropdowns, modal) isolated to prevent unnecessary rerenders
 * - Channel fetching decoupled from URL sync to avoid refetching on navigation
 * - Reusable hooks for outside dismiss and channel management
 */
export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mounted flag for hydration safety (localStorage + session mismatch avoidance)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert ReadonlyURLSearchParams to URLSearchParams for the hook
  const searchParamsObj = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams]
  );

  // Channel management hook
  const {
    channels,
    activeChannelId,
    activeChannel,
    channelLimit,
    handleSelectChannel,
    showUpgradePrompt,
    setShowUpgradePrompt,
  } = useChannels({
    sessionUser: session?.user,
    pathname,
    searchParams: searchParamsObj,
    router,
  });

  // Derived auth state
  const isLoggedIn = status === "authenticated" && session !== null;
  const isLoading = status === "loading";
  const userEmail = session?.user?.email ?? "";
  const userName = session?.user?.name;
  const userInitials = getInitials(userName || userEmail);

  // Admin check - computed once per session change
  const isAdmin = useMemo(() => {
    const email = String(session?.user?.email ?? "").toLowerCase();
    const allow = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allow.length === 0) return false;
    return allow.includes(email);
  }, [session?.user?.email]);

  // Stable callbacks for child components
  const handleUpgradeNeeded = useCallback(() => {
    setShowUpgradePrompt(true);
  }, [setShowUpgradePrompt]);

  const handleCloseUpgradeModal = useCallback(() => {
    setShowUpgradePrompt(false);
  }, [setShowUpgradePrompt]);

  return (
    <>
      <header className={s.header}>
        <div className={s.inner}>
          <div className={s.leftSection}>
            <Logo />
          </div>

          <div className={s.centerSection}>
            {/* Channel Selector (only when logged in and has channels) */}
            {mounted && isLoggedIn && channels.length > 0 && (
              <ChannelSelector
                channels={channels}
                activeChannelId={activeChannelId}
                activeChannel={activeChannel}
                channelLimit={channelLimit}
                onSelectChannel={handleSelectChannel}
                onUpgradeNeeded={handleUpgradeNeeded}
              />
            )}
          </div>

          <div className={s.rightSection}>
            <div className={s.authSection}>
              <AuthArea
                mounted={mounted}
                isLoading={isLoading}
                isLoggedIn={isLoggedIn}
                userEmail={userEmail}
                userName={userName}
                userInitials={userInitials}
                activeChannelId={activeChannelId}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradeModal
          channelLimit={channelLimit}
          onClose={handleCloseUpgradeModal}
        />
      )}
    </>
  );
}
