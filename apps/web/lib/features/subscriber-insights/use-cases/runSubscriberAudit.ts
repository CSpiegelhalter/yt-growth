import { prisma } from "@/prisma";
import type { LlmPort } from "@/lib/ports/LlmPort";
import { hashSubscriberAuditContent } from "@/lib/shared/content-hash";
import { SubscriberInsightError } from "../errors";
import type {
  PatternAnalysisJson,
  PatternAnalysisInput,
  RunSubscriberAuditInput,
  SubscriberAuditDeps,
  SubscriberAuditResult,
  SubscriberMagnetVideo,
  SubscriberVideoInput,
} from "../types";

// ── Pure Helpers ────────────────────────────────────────────

function subsPerThousandViews(subsGained: number, views: number): number | null {
  if (views <= 0) return null;
  return (subsGained / views) * 1000;
}

function daysSince(isoDate: string | null, nowMs: number = Date.now()): number {
  if (!isoDate) return 0;
  const diff = Math.floor((nowMs - new Date(isoDate).getTime()) / 86_400_000);
  return Math.max(1, diff);
}

// ── LLM Prompt Construction ─────────────────────────────────

const SYSTEM_PROMPT = `You are a YouTube growth expert specializing in subscriber conversion optimization.

Analyze these top-converting videos and return ONLY valid JSON matching this EXACT structure:

{
  "summary": "One sentence about what makes these videos convert viewers to subscribers",
  "commonPatterns": ["pattern1", "pattern2", "pattern3"],
  "ctaPatterns": ["cta1", "cta2"],
  "formatPatterns": ["format1", "format2"],
  "nextExperiments": ["experiment1", "experiment2", "experiment3"],
  "hooksToTry": ["hook1", "hook2"],
  "structuredInsights": {
    "commonPatterns": [
      {
        "pattern": "Clear pattern title",
        "evidence": "Seen in X of Y top videos",
        "howToUse": "Actionable one-liner"
      }
    ],
    "conversionRecipe": {
      "titleFormulas": ["[Outcome] in [Timeframe]", "[Number] Ways to [Benefit]"],
      "ctaTiming": "Place subscribe CTA after delivering first value moment (usually 60-90s)",
      "structure": "Problem statement → Quick win → Deep value → Clear next step"
    },
    "nextIdeas": [
      {
        "title": "Video title idea",
        "hook": "Opening line that grabs attention",
        "whyItConverts": "One line explanation",
        "ctaSuggestion": "When and how to ask for subscribe"
      }
    ]
  }
}

Guidelines:
- Keep patterns specific and actionable
- Base evidence on actual video data
- Generate 3-5 common patterns
- Generate exactly 3 video ideas
- Title formulas should be templates with [placeholders]
- CTA timing should reference specific moments
- Structure should be a clear flow`;

function buildUserPrompt(
  videos: SubscriberVideoInput[],
  channelAvgSubsPerThousand: number,
): string {
  return `Analyze these top converting videos (channel avg: ${channelAvgSubsPerThousand.toFixed(
    1,
  )} subs/1k):

${videos
  .map(
    (v, i) =>
      `${i + 1}. "${v.title}"
   - ${v.subsPerThousand.toFixed(1)} subs/1k views (${(
        (v.subsPerThousand / channelAvgSubsPerThousand - 1) *
        100
      ).toFixed(0)}% above avg)
   - ${v.views.toLocaleString()} views, ${v.viewsPerDay}/day
   - ${(v.engagedRate * 100).toFixed(1)}% engagement`,
  )
  .join("\n\n")}

Return ONLY JSON, no explanation.`;
}

// ── Fallback ────────────────────────────────────────────────

const FALLBACK_RESULT: PatternAnalysisJson = {
  summary: "Your top videos share clear value propositions and strong hooks.",
  commonPatterns: [
    "Strong opening hook in first 5 seconds",
    "Clear promise delivered early",
    "Consistent call-to-action placement",
  ],
  ctaPatterns: ["Subscribe CTA after first value delivery"],
  formatPatterns: ["Problem-solution structure"],
  nextExperiments: [
    "Test different CTA placements",
    "Try more specific titles",
    "Increase early value density",
  ],
  hooksToTry: [
    "What if I told you...",
    "Here's what nobody tells you about...",
  ],
  structuredInsights: {
    commonPatterns: [
      {
        pattern: "Clear promise in first 10 seconds",
        evidence: "Present in most top videos",
        howToUse: "State the viewer benefit before your intro",
      },
      {
        pattern: "Value delivered before CTA",
        evidence: "Top subscriber drivers give value first",
        howToUse: "Share a quick win before asking for subscribe",
      },
    ],
    conversionRecipe: {
      titleFormulas: [
        "[Outcome] in [Timeframe]",
        "How I [Achievement] (and you can too)",
      ],
      ctaTiming: "Place subscribe CTA after delivering first value moment",
      structure: "Hook → Quick win → Deep value → Subscribe ask → Next step",
    },
    nextIdeas: [
      {
        title: "The [Topic] Mistake Everyone Makes",
        hook: "I used to make this mistake every single day...",
        whyItConverts:
          "Creates immediate identification with viewer struggles",
        ctaSuggestion: "Ask for subscribe after revealing the solution",
      },
      {
        title: "[Number] [Topic] Tips That Actually Work",
        hook: "Forget everything you've heard about [topic]...",
        whyItConverts: "Promises curated, tested value upfront",
        ctaSuggestion: "Soft CTA between tips, strong CTA at end",
      },
      {
        title: "How to [Achieve Goal] in [Timeframe]",
        hook: "In the next [X] minutes, you'll learn exactly how to...",
        whyItConverts: "Specific outcome with time commitment",
        ctaSuggestion: "CTA after demonstrating the first result",
      },
    ],
  },
};

