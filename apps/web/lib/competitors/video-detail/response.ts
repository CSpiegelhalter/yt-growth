/**
 * Competitor Video Detail - Response Builder
 *
 * Builds the final API response from pipeline state.
 */

import type { CompetitorVideo, CompetitorVideoAnalysis, CompetitorCommentsAnalysis } from "@/types/api";
import { computePublicSignals } from "@/lib/competitor-utils";
import { daysSince } from "@/lib/youtube/utils";
import { computeStrategicInsights, deriveKeywordsFromText } from "./strategic";
import type {
  VideoDetailsResult,
  RequestContext,
  NormalizedAnalysis,
  BeatChecklist,
  ChannelVideosResult,
} from "./types";
import { createLogger } from "@/lib/shared/logger";

const logger = createLogger({ module: "video-detail.response" });

// ============================================
// BUILD VIDEO OBJECT
// ============================================

/**
 * Build CompetitorVideo object from YouTube API response.
 */
export function buildVideoObject(
  videoDetails: VideoDetailsResult,
  snapshots: Array<{ viewCount: number; capturedAt: Date }>,
  now: Date
): CompetitorVideo {
  const daysPublished = daysSince(videoDetails.publishedAt, now.getTime());
  const viewsPerDay = Math.round(videoDetails.viewCount / daysPublished);

  // Calculate engagement rate
  const engagementPerView =
    videoDetails.viewCount > 0
      ? (videoDetails.likeCount + videoDetails.commentCount) / videoDetails.viewCount
      : undefined;

  // Calculate velocity from snapshots
  let velocity24h: number | undefined;
  let velocity7d: number | undefined;

  if (snapshots.length >= 2) {
    const latest = snapshots[0];
    const snapshot24h = snapshots.find((s) => {
      const age = now.getTime() - s.capturedAt.getTime();
      return age >= 20 * 60 * 60 * 1000 && age <= 28 * 60 * 60 * 1000;
    });
    const snapshot7d = snapshots.find((s) => {
      const age = now.getTime() - s.capturedAt.getTime();
      return age >= 6 * 24 * 60 * 60 * 1000 && age <= 8 * 24 * 60 * 60 * 1000;
    });

    if (snapshot24h) {velocity24h = latest.viewCount - snapshot24h.viewCount;}
    if (snapshot7d) {velocity7d = latest.viewCount - snapshot7d.viewCount;}
  }

  return {
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
}

// ============================================
// BUILD MORE FROM CHANNEL
// ============================================

/**
 * Transform channel videos into CompetitorVideo format.
 */
export function buildMoreFromChannel(
  channelVideos: ChannelVideosResult,
  currentVideoId: string,
  channelId: string,
  channelTitle: string
): CompetitorVideo[] {
  return channelVideos
    .filter((v) => v.videoId !== currentVideoId)
    .slice(0, 4)
    .map((v) => ({
      videoId: v.videoId,
      title: v.title,
      channelId,
      channelTitle,
      channelThumbnailUrl: null,
      videoUrl: `https://youtube.com/watch?v=${v.videoId}`,
      channelUrl: `https://youtube.com/channel/${channelId}`,
      thumbnailUrl: v.thumbnailUrl,
      publishedAt: v.publishedAt,
      stats: { viewCount: v.views },
      derived: { viewsPerDay: v.viewsPerDay },
    }));
}

// ============================================
// BUILD FINAL RESPONSE
// ============================================

type BuildResponseInput = {
  video: CompetitorVideo;
  videoDetails: VideoDetailsResult;
  analysis: NormalizedAnalysis;
  beatChecklist: BeatChecklist | undefined;
  commentsAnalysis: CompetitorCommentsAnalysis | undefined;
  moreFromChannel: CompetitorVideo[];
  llmFailed: boolean;
  llmFailureReason: string | null;
  ctx: RequestContext;
};

/**
 * Build the final CompetitorVideoAnalysis response.
 */
export function buildResponse(input: BuildResponseInput): CompetitorVideoAnalysis {
  const {
    video,
    videoDetails,
    analysis,
    beatChecklist,
    commentsAnalysis,
    moreFromChannel,
    llmFailed,
    llmFailureReason,
    ctx,
  } = input;

  const startTime = Date.now();

  // Derive keywords if tags are empty
  let derivedKeywords: string[] | undefined;
  if (!videoDetails.tags || videoDetails.tags.length === 0) {
    derivedKeywords = deriveKeywordsFromText(
      `${videoDetails.title} ${videoDetails.description?.slice(0, 500) ?? ""}`
    );
  }

  // Compute strategic insights
  const strategicInsights = computeStrategicInsights({
    video,
    videoDetails,
    commentsAnalysis,
    beatThisVideo: beatChecklist,
  });

  // Compute public signals (all measured, deterministic)
  const publicSignals = computePublicSignals({
    title: video.title,
    description: videoDetails.description ?? "",
    publishedAt: videoDetails.publishedAt,
    durationSec: videoDetails.durationSec ?? 0,
    viewCount: videoDetails.viewCount,
    likeCount: videoDetails.likeCount,
    commentCount: videoDetails.commentCount,
  });

  // Build data limitations notice
  const dataLimitations: CompetitorVideoAnalysis["dataLimitations"] = {
    whatWeCanKnow: [
      "Public metrics (views, likes, comments)",
      "Title/description patterns and structure",
      "Upload timing and video duration",
      "Comment themes and sentiment",
      "Competitor channel recent uploads",
    ],
    whatWeCantKnow: [
      "Impressions and click-through rate (CTR)",
      "Retention curve and average view duration",
      "Subscriber conversion rate",
      "Traffic sources breakdown",
      "Revenue and monetization data",
    ],
  };

  // If LLM failed, add note to dataLimitations
  if (llmFailed && llmFailureReason) {
    dataLimitations.whatWeCantKnow.push(
      `AI analysis unavailable: ${llmFailureReason}`
    );
  }

  ctx.timings.push({
    stage: "response.build",
    durationMs: Date.now() - startTime,
  });

  logger.info("Response built", {
    videoId: ctx.videoId,
    whatItsAboutLen: analysis.whatItsAbout.length,
    whyItsWorkingCount: analysis.whyItsWorking.length,
    themesToRemixCount: analysis.themesToRemix.length,
    remixIdeasCount: analysis.remixIdeasForYou.length,
    hasCommentsAnalysis: !!commentsAnalysis,
    llmFailed,
    durationMs: Date.now() - startTime,
  });

  return {
    video,
    analysis,
    strategicInsights,
    comments: commentsAnalysis,
    tags: videoDetails.tags ?? [],
    derivedKeywords,
    category: videoDetails.category,
    moreFromChannel,
    publicSignals,
    dataLimitations,
  };
}

