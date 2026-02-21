/**
 * Next.js Middleware (proxy.ts)
 *
 * Runs on Vercel Edge for all requests.
 * Handles: auth protection, security headers, request hardening.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Security headers configuration
const SECURITY_HEADERS: Record<string, string> = {
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

  // Permissions policy (disable unused features)
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self)",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.ytimg.com https://*.ggpht.com https://replicate.delivery",
    "connect-src 'self' https://api.stripe.com https://www.googleapis.com https://youtubeanalytics.googleapis.com https://oauth2.googleapis.com https://va.vercel-scripts.com",
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; "),
};

// Suspicious paths to block (common attack vectors)
const SUSPICIOUS_PATHS = [
  "/wp-admin",
  "/wp-login",
  "/.env",
  "/phpinfo",
  "/phpmyadmin",
  "/.git",
  "/config",
  "/admin.php",
];

function getOrCreateRequestId(req: NextRequest) {
  const incoming = req.headers.get("x-request-id");
  if (incoming && incoming.length >= 8 && incoming.length <= 128)
    {return incoming;}
  return crypto.randomUUID();
}

function isProtectedPath(pathname: string) {
  const prefixes = [
    "/channels",
    "/audit",
    "/profile",
    "/saved-ideas",
    "/subscriber-insights",
    "/competitors",
    "/video",
    "/admin",
    "/api/private",
    "/api/me",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Static files that should never go through proxy
const STATIC_FILES = [
  "/manifest.json",
  "/favicon.ico",
  "/favicon.svg",
  "/icon.svg",
  "/logo.svg",
  "/apple-touch-icon.svg",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
];

/**
 * Apply security headers to response
 */
function applySecurityHeaders(res: NextResponse, requestId: string): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  res.headers.set("X-Request-ID", requestId);
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestId = getOrCreateRequestId(req);

  // Block suspicious paths (common attack vectors)
  if (SUSPICIOUS_PATHS.some((p) => pathname.toLowerCase().includes(p))) {
    const res = new NextResponse("Not Found", { status: 404 });
    applySecurityHeaders(res, requestId);
    return res;
  }

  // Skip proxy for static files (but still apply headers on initial load)
  if (STATIC_FILES.includes(pathname) || pathname.startsWith("/og/")) {
    const res = NextResponse.next();
    applySecurityHeaders(res, requestId);
    return res;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  // Auth protection for protected paths
  if (isProtectedPath(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/auth/login", req.nextUrl.origin);
      // Preserve original path for post-login navigation
      loginUrl.searchParams.set("redirect", `${pathname}${req.nextUrl.search}`);
      const res = NextResponse.redirect(loginUrl);
      applySecurityHeaders(res, requestId);
      return res;
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(res, requestId);
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - Static files in public folder
     */
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|icon\\.svg|logo\\.svg|apple-touch-icon\\.svg|robots\\.txt|sitemap\\.xml|manifest\\.json|og/).*)",
    "/api/:path*",
  ],
};
