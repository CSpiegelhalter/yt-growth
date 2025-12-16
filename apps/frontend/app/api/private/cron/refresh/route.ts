import { headers } from "next/headers";
import { prisma } from "@/prisma";
import { syncUserChannels } from "@/lib/sync-youtube";

export async function POST() {
  const secret = headers().get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const activeSubs = await prisma.subscription.findMany({
    where: { status: { in: ["active", "trialing", "past_due"] } },
  });
  const userIds = Array.from(new Set(activeSubs.map((s) => s.userId)));

  let refreshed = 0;
  for (const userId of userIds) {
    await syncUserChannels(userId);
    refreshed++;
  }

  return Response.json({ refreshed });
}
