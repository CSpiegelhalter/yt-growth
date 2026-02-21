import { createHash } from "crypto";

/**
 * SHA-256 hash → hex → first 32 chars.
 * Use for pre-formatted string inputs.
 */
export function sha256Short(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {return obj;}
  if (Array.isArray(obj)) {return obj.map(sortKeys);}
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Stable hash for any serializable data.
 * Recursively sorts object keys, then SHA-256 → hex → first 32 chars.
 */
export function stableHash(data: unknown): string {
  return sha256Short(JSON.stringify(sortKeys(data)));
}
