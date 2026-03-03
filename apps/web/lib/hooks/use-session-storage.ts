"use client";

/**
 * useSessionStorage - React hook for state persisted to sessionStorage.
 * Avoids hydration mismatches, supports optional TTL and validation.
 * Handles sessionStorage errors gracefully (Safari private browsing, SSR).
 */
import { useCallback, useEffect, useRef, useState } from "react";

type StorageEnvelope<T> = { value: T; timestamp: number };

type UseSessionStorageOptions<T> = {
  key: string;
  defaultValue: T;
  /** Time-to-live in milliseconds. When set, values are stored with a timestamp. */
  ttl?: number;
  /** Optional validator to ensure loaded data matches expected shape */
  validator?: (value: unknown) => value is T;
};

type UseSessionStorageReturn<T> = {
  value: T;
  setValue: (newValue: T | ((prev: T) => T)) => void;
  isHydrated: boolean;
  clear: () => void;
};

function isSessionStorageAvailable(): boolean {
  if (typeof window === "undefined") { return false; }
  try {
    const testKey = "__ss_test__";
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function readFromStorage<T>(
  key: string,
  ttl: number | undefined,
  validator: ((value: unknown) => value is T) | undefined,
): T | null {
  if (!isSessionStorageAvailable()) { return null; }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) { return null; }

    const parsed: unknown = JSON.parse(raw);

    if (ttl !== undefined) {
      const envelope = parsed as StorageEnvelope<unknown>;
      if (
        !envelope ||
        typeof envelope !== "object" ||
        !("value" in envelope) ||
        !("timestamp" in envelope) ||
        typeof envelope.timestamp !== "number"
      ) {
        return null;
      }
      if (Date.now() - envelope.timestamp > ttl) {
        window.sessionStorage.removeItem(key);
        return null;
      }
      if (validator) {
        return validator(envelope.value) ? (envelope.value as T) : null;
      }
      return envelope.value as T;
    }

    if (validator) {
      return validator(parsed) ? parsed : null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

function writeToStorage<T>(key: string, value: T, ttl: number | undefined): void {
  if (!isSessionStorageAvailable()) { return; }
  try {
    const toStore = ttl !== undefined ? { value, timestamp: Date.now() } : value;
    window.sessionStorage.setItem(key, JSON.stringify(toStore));
  } catch {
    // Silently fail (quota exceeded, private browsing, etc.)
  }
}

export function useSessionStorage<T>({
  key,
  defaultValue,
  ttl,
  validator,
}: UseSessionStorageOptions<T>): UseSessionStorageReturn<T> {
  const [value, setValueInternal] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasLoadedRef = useRef(false);

  // Hydrate from sessionStorage after mount (client-only)
  useEffect(() => {
    if (hasLoadedRef.current) { return; }
    hasLoadedRef.current = true;

    const stored = readFromStorage<T>(key, ttl, validator);
    if (stored !== null) {
      setValueInternal(stored);
    }
    setIsHydrated(true);
  }, [key, ttl, validator]);

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValueInternal((prev) => {
        const resolved =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        writeToStorage(key, resolved, ttl);
        return resolved;
      });
    },
    [key, ttl],
  );

  const clear = useCallback(() => {
    setValueInternal(defaultValue);
    if (isSessionStorageAvailable()) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Silently fail
      }
    }
  }, [key, defaultValue]);

  return { value, setValue, isHydrated, clear };
}
