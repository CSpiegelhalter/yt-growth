/**
 * Storage key helpers — shared by local and S3 adapters.
 *
 * Extracted to its own file to avoid circular imports between
 * client.ts (factory) and local.ts / s3.ts (implementations).
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
