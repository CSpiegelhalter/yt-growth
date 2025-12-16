import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/auth/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",     // protect dashboard
    "/channels/:path*",      // protect channels
    "/audit/:path*",
    "/profile/:path*",
    "/api/private/:path*",   // protect private APIs
  ],
};
