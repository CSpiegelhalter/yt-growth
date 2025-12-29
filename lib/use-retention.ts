"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { VideoWithRetention } from "@/types/api";

type RetentionState = {
  videos: VideoWithRetention[];
  loading: boolean;
  error: string | null;
  fetchedAt: Date | null;
  cachedUntil: Date | null;
  isDemo: boolean;
};

type UseRetentionOptions = {
  /** Whether to fetch on mount. Default: true */
  fetchOnMount?: boolean;
  /** Whether the user is subscribed (required for retention API) */
  isSubscribed: boolean;
};

type UseRetentionReturn = RetentionState & {
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Whether data is stale and should be refreshed */
  isStale: boolean;
};

/**
 * Hook to fetch retention data for a channel with proper request deduping.
 * Prevents infinite loops by using refs for in-flight tracking and stable callbacks.
 */
export function useRetention(
  channelId: string,
  options: UseRetentionOptions
): UseRetentionReturn {
  const { fetchOnMount = true, isSubscribed } = options;

  const [state, setState] = useState<RetentionState>({
    videos: [],
    loading: false,
    error: null,
    fetchedAt: null,
    cachedUntil: null,
    isDemo: false,
  });

  // Refs for request deduping - prevent re-renders from triggering fetches
  const inFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);
  const channelIdRef = useRef(channelId);

  // Track channelId changes to reset fetch state
  useEffect(() => {
    if (channelIdRef.current !== channelId) {
      channelIdRef.current = channelId;
      hasFetchedRef.current = false;
      setState({
        videos: [],
        loading: false,
        error: null,
        fetchedAt: null,
        cachedUntil: null,
        isDemo: false,
      });
    }
  }, [channelId]);

  const fetchRetention = useCallback(
    async (force = false) => {
      // Guard: don't fetch if already in flight
      if (inFlightRef.current) {
        return;
      }

      // Guard: don't refetch if already fetched (unless forced)
      if (hasFetchedRef.current && !force) {
        return;
      }

      // Guard: subscription required
      if (!isSubscribed) {
        return;
      }

      // Abort any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      inFlightRef.current = true;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await fetch(`/api/me/channels/${channelId}/retention`, {
          signal: controller.signal,
        });

        // Check if aborted
        if (controller.signal.aborted) {
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load retention");
        }

        hasFetchedRef.current = true;

        setState({
          videos: data.videos || [],
          loading: false,
          error: null,
          fetchedAt: data.fetchedAt ? new Date(data.fetchedAt) : new Date(),
          cachedUntil: data.videos?.[0]?.retention?.cachedUntil
            ? new Date(data.videos[0].retention.cachedUntil)
            : null,
          isDemo: Boolean(data.demo),
        });
      } catch (err: unknown) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load retention",
        }));
      } finally {
        inFlightRef.current = false;
      }
    },
    [channelId, isSubscribed]
  );

  // Fetch on mount (once) if enabled
  useEffect(() => {
    if (fetchOnMount && !hasFetchedRef.current && isSubscribed) {
      fetchRetention();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOnMount, isSubscribed, fetchRetention]);

  const refresh = useCallback(async () => {
    await fetchRetention(true);
  }, [fetchRetention]);

  const isStale =
    state.cachedUntil !== null && new Date() > state.cachedUntil;

  return {
    ...state,
    refresh,
    isStale,
  };
}

