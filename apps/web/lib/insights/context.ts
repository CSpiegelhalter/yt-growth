import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { channelVideoParamsSchema } from "@/lib/competitors/video-detail/validation";

const RangeSchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

export type InsightsContext = {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUserWithSubscription>>>;
  channel: { id: number; youtubeChannelId: string };
  cached: NonNullable<Awaited<ReturnType<typeof prisma.ownedVideoInsightsCache.findFirst>>>;
  derivedData: any;
  range: "7d" | "28d" | "90d";
  channelId: string;
  videoId: string;
};

/**
 * Shared auth → validation → cache → rate-limit pipeline used by
 * ideas / seo / comments / summary insight routes.
 *
 * Returns a `Response` on failure or an `InsightsContext` on success.
 */
export async function getVideoInsightsContext(
  req: NextRequest,
  params: Promise<{ channelId: string; videoId: string }>,
): Promise<Response | InsightsContext> {
  const resolvedParams = await params;

  const parsedParams = channelVideoParamsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { channelId, videoId } = parsedParams.data;

  const url = new URL(req.url);
  const queryResult = RangeSchema.safeParse({
    range: url.searchParams.get("range") ?? "28d",
  });
  if (!queryResult.success) {
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }
  const { range } = queryResult.data;

  const user = await getCurrentUserWithSubscription();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId: user.id },
  });
  if (!channel) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  const cached = await prisma.ownedVideoInsightsCache.findFirst({
    where: {
      userId: user.id,
      channelId: channel.id,
      videoId,
      range,
    },
  });

  if (!cached?.derivedJson) {
    return Response.json(
      { error: "Analytics not loaded. Call /analytics first." },
      { status: 400 },
    );
  }

  const rateResult = checkRateLimit(
    rateLimitKey("videoInsights", user.id),
    RATE_LIMITS.videoInsights,
  );
  if (!rateResult.success) {
    return Response.json(
      { error: "Rate limit exceeded", retryAfter: rateResult.resetAt },
      { status: 429 },
    );
  }

  return {
    user,
    channel,
    cached,
    derivedData: cached.derivedJson as any,
    range,
    channelId,
    videoId,
  };
}

/** Type guard: is the result an early-exit HTTP Response? */
export function isErrorResponse(
  result: Response | InsightsContext,
): result is Response {
  return result instanceof Response;
}
