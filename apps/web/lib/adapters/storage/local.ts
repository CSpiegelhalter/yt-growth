/**
 * Local Filesystem Storage Adapter
 *
 * Stores files on local disk. Suitable for development and single-server deployments.
 * Files are stored in a configurable directory (default: .storage/).
 */

import { promises as fs } from "fs";
import * as path from "path";
import type {
  StoragePort,
  StorageObject,
  StorageObjectMetadata,
  PutObjectOptions,
} from "@/lib/ports/StoragePort";
import { extToMime } from "./utils";

type LocalStorageConfig = {
  basePath: string;
  publicUrlPrefix: string;
};

const DEFAULT_CONFIG: LocalStorageConfig = {
  basePath: path.join(process.cwd(), ".storage"),
  publicUrlPrefix: "/api/thumbnails/image",
};

class LocalStorageAdapter implements StoragePort {
  private config: LocalStorageConfig;

  constructor(config?: Partial<LocalStorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getFilePath(key: string): string {
    const sanitized = key.replace(/\.\./g, "").replace(/^\//, "");
    return path.join(this.config.basePath, sanitized);
  }

  /** Resolve MIME from .meta.json sidecar, falling back to file extension. */
  private async resolveMime(filePath: string, key: string): Promise<string> {
    try {
      const metaContent = await fs.readFile(`${filePath}.meta.json`, "utf-8");
      const meta = JSON.parse(metaContent);
      if (meta.contentType) return meta.contentType as string;
    } catch {
      const ext = path.extname(key).slice(1);
      if (ext) return extToMime(ext);
    }
    return "application/octet-stream";
  }

  async put(key: string, data: Buffer, options?: PutObjectOptions): Promise<string> {
    const filePath = this.getFilePath(key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);

    if (options?.contentType) {
      const metaPath = `${filePath}.meta.json`;
      await fs.writeFile(
        metaPath,
        JSON.stringify({
          contentType: options.contentType,
          cacheControl: options.cacheControl,
          metadata: options.metadata,
          createdAt: new Date().toISOString(),
        }),
      );
    }

    return key;
  }

  async get(key: string): Promise<StorageObject | null> {
    const filePath = this.getFilePath(key);

    try {
      const buffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      const mime = await this.resolveMime(filePath, key);

      return { buffer, mime, size: stats.size };
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
      try {
        await fs.unlink(`${filePath}.meta.json`);
      } catch {
        // No metadata file
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

  async getMetadata(key: string): Promise<StorageObjectMetadata | null> {
    const filePath = this.getFilePath(key);

    try {
      const stats = await fs.stat(filePath);
      const mime = await this.resolveMime(filePath, key);

      return { key, mime, size: stats.size, createdAt: stats.birthtime };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  getPublicUrl(key: string): string {
    const encodedKey = encodeURIComponent(key);
    return `${this.config.publicUrlPrefix}/${encodedKey}`;
  }

  async list(prefix: string): Promise<StorageObjectMetadata[]> {
    const dirPath = this.getFilePath(prefix);
    const results: StorageObjectMetadata[] = [];

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

// ─── Singleton ───────────────────────────────────────────────

let _storage: LocalStorageAdapter | null = null;

export function getLocalStorage(): LocalStorageAdapter {
  if (!_storage) {
    _storage = new LocalStorageAdapter();
  }
  return _storage;
}
