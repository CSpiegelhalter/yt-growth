import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth route handler
 *
 * Note: NextAuth handles its own request/response lifecycle and cannot be
 * wrapped with createApiRoute. It expects the raw handler exported directly.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
