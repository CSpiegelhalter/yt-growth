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

    // If a validator is provided, use it to verify the structure
    if (validator) {
      return validator(parsed) ? parsed : null;
    }

    return parsed as T;
  } catch {
    // Invalid JSON or other error - return null
    return null;
  }
}

/**
 * Set a JSON value in localStorage.
 * Silently fails if:
 * - localStorage unavailable
 * - Quota exceeded
 * - Other storage errors
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
    // Quota exceeded or other error
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      // Could implement cleanup of old data here if needed
      console.warn("[safeLocalStorage] Quota exceeded, unable to save:", key);
    }
    return false;
  }
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
} as const;
