import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import { callLLM } from "@/lib/llm";
import { hashVideoContent } from "@/lib/content-hash";
import {
  fetchCompetitiveContext,
  type CompetitiveContext,
} from "@/lib/dataforseo";
import type {
  DerivedMetrics,
  BaselineComparison,
} from "@/lib/owned-video-math";
import type {
  VideoMetadata,
  SubscriberBreakdown,
  GeographicBreakdown,
  TrafficSourceDetail,
  DemographicBreakdown,
} from "@/lib/youtube-analytics";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

// Core analysis result type (supports both old and new formats)
export type CoreAnalysis = {
  // Old format (deprecated but still supported)
  headline?: string;
  wins?: Array<{
    label: string;
    metric: string;
    why: string;
  }>;
  improvements?: Array<{
    label: string;
    metric: string;
    fix: string;
  }>;
  topAction?: {
    what: string;
    why: string;
    effort: "low" | "medium" | "high";
  };
  // New format (viewer journey-based)
  insight_headline?: string;
  the_viewer_journey?: {
    discovery_phase: string;
    consumption_phase: string;
    conversion_phase: string;
  };
  dimensional_nuance?: string;
  strategic_pivot?: {
    what: string;
    why: string;
    impact_forecast: string;
  };
};

export const ARCHETYPE_LIBRARY = [
  // CATEGORY 1: DISCOVERY & PACKAGING
  {
    id: "PACKAGING_CRISIS",
    label: "The Packaging Crisis",
    logic: "High Rank + Low CTR + Rising Trend",
    conditions: { rank: "HIGH", ctr: "LOW", trend: "HIGH" },
  },
  {
    id: "ALGORITHM_GHOST",
    label: "The Algorithm Ghost",
    logic: "High CTR + High Retention + Low Impressions",
    conditions: { ctr: "HIGH", retention: "HIGH", impressions: "LOW" },
  },
  {
    id: "SEARCH_SABOTAGE",
    label: "The Search Sabotage",
    logic: "High Search Rank + Low CTR",
    conditions: { rank: "HIGH", ctr: "LOW" },
  },
  {
    id: "RISING_TIDE",
    label: "The Rising Tide",
    logic: "Low Rank + Low Views + Rising Trend",
    conditions: { rank: "LOW", trend: "HIGH" },
  },
  {
    id: "SEO_LONG_GAME",
    label: "The SEO Long-Game",
    logic: "Low CTR + High Search Traffic + Long Duration",
    conditions: { ctr: "LOW", trafficSource: "SEARCH", isLongForm: true },
  },
  {
    id: "CLICKBAIT_GAP",
    label: "The Clickbait Gap",
    logic: "High CTR + Low Retention + High Browse",
    conditions: { ctr: "HIGH", retention: "LOW", trafficSource: "BROWSE" },
  },
  {
    id: "DEAD_ZONE",
    label: "The Dead Zone",
    logic: "Low CTR + Low Rank + Falling Trend",
    conditions: { ctr: "LOW", rank: "LOW", trend: "LOW" },
  },
  {
    id: "INVISIBLE_AUTHORITY",
    label: "The Invisible Authority",
    logic: "High Search Rank + High Retention + Low CTR",
    conditions: { rank: "HIGH", retention: "HIGH", ctr: "LOW" },
  },

  // CATEGORY 2: AUDIENCE RESONANCE
  {
    id: "ECHO_CHAMBER",
    label: "The Echo Chamber",
    logic: "High Sub % + High Sub-Retention + Low Non-Sub Views",
    conditions: {
      subViewsPct: "HIGH",
      subRetention: "HIGH",
      nonSubViews: "LOW",
    },
  },
  {
    id: "SUB_REJECTION",
    label: "The Subscriber Rejection",
    logic: "High Sub-Impressions + Low Sub-CTR",
    conditions: { subImpressions: "HIGH", subCtr: "LOW" },
  },
  {
    id: "BREAKOUT_DISCOVERY",
    label: "The Breakout Discovery",
    logic: "Low Sub % + High Non-Sub Retention",
    conditions: { subViewsPct: "LOW", nonSubRetention: "HIGH" },
  },
  {
    id: "INSIDE_JOKE",
    label: "The Inside Joke",
    logic: "High Sub-Retention + Low Non-Sub Retention",
    conditions: { subRetention: "HIGH", nonSubRetention: "LOW" },
  },
  {
    id: "IDENTITY_CRISIS",
    label: "The Identity Crisis",
    logic: "Low Sub-Retention + Low Non-Sub Retention",
    conditions: { subRetention: "LOW", nonSubRetention: "LOW" },
  },
  {
    id: "BRIDGE_CONTENT",
    label: "The Bridge Content",
    logic: "Balanced Sub/Non-Sub + High Retention",
    conditions: { subViewsPct: "MED", retention: "HIGH" },
  },
  {
    id: "PERSONALITY_MAGNET",
    label: "The Personality Magnet",
    logic: "Low CTR + High Retention Across All",
    conditions: { ctr: "LOW", retention: "HIGH" },
  },
  {
    id: "COMMUNITY_PILLAR",
    label: "The Community Pillar",
    logic: "High Sub-Retention + High Engagement + Low Views",
    conditions: { subRetention: "HIGH", engagement: "HIGH", views: "LOW" },
  },

  // CATEGORY 3: RETENTION & VALUE
  {
    id: "WATCH_TIME_KING",
    label: "The Watch-Time King",
    logic: "Long Duration + Low % Viewed + High Raw Minutes",
    conditions: { isLongForm: true, retention: "LOW" },
  },
  {
    id: "TOURIST_TRAP",
    label: "The Tourist Trap",
    logic: "High Non-Sub Views + Low Non-Sub Retention",
    conditions: { nonSubViews: "HIGH", nonSubRetention: "LOW" },
  },
  {
    id: "UTILITY_HIT",
    label: "The Utility Hit",
    logic: "High Search + Low % Viewed + 0 Subs",
    conditions: {
      trafficSource: "SEARCH",
      retention: "LOW",
      subConversion: "NONE",
    },
  },
  {
    id: "PACING_TRAP",
    label: "The Pacing Trap",
    logic: "Steady Retention + Sharp Mid-Video Drop",
    conditions: { retention: "MED", hookRetention: "HIGH" },
  },
  {
    id: "FALSE_START",
    label: "The False Start",
    logic: "Low Intro Retention + High Mid-Video Retention",
    conditions: { hookRetention: "LOW", retention: "HIGH" },
  },
  {
    id: "ENGAGEMENT_MIRAGE",
    label: "The Engagement Mirage",
    logic: "High Engagement + Low Total Retention",
    conditions: { engagement: "HIGH", retention: "LOW" },
  },
  {
    id: "VALUE_DEAD_END",
    label: "The Value Dead-End",
    logic: "High Retention + 0 Subs/1k Views",
    conditions: { retention: "HIGH", subConversion: "NONE" },
  },
  {
    id: "SLOW_BURN_SUCCESS",
    label: "The Slow-Burn Success",
    logic: "Low Initial Retention + Rising End Retention",
    conditions: { hookRetention: "LOW", retention: "MED" },
  },

  // CATEGORY 4: GEO & DEMO
  {
    id: "LOCALIZED_STAR",
    label: "The Localized Star",
    logic: "80%+ Views from 1 Country + High Retention There",
    conditions: { geoSkew: "HIGH", geoRetention: "HIGH" },
  },
  {
    id: "DEMO_SHIFT",
    label: "The Demographic Shift",
    logic: "Age/Gender Skew != Channel Avg + High Retention",
    conditions: { demoSkew: "HIGH", retention: "HIGH" },
  },
  {
    id: "LANGUAGE_BARRIER",
    label: "The Language Barrier",
    logic: "High Views + Low Retention in Non-Primary Markets",
    conditions: { geoSkew: "LOW", geoRetention: "LOW" },
  },
  {
    id: "CULTURAL_MISMATCH",
    label: "The Cultural Mismatch",
    logic: "High Impressions in Secondary Market + Low CTR",
    conditions: { geoImpressions: "HIGH", ctr: "LOW" },
  },
  {
    id: "GEN_Z_PIVOT",
    label: "The Gen-Z/Alpha Pivot",
    logic: "Younger Demo Skew + High Engagement",
    conditions: { demoAge: "YOUNG", engagement: "HIGH" },
  },
  {
    id: "LEGACY_APPEAL",
    label: "The Legacy Appeal",
    logic: "Older Demo Skew + High AVD",
    conditions: { demoAge: "OLD", retention: "HIGH" },
  },

  // CATEGORY 5: GROWTH & CONVERSION
  {
    id: "BROAD_SHALLOW_HIT",
    label: "The Broad but Shallow Hit",
    logic: "High Views + Low Subs/1k + High Retention",
    conditions: { views: "HIGH", subConversion: "LOW", retention: "HIGH" },
  },
  {
    id: "GROWTH_ENGINE",
    label: "The Growth Engine",
    logic: "High Subs/1k + High Retention + Low Views",
    conditions: { subConversion: "HIGH", retention: "HIGH", views: "LOW" },
  },
  {
    id: "COMPETITIVE_UNDERDOG",
    label: "The Competitive Underdog",
    logic: "High Rank + Lower CTR than Expected",
    conditions: { rank: "HIGH", ctr: "LOW" },
  },
  {
    id: "TOPIC_PIONEER",
    label: "The Topic Pioneer",
    logic: "No Rankings + High Browse + High Trend",
    conditions: { rank: "NONE", trafficSource: "BROWSE", trend: "HIGH" },
  },
  {
    id: "EFFICIENCY_EXPERT",
    label: "The Efficiency Expert",
    logic: "Short Duration + High Retention + High Subs/1k",
    conditions: { isLongForm: false, retention: "HIGH", subConversion: "HIGH" },
  },
  {
    id: "HIGH_EFFORT_FLOP",
    label: "The High-Effort Flop",
    logic: "High Duration + Low Retention + High Production",
    conditions: { isLongForm: true, retention: "LOW", views: "LOW" },
  },
  {
    id: "LOW_EFFORT_WIN",
    label: "The Low-Effort Win",
    logic: "Short Duration + High Retention + Low Effort",
    conditions: { isLongForm: false, retention: "HIGH", views: "HIGH" },
  },
  {
    id: "NICHE_DEEP_DIVE",
    label: "The Niche Deep-Dive",
    logic: "High Sub-Retention + Low Non-Sub Views",
    conditions: { subRetention: "HIGH", nonSubViews: "LOW" },
  },
  {
    id: "BRAND_BUILDER",
    label: "The Brand Builder",
    logic: "High Engagement + High Subs + Low Views",
    conditions: { engagement: "HIGH", subConversion: "HIGH", views: "LOW" },
  },
  {
    id: "PERFECT_STORM",
    label: "The Perfect Storm",
    logic: "High CTR + High Retention + High Conversion",
    conditions: { ctr: "HIGH", retention: "HIGH", subConversion: "HIGH" },
  },
];

