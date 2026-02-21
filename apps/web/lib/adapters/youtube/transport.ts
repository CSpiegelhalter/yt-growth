/**
 * YouTube API Transport Layer
 *
 * Central request wrapper using OAuth token auto-refresh.
 */

import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";
import type { GoogleAccount } from "./types";

const DEBUG = process.env.YT_DEBUG === "1";

/**
 * Make an authenticated request to YouTube APIs with auto token refresh.
 * Wrapper around googleFetchWithAutoRefresh with optional debug logging.
 */
export async function youtubeFetch<T>(
  ga: GoogleAccount,
  url: string
): Promise<T> {
  if (DEBUG) {
    console.log(`[YouTube API] ${url}`);
  }
  return googleFetchWithAutoRefresh<T>(ga, url);
}
