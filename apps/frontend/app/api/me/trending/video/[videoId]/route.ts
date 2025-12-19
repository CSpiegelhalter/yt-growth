/**
 * GET /api/me/trending/video/[videoId]
 *
 * Get deep analysis of a specific trending video.
 * Provides structured insights without markdown blobs.
 *
 * Auth: Required
 * Subscription: Required
 * Caching: 7-30 days per videoId (trending analysis doesn't need frequent refresh)
 *
 * Query params:
 * - channelId: string (the user's active channel for context)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { getGoogleAccount, fetchVideoDetails } from "@/lib/youtube-api";
import { generateTrendingVideoAnalysis } from "@/lib/llm";
import { isDemoMode } from "@/lib/demo-fixtures";
import type { TrendingVideoAnalysis, TrendingVideo } from "@/types/api";

const ParamsSchema = z.object({
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  channelId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode()) {
    const demoData = generateDemoVideoAnalysis(params.videoId);
    return Response.json(demoData);
  }

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
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const { videoId } = parsedParams.data;

    // Parse query params
    const url = new URL(req.url);
    const queryResult = QuerySchema.safeParse({
      channelId: url.searchParams.get("channelId") ?? "",
    });

    if (!queryResult.success) {
      return Response.json(
        { error: "channelId query parameter required" },
        { status: 400 }
      );
    }

    const { channelId } = queryResult.data;

    // Verify the user owns this channel
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get Google account for API calls
    const ga = await getGoogleAccount(user.id);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // Fetch video details from YouTube API
    const videoDetails = await fetchVideoDetails(ga, videoId);
    if (!videoDetails) {
      return Response.json({ error: "Video not found" }, { status: 404 });
    }

    // Check if this is the user's own video
    const isUserVideo = videoDetails.channelId === channelId;

    // Calculate metrics
    const now = new Date();
    const publishedAt = new Date(videoDetails.publishedAt);
    const daysSincePublish = Math.max(
      1,
      Math.floor(
        (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const viewsPerDay = Math.round(videoDetails.viewCount / daysSincePublish);

    // Calculate engagement rates
    const likeRate =
      videoDetails.likeCount && videoDetails.viewCount > 0
        ? (videoDetails.likeCount / videoDetails.viewCount) * 100
        : undefined;
    const commentRate =
      videoDetails.commentCount && videoDetails.viewCount > 0
        ? (videoDetails.commentCount / videoDetails.viewCount) * 100
        : undefined;

    // Build video object
    const video: TrendingVideo = {
      videoId: videoDetails.videoId,
      title: videoDetails.title,
      channelId: videoDetails.channelId,
      channelTitle: videoDetails.channelTitle,
      channelThumbnailUrl: null,
      videoUrl: `https://youtube.com/watch?v=${videoDetails.videoId}`,
      channelUrl: `https://youtube.com/channel/${videoDetails.channelId}`,
      thumbnailUrl: videoDetails.thumbnailUrl,
      publishedAt: videoDetails.publishedAt,
      viewCount: videoDetails.viewCount,
      likeCount: videoDetails.likeCount,
      commentCount: videoDetails.commentCount,
      viewsPerDay,
      durationSec: videoDetails.durationSec,
      topicKeywords: videoDetails.tags?.slice(0, 10),
      isUserVideo,
    };

    // Generate analysis using LLM
    let analysis: TrendingVideoAnalysis["analysis"];

    try {
      analysis = await generateTrendingVideoAnalysis(
        video,
        channel.title ?? "Your Channel"
      );
    } catch (err) {
      console.warn(
        "Failed to generate trending analysis, using defaults:",
        err
      );
      analysis = getDefaultAnalysis(video);
    }

    // Build response
    const response: TrendingVideoAnalysis = {
      video,
      metrics: {
        viewCount: video.viewCount,
        viewsPerDay,
        likeRate,
        commentRate,
        // Only include subscriber metrics for user's own videos
        ...(isUserVideo
          ? {
              subscriberGain: undefined, // Would need Analytics API
              subsPer1k: undefined,
            }
          : {}),
      },
      analysis,
      tags: videoDetails.tags,
      category: videoDetails.category,
    };

    return Response.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Trending video analysis error:", err);

    // Return demo analysis as fallback
    const demoData = generateDemoVideoAnalysis(params.videoId);
    return Response.json({
      ...demoData,
      error: "Using demo data - actual fetch failed",
    });
  }
}

// Default analysis when LLM fails
function getDefaultAnalysis(
  video: TrendingVideo
): TrendingVideoAnalysis["analysis"] {
  return {
    whatItsAbout: `A video about ${
      video.title?.split(" ").slice(0, 5).join(" ") || "this topic"
    }...`,
    whyTrending: [
      "Strong initial hook in the first 5 seconds",
      "Title creates immediate curiosity",
      "Thumbnail has clear, readable text",
    ],
    whatTheyDidWell: [
      "Clear value proposition in the title",
      "Maintains viewer attention throughout",
      "Strong call to action",
    ],
    themesToRemix: [
      {
        theme: "Personal experience angle",
        why: "Adds authenticity and relatability",
      },
      { theme: "Contrarian perspective", why: "Stands out in a crowded niche" },
    ],
    titlePatterns: [
      "Number + outcome pattern",
      "Creates urgency with 'now' or 'today'",
    ],
    hookPatterns: ["Opens with a bold claim", "Shows the end result first"],
    thumbnailPatterns: [
      "High contrast text overlay",
      "Clear facial expression",
    ],
    remixIdeasForYou: [
      {
        title: `My Version: ${video.title?.slice(0, 30) || "This Topic"}`,
        hook: "What if I told you there's a better way?",
        overlayText: "I TRIED IT",
        angle: "Personal experiment documenting your results",
      },
      {
        title: `The Truth About ${
          video.title?.split(" ").slice(0, 3).join(" ") || "This"
        }`,
        hook: "Everyone's talking about this, but nobody mentions...",
        overlayText: "THE TRUTH",
        angle: "Myth-busting with evidence",
      },
    ],
  };
}

// Generate demo video analysis
function generateDemoVideoAnalysis(videoId: string): TrendingVideoAnalysis {
  const now = new Date();

  return {
    video: {
      videoId,
      title: "This One Change DOUBLED My YouTube Growth",
      channelId: "demo-channel",
      channelTitle: "Creator Academy",
      channelThumbnailUrl: null,
      videoUrl: `https://youtube.com/watch?v=${videoId}`,
      channelUrl: "https://youtube.com/channel/demo-channel",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      publishedAt: new Date(
        now.getTime() - 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
      viewCount: 245000,
      viewsPerDay: 81666,
      isUserVideo: false,
    },
    metrics: {
      viewCount: 245000,
      viewsPerDay: 81666,
      likeRate: 4.8,
      commentRate: 0.3,
    },
    analysis: {
      whatItsAbout:
        "A creator shares how changing their upload strategy from 3 videos per week to 1 high-quality video doubled their subscriber growth and watch time.",
      whyTrending: [
        "Addresses a common pain point (quantity vs quality debate)",
        "Promise of 'doubling growth' is specific and compelling",
        "Published during peak creator burnout discussion period",
        "Strong thumbnail with before/after visual contrast",
      ],
      whatTheyDidWell: [
        "Opens with hard data showing the growth metrics",
        "Uses chapter markers for easy navigation",
        "Shares specific, actionable steps (not just theory)",
        "Includes real screenshots as proof",
        "Ends with clear next action for viewers",
      ],
      themesToRemix: [
        {
          theme: "Quality over quantity",
          why: "Resonates with burned-out creators looking for permission to slow down",
        },
        {
          theme: "Data-driven decisions",
          why: "Appeals to analytical creators who want proof",
        },
        {
          theme: "Sustainable growth",
          why: "Taps into long-term thinking mindset",
        },
      ],
      titlePatterns: [
        "'This One Change' creates curiosity about the single solution",
        "'DOUBLED' is a specific, believable metric",
        "Direct address with 'My' makes it personal/authentic",
      ],
      hookPatterns: [
        "Opens with the transformation (end result first)",
        "Immediately shows data to establish credibility",
        "Creates pattern interrupt with unexpected advice",
      ],
      thumbnailPatterns: [
        "Split screen showing before/after comparison",
        "Large '2X' text with arrow indicating growth",
        "Creator face showing genuine surprise/excitement",
      ],
      remixIdeasForYou: [
        {
          title: "I Tried Posting Less (Here's What Happened)",
          hook: "I was posting 5 times a week. Then I tried something crazy...",
          overlayText: "I STOPPED",
          angle:
            "Personal experiment documenting your shift to quality over quantity",
        },
        {
          title: "The Upload Schedule That Actually Works",
          hook: "Forget everything you've heard about 'consistency'",
          overlayText: "NEW STRATEGY",
          angle:
            "Data-backed breakdown of optimal posting frequency for your niche",
        },
        {
          title: "Why Less Content = More Growth (Proof Inside)",
          hook: "What if the secret to growing isn't making more videos?",
          overlayText: "PROOF",
          angle:
            "Counter-intuitive deep dive with case studies from your niche",
        },
      ],
    },
    tags: [
      "youtube growth",
      "content strategy",
      "creator tips",
      "upload schedule",
    ],
    category: "Education",
  };
}
