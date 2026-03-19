"use client";

/**
 * useLocalStorage - React hook for state persisted to localStorage.
 * Avoids hydration mismatches, supports optional TTL and validation.
 * Handles localStorage errors gracefully (Safari private browsing, SSR).
 */
import { useCallback, useEffect, useRef, useState } from "react";

type StorageEnvelope<T> = { value: T; timestamp: number };

type UseLocalStorageOptions<T> = {
  key: string;
  defaultValue: T;
  ttl?: number;
  validator?: (value: unknown) => value is T;
};

type UseLocalStorageReturn<T> = {
  value: T;
  setValue: (newValue: T | ((prev: T) => T)) => void;
  isHydrated: boolean;
  clear: () => void;
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") { return null; }
  try {
    const k = "__ls_probe__";
    window.localStorage.setItem(k, k);
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(
  key: string,
  ttl: number | undefined,
  validator: ((v: unknown) => v is T) | undefined,
): T | null {
  const store = getStorage();
  if (!store) { return null; }

  try {
    const raw = store.getItem(key);
    if (raw === null) { return null; }

    const parsed: unknown = JSON.parse(raw);

    if (ttl === undefined) {
      return validator ? (validator(parsed) ? parsed : null) : (parsed as T);
    }

    const env = parsed as StorageEnvelope<unknown>;
    const isValidEnvelope =
      env && typeof env === "object" && "value" in env && "timestamp" in env && typeof env.timestamp === "number";
    if (!isValidEnvelope) { return null; }

    if (Date.now() - env.timestamp > ttl) {
      store.removeItem(key);
      return null;
    }

    return validator ? (validator(env.value) ? (env.value as T) : null) : (env.value as T);
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T, ttl: number | undefined): void {
  const store = getStorage();
  if (!store) { return; }
  try {
    const payload = ttl !== undefined ? { value, timestamp: Date.now() } : value;
    store.setItem(key, JSON.stringify(payload));
  } catch { /* quota exceeded, private browsing */ }
}

export function useLocalStorage<T>({
  key,
  defaultValue,
  ttl,
  validator,
}: UseLocalStorageOptions<T>): UseLocalStorageReturn<T> {
  const [value, setInternal] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) { return; }
    loaded.current = true;
    const stored = read<T>(key, ttl, validator);
    if (stored !== null) { setInternal(stored); }
    setIsHydrated(true);
  }, [key, ttl, validator]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setInternal((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(key, resolved, ttl);
        return resolved;
      });
    },
    [key, ttl],
  );

  const clear = useCallback(() => {
    setInternal(defaultValue);
    const store = getStorage();
    if (store) {
      try { store.removeItem(key); } catch { /* ignore */ }
    }
  }, [key, defaultValue]);

  return { value, setValue, isHydrated, clear };
}
