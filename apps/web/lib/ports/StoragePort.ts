/**
 * Storage Port — contract for binary object storage.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what features need from an object store without specifying how.
 *
 * Imported by:
 *   - lib/features/ (to declare dependency on file storage)
 *   - lib/adapters/storage/ (to implement — S3, local, etc.)
 *   - app/ or lib/server/ (to wire adapter to features)
 */

// ─── Object Types ───────────────────────────────────────────

export interface StorageObject {
  buffer: Buffer;
  mime: string;
  size: number;
}

export interface StorageObjectMetadata {
  key: string;
  mime: string;
  size: number;
  createdAt: Date;
}

// ─── Options Types ──────────────────────────────────────────

export interface PutObjectOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

// ─── Port Interface ─────────────────────────────────────────

export interface StoragePort {
  /** Store an object and return its storage key. */
  put(key: string, data: Buffer, options?: PutObjectOptions): Promise<string>;

  /** Retrieve an object by key. Returns null if not found. */
  get(key: string): Promise<StorageObject | null>;

  /** Delete an object by key. Returns true if deleted, false if not found. */
  delete(key: string): Promise<boolean>;

  /** Check if an object exists at the given key. */
  exists(key: string): Promise<boolean>;

  /** Get metadata for an object without fetching its content. */
  getMetadata(key: string): Promise<StorageObjectMetadata | null>;

  /** Generate a public URL for an object. */
  getPublicUrl(key: string): string;

  /** List objects whose keys match the given prefix. */
  list(prefix: string): Promise<StorageObjectMetadata[]>;
}
