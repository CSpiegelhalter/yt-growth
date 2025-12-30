import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { createApiRoute } from "@/lib/api/route";

const handler = NextAuth(authOptions);

export const GET = createApiRoute(
  { route: "/api/auth/[...nextauth]" },
  async (req) => handler(req)
);

export const POST = createApiRoute(
  { route: "/api/auth/[...nextauth]" },
  async (req) => handler(req)
);
