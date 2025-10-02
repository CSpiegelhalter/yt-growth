import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/auth/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",     // protect dashboard
    "/channels/:path*",      // protect channels
    "/api/private/:path*",   // protect private APIs
  ],
};
