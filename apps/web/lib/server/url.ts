import type { NextRequest } from "next/server";

/**
 * Resolve the application's base URL for webhook callbacks, redirects, etc.
 *
 * Priority:
 *  1. NEXT_PUBLIC_APP_URL / NEXTAUTH_URL env vars
 *  2. Request headers (x-forwarded-proto + host) — only when `req` is provided
 *  3. Throws if nothing can be determined
 */
export function getAppBaseUrl(req?: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  if (env) return env.replace(/\/$/, "");

  if (req) {
    const proto = req.headers.get("x-forwarded-proto") ?? "http";
    const host =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host) return `${proto}://${host}`;
  }

  throw new Error("Cannot determine base URL — set NEXT_PUBLIC_APP_URL");
}
