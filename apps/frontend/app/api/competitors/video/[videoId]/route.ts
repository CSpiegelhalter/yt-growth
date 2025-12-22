/**
 * GET /api/competitors/video/[videoId]
 *
 * Get deep analysis of a specific competitor video including:
 * - Public stats and derived velocity metrics
 * - Top comments analysis (sentiment, themes, hook inspiration)
 * - LLM-generated insights for remixing
 *
 * IMPORTANT: Only shows publicly available metrics.
 * Subscriber gain, watch time, AVD are NOT available for competitors.
 *
 * Auth: Required
 * Subscription: Required
 * Caching: 7-30 days per videoId
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
import {
  getGoogleAccount,
  fetchVideoDetails,
  fetchRecentChannelVideos,
  fetchVideoComments,
} from "@/lib/youtube-api";
import {
  generateCompetitorVideoAnalysis,
  analyzeVideoComments,
} from "@/lib/llm";
import { isDemoMode, isYouTubeMockMode } from "@/lib/demo-fixtures";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import type {
  CompetitorVideoAnalysis,
  CompetitorVideo,
  CompetitorCommentsAnalysis,
} from "@/types/api";

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
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = generateDemoVideoAnalysis(params.videoId);
    return Response.json(demoData);
  }

  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const rlKey = rateLimitKey("competitorDetail", user.id);
    const rlResult = checkRateLimit(rlKey, RATE_LIMITS.competitorDetail);
    if (!rlResult.success) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          resetAt: new Date(rlResult.resetAt).toISOString(),
        },
        { status: 429 }
      );
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

    // Check for cached analysis in DB
    const cachedComments = await prisma.competitorVideoComments.findUnique({
      where: { videoId },
    });

    // If comment analysis is fresh (within 7 days), use cached
    const commentsCacheDays = 7;
    const now = new Date();
    const isCacheFresh =
      cachedComments &&
      now.getTime() - cachedComments.capturedAt.getTime() <
        commentsCacheDays * 24 * 60 * 60 * 1000;

    // Fetch video details from YouTube API
    const videoDetails = await fetchVideoDetails(ga, videoId);
    if (!videoDetails) {
      return Response.json({ error: "Video not found" }, { status: 404 });
    }

    console.log("[competitor.video] fetched video details", {
      videoId,
      channelId: videoDetails.channelId,
      titleLen: videoDetails.title?.length ?? 0,
      descLen: videoDetails.description?.length ?? 0,
      tagsCount: videoDetails.tags?.length ?? 0,
      hasThumb: Boolean(videoDetails.thumbnailUrl),
      hasDuration: Boolean(videoDetails.durationSec),
    });

    // Upsert competitor video metadata (enables caching LLM analysis even if it wasn't tracked before)
    await prisma.competitorVideo.upsert({
      where: { videoId },
      create: {
        videoId,
        channelId: videoDetails.channelId,
        channelTitle: videoDetails.channelTitle,
        title: videoDetails.title,
        description: videoDetails.description,
        publishedAt: new Date(videoDetails.publishedAt),
        durationSec: videoDetails.durationSec,
        thumbnailUrl: videoDetails.thumbnailUrl ?? undefined,
        tags: videoDetails.tags ?? [],
        categoryId: videoDetails.category,
        lastFetchedAt: now,
      },
      update: {
        channelId: videoDetails.channelId,
        channelTitle: videoDetails.channelTitle,
        title: videoDetails.title,
        description: videoDetails.description,
        publishedAt: new Date(videoDetails.publishedAt),
        durationSec: videoDetails.durationSec,
        thumbnailUrl: videoDetails.thumbnailUrl ?? undefined,
        tags: videoDetails.tags ?? [],
        categoryId: videoDetails.category,
        lastFetchedAt: now,
      },
    });

    // Calculate derived metrics
    const publishedAt = new Date(videoDetails.publishedAt);
    const daysSincePublish = Math.max(
      1,
      Math.floor(
        (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const viewsPerDay = Math.round(videoDetails.viewCount / daysSincePublish);

    // Calculate engagement rates from public metrics
    const engagementPerView =
      videoDetails.viewCount > 0
        ? (videoDetails.likeCount + videoDetails.commentCount) /
          videoDetails.viewCount
        : undefined;

    // Get velocity from snapshots if available (+ cached LLM analysis)
    const dbVideo = await prisma.competitorVideo.findUnique({
      where: { videoId },
      include: {
        Snapshots: {
          orderBy: { capturedAt: "desc" },
          take: 5,
        },
      },
    });

    let velocity24h: number | undefined;
    let velocity7d: number | undefined;

    if (dbVideo && dbVideo.Snapshots.length >= 2) {
      const latest = dbVideo.Snapshots[0];
      const snapshot24h = dbVideo.Snapshots.find((s) => {
        const age = now.getTime() - s.capturedAt.getTime();
        return age >= 20 * 60 * 60 * 1000 && age <= 28 * 60 * 60 * 1000;
      });
      const snapshot7d = dbVideo.Snapshots.find((s) => {
        const age = now.getTime() - s.capturedAt.getTime();
        return age >= 6 * 24 * 60 * 60 * 1000 && age <= 8 * 24 * 60 * 60 * 1000;
      });

      if (snapshot24h) velocity24h = latest.viewCount - snapshot24h.viewCount;
      if (snapshot7d) velocity7d = latest.viewCount - snapshot7d.viewCount;
    }

    // Build video object
    const video: CompetitorVideo = {
      videoId: videoDetails.videoId,
      title: videoDetails.title,
      channelId: videoDetails.channelId,
      channelTitle: videoDetails.channelTitle,
      channelThumbnailUrl: null,
      videoUrl: `https://youtube.com/watch?v=${videoDetails.videoId}`,
      channelUrl: `https://youtube.com/channel/${videoDetails.channelId}`,
      thumbnailUrl: videoDetails.thumbnailUrl,
      publishedAt: videoDetails.publishedAt,
      durationSec: videoDetails.durationSec,
      stats: {
        viewCount: videoDetails.viewCount,
        likeCount: videoDetails.likeCount,
        commentCount: videoDetails.commentCount,
      },
      derived: {
        viewsPerDay,
        velocity24h,
        velocity7d,
        engagementPerView,
        dataStatus: velocity24h !== undefined ? "ready" : "building",
      },
    };

    // Fetch or use cached comments analysis
    let commentsAnalysis: CompetitorCommentsAnalysis | undefined;

    if (isCacheFresh && cachedComments?.analysisJson) {
      // Use cached analysis
      commentsAnalysis =
        cachedComments.analysisJson as unknown as CompetitorCommentsAnalysis;
    } else {
      // Fetch fresh comments
      const commentsRlKey = rateLimitKey("competitorComments", user.id);
      const commentsRlResult = checkRateLimit(
        commentsRlKey,
        RATE_LIMITS.competitorComments
      );

      if (commentsRlResult.success) {
        const commentsResult = await fetchVideoComments(ga, videoId, 50);

        if (commentsResult.commentsDisabled) {
          commentsAnalysis = {
            topComments: [],
            sentiment: { positive: 0, neutral: 0, negative: 0 },
            themes: [],
            viewerLoved: [],
            viewerAskedFor: [],
            hookInspiration: [],
            commentsDisabled: true,
          };
        } else if (commentsResult.error) {
          commentsAnalysis = {
            topComments: [],
            sentiment: { positive: 0, neutral: 0, negative: 0 },
            themes: [],
            viewerLoved: [],
            viewerAskedFor: [],
            hookInspiration: [],
            error: commentsResult.error,
          };
        } else if (commentsResult.comments.length > 0) {
          // Analyze comments with LLM
          try {
            commentsAnalysis = await analyzeVideoComments(
              commentsResult.comments.slice(0, 30), // Limit for token efficiency
              video.title
            );

            // Add top comments to response
            commentsAnalysis.topComments = commentsResult.comments
              .slice(0, 10)
              .map((c) => ({
                text: c.text,
                likeCount: c.likeCount,
                authorName: c.authorName,
                publishedAt: c.publishedAt,
              }));

            // Cache the analysis
            await prisma.competitorVideoComments.upsert({
              where: { videoId },
              create: {
                videoId,
                capturedAt: now,
                topCommentsJson: commentsResult.comments.slice(0, 20),
                analysisJson: commentsAnalysis as object,
                sentimentPos: commentsAnalysis.sentiment.positive,
                sentimentNeu: commentsAnalysis.sentiment.neutral,
                sentimentNeg: commentsAnalysis.sentiment.negative,
                themesJson: commentsAnalysis.themes,
              },
              update: {
                capturedAt: now,
                topCommentsJson: commentsResult.comments.slice(0, 20),
                analysisJson: commentsAnalysis as object,
                sentimentPos: commentsAnalysis.sentiment.positive,
                sentimentNeu: commentsAnalysis.sentiment.neutral,
                sentimentNeg: commentsAnalysis.sentiment.negative,
                themesJson: commentsAnalysis.themes,
              },
            });
          } catch (err) {
            console.warn("Failed to analyze comments:", err);
            commentsAnalysis = {
              topComments: commentsResult.comments.slice(0, 10).map((c) => ({
                text: c.text,
                likeCount: c.likeCount,
                authorName: c.authorName,
                publishedAt: c.publishedAt,
              })),
              sentiment: { positive: 50, neutral: 30, negative: 20 }, // Fallback
              themes: [],
              viewerLoved: [],
              viewerAskedFor: [],
              hookInspiration: [],
              error: "Analysis unavailable",
            };
          }
        }
      }
    }

    // Fetch more videos from the same channel
    const rangeDays = 28;
    const publishedAfter = new Date(
      now.getTime() - rangeDays * 24 * 60 * 60 * 1000
    ).toISOString();
    let moreFromChannel: CompetitorVideo[] = [];

    try {
      const channelVideos = await fetchRecentChannelVideos(
        ga,
        videoDetails.channelId,
        publishedAfter,
        6
      );
      moreFromChannel = channelVideos
        .filter((v) => v.videoId !== videoId)
        .slice(0, 4)
        .map((v) => ({
          videoId: v.videoId,
          title: v.title,
          channelId: videoDetails.channelId,
          channelTitle: videoDetails.channelTitle,
          channelThumbnailUrl: null,
          videoUrl: `https://youtube.com/watch?v=${v.videoId}`,
          channelUrl: `https://youtube.com/channel/${videoDetails.channelId}`,
          thumbnailUrl: v.thumbnailUrl,
          publishedAt: v.publishedAt,
          stats: { viewCount: v.views },
          derived: { viewsPerDay: v.viewsPerDay },
        }));
    } catch (err) {
      console.warn("Failed to fetch more videos from channel:", err);
    }

    // Generate analysis using LLM (includes comments context if available)
    let analysis: CompetitorVideoAnalysis["analysis"];

    const analysisCacheDays = 30;
    const isAnalysisCacheFresh =
      dbVideo?.analysisCapturedAt &&
      now.getTime() - dbVideo.analysisCapturedAt.getTime() <
        analysisCacheDays * 24 * 60 * 60 * 1000;

    if (isAnalysisCacheFresh && dbVideo?.analysisJson) {
      analysis =
        dbVideo.analysisJson as unknown as CompetitorVideoAnalysis["analysis"];
    } else {
      try {
        analysis = await generateCompetitorVideoAnalysis(
          {
            videoId: video.videoId,
            title: video.title,
            description: videoDetails.description,
            tags: videoDetails.tags ?? [],
            channelTitle: video.channelTitle,
            stats: video.stats,
            derived: {
              viewsPerDay: video.derived.viewsPerDay,
              engagementPerView,
            },
          },
          channel.title ?? "Your Channel",
          commentsAnalysis
        );
      } catch (err) {
        console.warn(
          "Failed to generate competitor analysis, using defaults:",
          err
        );
        analysis = getDefaultAnalysis(video);
      }
    }

    // Normalize analysis to protect the UI from partial LLM output.
    // (We keep packagingNotes in the type for backward compatibility, but the UI no longer displays it.)
    analysis = {
      whatItsAbout:
        (analysis.whatItsAbout ?? "").trim() ||
        fallbackWhatItsAbout({
          title: videoDetails.title,
          description: videoDetails.description,
          tags: videoDetails.tags ?? [],
        }),
      whyItsWorking: Array.isArray(analysis.whyItsWorking)
        ? analysis.whyItsWorking
        : [],
      themesToRemix: Array.isArray(analysis.themesToRemix)
        ? analysis.themesToRemix
        : [],
      titlePatterns: Array.isArray(analysis.titlePatterns)
        ? analysis.titlePatterns
        : [],
      packagingNotes: Array.isArray(analysis.packagingNotes)
        ? analysis.packagingNotes
        : [],
      remixIdeasForYou: Array.isArray(analysis.remixIdeasForYou)
        ? analysis.remixIdeasForYou
        : [],
    };

    // Persist normalized analysis (cache) so the “What it’s about” stays useful without re-calling the LLM.
    // Only write when cache was missing/stale.
    if (!isAnalysisCacheFresh) {
      try {
        await prisma.competitorVideo.update({
          where: { videoId },
          data: {
            analysisJson: analysis as object,
            analysisCapturedAt: now,
          },
        });
      } catch (err) {
        console.warn("Failed to cache competitor video analysis:", err);
      }
    }

    console.log("[competitor.video] analysis summary", {
      videoId,
      whatItsAboutLen: analysis.whatItsAbout.length,
      whyItsWorkingCount: analysis.whyItsWorking.length,
      themesToRemixCount: analysis.themesToRemix.length,
      titlePatternsCount: analysis.titlePatterns.length,
      remixIdeasCount: analysis.remixIdeasForYou.length,
      hasCommentsAnalysis: Boolean(commentsAnalysis),
    });

    // Derive keywords if tags are empty
    let derivedKeywords: string[] | undefined;
    if (!videoDetails.tags || videoDetails.tags.length === 0) {
      derivedKeywords = deriveKeywordsFromText(
        `${videoDetails.title} ${videoDetails.description?.slice(0, 500) ?? ""}`
      );
    }

    // Build response
    const response: CompetitorVideoAnalysis = {
      video,
      analysis,
      comments: commentsAnalysis,
      tags: videoDetails.tags ?? [],
      derivedKeywords,
      category: videoDetails.category,
      moreFromChannel,
    };

    return Response.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Competitor video analysis error:", err);
    return Response.json(
      { error: "Failed to analyze competitor video", detail: message },
      { status: 500 }
    );
  }
}

// Derive keywords from text when tags are missing
function deriveKeywordsFromText(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !commonWords.has(w));

  const wordCounts = new Map<string, number>();
  words.forEach((w) => {
    wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
  });

  return [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function fallbackWhatItsAbout(input: {
  title: string;
  description?: string | null;
  tags: string[];
}): string {
  const desc = (input.description ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Prefer the first “real” sentence from the description (not the title).
  const firstSentence = desc.split(/(?<=[.!?])\s+/).find((s) => {
    const t = s.trim();
    return t.length >= 60 && t.length <= 240;
  });
  if (firstSentence) return firstSentence.trim();

  const topTags = (input.tags ?? []).slice(0, 4).filter(Boolean);
  if (topTags.length > 0) {
    return `A video centered on ${topTags.join(
      ", "
    )}, framed as a practical breakdown for viewers.`;
  }

  // Last resort: avoid echoing the title; keep it general.
  return "A video that explores the core topic implied by the title, focusing on the main promise and viewer takeaway.";
}

// Default analysis when LLM fails
function getDefaultAnalysis(
  video: CompetitorVideo
): CompetitorVideoAnalysis["analysis"] {
  return {
    whatItsAbout: `A video about ${
      video.title?.split(" ").slice(0, 5).join(" ") || "this topic"
    }...`,
    whyItsWorking: [
      "Strong initial hook captures attention in the first few seconds",
      "Title creates clear curiosity gap without revealing the answer",
      "Specific outcome or transformation promised",
      "High engagement indicates strong audience resonance",
    ],
    themesToRemix: [
      {
        theme: "Personal experience angle",
        why: "Adds authenticity and relatability to the topic",
      },
      {
        theme: "Contrarian perspective",
        why: "Stands out in a crowded niche by challenging assumptions",
      },
    ],
    titlePatterns: [
      "Uses specific, believable numbers",
      "Creates urgency with timely language",
    ],
    packagingNotes: [
      "Clear value proposition visible at a glance",
      "Likely uses emotional triggers in thumbnail",
    ],
    remixIdeasForYou: [
      {
        title: `My Take on ${video.title?.slice(0, 30) || "This Topic"}`,
        hook: "What if there's an even better approach nobody talks about?",
        overlayText: "MY VERSION",
        angle: "Personal experiment documenting your unique results",
      },
      {
        title: `The Truth About ${
          video.title?.split(" ").slice(0, 3).join(" ") || "This"
        }`,
        hook: "Everyone's talking about this, but nobody mentions the real problem...",
        overlayText: "THE TRUTH",
        angle: "Myth-busting with evidence from your experience",
      },
    ],
  };
}

// Generate demo video analysis
function generateDemoVideoAnalysis(videoId: string): CompetitorVideoAnalysis {
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
      durationSec: 847,
      stats: {
        viewCount: 245000,
        likeCount: 11760,
        commentCount: 735,
      },
      derived: {
        viewsPerDay: 81666,
        velocity24h: 52000,
        velocity7d: 180000,
        engagementPerView: 0.051,
        dataStatus: "ready",
      },
    },
    analysis: {
      whatItsAbout:
        "A creator shares how changing their upload strategy from 3 videos per week to 1 high-quality video doubled their subscriber growth and watch time metrics.",
      whyItsWorking: [
        "Addresses a common pain point: quantity vs quality debate that every creator faces",
        "Promise of 'doubling growth' is specific, believable, and highly desirable",
        "Published during peak creator burnout discussion period, making it timely",
        "Strong thumbnail with before/after visual contrast draws immediate attention",
        "Title creates curiosity about the 'one change' without revealing it",
        "Comments show high resonance with personal stories of similar results",
      ],
      themesToRemix: [
        {
          theme: "Quality over quantity",
          why: "Resonates with burned-out creators looking for permission to slow down",
        },
        {
          theme: "Data-driven decisions",
          why: "Appeals to analytical creators who want proof before making changes",
        },
        {
          theme: "Sustainable growth",
          why: "Taps into long-term thinking mindset vs short-term metrics",
        },
      ],
      titlePatterns: [
        "'This One Change' creates curiosity about the single solution",
        "'DOUBLED' is a specific, believable metric (not 10x exaggeration)",
        "Direct address with 'My' makes it personal and authentic",
      ],
      packagingNotes: [
        "Thumbnail likely shows creator face with expression of surprise/realization",
        "Before/after numbers or visuals create immediate proof element",
        "Title promises transformation with minimal effort perception",
      ],
      remixIdeasForYou: [
        {
          title: "I Tried Posting Less for 30 Days (Here's What Happened)",
          hook: "I was posting 5 times a week and burning out. Then I tried something counterintuitive...",
          overlayText: "I STOPPED",
          angle:
            "Personal experiment documenting your shift to quality over quantity with real metrics",
        },
        {
          title: "The Upload Schedule That Actually Works in 2024",
          hook: "Forget everything you've heard about 'consistency being key'. Here's what the data shows...",
          overlayText: "NEW STRATEGY",
          angle:
            "Data-backed breakdown of optimal posting frequency for your specific niche",
        },
        {
          title: "Why Less Content = More Growth (Proof Inside)",
          hook: "What if the secret to growing faster isn't making more videos?",
          overlayText: "PROOF",
          angle:
            "Counter-intuitive deep dive with case studies from creators in your niche",
        },
      ],
    },
    comments: {
      topComments: [
        {
          text: "This completely changed my approach. Went from 3 videos/week to 1 and my retention went up 40%.",
          likeCount: 342,
          authorName: "Creative Mind",
          publishedAt: new Date(
            now.getTime() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          text: "Can you do a follow-up on how to decide WHICH videos to make when posting less?",
          likeCount: 187,
          authorName: "Aspiring Creator",
          publishedAt: new Date(
            now.getTime() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          text: "The data at 4:32 was mind-blowing. Never realized retention matters more than frequency.",
          likeCount: 98,
          authorName: "Data Dave",
          publishedAt: new Date(
            now.getTime() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ],
      sentiment: {
        positive: 72,
        neutral: 22,
        negative: 6,
      },
      themes: [
        {
          theme: "Quality over quantity",
          count: 45,
          examples: ["finally permission to slow down", "quality matters more"],
        },
        {
          theme: "Personal results",
          count: 38,
          examples: ["tried this and it worked", "my retention went up"],
        },
        {
          theme: "Burnout relief",
          count: 24,
          examples: ["was burning out", "sustainable approach"],
        },
      ],
      viewerLoved: [
        "The permission to post less without guilt",
        "Specific data and proof, not just theory",
        "Relatable burnout acknowledgment",
      ],
      viewerAskedFor: [
        "How to decide which video topics to prioritize",
        "Case studies for smaller channels (under 10k)",
        "Deep dive on retention optimization",
      ],
      hookInspiration: [
        "This completely changed my approach",
        "The data at 4:32 was mind-blowing",
        "Finally someone said what we all needed to hear",
      ],
    },
    tags: [
      "youtube growth",
      "content strategy",
      "creator tips",
      "upload schedule",
      "quality vs quantity",
    ],
    category: "Education",
    moreFromChannel: [
      {
        videoId: "more-1",
        title: "Stop Making This Thumbnail Mistake",
        channelId: "demo-channel",
        channelTitle: "Creator Academy",
        channelThumbnailUrl: null,
        videoUrl: "https://youtube.com/watch?v=more-1",
        channelUrl: "https://youtube.com/channel/demo-channel",
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        publishedAt: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        stats: { viewCount: 156000 },
        derived: { viewsPerDay: 22285 },
      },
      {
        videoId: "more-2",
        title: "The Title Formula That Gets Clicks",
        channelId: "demo-channel",
        channelTitle: "Creator Academy",
        channelThumbnailUrl: null,
        videoUrl: "https://youtube.com/watch?v=more-2",
        channelUrl: "https://youtube.com/channel/demo-channel",
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        publishedAt: new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
        stats: { viewCount: 198000 },
        derived: { viewsPerDay: 19800 },
      },
    ],
    demo: true,
  };
}

// Common words to filter out
const commonWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "have",
  "you",
  "what",
  "when",
  "where",
  "how",
  "why",
  "who",
  "which",
  "your",
  "will",
  "can",
  "all",
  "are",
  "been",
  "being",
  "but",
  "each",
  "had",
  "has",
  "about",
  "video",
  "watch",
  "youtube",
  "channel",
  "subscribe",
]);
