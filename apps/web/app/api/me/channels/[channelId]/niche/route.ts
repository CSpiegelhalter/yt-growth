/**
 * GET/POST /api/me/channels/[channelId]/niche
 *
 * Pre-warm the niche cache for a channel.
 * Called by the dashboard on page load to ensure niche is ready
 * before user navigates to competitors or idea pages.
 *
 * GET - Returns current niche status/data (or triggers generation)
 * POST - Explicitly triggers background generation (non-blocking)
 *
 * Auth: Required
 * Rate limit: None (lightweight endpoint)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription } from "@/lib/user";
import {
  getChannelNiche,
  triggerNicheGenerationInBackground,
} from "@/lib/channel-niche";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";

/**
 * GET - Get current niche status and optionally trigger generation
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  void req;
  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsObj = await params;
    const parsedParams = channelParamsSchema.safeParse(paramsObj);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

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

    // Check for existing cached niche
    const cached = await getChannelNiche(channel.id);

    if (cached) {
      return Response.json({
        status: "cached",
        niche: cached.niche,
        queries: cached.queries,
        generatedAt: cached.generatedAt,
        cachedUntil: cached.cachedUntil,
      });
    }

    // No cache - trigger background generation
    const result = await triggerNicheGenerationInBackground(channel.id);

    return Response.json({
      status: result.status,
      niche: null,
      queries: [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Niche GET error:", err);
    return Response.json(
      { error: "Failed to get niche", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger background niche generation (non-blocking)
 * Returns immediately with status - doesn't wait for generation to complete
 */
async function POSTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  void req;
  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsObj = await params;
    const parsedParams = channelParamsSchema.safeParse(paramsObj);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

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

    // Trigger background generation
    const result = await triggerNicheGenerationInBackground(channel.id);

    return Response.json({
      success: true,
      status: result.status,
      message:
        result.status === "cached"
          ? "Niche already cached"
          : result.status === "already_in_progress"
          ? "Niche generation already in progress"
          : result.status === "no_videos"
          ? "Not enough videos to generate niche"
          : "Niche generation started in background",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Niche POST error:", err);
    return Response.json(
      { error: "Failed to trigger niche generation", detail: message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/niche" },
  async (req, ctx) => GETHandler(req, ctx as any)
);

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/niche" },
  async (req, ctx) => POSTHandler(req, ctx as any)
);
