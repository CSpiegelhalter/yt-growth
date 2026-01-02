/**
 * Security headers configuration
 *
 * Centralized security header definitions used by middleware and next.config.js.
 */

export const SECURITY_HEADERS = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // XSS protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // HSTS (1 year, include subdomains)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // Permissions policy
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self)",
} as const;

/**
 * Content Security Policy directives
 */
export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://va.vercel-scripts.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://*.ytimg.com",
    "https://*.ggpht.com",
  ],
  "connect-src": [
    "'self'",
    "https://api.stripe.com",
    "https://www.googleapis.com",
    "https://youtubeanalytics.googleapis.com",
    "https://oauth2.googleapis.com",
    "https://va.vercel-scripts.com",
  ],
  "frame-src": ["https://js.stripe.com", "https://checkout.stripe.com"],
  "font-src": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
} as const;

/**
 * Build CSP header string from directives
 */
export function buildCSP(
  directives: Record<string, readonly string[]> = CSP_DIRECTIVES
): string {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Get all security headers as an object
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    "Content-Security-Policy": buildCSP(),
  };
}

/**
 * Get security headers as Next.js header format
 */
export function getNextSecurityHeaders(): Array<{
  key: string;
  value: string;
}> {
  const headers = getSecurityHeaders();
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

/**
 * Cache control headers for sensitive data
 */
export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/**
 * CORS headers for API routes (restrictive by default)
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
  // Only allow same-origin by default
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Check if origin is allowed for CORS
 */
function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    "http://localhost:3000",
  ].filter(Boolean);

  return allowedOrigins.some((allowed) => origin.startsWith(allowed!));
}
