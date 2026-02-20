/**
 * Local Filesystem Storage Adapter
 *
 * Stores files on local disk. Suitable for development and single-server deployments.
 * Files are stored in a configurable directory (default: .storage/).
 */

import { promises as fs } from "fs";
import * as path from "path";
import type {
  StorageAdapter,
  StorageObject,
  StorageMetadata,
  PutOptions,
  GetOptions,
} from "./adapter";
import { extToMime } from "./adapter";

type LocalStorageConfig = {
  basePath: string; // Absolute path to storage directory
  publicUrlPrefix: string; // URL prefix for public URLs (e.g., "/api/thumbnails/image")
};

const DEFAULT_CONFIG: LocalStorageConfig = {
  basePath: path.join(process.cwd(), ".storage"),
  publicUrlPrefix: "/api/thumbnails/image",
};

class LocalStorageAdapter implements StorageAdapter {
  private config: LocalStorageConfig;

  constructor(config?: Partial<LocalStorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitized = key.replace(/\.\./g, "").replace(/^\//, "");
    return path.join(this.config.basePath, sanitized);
  }

  async put(key: string, data: Buffer, options?: PutOptions): Promise<string> {
    const filePath = this.getFilePath(key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, data);

    // Write metadata file if we have content type
    if (options?.contentType) {
      const metaPath = `${filePath}.meta.json`;
      await fs.writeFile(
        metaPath,
        JSON.stringify({
          contentType: options.contentType,
          cacheControl: options.cacheControl,
          metadata: options.metadata,
          createdAt: new Date().toISOString(),
        })
      );
    }

    return key;
  }

  async get(key: string, _options?: GetOptions): Promise<StorageObject | null> {
    const filePath = this.getFilePath(key);

    try {
      const buffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);

      // Try to get MIME from metadata file
      let mime = "application/octet-stream";
      try {
        const metaPath = `${filePath}.meta.json`;
        const metaContent = await fs.readFile(metaPath, "utf-8");
        const meta = JSON.parse(metaContent);
        if (meta.contentType) mime = meta.contentType;
      } catch {
        // No metadata file, infer from extension
        const ext = path.extname(key).slice(1);
        if (ext) mime = extToMime(ext);
      }

      return {
        buffer,
        mime,
        size: stats.size,
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);
      // Also try to delete metadata file
      try {
        await fs.unlink(`${filePath}.meta.json`);
      } catch {
        // Ignore if no metadata file
      }
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    const filePath = this.getFilePath(key);

    try {
      const stats = await fs.stat(filePath);

      // Try to get MIME from metadata file
      let mime = "application/octet-stream";
      try {
        const metaPath = `${filePath}.meta.json`;
        const metaContent = await fs.readFile(metaPath, "utf-8");
        const meta = JSON.parse(metaContent);
        if (meta.contentType) mime = meta.contentType;
      } catch {
        const ext = path.extname(key).slice(1);
        if (ext) mime = extToMime(ext);
      }

      return {
        key,
        mime,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  getPublicUrl(key: string): string {
    // URL-encode the key for safe inclusion in URL
    const encodedKey = encodeURIComponent(key);
    return `${this.config.publicUrlPrefix}/${encodedKey}`;
  }

  async list(prefix: string): Promise<StorageMetadata[]> {
    const dirPath = this.getFilePath(prefix);
    const results: StorageMetadata[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && !entry.name.endsWith(".meta.json")) {
          const key = path.join(prefix, entry.name);
          const meta = await this.getMetadata(key);
          if (meta) results.push(meta);
        }
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw err;
    }

    return results;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let _storage: LocalStorageAdapter | null = null;

/**
 * Get the local storage adapter singleton.
 */
export function getLocalStorage(): LocalStorageAdapter {
  if (!_storage) {
    _storage = new LocalStorageAdapter();
  }
  return _storage;
}
