/**
 * GET /api/me/channels/[channelId]/plans
 *
 * Get plan history for a channel.
 *
 * Auth: Required
 * Subscription: Not required (can view history even if subscription lapses)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate params
    const parsed = ParamsSchema.safeParse(params);
    if (!parsed.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsed.data;

    // Get channel and verify ownership
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get plans with pagination
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10", 10), 50);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where: { channelId: channel.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          outputMarkdown: true,
          modelVersion: true,
          tokensUsed: true,
          createdAt: true,
          cachedUntil: true,
        },
      }),
      prisma.plan.count({ where: { channelId: channel.id } }),
    ]);

    return Response.json({
      plans: plans.map((p) => ({
        ...p,
        isCached: p.cachedUntil > new Date(),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + plans.length < total,
      },
    });
  } catch (err: any) {
    console.error("Plans fetch error:", err);
    return Response.json(
      { error: "Failed to fetch plans", detail: err.message },
      { status: 500 }
    );
  }
}

