import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function getOrCreateRequestId(req: NextRequest) {
  const incoming = req.headers.get("x-request-id");
  if (incoming && incoming.length >= 8 && incoming.length <= 128) return incoming;
  return crypto.randomUUID();
}

function isProtectedPath(pathname: string) {
  const prefixes = [
    "/dashboard",
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

export default async function proxy(req: NextRequest) {
  const requestId = getOrCreateRequestId(req);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  if (isProtectedPath(req.nextUrl.pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/auth/login", req.nextUrl.origin);
      // Preserve original path for post-login navigation
      loginUrl.searchParams.set(
        "redirect",
        `${req.nextUrl.pathname}${req.nextUrl.search}`
      );
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("x-request-id", requestId);
      return res;
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("x-request-id", requestId);
  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|icon.svg|logo.svg|apple-touch-icon.svg|og/).*)",
  ],
};
