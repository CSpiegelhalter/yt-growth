/**
 * Storage Adapter — factory.
 *
 * Provides `getStorage()` which returns either an S3 or local-filesystem
 * adapter depending on environment variables. Both implementations satisfy
 * the `StoragePort` contract from `lib/ports/StoragePort`.
 */

import type { StoragePort } from "@/lib/ports/StoragePort";
import { getLocalStorage } from "./local";
import { getS3Storage } from "./s3";

/**
 * Get the appropriate storage adapter for the current environment.
 *
 * Uses S3 if S3_BUCKET is configured, otherwise falls back to local storage.
 */
export function getStorage(): StoragePort {
  if (
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  ) {
    return getS3Storage();
  }

  return getLocalStorage();
}
