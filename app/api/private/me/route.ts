import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";

async function GETHandler() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ user: session.user });
}

export const GET = createApiRoute(
  { route: "/api/private/me" },
  async () => GETHandler()
);
