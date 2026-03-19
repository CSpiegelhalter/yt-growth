"use client";

/**
 * useDismissable - Reusable hook for timed dismissal of UI surfaces.
 * Stores dismissal state in localStorage with a TTL. After the TTL expires,
 * the surface becomes visible again. Each surface is identified by a unique key.
 */
import { useCallback } from "react";

import { useLocalStorage } from "./use-local-storage";

const KEY_PREFIX = "dismissable:";

type UseDismissableReturn = {
  isDismissed: boolean;
  dismiss: () => void;
  isHydrated: boolean;
};

export function useDismissable(key: string, durationMs: number): UseDismissableReturn {
  const { value, setValue, isHydrated } = useLocalStorage<boolean>({
    key: `${KEY_PREFIX}${key}`,
    defaultValue: false,
    ttl: durationMs,
  });

  const dismiss = useCallback(() => {
    setValue(true);
  }, [setValue]);

  return { isDismissed: value, dismiss, isHydrated };
}
