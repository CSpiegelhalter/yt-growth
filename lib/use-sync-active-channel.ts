import { useEffect } from "react";

/**
 * Keep the current active channel ID in localStorage so it can be reused as a
 * default across navigations and refreshes.
 *
 * Note: server-side bootstrap cannot read localStorage; this is client-only.
 */
export function useSyncActiveChannelIdToLocalStorage(
  activeChannelId: string | null
) {
  useEffect(() => {
    if (!activeChannelId) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem("activeChannelId", activeChannelId);
  }, [activeChannelId]);
}


