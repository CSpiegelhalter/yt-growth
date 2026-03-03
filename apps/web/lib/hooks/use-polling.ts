"use client";

/**
 * usePolling Hook
 *
 * Generic polling hook that calls a fetcher at a fixed interval.
 * Pauses on error (requires manual resume), auto-stops via shouldStop,
 * and respects tab visibility.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type UsePollingOptions<T> = {
  fetcher: () => Promise<T>;
  interval: number;
  enabled?: boolean;
  onData?: (data: T) => void;
  shouldStop?: (data: T) => boolean;
};

type UsePollingReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  pause: () => void;
  resume: () => void;
};

function clearTimer(ref: React.RefObject<ReturnType<typeof setInterval> | null>) {
  if (ref.current !== null) {
    clearInterval(ref.current);
    ref.current = null;
  }
}

async function executeFetch<T>(
  fetcherRef: React.RefObject<() => Promise<T>>,
  shouldStopRef: React.RefObject<((data: T) => boolean) | undefined>,
  onDataRef: React.RefObject<((data: T) => void) | undefined>,
  setData: (data: T) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setPaused: (paused: boolean) => void,
  timerRef: React.RefObject<ReturnType<typeof setInterval> | null>,
) {
  setLoading(true);
  try {
    const result = await fetcherRef.current();
    setData(result);
    setLoading(false);
    onDataRef.current?.(result);

    if (shouldStopRef.current?.(result)) {
      clearTimer(timerRef);
      setPaused(true);
    }
  } catch (error_: unknown) {
    const message = error_ instanceof Error ? error_.message : "Polling failed";
    setError(message);
    setLoading(false);
    clearTimer(timerRef);
    setPaused(true);
  }
}

export function usePolling<T>(options: UsePollingOptions<T>): UsePollingReturn<T> {
  const { fetcher, interval, enabled = true, onData, shouldStop } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetcherRef = useRef(fetcher);
  const shouldStopRef = useRef(shouldStop);
  const onDataRef = useRef(onData);

  useEffect(() => {
    fetcherRef.current = fetcher;
    shouldStopRef.current = shouldStop;
    onDataRef.current = onData;
  });

  const startPolling = useCallback(() => {
    clearTimer(timerRef);

    void executeFetch(
      fetcherRef, shouldStopRef, onDataRef,
      setData, setLoading, setError, setPaused, timerRef,
    );

    timerRef.current = setInterval(() => {
      if (document.hidden) {
        return;
      }
      void executeFetch(
        fetcherRef, shouldStopRef, onDataRef,
        setData, setLoading, setError, setPaused, timerRef,
      );
    }, interval);
  }, [interval]);

  const pause = useCallback(() => {
    clearTimer(timerRef);
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    setError(null);
    setPaused(false);
  }, []);

  useEffect(() => {
    if (!enabled || paused) {
      clearTimer(timerRef);
      return;
    }

    startPolling();

    const handleVisibility = () => {
      if (document.hidden) {
        clearTimer(timerRef);
      } else {
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimer(timerRef);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, paused, startPolling]);

  return {
    data,
    loading,
    error,
    isPolling: enabled && !paused,
    pause,
    resume,
  };
}