// ── Response Parsing ────────────────────────────────────────

function parseAnalysisResponse(content: string): PatternAnalysisJson | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  return JSON.parse(jsonMatch[0]) as PatternAnalysisJson;
}

// ── LLM Pattern Analysis (internal) ────────────────────────

async function generatePatternAnalysis(
  input: PatternAnalysisInput,
  llm: LlmPort,
): Promise<PatternAnalysisJson> {
  const { topSubscriberDrivers, channelAvgSubsPerThousand } = input;

  if (topSubscriberDrivers.length === 0) {
    throw new SubscriberInsightError(
      "INVALID_INPUT",
      "At least one video is required for subscriber audit analysis",
    );
  }

  try {
    const result = await llm.complete({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(
            topSubscriberDrivers,
            channelAvgSubsPerThousand,
          ),
        },
      ],
      temperature: 0.6,
      maxTokens: 2000,
    });

    const parsed = parseAnalysisResponse(result.content);
    if (parsed) return parsed;
  } catch (err) {
    throw new SubscriberInsightError(
      "EXTERNAL_FAILURE",
      "Failed to generate subscriber insights from LLM",
      err,
    );
  }

  return FALLBACK_RESULT;
}

// ── Video Metric Computation ────────────────────────────────

function computeVideoMetrics(
  videos: Array<{
    youtubeVideoId: string;
    title: string | null;
    publishedAt: Date | null;
    thumbnailUrl: string | null;
    durationSec: number | null;
    VideoMetrics: {
      views: number;
      subscribersGained: number;
      comments: number;
      shares: number;
      likes: number;
      averageViewDuration: number | null;
      averageViewPercentage: number | null;
    } | null;
  }>,
): SubscriberMagnetVideo[] {
  const now = Date.now();

  return videos
    .filter((v) => v.VideoMetrics && v.VideoMetrics.views > 0)
    .map((v) => {
      const m = v.VideoMetrics!;
      const views = m.views;
      const viewsIn1k = views / 1000;
      const daysPublished = daysSince(v.publishedAt?.toISOString() ?? null, now);

      const spt =
        Math.round((subsPerThousandViews(m.subscribersGained, views) ?? 0) * 100) / 100;
      const commentsPer1k = viewsIn1k > 0 ? m.comments / viewsIn1k : 0;
      const sharesPer1k = viewsIn1k > 0 ? m.shares / viewsIn1k : 0;
      const engagedRate = views > 0 ? (m.likes + m.comments + m.shares) / views : 0;

      return {
        videoId: v.youtubeVideoId,
        title: v.title ?? "Untitled",
        views,
        subscribersGained: m.subscribersGained,
        subsPerThousand: spt,
        publishedAt: v.publishedAt?.toISOString() ?? null,
        thumbnailUrl: v.thumbnailUrl,
        durationSec: v.durationSec,
        viewsPerDay: Math.round(views / daysPublished),
        avdSec: m.averageViewDuration ? Math.round(m.averageViewDuration) : null,
        apv: m.averageViewPercentage ?? null,
        commentsPer1k: commentsPer1k > 0 ? commentsPer1k : null,
        sharesPer1k: sharesPer1k > 0 ? sharesPer1k : null,
        engagedRate: engagedRate > 0 ? engagedRate : null,
        playlistAddsPer1k: null,
      } satisfies SubscriberMagnetVideo;
    });
}

// ── Percentile Ranking & Tier Assignment ────────────────────

function assignConversionTiers(videos: SubscriberMagnetVideo[]): void {
  const sorted = [...videos].sort(
    (a, b) => b.subscribersGained - a.subscribersGained,
  );

  sorted.forEach((v, idx) => {
    const percentile = ((sorted.length - idx) / sorted.length) * 100;
    v.percentileRank = percentile;

    if (v.subscribersGained >= 10 && percentile >= 75) {
      v.conversionTier = "strong";
    } else if (v.subscribersGained >= 3 && percentile >= 25) {
      v.conversionTier = "average";
    } else {
      v.conversionTier = "weak";
    }
  });
}

// ── Cached LLM Analysis ────────────────────────────────────

