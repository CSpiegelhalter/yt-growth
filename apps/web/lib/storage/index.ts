/**
 * Storage Module
 *
 * Exports the appropriate storage adapter based on environment.
 * - Development: Local filesystem storage
 * - Production: S3-compatible storage (if configured)
 */

import type { StorageAdapter } from "./adapter";
import { getLocalStorage } from "./local";
import { getS3Storage } from "./s3";

export * from "./adapter";
export * from "./local";
export * from "./s3";

/**
 * Get the appropriate storage adapter for the current environment.
 *
 * Uses S3 if S3_BUCKET is configured, otherwise falls back to local storage.
 */
export function getStorage(): StorageAdapter {
  // Check if S3 is configured
  if (
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  ) {
    return getS3Storage();
  }

  // Fall back to local storage
  return getLocalStorage();
}

