/**
 * Centralized OAuth attempt tracking via sessionStorage.
 *
 * Prevents redirect loops by throttling OAuth re-attempts
 * to at most once per THROTTLE_WINDOW_MS.
 */

const STORAGE_KEY = "lastOAuthAttempt";
const THROTTLE_WINDOW_MS = 60_000; // 1 minute

function isSessionStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const k = "__ss_test__";
    window.sessionStorage.setItem(k, k);
    window.sessionStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** Read the last OAuth attempt timestamp (ms epoch), or null if absent/invalid. */
export function getLastOAuthAttempt(): number | null {
  if (!isSessionStorageAvailable()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const ts = parseInt(raw, 10);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

/**
 * Whether a new OAuth attempt is allowed (i.e. no attempt within the
 * throttle window). Returns true when there is no recorded attempt or
 * when the throttle window has elapsed.
 */
export function canAttemptOAuth(nowMs?: number): boolean {
  const last = getLastOAuthAttempt();
  if (last === null) return true;
  return (nowMs ?? Date.now()) - last >= THROTTLE_WINDOW_MS;
}

/** Record the current time as the latest OAuth attempt. */
export function recordOAuthAttempt(nowMs?: number): void {
  if (!isSessionStorageAvailable()) return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      (nowMs ?? Date.now()).toString(),
    );
  } catch {
    // Quota / private-mode — silently ignore
  }
}
