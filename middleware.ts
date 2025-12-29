import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/auth/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",     // protect dashboard
    "/channels/:path*",      // protect channels
    "/audit/:path*",         // protect audit pages
    "/profile/:path*",       // protect profile
    "/api/private/:path*",   // protect private APIs
    "/api/me/:path*",        // protect user APIs
  ],
};