async function getCachedOrGenerateAnalysis(
  userId: number,
  channelDbId: number,
  videosWithMetrics: SubscriberMagnetVideo[],
  avgSubsPerThousand: number,
  llm: LlmPort,
): Promise<{ analysisJson: PatternAnalysisJson | null; analysisMarkdownFallback: string | null }> {
  if (videosWithMetrics.length < 3) {
    return { analysisJson: null, analysisMarkdownFallback: null };
  }

  const sorted = [...videosWithMetrics].sort(
    (a, b) => b.subscribersGained - a.subscribersGained,
  );
  const topDrivers = sorted
    .filter((v) => v.conversionTier === "strong")
    .slice(0, 10);

  const contentHash = hashSubscriberAuditContent(
    topDrivers.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      subsPerThousand: v.subsPerThousand,
    })),
  );

  const cachedAnalysis = await prisma.subscriberAuditCache.findFirst({
    where: { userId, channelId: channelDbId, range: "all" },
  });

  const isCacheFresh =
    cachedAnalysis &&
    cachedAnalysis.cachedUntil > new Date() &&
    cachedAnalysis.contentHash === contentHash;

  if (isCacheFresh && cachedAnalysis.analysisJson) {
    return {
      analysisJson: cachedAnalysis.analysisJson as PatternAnalysisJson,
      analysisMarkdownFallback: null,
    };
  }

  try {
    const analysisJson = await generatePatternAnalysis(
      {
        topSubscriberDrivers: topDrivers.map((v) => ({
          title: v.title,
          subsPerThousand: v.subsPerThousand,
          views: v.views,
          viewsPerDay: v.viewsPerDay ?? 0,
          engagedRate: v.engagedRate ?? 0,
        })),
        channelAvgSubsPerThousand: avgSubsPerThousand,
      },
      llm,
    );

    await prisma.subscriberAuditCache.upsert({
      where: {
        userId_channelId_range: { userId, channelId: channelDbId, range: "all" },
      },
      create: {
        userId,
        channelId: channelDbId,
        range: "all",
        contentHash,
        analysisJson: analysisJson as object,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        contentHash,
        analysisJson: analysisJson as object,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { analysisJson, analysisMarkdownFallback: null };
  } catch (err) {
    console.warn("Failed to generate subscriber insights:", err);
    return { analysisJson: null, analysisMarkdownFallback: null };
  }
}

// ── Empty Result ────────────────────────────────────────────

function emptyResult(channelId: string): SubscriberAuditResult {
  return {
    channelId,
    range: "all",
    generatedAt: new Date().toISOString(),
    cachedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    videos: [],
    patternAnalysis: { analysisJson: null, analysisMarkdownFallback: null },
    stats: {
      totalVideosAnalyzed: 0,
      avgSubsPerThousand: 0,
      totalSubscribersGained: 0,
      totalViews: 0,
      strongSubscriberDriverCount: 0,
    },
  };
}

// ── Main Use-Case ───────────────────────────────────────────

export async function runSubscriberAudit(
  input: RunSubscriberAuditInput,
  deps: SubscriberAuditDeps,
): Promise<SubscriberAuditResult> {
  const { userId, channelId, limit } = input;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new SubscriberInsightError("NOT_FOUND", "Channel not found");
  }

  const videos = await prisma.video.findMany({
    where: { channelId: channel.id, VideoMetrics: { isNot: null } },
    include: { VideoMetrics: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  if (videos.length === 0) {
    return emptyResult(channelId);
  }

  const videosWithMetrics = computeVideoMetrics(videos);
  assignConversionTiers(videosWithMetrics);

  const totalSubs = videosWithMetrics.reduce((s, v) => s + v.subscribersGained, 0);
  const totalViews = videosWithMetrics.reduce((s, v) => s + v.views, 0);
  const avgSubsPerThousand =
    Math.round((subsPerThousandViews(totalSubs, totalViews) ?? 0) * 100) / 100;

  const sorted = [...videosWithMetrics].sort(
    (a, b) => b.subscribersGained - a.subscribersGained,
  );
  const topVideos = sorted.slice(0, limit);

  const patternAnalysis = await getCachedOrGenerateAnalysis(
    userId,
    channel.id,
    videosWithMetrics,
    avgSubsPerThousand,
    deps.llm,
  );

  const strongCount = videosWithMetrics.filter(
    (v) => v.conversionTier === "strong",
  ).length;

  const avgEngagedRate =
    videosWithMetrics.reduce((s, v) => s + (v.engagedRate ?? 0), 0) /
    videosWithMetrics.length;

  return {
    channelId,
    range: "all",
    generatedAt: new Date().toISOString(),
    cachedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    videos: topVideos,
    patternAnalysis,
    stats: {
      totalVideosAnalyzed: videosWithMetrics.length,
      avgSubsPerThousand,
      totalSubscribersGained: totalSubs,
      totalViews,
      strongSubscriberDriverCount: strongCount,
      avgEngagedRate: avgEngagedRate > 0 ? avgEngagedRate : undefined,
    },
  };
}
