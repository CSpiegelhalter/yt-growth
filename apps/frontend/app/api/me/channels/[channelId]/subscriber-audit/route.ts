/**
 * GET /api/me/channels/[channelId]/subscriber-audit
 *
 * Get top 3 videos by subscribers gained per 1k views with pattern analysis.
 * This is a PAID feature - requires active subscription.
 *
 * Auth: Required
 * Subscription: Required
 * Caching: Uses video metrics cache (12h)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import { calcSubsPerThousandViews } from "@/lib/retention";
import { generateSubscriberMagnetAnalysis } from "@/lib/llm";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscription check (paid feature)
    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
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

    // Get videos with metrics
    const videos = await prisma.video.findMany({
      where: {
        channelId: channel.id,
        VideoMetrics: { isNot: null },
      },
      include: {
        VideoMetrics: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 50, // Look at last 50 videos
    });

    if (videos.length === 0) {
      return Response.json({
        topVideos: [],
        analysis: null,
        message: "No video metrics found. Please sync the channel first.",
      });
    }

    // Calculate subs per 1k views and sort
    const videosWithSubs = videos
      .filter((v) => v.VideoMetrics && v.VideoMetrics.views > 0)
      .map((v) => ({
        videoId: v.youtubeVideoId,
        title: v.title ?? "Untitled",
        views: v.VideoMetrics!.views,
        subscribersGained: v.VideoMetrics!.subscribersGained,
        subsPerThousand: calcSubsPerThousandViews(
          v.VideoMetrics!.subscribersGained,
          v.VideoMetrics!.views
        ),
        publishedAt: v.publishedAt,
        thumbnailUrl: v.thumbnailUrl,
      }))
      .sort((a, b) => b.subsPerThousand - a.subsPerThousand);

    const topVideos = videosWithSubs.slice(0, 3);

    // Generate pattern analysis if we have top videos
    let analysis: string | null = null;
    if (topVideos.length > 0) {
      try {
        const llmResult = await generateSubscriberMagnetAnalysis(
          topVideos.map((v) => ({
            title: v.title,
            subsPerThousand: v.subsPerThousand,
            views: v.views,
          }))
        );
        analysis = llmResult.content;
      } catch (err) {
        console.warn("Failed to generate subscriber analysis:", err);
        analysis = null;
      }
    }

    // Calculate channel averages for context
    const totalSubs = videosWithSubs.reduce((sum, v) => sum + v.subscribersGained, 0);
    const totalViews = videosWithSubs.reduce((sum, v) => sum + v.views, 0);
    const avgSubsPerThousand = calcSubsPerThousandViews(totalSubs, totalViews);

    return Response.json({
      channelId,
      topVideos,
      analysis,
      stats: {
        totalVideosAnalyzed: videosWithSubs.length,
        avgSubsPerThousand,
        totalSubscribersGained: totalSubs,
        totalViews,
      },
      fetchedAt: new Date(),
    });
  } catch (err: any) {
    console.error("Subscriber audit error:", err);
    return Response.json(
      { error: "Failed to fetch subscriber audit", detail: err.message },
      { status: 500 }
    );
  }
}

