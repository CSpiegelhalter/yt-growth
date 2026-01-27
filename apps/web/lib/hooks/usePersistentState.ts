/**
 * usePersistentState - React hook for state that persists to localStorage
 *
 * Features:
 * - Avoids hydration mismatches by initializing from localStorage only after mount
 * - Handles localStorage errors gracefully
 * - Supports validation of loaded data
 * - Type-safe with generics
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage/safeLocalStorage";

type UsePersistentStateOptions<T> = {
  /** localStorage key (will be prefixed automatically) */
  key: string;
  /** Initial value used before localStorage loads and as fallback */
  initialValue: T;
  /** Optional validator to ensure loaded data matches expected shape */
  validator?: (value: unknown) => value is T;
};

type UsePersistentStateReturn<T> = {
  /** Current state value */
  value: T;
  /** Update state and persist to localStorage */
  setValue: (newValue: T | ((prev: T) => T)) => void;
  /** Whether initial load from localStorage has completed */
  isHydrated: boolean;
  /** Clear persisted value (resets to initialValue) */
  clear: () => void;
};

/**
 * useState-like hook that automatically persists to localStorage.
 *
 * IMPORTANT: To avoid hydration issues, this hook:
 * 1. Starts with `initialValue` on first render (server + client)
 * 2. Loads from localStorage in useEffect (client only, after hydration)
 * 3. Syncs writes to localStorage on every setValue call
 *
 * @example
 * const { value: thumbnails, setValue: setThumbnails, isHydrated } = usePersistentState({
 *   key: "generated_thumbnails",
 *   initialValue: [],
 *   validator: isGeneratedThumbnailArray,
 * });
 */
export function usePersistentState<T>({
  key,
  initialValue,
  validator,
}: UsePersistentStateOptions<T>): UsePersistentStateReturn<T> {
  const [value, setValueInternal] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Track whether we've loaded from storage to avoid overwriting
  const hasLoadedRef = useRef(false);

  // Load from localStorage after mount (client-only)
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const stored = getJSON<T>(key, validator);
    if (stored !== null) {
      setValueInternal(stored);
    }
    setIsHydrated(true);
  }, [key, validator]);

  // Wrapped setter that also persists to localStorage
  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValueInternal((prev) => {
        const resolved =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;

        // Persist to localStorage (fire-and-forget, errors handled internally)
        setJSON(key, resolved);

        return resolved;
      });
    },
    [key],
  );

  // Clear persisted data and reset to initial value
  const clear = useCallback(() => {
    setValueInternal(initialValue);
    setJSON(key, initialValue);
  }, [key, initialValue]);

  return { value, setValue, isHydrated, clear };
}
