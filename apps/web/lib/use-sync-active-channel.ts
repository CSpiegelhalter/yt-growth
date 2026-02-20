import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
} from "@/lib/storage/safeLocalStorage";

const ACTIVE_CHANNEL_STORAGE_KEY = "activeChannelId";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type UseSyncActiveChannelOptions = {
  channels: Array<{ channel_id: string }>;
  initialActiveChannelId?: string | null;
  urlChannelId?: string | null;
  onChange?: (id: string | null) => void;
};

export type UseSyncActiveChannelReturn = {
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;
  isHydrated: boolean;
};

/* ------------------------------------------------------------------ */
/*  Pure resolver (exported for consumers that need pre-resolution)    */
/* ------------------------------------------------------------------ */

/**
 * Resolve which channel should be active given multiple sources.
 * Priority: URL param > localStorage > server-provided initial > first in list > null.
 *
 * Pure function aside from the localStorage read (returns null during SSR).
 */
export function resolveActiveChannelId(
  channels: Array<{ channel_id: string }>,
  urlChannelId?: string | null,
  initialActiveChannelId?: string | null,
): string | null {
  if (
    urlChannelId &&
    channels.some((c) => c.channel_id === urlChannelId)
  ) {
    return urlChannelId;
  }

  const stored = safeGetItem(ACTIVE_CHANNEL_STORAGE_KEY);
  if (stored && channels.some((c) => c.channel_id === stored)) {
    return stored;
  }

  if (
    initialActiveChannelId &&
    channels.some((c) => c.channel_id === initialActiveChannelId)
  ) {
    return initialActiveChannelId;
  }

  return channels[0]?.channel_id ?? null;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function persistActiveChannel(id: string | null): void {
  if (id) {
    safeSetItem(ACTIVE_CHANNEL_STORAGE_KEY, id);
  } else {
    safeRemoveItem(ACTIVE_CHANNEL_STORAGE_KEY);
  }
}

/* ------------------------------------------------------------------ */
/*  Main hook                                                          */
/* ------------------------------------------------------------------ */

/**
 * Centralized hook for active-channel-ID management.
 *
 * Owns:
 *   - Initialization (URL > localStorage > server initial > first channel)
 *   - Persistence write-through to localStorage
 *   - Reconciliation when the channels list changes
 *
 * Does NOT own:
 *   - Channel fetching (receives channels as a prop)
 *   - URL / router updates (consumer handles via onChange or its own effects)
 */
export function useSyncActiveChannel({
  channels,
  initialActiveChannelId = null,
  urlChannelId = null,
  onChange,
}: UseSyncActiveChannelOptions): UseSyncActiveChannelReturn {
  const onChangeRef = useRef(onChange);

  const [isHydrated, setIsHydrated] = useState(false);

  // Keep the ref in sync via effect (refs must not be written during render).
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Internal selection state, seeded from initial resolution.
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    resolveActiveChannelId(channels, urlChannelId, initialActiveChannelId),
  );

  // Synchronous reconciliation: the returned value is always valid for the
  // current channels list, even before effects run.  This avoids a one-frame
  // flash when a channel is removed.
  const activeChannelId = useMemo(() => {
    if (channels.length === 0) return null;
    if (selectedId && channels.some((c) => c.channel_id === selectedId)) {
      return selectedId;
    }
    return resolveActiveChannelId(
      channels,
      urlChannelId,
      initialActiveChannelId,
    );
  }, [channels, selectedId, urlChannelId, initialActiveChannelId]);

  // Public setter: update state + persist + notify consumer.
  const setActiveChannelId = useCallback((id: string | null) => {
    setSelectedId(id);
    persistActiveChannel(id);
    onChangeRef.current?.(id);
  }, []);

  // Mark as hydrated after first client render.
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Keep internal selection in sync after useMemo reconciliation.
  useEffect(() => {
    if (activeChannelId !== selectedId) {
      setSelectedId(activeChannelId);
    }
  }, [activeChannelId, selectedId]);

  // Persist whenever the effective active channel changes (covers
  // reconciliation-triggered changes that bypass setActiveChannelId).
  useEffect(() => {
    persistActiveChannel(activeChannelId);
  }, [activeChannelId]);

  // Re-select when the URL channel ID changes externally.
  const prevUrlRef = useRef(urlChannelId);
  useEffect(() => {
    if (urlChannelId === prevUrlRef.current) return;
    prevUrlRef.current = urlChannelId;
    if (
      urlChannelId &&
      channels.some((c) => c.channel_id === urlChannelId)
    ) {
      setSelectedId(urlChannelId);
    }
  }, [urlChannelId, channels]);

  return { activeChannelId, setActiveChannelId, isHydrated };
}

/* ------------------------------------------------------------------ */
/*  Backward-compatible write-through (used by out-of-scope pages)    */
/* ------------------------------------------------------------------ */

/**
 * Thin write-through hook that persists an externally-managed
 * activeChannelId to localStorage.
 *
 * @deprecated Prefer `useSyncActiveChannel` for new code.
 */
export function useSyncActiveChannelIdToLocalStorage(
  activeChannelId: string | null,
) {
  useEffect(() => {
    if (!activeChannelId) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_CHANNEL_STORAGE_KEY, activeChannelId);
  }, [activeChannelId]);
}