function getRelevantArchetypes(
  video: VideoMetadata,
  derived: DerivedMetrics,
  comparison: BaselineComparison,
  subscriberBreakdown: SubscriberBreakdown | null | undefined,
  competitiveContext: CompetitiveContext | null | undefined,
) {
  // 1. Assign "States" to metrics based on comparison
  const states = {
    ctr: (derived.impressionsCtr || 0) > 5 ? "HIGH" : "LOW",
    views: comparison.viewsPerDay?.vsBaseline === "above" ? "HIGH" : "LOW",
    retention: (derived.avdRatio || 0) > 0.4 ? "HIGH" : "LOW",
    rank:
      (competitiveContext?.searchRankings?.[0]?.position || 99) <= 5
        ? "HIGH"
        : competitiveContext?.searchRankings?.[0]?.position
          ? "LOW"
          : "NONE",
    subConversion:
      (derived.subsPer1k || 0) === 0
        ? "NONE"
        : (derived.subsPer1k || 0) > 2
          ? "HIGH"
          : "LOW",
    isLongForm: (video.durationSec || 0) > 1800, // 30 mins
    subViewsPct:
      (subscriberBreakdown?.subscriberViewPct || 0) > 40 ? "HIGH" : "LOW",
    subRetention:
      (subscriberBreakdown?.subscribers?.avgViewPct || 0) >
      (subscriberBreakdown?.nonSubscribers?.avgViewPct || 0) + 10
        ? "HIGH"
        : "LOW",
    nonSubRetention:
      (subscriberBreakdown?.nonSubscribers?.avgViewPct || 0) > 20
        ? "HIGH"
        : "LOW",
    engagement:
      comparison.engagementPerView?.vsBaseline === "above" ? "HIGH" : "LOW",
    trend:
      competitiveContext?.topicTrends?.recentInterest &&
      competitiveContext.topicTrends.recentInterest > 60
        ? "HIGH"
        : "LOW",
  };

  // 2. Filter library based on states
  // We match archetypes where AT LEAST 2 conditions are met
  return ARCHETYPE_LIBRARY.filter((arch) => {
    const conditionKeys = Object.keys(arch.conditions);
    const matches = conditionKeys.filter(
      (key) =>
        states[key as keyof typeof states] ===
        arch.conditions[key as keyof typeof arch.conditions],
    );
    return matches.length >= 2; // Threshold for relevance
  }).slice(0, 6); // Limit to top 6 to keep prompt clean
}
/**
 * GET - Fetch AI summary (requires cached analytics)
 * Returns the consolidated AI analysis
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> },
) {
  const resolvedParams = await params;

  const parsedParams = ParamsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { channelId, videoId } = parsedParams.data;

  const url = new URL(req.url);
  const queryResult = QuerySchema.safeParse({
    range: url.searchParams.get("range") ?? "28d",
  });
  if (!queryResult.success) {
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }
  const { range } = queryResult.data;

  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify channel ownership
    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
    });
    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get cached data
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

    const derivedData = cached.derivedJson as any;

    // Check if we have a cached summary that's still valid
    if (cached.llmJson && cached.cachedUntil > new Date()) {
      const llmData = cached.llmJson as any;
      // Check if it's the new format (has headline) vs old format
      if (llmData.headline) {
        // New format: llmData IS the summary
        return Response.json({
          summary: llmData,
          cached: true,
        });
      } else if (llmData.summary?.headline) {
        // Wrapped format: llmData contains a summary key
        return Response.json({
          summary: llmData.summary,
          cached: true,
        });
      }
    }

    // Check content hash - if unchanged, we can reuse cached LLM
    const currentHash = hashVideoContent({
      title: derivedData.video?.title,
      description: derivedData.video?.description,
      tags: derivedData.video?.tags,
      durationSec: derivedData.video?.durationSec,
      categoryId: derivedData.video?.categoryId,
    });

    if (cached.contentHash === currentHash && cached.llmJson) {
      const llmData = cached.llmJson as any;
      if (llmData.headline) {
        return Response.json({
          summary: llmData,
          cached: true,
        });
      } else if (llmData.summary?.headline) {
        return Response.json({
          summary: llmData.summary,
          cached: true,
        });
      }
    }

    // Rate limit
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

    // Entitlement check
    const entitlementResult = await checkEntitlement({
      featureKey: "owned_video_analysis",
      increment: true,
    });
    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }

    // Fetch competitive context if video has search traffic
    let competitiveContext: CompetitiveContext | null = null;
    if (derivedData.trafficDetail?.searchTerms?.length > 0) {
      competitiveContext = await fetchCompetitiveContext({
        videoId,
        title: derivedData.video.title,
        tags: derivedData.video.tags || [],
        searchTerms: derivedData.trafficDetail.searchTerms.slice(0, 3),
        totalViews: derivedData.derived.totalViews,
      }).catch((err) => {
        console.warn("Competitive context fetch failed:", err);
        return null;
      });
    }

    // Generate AI summary with all available data
    const summary = await generateCoreAnalysis(
      derivedData.video,
      derivedData.derived,
      derivedData.comparison,
      derivedData.bottleneck,
      derivedData.subscriberBreakdown,
      derivedData.geoBreakdown,
      derivedData.trafficDetail,
      derivedData.demographicBreakdown,
      competitiveContext,
    );

    if (!summary) {
      return Response.json(
        { error: "Failed to generate AI summary" },
        { status: 500 },
      );
    }

    // Cache the summary
    await prisma.ownedVideoInsightsCache.update({
      where: {
        userId_channelId_videoId_range: {
          userId: user.id,
          channelId: channel.id,
          videoId,
          range,
        },
      },
      data: {
        contentHash: currentHash,
        llmJson: summary as unknown as Prisma.JsonObject,
      },
    });

    return Response.json({
      summary,
      cached: false,
    });
  } catch (err) {
    console.error("Summary generation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Failed to generate summary", detail: message },
      { status: 500 },
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/summary" },
  async (req, ctx) => GETHandler(req, ctx as any),
);

/**
 * Generate consolidated AI analysis
 * Single LLM call that provides the core value with rich dimensional data
 */
