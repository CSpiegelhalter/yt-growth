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
 * Entitlements: competitor_video_analysis (5/day FREE, 100/day PRO)
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
  generateCompetitorBeatChecklist,
} from "@/lib/llm";
import { isDemoMode, isYouTubeMockMode } from "@/lib/demo-fixtures";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { hashVideoContent, hashCommentsContent } from "@/lib/content-hash";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
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
  includeMoreFromChannel: z.union([z.literal("0"), z.literal("1")])
    .optional()
    .default("1"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const paramsObj = await params;

  // Return demo data if demo mode is enabled
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = generateDemoVideoAnalysis(paramsObj.videoId);
    return Response.json(demoData);
  }

  try {
    // Entitlement check - competitor video analysis is a usage-limited feature
    const entitlementResult = await checkEntitlement({
      featureKey: "competitor_video_analysis",
      increment: true,
    });
    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }
    const user = entitlementResult.context.user;

    // Rate limit check (per-hour limit for API protection)
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

    // Validate params
    const parsedParams = ParamsSchema.safeParse(paramsObj);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const { videoId } = parsedParams.data;

    // Parse query params
    const url = new URL(req.url);
    const queryResult = QuerySchema.safeParse({
      channelId: url.searchParams.get("channelId") ?? "",
      includeMoreFromChannel:
        (url.searchParams.get("includeMoreFromChannel") as "0" | "1" | null) ??
        undefined,
    });

    if (!queryResult.success) {
      return Response.json(
        { error: "channelId query parameter required" },
        { status: 400 }
      );
    }

    const { channelId, includeMoreFromChannel } = queryResult.data;
    const shouldIncludeMoreFromChannel = includeMoreFromChannel !== "0";

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
      console.log(`[competitor.video] Using cached comments analysis`);
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
          // Compute content hash for comments
          const commentsContentHash = hashCommentsContent(
            commentsResult.comments
          );
          const cachedCommentsHash = cachedComments?.contentHash;
          const commentsUnchanged =
            cachedCommentsHash && cachedCommentsHash === commentsContentHash;

          // Check if cached analysis is real (has actual themes/insights, not just fallback)
          const cachedHasRealAnalysis =
            cachedComments?.analysisJson &&
            (cachedComments.analysisJson as { themes?: unknown[] }).themes &&
            (cachedComments.analysisJson as { themes?: unknown[] }).themes!
              .length > 0;

          // Reuse cached LLM analysis if comments haven't changed AND we have real analysis
          if (commentsUnchanged && cachedHasRealAnalysis) {
            console.log(
              `[competitor.video] Reusing cached comments LLM (hash: ${commentsContentHash})`
            );
            commentsAnalysis =
              cachedComments.analysisJson as unknown as CompetitorCommentsAnalysis;
            // Update top comments with fresh data
            commentsAnalysis.topComments = commentsResult.comments
              .slice(0, 10)
              .map((c) => ({
                text: c.text,
                likeCount: c.likeCount,
                authorName: c.authorName,
                publishedAt: c.publishedAt,
              }));
          } else {
            // Analyze comments with LLM
            console.log(
              `[competitor.video] Generating new comments analysis (hash: ${cachedCommentsHash} -> ${commentsContentHash}, hadRealAnalysis: ${cachedHasRealAnalysis})`
            );
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

              // Only cache if we got real analysis (has themes)
              if (
                commentsAnalysis.themes &&
                commentsAnalysis.themes.length > 0
              ) {
                await prisma.competitorVideoComments.upsert({
                  where: { videoId },
                  create: {
                    videoId,
                    capturedAt: now,
                    topCommentsJson: commentsResult.comments.slice(0, 20),
                    contentHash: commentsContentHash,
                    analysisJson: commentsAnalysis as object,
                    sentimentPos: commentsAnalysis.sentiment.positive,
                    sentimentNeu: commentsAnalysis.sentiment.neutral,
                    sentimentNeg: commentsAnalysis.sentiment.negative,
                    themesJson: commentsAnalysis.themes,
                  },
                  update: {
                    capturedAt: now,
                    topCommentsJson: commentsResult.comments.slice(0, 20),
                    contentHash: commentsContentHash,
                    analysisJson: commentsAnalysis as object,
                    sentimentPos: commentsAnalysis.sentiment.positive,
                    sentimentNeu: commentsAnalysis.sentiment.neutral,
                    sentimentNeg: commentsAnalysis.sentiment.negative,
                    themesJson: commentsAnalysis.themes,
                  },
                });
              }
            } catch (err) {
              console.warn("Failed to analyze comments:", err);
              // Show raw comments without fake sentiment data
              commentsAnalysis = {
                topComments: commentsResult.comments.slice(0, 10).map((c) => ({
                  text: c.text,
                  likeCount: c.likeCount,
                  authorName: c.authorName,
                  publishedAt: c.publishedAt,
                })),
                // Zero sentiment indicates no analysis was done
                sentiment: { positive: 0, neutral: 0, negative: 0 },
                themes: [],
                viewerLoved: [],
                viewerAskedFor: [],
                hookInspiration: [],
                error:
                  "Comment analysis unavailable - showing raw comments only",
              };
              // DO NOT cache this fallback data
            }
          }
        }
      }
    }

    // Fetch more videos from the same channel (optional; not critical path for initial render)
    const rangeDays = 28;
    const publishedAfter = new Date(
      now.getTime() - rangeDays * 24 * 60 * 60 * 1000
    ).toISOString();
    let moreFromChannel: CompetitorVideo[] = [];

    if (shouldIncludeMoreFromChannel) {
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
    }

    // Generate analysis using LLM (includes comments context if available)
    let analysis: CompetitorVideoAnalysis["analysis"];
    let beatThisVideoLLM:
      | Array<{
          action: string;
          difficulty: "Easy" | "Medium" | "Hard";
          impact: "Low" | "Medium" | "High";
        }>
      | undefined;

    const normalizeBeatChecklist = (input: unknown) => {
      if (!Array.isArray(input)) return undefined;
      const out = input
        .map((x: any) => ({
          action: typeof x?.action === "string" ? x.action.trim() : "",
          difficulty:
            x?.difficulty === "Easy" ||
            x?.difficulty === "Medium" ||
            x?.difficulty === "Hard"
              ? x.difficulty
              : "Medium",
          impact:
            x?.impact === "Low" ||
            x?.impact === "Medium" ||
            x?.impact === "High"
              ? x.impact
              : "High",
        }))
        .filter((x) => x.action.length >= 16)
        .slice(0, 10);
      return out.length > 0 ? out : undefined;
    };

    // Compute content hash for the current video
    const currentContentHash = hashVideoContent({
      title: video.title,
      description: videoDetails.description,
      tags: videoDetails.tags,
      durationSec: video.durationSec,
      categoryId: videoDetails.category,
    });

    // Check if cached analysis is still valid:
    // 1. Must have analysis captured
    // 2. Content hash must match (or be within time window for older entries without hash)
    const analysisCacheDays = 30;
    const isWithinTimeWindow =
      dbVideo?.analysisCapturedAt &&
      now.getTime() - dbVideo.analysisCapturedAt.getTime() <
        analysisCacheDays * 24 * 60 * 60 * 1000;
    const contentHashMatches =
      dbVideo?.analysisContentHash === currentContentHash;
    const isAnalysisCacheFresh =
      isWithinTimeWindow &&
      (contentHashMatches || !dbVideo?.analysisContentHash);

    if (isAnalysisCacheFresh && dbVideo?.analysisJson) {
      console.log(
        `[competitor.video] Using cached analysis (hash: ${currentContentHash})`
      );
      const cached = dbVideo.analysisJson as any;
      analysis = cached as CompetitorVideoAnalysis["analysis"];
      beatThisVideoLLM = normalizeBeatChecklist(cached?.beatThisVideo);
    } else {
      console.log(
        `[competitor.video] Generating new analysis (hash changed: ${dbVideo?.analysisContentHash} -> ${currentContentHash})`
      );
      try {
        const llm = await generateCompetitorVideoAnalysis(
          {
            videoId: video.videoId,
            title: video.title,
            description: videoDetails.description,
            tags: videoDetails.tags ?? [],
            channelTitle: video.channelTitle,
            durationSec: video.durationSec,
            stats: video.stats,
            derived: {
              viewsPerDay: video.derived.viewsPerDay,
              engagementPerView,
            },
          },
          channel.title ?? "Your Channel",
          commentsAnalysis
        );
        beatThisVideoLLM = normalizeBeatChecklist((llm as any).beatThisVideo);
        // Keep analysisJson compatible (beat checklist is stored separately)
        const analysisOnly = { ...(llm as any) };
        delete (analysisOnly as any).beatThisVideo;
        analysis = analysisOnly as CompetitorVideoAnalysis["analysis"];
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

    // Backfill beat checklist (LLM) if missing from cache.
    // This keeps "Beat this video" from being generic across all videos.
    if (!beatThisVideoLLM || beatThisVideoLLM.length === 0) {
      try {
        beatThisVideoLLM = await generateCompetitorBeatChecklist({
          title: video.title,
          channelTitle: video.channelTitle,
          description: videoDetails.description,
          tags: videoDetails.tags ?? [],
          durationSec: video.durationSec,
          viewCount: video.stats.viewCount,
          viewsPerDay: video.derived.viewsPerDay,
          likeCount: video.stats.likeCount,
          commentCount: video.stats.commentCount,
          engagementPerView,
          userChannelTitle: channel.title ?? "Your Channel",
          commentsAnalysis,
        });
      } catch (err) {
        console.warn("Failed to generate beat checklist:", err);
      }
    }

    // If analysis was served from cache but beat checklist was missing, persist just the beat list
    // so subsequent loads are fast and consistent.
    if (
      isAnalysisCacheFresh &&
      dbVideo?.analysisJson &&
      beatThisVideoLLM &&
      !Array.isArray((dbVideo.analysisJson as any)?.beatThisVideo)
    ) {
      try {
        await prisma.competitorVideo.update({
          where: { videoId },
          data: {
            analysisJson: {
              ...(dbVideo.analysisJson as any),
              beatThisVideo: beatThisVideoLLM,
            } as object,
          },
        });
      } catch (err) {
        console.warn("Failed to backfill beat checklist cache:", err);
      }
    }

    // Persist normalized analysis (cache) so the "What it's about" stays useful without re-calling the LLM.
    // Only write when cache was missing/stale.
    if (!isAnalysisCacheFresh) {
      try {
        await prisma.competitorVideo.update({
          where: { videoId },
          data: {
            analysisJson: {
              ...analysis,
              beatThisVideo: beatThisVideoLLM,
            } as object,
            analysisContentHash: currentContentHash,
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

    // Generate strategic insights
    const strategicInsights = computeStrategicInsights({
      video,
      videoDetails,
      commentsAnalysis,
      beatThisVideo: beatThisVideoLLM,
    });

    // Build response
    const response: CompetitorVideoAnalysis = {
      video,
      analysis,
      strategicInsights,
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

// Compute strategic insights from video data
function computeStrategicInsights(input: {
  video: CompetitorVideo;
  videoDetails: {
    title: string;
    description?: string;
    tags?: string[];
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: string;
    durationSec?: number;
  };
  commentsAnalysis?: CompetitorCommentsAnalysis;
  beatThisVideo?: Array<{
    action: string;
    difficulty: "Easy" | "Medium" | "Hard";
    impact: "Low" | "Medium" | "High";
  }>;
}): CompetitorVideoAnalysis["strategicInsights"] {
  const { video, videoDetails, commentsAnalysis } = input;
  const title = videoDetails.title;
  const description = videoDetails.description ?? "";

  // ===== TITLE ANALYSIS =====
  const titleLength = title.length;
  const hasNumber = /\d/.test(title);
  const powerWords = [
    "secret",
    "shocking",
    "amazing",
    "ultimate",
    "best",
    "worst",
    "never",
    "always",
    "proven",
    "guaranteed",
    "free",
    "instant",
    "easy",
    "simple",
    "fast",
    "new",
    "finally",
    "revealed",
    "truth",
    "mistake",
    "hack",
    "trick",
    "strategy",
  ];
  const hasPowerWord = powerWords.some((w) => title.toLowerCase().includes(w));
  const hasCuriosityGap =
    /\?|\.{3}|how|why|what|secret|truth|reveal|nobody|everyone/i.test(title);
  const hasTimeframe =
    /202\d|today|now|this year|\d+\s*(day|week|month|hour)/i.test(title);

  let titleScore = 5;
  const titleStrengths: string[] = [];
  const titleWeaknesses: string[] = [];

  if (titleLength >= 40 && titleLength <= 60) {
    titleScore += 1;
    titleStrengths.push("Optimal length (40-60 chars)");
  } else if (titleLength < 30) {
    titleScore -= 1;
    titleWeaknesses.push("Title might be too short");
  } else if (titleLength > 70) {
    titleWeaknesses.push("Title may get truncated on mobile");
  }

  if (hasNumber) {
    titleScore += 1;
    titleStrengths.push("Uses specific number (increases CTR)");
  } else {
    titleWeaknesses.push("No specific number to create curiosity");
  }

  if (hasPowerWord) {
    titleScore += 1;
    titleStrengths.push("Contains emotional trigger word");
  }

  if (hasCuriosityGap) {
    titleScore += 1;
    titleStrengths.push("Creates curiosity gap");
  } else {
    titleWeaknesses.push("Could add more curiosity/tension");
  }

  if (hasTimeframe) {
    titleScore += 0.5;
    titleStrengths.push("Time-relevant (freshness signal)");
  }

  titleScore = Math.min(10, Math.max(1, Math.round(titleScore)));

  // ===== POSTING TIMING =====
  const publishedDate = new Date(videoDetails.publishedAt);
  const dayOfWeek = publishedDate.toLocaleDateString("en-US", {
    weekday: "long",
  });
  const hourOfDay = publishedDate.getHours();
  const isWeekend =
    publishedDate.getDay() === 0 || publishedDate.getDay() === 6;
  const daysAgo = Math.floor(
    (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let timingInsight = "";
  if (hourOfDay >= 14 && hourOfDay <= 17) {
    timingInsight = "Posted during peak viewing hours (2-5pm)";
  } else if (hourOfDay >= 9 && hourOfDay <= 11) {
    timingInsight = "Posted mid-morning for afternoon pickup";
  } else if (hourOfDay >= 18 && hourOfDay <= 21) {
    timingInsight = "Posted for evening viewers";
  } else {
    timingInsight =
      "Off-peak posting time - may rely more on suggested traffic";
  }

  // ===== VIDEO LENGTH =====
  const durationSec = videoDetails.durationSec ?? 0;
  const durationMin = Math.round(durationSec / 60);
  let lengthCategory: "Short" | "Medium" | "Long" | "Very Long" = "Medium";
  let lengthInsight = "";

  if (durationMin < 3) {
    lengthCategory = "Short";
    lengthInsight =
      "Short format - optimized for quick consumption and high retention %";
  } else if (durationMin < 10) {
    lengthCategory = "Medium";
    lengthInsight =
      "Sweet spot length - long enough for depth, short enough for retention";
  } else if (durationMin < 20) {
    lengthCategory = "Long";
    lengthInsight =
      "Long-form content - needs strong hooks throughout to maintain attention";
  } else {
    lengthCategory = "Very Long";
    lengthInsight =
      "Deep-dive format - appeals to highly engaged viewers, lower broad appeal";
  }

  // ===== ENGAGEMENT BENCHMARKS =====
  const views = videoDetails.viewCount || 1;
  const likes = videoDetails.likeCount || 0;
  const comments = videoDetails.commentCount || 0;

  const likeRate = (likes / views) * 100; // likes per 100 views
  const commentRate = (comments / views) * 1000; // comments per 1000 views

  let likeRateVerdict:
    | "Below Average"
    | "Average"
    | "Above Average"
    | "Exceptional" = "Average";
  if (likeRate < 2) likeRateVerdict = "Below Average";
  else if (likeRate >= 2 && likeRate < 4) likeRateVerdict = "Average";
  else if (likeRate >= 4 && likeRate < 6) likeRateVerdict = "Above Average";
  else likeRateVerdict = "Exceptional";

  let commentRateVerdict:
    | "Below Average"
    | "Average"
    | "Above Average"
    | "Exceptional" = "Average";
  if (commentRate < 1) commentRateVerdict = "Below Average";
  else if (commentRate >= 1 && commentRate < 3) commentRateVerdict = "Average";
  else if (commentRate >= 3 && commentRate < 6)
    commentRateVerdict = "Above Average";
  else commentRateVerdict = "Exceptional";

  // ===== COMPETITION DIFFICULTY =====
  let difficultyScore: "Easy" | "Medium" | "Hard" | "Very Hard" = "Medium";
  const difficultyReasons: string[] = [];

  if (views > 1_000_000) {
    difficultyScore = "Very Hard";
    difficultyReasons.push("Viral video (1M+ views) - hard to match reach");
  } else if (views > 100_000) {
    difficultyScore = "Hard";
    difficultyReasons.push("High-performing video (100K+ views)");
  } else if (views > 10_000) {
    difficultyScore = "Medium";
    difficultyReasons.push("Solid performer - achievable with good execution");
  } else {
    difficultyScore = "Easy";
    difficultyReasons.push("Lower view count - opportunity to do better");
  }

  if (likeRateVerdict === "Exceptional") {
    difficultyReasons.push(
      "Very high engagement - content is resonating strongly"
    );
  }

  if (durationMin > 15) {
    difficultyReasons.push("Long-form requires significant production time");
  }

  // ===== OPPORTUNITY SCORE =====
  let opportunityScore = 5;
  const gaps: string[] = [];
  const angles: string[] = [];

  // Check tags for gaps
  const tags = videoDetails.tags ?? [];
  if (tags.length < 10) {
    gaps.push(
      "Competitor has weak tag coverage - you can rank better with more tags"
    );
    opportunityScore += 1;
  }

  // Check description
  if (description.length < 200) {
    gaps.push("Thin description - opportunity to be more comprehensive");
    opportunityScore += 1;
  }

  // Check for timestamps
  const hasTimestamps = /\d{1,2}:\d{2}/.test(description);
  if (!hasTimestamps && durationMin > 5) {
    gaps.push("No timestamps - add chapters for better UX");
    opportunityScore += 0.5;
  }

  // Fresh angles based on common patterns
  if (!hasCuriosityGap) {
    angles.push("Add a stronger curiosity hook in your title");
  }
  if (!hasNumber) {
    angles.push("Use specific numbers (e.g., '5 Ways', 'In 30 Days')");
  }
  angles.push("Personal case study angle - 'I tried X for Y days'");
  angles.push("Contrarian take - challenge the assumptions");
  if (durationMin > 10) {
    angles.push("Make a shorter, more focused version");
  }

  // Comment-based opportunities
  if (
    commentsAnalysis?.viewerAskedFor &&
    commentsAnalysis.viewerAskedFor.length > 0
  ) {
    gaps.push(
      `Viewers asking for: ${commentsAnalysis.viewerAskedFor[0]} - make that video!`
    );
    opportunityScore += 1;
  }

  opportunityScore = Math.min(10, Math.max(1, Math.round(opportunityScore)));

  let opportunityVerdict = "";
  if (opportunityScore >= 8) {
    opportunityVerdict = "High opportunity - gaps to exploit!";
  } else if (opportunityScore >= 6) {
    opportunityVerdict = "Good opportunity - room to differentiate";
  } else if (opportunityScore >= 4) {
    opportunityVerdict = "Moderate - will need strong execution";
  } else {
    opportunityVerdict = "Tough to beat - focus on unique angles";
  }

  // ===== BEAT THIS VIDEO CHECKLIST =====
  const fallbackBeatChecklist: Array<{
    action: string;
    difficulty: "Easy" | "Medium" | "Hard";
    impact: "Low" | "Medium" | "High";
  }> = [];

  // (Fallback only) Keep it a bit more tailored than the previous mostly-static list.
  if (durationMin <= 4) {
    fallbackBeatChecklist.push({
      action:
        "Deliver the payoff faster: cut intro to <5 seconds and show the result upfront",
      difficulty: "Easy",
      impact: "High",
    });
  } else {
    fallbackBeatChecklist.push({
      action:
        "Use a sharper opening promise than theirs, then validate it with a quick preview of what’s coming",
      difficulty: "Medium",
      impact: "High",
    });
  }

  if (!hasNumber && /how|why|what|best|stop|fix|make/i.test(title)) {
    fallbackBeatChecklist.push({
      action:
        "Make the title more specific with a number or constraint (time, steps, or result)",
      difficulty: "Easy",
      impact: "Medium",
    });
  }

  if (!hasTimestamps && durationMin >= 8) {
    fallbackBeatChecklist.push({
      action:
        "Add clear chapters and reference them on-screen to reduce drop-off in the middle",
      difficulty: "Easy",
      impact: "Medium",
    });
  }

  if (commentsAnalysis?.viewerAskedFor?.length) {
    fallbackBeatChecklist.push({
      action: `Directly answer what viewers asked for most: "${commentsAnalysis.viewerAskedFor[0]}"`,
      difficulty: "Medium",
      impact: "High",
    });
  }

  fallbackBeatChecklist.push({
    action:
      "Differentiate with a unique angle they didn’t cover (a contrarian take, a case study, or a tighter framework)",
    difficulty: "Medium",
    impact: "High",
  });

  if (durationMin > 12) {
    fallbackBeatChecklist.push({
      action:
        "Tighten pacing: remove repetition and add pattern interrupts every ~60–90 seconds",
      difficulty: "Medium",
      impact: "Medium",
    });
  }

  const beatChecklist =
    input.beatThisVideo && input.beatThisVideo.length > 0
      ? input.beatThisVideo
      : fallbackBeatChecklist;

  // ===== DESCRIPTION ANALYSIS =====
  const hasLinks = /https?:\/\/\S+/i.test(description);
  const hasCTA =
    /subscribe|like|comment|share|follow|check out|click|link|download/i.test(
      description
    );
  const estimatedWordCount = description.split(/\s+/).filter(Boolean).length;

  const keyElements: string[] = [];
  if (hasTimestamps) keyElements.push("Chapter timestamps");
  if (hasLinks) keyElements.push("External links");
  if (hasCTA) keyElements.push("Call-to-action");
  if (description.includes("#")) keyElements.push("Hashtags");
  if (/social|instagram|twitter|tiktok|discord/i.test(description))
    keyElements.push("Social media links");

  // ===== FORMAT SIGNALS =====
  let likelyFormat = "General";
  if (/tutorial|how to|guide|step|learn/i.test(title + " " + description)) {
    likelyFormat = "Tutorial";
  } else if (/review|honest|vs |compared|worth/i.test(title)) {
    likelyFormat = "Review";
  } else if (/vlog|day in|week in|behind/i.test(title + " " + description)) {
    likelyFormat = "Vlog";
  } else if (/react|watch|reacts/i.test(title)) {
    likelyFormat = "Reaction";
  } else if (/story|journey|experience/i.test(title + " " + description)) {
    likelyFormat = "Story/Documentary";
  } else if (/top \d|best \d|\d things|\d ways/i.test(title)) {
    likelyFormat = "Listicle";
  } else if (/explained|what is|why/i.test(title)) {
    likelyFormat = "Explainer";
  }

  let productionLevel: "Low" | "Medium" | "High" = "Medium";
  if (durationMin < 3) {
    productionLevel = "Low";
  } else if (durationMin > 15 && views > 50000) {
    productionLevel = "High";
  }

  let paceEstimate: "Slow" | "Medium" | "Fast" = "Medium";
  if (durationMin < 5) {
    paceEstimate = "Fast";
  } else if (durationMin > 20) {
    paceEstimate = "Slow";
  }

  return {
    titleAnalysis: {
      score: titleScore,
      characterCount: titleLength,
      hasNumber,
      hasPowerWord,
      hasCuriosityGap,
      hasTimeframe,
      strengths: titleStrengths.slice(0, 4),
      weaknesses: titleWeaknesses.slice(0, 3),
    },
    competitionDifficulty: {
      score: difficultyScore,
      reasons: difficultyReasons.slice(0, 3),
    },
    postingTiming: {
      dayOfWeek,
      hourOfDay,
      daysAgo,
      isWeekend,
      timingInsight,
    },
    lengthAnalysis: {
      minutes: durationMin,
      category: lengthCategory,
      insight: lengthInsight,
      optimalForTopic: durationMin >= 5 && durationMin <= 12,
    },
    engagementBenchmarks: {
      likeRate: Math.round(likeRate * 100) / 100,
      commentRate: Math.round(commentRate * 100) / 100,
      likeRateVerdict,
      commentRateVerdict,
    },
    opportunityScore: {
      score: opportunityScore,
      verdict: opportunityVerdict,
      gaps: gaps.slice(0, 4),
      angles: angles.slice(0, 4),
    },
    beatThisVideo: beatChecklist.slice(0, 6),
    descriptionAnalysis: {
      hasTimestamps,
      hasLinks,
      hasCTA,
      estimatedWordCount,
      keyElements,
    },
    formatSignals: {
      likelyFormat,
      productionLevel,
      paceEstimate,
    },
  };
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
    strategicInsights: {
      titleAnalysis: {
        score: 8,
        characterCount: 44,
        hasNumber: false,
        hasPowerWord: true, // "DOUBLED"
        hasCuriosityGap: true, // "This One Change"
        hasTimeframe: false,
        strengths: [
          "Creates curiosity gap with 'This One Change'",
          "Specific metric 'DOUBLED' builds trust",
          "Personal pronoun 'My' adds authenticity",
          "Optimal length (40-60 chars)",
        ],
        weaknesses: ["Could add a number for specificity (e.g., '30 Days')"],
      },
      competitionDifficulty: {
        score: "Hard",
        reasons: [
          "High-performing video (245K+ views)",
          "Very high engagement - content is resonating strongly",
          "Established channel with loyal audience",
        ],
      },
      postingTiming: {
        dayOfWeek: "Tuesday",
        hourOfDay: 14,
        daysAgo: 3,
        isWeekend: false,
        timingInsight: "Posted during peak viewing hours (2-5pm)",
      },
      lengthAnalysis: {
        minutes: 14,
        category: "Long",
        insight:
          "Long-form content - needs strong hooks throughout to maintain attention",
        optimalForTopic: true,
      },
      engagementBenchmarks: {
        likeRate: 4.8,
        commentRate: 3.0,
        likeRateVerdict: "Above Average",
        commentRateVerdict: "Average",
      },
      opportunityScore: {
        score: 7,
        verdict: "Good opportunity - room to differentiate",
        gaps: [
          "Viewers asking for: How to decide which video topics to prioritize",
          "No case studies for smaller channels under 10K",
          "Could include more actionable templates/frameworks",
        ],
        angles: [
          "Personal case study - 'I tried posting less for 30 days'",
          "Contrarian take - 'Why posting MORE actually works better'",
          "Make a shorter, more focused version (under 10 min)",
          "Target smaller creators specifically (under 1K subs)",
        ],
      },
      beatThisVideo: [
        {
          action: "Study their first 30 seconds and make your hook stronger",
          difficulty: "Medium",
          impact: "High",
        },
        {
          action:
            "Add specific numbers to your title (e.g., '30 Days', '5 Steps')",
          difficulty: "Easy",
          impact: "Medium",
        },
        {
          action:
            "Address what viewers asked for: smaller channel case studies",
          difficulty: "Medium",
          impact: "High",
        },
        {
          action: "Create a more compelling thumbnail with clear focal point",
          difficulty: "Medium",
          impact: "High",
        },
        {
          action: "Add downloadable templates/checklists as value-add",
          difficulty: "Easy",
          impact: "Medium",
        },
        {
          action: "Share YOUR unique results - they can't replicate your data",
          difficulty: "Hard",
          impact: "High",
        },
      ],
      descriptionAnalysis: {
        hasTimestamps: true,
        hasLinks: true,
        hasCTA: true,
        estimatedWordCount: 245,
        keyElements: [
          "Chapter timestamps",
          "Social media links",
          "Call-to-action",
          "External links",
        ],
      },
      formatSignals: {
        likelyFormat: "Tutorial",
        productionLevel: "High",
        paceEstimate: "Medium",
      },
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
