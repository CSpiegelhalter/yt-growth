import bcrypt from "bcryptjs";
import crypto from "crypto";

export const hash = (s: string) => bcrypt.hash(s, 12);
export const compare = (s: string, h: string) => bcrypt.compare(s, h);

/**
 * Timing-safe comparison of two hex-encoded strings.
 * Used by webhook signature verification (Stripe, Replicate, etc.)
 * to prevent timing attacks.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length !== bb.length) {return false;}
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}
