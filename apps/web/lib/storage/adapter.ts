/**
 * Storage Adapter Interface
 *
 * Abstraction layer for file storage to avoid vendor lock-in.
 * Supports local filesystem (dev) and S3-compatible storage (prod).
 */

export type StorageObject = {
  buffer: Buffer;
  mime: string;
  size: number;
};

export type StorageMetadata = {
  key: string;
  mime: string;
  size: number;
  createdAt: Date;
};

export type PutOptions = {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
};

export type GetOptions = {
  // Reserved for future options like range requests
};

/**
 * Storage adapter interface.
 * Implementations must handle:
 * - Binary data (images)
 * - MIME type preservation
 * - Basic error handling
 */
export interface StorageAdapter {
  /**
   * Store an object and return its key.
   */
  put(key: string, data: Buffer, options?: PutOptions): Promise<string>;

  /**
   * Retrieve an object by key.
   * Returns null if not found.
   */
  get(key: string, options?: GetOptions): Promise<StorageObject | null>;

  /**
   * Delete an object by key.
   * Returns true if deleted, false if not found.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if an object exists.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get metadata for an object without fetching the full content.
   */
  getMetadata(key: string): Promise<StorageMetadata | null>;

  /**
   * Generate a public URL for an object.
   * For local storage, this returns a relative API path.
   * For S3, this can return a signed URL or CDN URL.
   */
  getPublicUrl(key: string): string;

  /**
   * List objects with a given prefix.
   */
  list(prefix: string): Promise<StorageMetadata[]>;
}

// ============================================
// STORAGE KEY HELPERS
// ============================================

/**
 * Generate a unique storage key for thumbnail images.
 */
export function thumbnailKey(
  type: "base" | "final",
  jobId: string,
  variantId: string,
  ext: string = "png"
): string {
  return `thumbnails/${jobId}/${type}-${variantId}.${ext}`;
}

/**
 * Generate a storage key for uploaded assets.
 */
export function assetKey(assetId: string, ext: string): string {
  return `assets/${assetId}.${ext}`;
}

/**
 * Extract extension from MIME type.
 */
export function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] ?? "bin";
}

/**
 * Get MIME type from extension.
 */
export function extToMime(ext: string): string {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}
