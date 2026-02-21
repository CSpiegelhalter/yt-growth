/**
 * Safe localStorage utilities that handle:
 * - Server-side rendering (localStorage unavailable)
 * - localStorage disabled/blocked
 * - Invalid JSON parsing
 * - Quota exceeded errors
 *
 * All methods return gracefully without throwing.
 */

const STORAGE_PREFIX = "cb_thumbnails_";

type ExpiringStorageEnvelope<T> = {
  value: T;
  expiresAt: number; // unix ms
};

/**
 * Check if localStorage is available.
 * Returns false during SSR or if localStorage is blocked.
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a JSON value from localStorage with type safety.
 * Returns null if:
 * - localStorage unavailable
 * - Key doesn't exist
 * - Value is invalid JSON
 * - Value fails validation (if validator provided)
 */
export function getJSON<T>(
  key: string,
  validator?: (value: unknown) => value is T,
): T | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);

    if (validator) {
      return validator(parsed) ? parsed : null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Get a JSON value with TTL semantics.
 * Returns null if missing, expired, invalid, or localStorage unavailable.
 */
export function getJSONWithExpiry<T>(
  key: string,
  validator?: (value: unknown) => value is T,
): T | null {
  const envelope = getJSON<ExpiringStorageEnvelope<unknown>>(
    key,
    (value): value is ExpiringStorageEnvelope<unknown> => {
      if (!value || typeof value !== "object") return false;
      const v = value as Record<string, unknown>;
      return (
        "value" in v &&
        typeof v.expiresAt === "number" &&
        Number.isFinite(v.expiresAt)
      );
    },
  );

  if (!envelope) return null;

  if (envelope.expiresAt <= Date.now()) {
    removeJSON(key);
    return null;
  }

  if (validator) {
    return validator(envelope.value) ? (envelope.value as T) : null;
  }
  return envelope.value as T;
}

/**
 * Set a JSON value in localStorage.
 * Silently fails if localStorage unavailable or quota exceeded.
 *
 * Returns true if successful, false otherwise.
 */
export function setJSON<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(STORAGE_PREFIX + key, serialized);
    return true;
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      console.warn("[safeLocalStorage] Quota exceeded, unable to save:", key);
    }
    return false;
  }
}

/**
 * Set a JSON value with expiration.
 * ttlMs must be > 0.
 */
export function setJSONWithExpiry<T>(
  key: string,
  value: T,
  ttlMs: number,
): boolean {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    return false;
  }

  const envelope: ExpiringStorageEnvelope<T> = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
  return setJSON(key, envelope);
}

/**
 * Remove a key from localStorage.
 * Silently fails if localStorage unavailable.
 *
 * Returns true if successful, false otherwise.
 */
export function removeJSON(key: string): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Storage keys used by the thumbnails feature.
 * Centralizing keys prevents typos and makes cleanup easier.
 */
export const STORAGE_KEYS = {
  /** Generated thumbnail results that persist across sessions */
  GENERATED_THUMBNAILS: "generated_v1",
  /** Uploaded identity photos metadata (URLs from server, not raw files) */
  UPLOADED_PHOTOS: "uploaded_photos_v1",
  /** Dashboard videos page cache (channel/page scoped) */
  DASHBOARD_VIDEOS: "dashboard_videos_v1",
} as const;

/* ------------------------------------------------------------------ */
/*  Raw-string helpers (no prefix, no JSON encoding)                  */
/*  Use for keys that store plain strings (e.g. activeChannelId).     */
/* ------------------------------------------------------------------ */

export function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  sessionStorage helpers (raw string, no prefix)                    */
/* ------------------------------------------------------------------ */

function isSessionStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__storage_test__";
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionGetItem(key: string): string | null {
  if (!isSessionStorageAvailable()) return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionRemoveItem(key: string): boolean {
  if (!isSessionStorageAvailable()) return false;
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