async function generateCoreAnalysis(
  video: VideoMetadata,
  derived: DerivedMetrics,
  comparison: BaselineComparison,
  bottleneck: { bottleneck: string; evidence: string; severity: string } | null,
  subscriberBreakdown?: SubscriberBreakdown | null,
  geoBreakdown?: GeographicBreakdown | null,
  trafficDetail?: TrafficSourceDetail | null,
  demographicBreakdown?: DemographicBreakdown | null,
  competitiveContext?: CompetitiveContext | null,
): Promise<CoreAnalysis | null> {
  const durationMin = Math.round(video.durationSec / 60);
  const descriptionSnippet =
    video.description?.slice(0, 300) || "No description";

  // Build subscriber behavior section
  const subscriberSection = subscriberBreakdown
    ? `
SUBSCRIBER BEHAVIOR:
• ${subscriberBreakdown.subscriberViewPct?.toFixed(0) ?? "N/A"}% of views from subscribers
• Subscriber retention: ${subscriberBreakdown.subscribers?.avgViewPct?.toFixed(1) ?? "N/A"}%
• Non-subscriber retention: ${subscriberBreakdown.nonSubscribers?.avgViewPct?.toFixed(1) ?? "N/A"}%
${subscriberBreakdown.subscribers?.ctr ? `• Subscriber CTR: ${subscriberBreakdown.subscribers.ctr.toFixed(1)}%` : ""}`
    : `
SUBSCRIBER BEHAVIOR:
• Subscriber data not available`;

  // Build geographic section
  const geoSection =
    geoBreakdown?.topCountries && geoBreakdown.topCountries.length > 0
      ? `
GEOGRAPHIC PERFORMANCE:
${geoBreakdown.topCountries
  .slice(0, 5)
  .map(
    (c: { countryName: string; viewsPct: number; avgViewPct: number | null }) =>
      `• ${c.countryName}: ${c.viewsPct.toFixed(0)}% of views${c.avgViewPct ? ` (${c.avgViewPct.toFixed(1)}% retention)` : ""}`,
  )
  .join("\n")}
${geoBreakdown.primaryMarket ? `• Primary market: ${geoBreakdown.primaryMarket}` : ""}`
      : `
GEOGRAPHIC PERFORMANCE:
• Geographic data not available`;

  // Build traffic detail section
  const trafficSection = trafficDetail
    ? `
TRAFFIC SOURCE DETAIL:
${
  trafficDetail.searchTerms && trafficDetail.searchTerms.length > 0
    ? `• Search Terms: ${trafficDetail.searchTerms
        .slice(0, 5)
        .map(
          (t: { term: string; views: number }) =>
            `"${t.term}" (${t.views} views)`,
        )
        .join(", ")}`
    : ""
}
${trafficDetail.suggestedVideos && trafficDetail.suggestedVideos.length > 0 ? `• Top Suggested Video: ${trafficDetail.suggestedVideos[0].videoId} (${trafficDetail.suggestedVideos[0].views} views)` : ""}
${
  trafficDetail.browseFeatures && trafficDetail.browseFeatures.length > 0
    ? `• Browse Features: ${trafficDetail.browseFeatures
        .slice(0, 3)
        .map(
          (b: { feature: string; views: number }) =>
            `${b.feature} (${b.views} views)`,
        )
        .join(", ")}`
    : ""
}
${!trafficDetail.searchTerms && !trafficDetail.suggestedVideos && !trafficDetail.browseFeatures ? "• Traffic detail not available" : ""}`.trim()
    : `
TRAFFIC SOURCE DETAIL:
• Traffic detail not available`;

  // Build demographic section
  const demoSection = demographicBreakdown?.hasData
    ? `
DEMOGRAPHIC BREAKDOWN:
• By Age: ${demographicBreakdown.byAge.map((a: { ageGroup: string; viewsPct: number }) => `${a.ageGroup} (${a.viewsPct.toFixed(0)}%)`).join(", ")}
• By Gender: ${demographicBreakdown.byGender.map((g: { gender: string; viewsPct: number }) => `${g.gender} (${g.viewsPct.toFixed(0)}%)`).join(", ")}`
    : `
DEMOGRAPHIC BREAKDOWN:
• Demographic data not available (needs more views)`;

  // Build competitive context section
  const competitiveSection = competitiveContext
    ? `
COMPETITIVE CONTEXT:
${
  competitiveContext.searchRankings &&
  competitiveContext.searchRankings.length > 0
    ? `• Search Rankings: ${competitiveContext.searchRankings
        .map(
          (r) =>
            `"${r.term}" → ${r.position ? `#${r.position} (expected ${r.expectedCtr.toFixed(1)}% CTR, actual ${r.actualCtr.toFixed(1)}%)` : "not ranking top 20"}`,
        )
        .join(" | ")}`
    : ""
}
${competitiveContext.topicTrends ? `• Topic Trend: ${competitiveContext.topicTrends.trend} (interest: ${competitiveContext.topicTrends.recentInterest}/100)` : ""}
${competitiveContext.similarVideos && competitiveContext.similarVideos.length > 0 ? `• Similar Videos: Found ${competitiveContext.similarVideos.length} competitors ranking for main search term` : ""}`.trim()
    : "";

  const videoContext = `VIDEO INFO:
TITLE: "${video.title}"
DESCRIPTION (first 300 chars): "${descriptionSnippet}"
TAGS: [${video.tags
    .slice(0, 10)
    .map((t) => `"${t}"`)
    .join(", ")}]
DURATION: ${durationMin} minutes

PERFORMANCE DATA (${derived.daysInRange} day period):
• Total Views: ${derived.totalViews.toLocaleString()}
• Views/Day: ${derived.viewsPerDay.toFixed(0)} ${
    comparison.viewsPerDay.vsBaseline !== "unknown"
      ? `(${comparison.viewsPerDay.delta?.toFixed(0)}% vs your channel avg)`
      : ""
  }
• Avg % Viewed: ${
    derived.avdRatio != null ? (derived.avdRatio * 100).toFixed(1) : "N/A"
  }% ${
    comparison.avgViewPercentage.vsBaseline !== "unknown"
      ? `(${comparison.avgViewPercentage.delta?.toFixed(0)}% vs avg)`
      : ""
  }
• Engagement Rate: ${
    derived.engagementPerView != null
      ? (derived.engagementPerView * 100).toFixed(2)
      : "N/A"
  }% ${
    comparison.engagementPerView.vsBaseline !== "unknown"
      ? `(${comparison.engagementPerView.delta?.toFixed(0)}% vs avg)`
      : ""
  }
• Subs/1K Views: ${derived.subsPer1k?.toFixed(2) ?? "N/A"} ${
    comparison.subsPer1k.vsBaseline !== "unknown"
      ? `(${comparison.subsPer1k.delta?.toFixed(0)}% vs avg)`
      : ""
  }
${bottleneck ? `\nBOTTLENECK: ${bottleneck.bottleneck} - ${bottleneck.evidence}` : ""}
${subscriberSection}
${geoSection}
${trafficSection}
${demoSection}
${competitiveSection ? "\n" + competitiveSection : ""}`;

  const relevantArchetypes = getRelevantArchetypes(
    video,
    derived,
    comparison,
    subscriberBreakdown,
    competitiveContext,
  );

  const archetypeString = relevantArchetypes
    .map((a) => `${a.label}: ${a.logic}`)
    .join("\n");

  const systemPrompt = `
You are a YouTube Growth Strategist. Your goal is to explain the CAUSAL RELATIONSHIP between data points. 

--- YOUR MENTAL MODELS (DO NOT REPEAT THESE LABELS) ---
Use the following logic to shape your response. These archetypes explain how metrics interact. If the data fits one of these patterns, use that logic to write your explanation:

${archetypeString}

--- THE EXPLANATION RULES ---
1. NO REPEATING DATA: Do not say 'Your CTR is 4%.' Say 'Your packaging is struggling to capture attention compared to the high search interest in this topic.'
2. DURATION AWARENESS: For videos over 30 minutes, treat 'Low % Viewed' as a success if the raw minutes are high. Explain this as 'Deep Intent' or 'Comfort Content.'
3. THE 'WHY' REQUIREMENT: Every statement must answer: 'What is the viewer thinking?' 
   - (e.g., 'Subscribers are skipping this because the title feels like a repeat of previous content, not a new mystery to solve.')
4. DIMENSIONAL INTEGRATION: Use the Geo/Demo/SEO data to add 'flavor' to the why. 
   - (e.g., 'While the US audience is loyal, the 0% retention in international markets suggests the pacing is too fast for non-native speakers.')

--- OUTPUT FORMAT (JSON ONLY) ---
{
  "insight_headline": "String",
  "the_viewer_journey": {
    "discovery_phase": "Explanation of the 'Click' psychology",
    "consumption_phase": "Explanation of the 'Watch' psychology",
    "conversion_phase": "Explanation of the 'Join' psychology"
  },
  "dimensional_nuance": "Explanation of how Geo/Demo/SEO factors are shifting the numbers",
  "strategic_pivot": {
    "what": "Actionable step",
    "why": "The psychological trigger",
    "impact_forecast": "Expected result"
  }
}
`;
  try {
    // Log the full prompt for debugging
    console.log("\n========== LLM PROMPT START ==========");
    console.log("SYSTEM PROMPT:");
    console.log(systemPrompt);
    console.log("\n--- VIDEO CONTEXT ---");
    console.log(videoContext);
    console.log("========== LLM PROMPT END ==========\n");

    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: videoContext },
      ],
      { maxTokens: 800, temperature: 0.3, responseFormat: "json_object" },
    );

    // Log the response
    console.log("\n========== LLM RESPONSE ==========");
    console.log(result.content);
    console.log("========== LLM RESPONSE END ==========\n");

    return JSON.parse(result.content);
  } catch (err) {
    console.error("Core analysis LLM failed:", err);
    return null;
  }
}
