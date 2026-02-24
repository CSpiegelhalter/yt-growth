/**
 * LLM-powered channel health insights.
 *
 * Matches the channel against ~42 diagnostic archetypes derived from
 * YouTube growth best practices, then asks the LLM to produce
 * structured ActionableInsight cards explaining what the data means.
 */

import { ChannelAuditError } from "../errors";
import type {
  ActionableInsight,
  AuditTrends,
  ChannelArchetype,
  ChannelInsightsDeps,
  ChannelInsightsInput,
  ChannelInsightsVideoSummary,
} from "../types";
import { parseRecommendationsJson } from "./generateRecommendations";

// ── Archetype Library ────────────────────────────────────────

const CHANNEL_HEALTH_ARCHETYPES: ChannelArchetype[] = [
  // GROUP 1: DISTRIBUTION & TRAFFIC (from existing library)
  {
    id: "SEARCH_PRISON",
    logic: "Search > 50% + Browse < 20%",
    meaning:
      "You solve problems but don't build a brand. You lack homepage pull -- viewers find you via search and never return.",
  },
  {
    id: "ALGO_FAVORITE",
    logic: "Browse > 60% + Views trending UP",
    meaning:
      "The algorithm is actively testing your content on homepages. Maintain quality -- this momentum is fragile.",
  },
  {
    id: "SUGGESTED_LEECH",
    logic: "Suggested > 40%",
    meaning:
      "You're drafting off larger creators' audiences. Great for growth, risky for identity -- build your own brand.",
  },
  {
    id: "EXTERNAL_DEPENDENT",
    logic: "External > 30% + Browse < 20%",
    meaning:
      "Your views come from outside YouTube. The platform's internal system isn't recommending you yet.",
  },

  // GROUP 2: LOYALTY & CHURN
  {
    id: "LEAKY_BUCKET",
    logic: "Subs Lost > 30% of Subs Gained",
    meaning:
      "You're gaining views but losing core fans. Your new direction may be pushing subscribers away.",
  },
  {
    id: "PASSERBY_CHANNEL",
    logic: "Views UP + Net Subs flat",
    meaning:
      "People enjoy individual videos but see no reason to follow the journey. No clear channel promise.",
  },
  {
    id: "THE_CULT_LEADER",
    logic: "Views flat + Net Subs UP + Retention > 50%",
    meaning:
      "You have a small obsessed tribe. Broaden your topics to find more people like them.",
  },
  {
    id: "BRAND_BURN_OUT",
    logic: "Subs Lost trending UP + Watch Time DOWN",
    meaning:
      "Your audience is tired of the current format. The novelty has worn off.",
  },

  // GROUP 3: BINGE-ABILITY
  {
    id: "THE_DEAD_END",
    logic: "End Screen CTR < 1% + Retention > 30%",
    meaning:
      "Viewers watch to the end then leave. You're not chaining videos into sessions.",
  },
  {
    id: "THE_BINGE_MASTER",
    logic: "End Screen CTR > 5% + Watch Time UP",
    meaning:
      "You're keeping viewers on your channel for multiple videos. This is what the algorithm loves most.",
  },
  {
    id: "SHALLOW_HOOKS",
    logic: "Views UP + Avg Retention < 20%",
    meaning:
      "You get clicks but can't keep them. Your intro/content doesn't match the hype of your packaging.",
  },

  // GROUP 4: TRENDS & MOMENTUM
  {
    id: "THE_RECOVERY",
    logic: "All trends turning UP simultaneously",
    meaning:
      "A recent strategy change is being recognized by the algorithm. Keep doing what's working.",
  },
  {
    id: "THE_SLOW_DEATH",
    logic: "Views flat + Watch Time DOWN + Subs DOWN",
    meaning:
      "Your niche is shrinking or your style is becoming outdated. A pivot is needed.",
  },
  {
    id: "THE_VERTICAL_LIMIT",
    logic: "Views UP + Watch Time flat",
    meaning:
      "More views but less total time. You may be leaning too heavily on short-form at the expense of depth.",
  },

  // GROUP 5: SPECIFIC PERMUTATIONS
  {
    id: "UTILITY_OBLIVION",
    logic: "Search HIGH + End Screen LOW + Subs LOW",
    meaning:
      "You provide great answers but zero personality. You're a one-and-done resource.",
  },
  {
    id: "CONTENT_MISMATCH",
    logic: "Browse HIGH + Retention LOW",
    meaning:
      "YouTube is trying to help you, but viewers who click are disappointed by the content.",
  },
  {
    id: "HIDDEN_GEMS",
    logic: "Retention > 60% + Views trending DOWN",
    meaning:
      "Quality is there but your titles/thumbnails are invisible. Distribution is the bottleneck, not content.",
  },
  {
    id: "THE_WALL",
    logic: "Views flat + Watch Time UP + Subs flat",
    meaning:
      "You've reached everyone in your current sub-niche. Expand to an adjacent topic.",
  },
  {
    id: "AUDIENCE_FATIGUE",
    logic: "Views DOWN + Subs Lost UP",
    meaning:
      "You're repeating yourself too much. Fans are unsubscribing out of boredom.",
  },
  {
    id: "THE_CLIMBER",
    logic: "Watch Time Trend > Views Trend",
    meaning:
      "People are watching longer even if view counts aren't exploding. Quality is improving -- success is coming.",
  },
  {
    id: "THE_DIVE",
    logic: "Watch Time Trend < Views Trend",
    meaning:
      "More clicks but viewers leave faster. Your content is losing stickiness.",
  },
  {
    id: "THE_GHOST_CHANNEL",
    logic: "All metrics < 10% change + flat trends",
    meaning:
      "The channel is on autopilot. It needs a pattern interrupt to restart growth.",
  },

  // GROUP 6: RETENTION DIAGNOSTICS (article-derived)
  {
    id: "HOOK_CRISIS",
    logic: "Avg retention < 40% across recent videos",
    meaning:
      "Your intros are killing your videos before they start. The first 30 seconds determine who stays -- and most are leaving.",
  },
  {
    id: "LONG_FORM_TRAP",
    logic: "Avg duration > 15min + retention < 30%",
    meaning:
      "You're making videos longer than your content supports. Viewers lose interest because there's too much filler.",
  },
  {
    id: "CLICKBAIT_DECAY",
    logic: "High engagement rate but retention < 25%",
    meaning:
      "Your packaging overpromises. Viewers feel baited and leave. The title/thumbnail sets an expectation the video doesn't deliver.",
  },

  // GROUP 7: PACKAGING DIAGNOSTICS (article-derived)
  {
    id: "THUMBNAIL_BLINDNESS",
    logic: "Browse traffic exists but overall engagement low",
    meaning:
      "YouTube is showing your videos on homepages but nobody is clicking. Your thumbnails need a complete refresh.",
  },
  {
    id: "TITLE_KEYWORD_MISS",
    logic: "Search traffic < 15% of total",
    meaning:
      "Your titles aren't findable. Front-load keywords in the first 60 characters and target topics people actually search for.",
  },

  // GROUP 8: ENGAGEMENT DIAGNOSTICS (article-derived)
  {
    id: "SILENT_AUDIENCE",
    logic: "Like rate < 2% + comment rate < 1 per 1K views",
    meaning:
      "Your viewers are passive. They watch but never interact. Without engagement signals, the algorithm deprioritizes your content.",
  },
  {
    id: "ENGAGEMENT_WITHOUT_GROWTH",
    logic: "Like rate > 5% + views flat or declining",
    meaning:
      "Your core fans love you but you're not reaching new people. The content resonates but discovery is broken.",
  },

  // GROUP 9: CONVERSION DIAGNOSTICS (article-derived)
  {
    id: "LEAKY_FUNNEL",
    logic: "Avg views > 1K + subs per 1K views < 0.5",
    meaning:
      "People watch but see no reason to subscribe. Your channel lacks a clear promise of ongoing value.",
  },
  {
    id: "END_SCREEN_WASTE",
    logic: "End Screen CTR < 1% + Retention > 40%",
    meaning:
      "Viewers make it to the end but you're not sending them anywhere. You're wasting your best conversion moment.",
  },
  {
    id: "THE_CONVERTER",
    logic: "Subs per 1K views > 5",
    meaning:
      "Your channel promise is incredibly strong. You just need more traffic -- every viewer you reach is likely to subscribe.",
  },
  {
    id: "THE_SKEPTIC_AUDIENCE",
    logic: "Subs per 1K views < 0.1",
    meaning:
      "Viewers watch but don't feel a connection to you or the brand. There's a trust gap between content and creator.",
  },

  // GROUP 10: GROWTH PATTERN DIAGNOSTICS (article-derived)
  {
    id: "TOPIC_SCATTER",
    logic: "High variance in views across recent videos (CV > 1.0)",
    meaning:
      "Your topic selection is wildly inconsistent. Some videos hit but most miss -- the algorithm can't figure out who to show your content to.",
  },
  {
    id: "UPLOAD_GHOST",
    logic: "< 2 videos in 30 days + declining trends",
    meaning:
      "YouTube's algorithm forgets channels that don't upload. Consistency signals reliability to both viewers and the algorithm.",
  },
];

// ── Archetype Matching ──────────────────────────────────────

type MatchContext = {
  searchPct: number;
  browsePct: number;
  suggestedPct: number;
  externalPct: number;
  endScreenCtr: number;
  avgRetention: number;
  subChurn: number;
  subConversionPer1k: number;
  likeRate: number;
  commentsPer1k: number;
  avgViews: number;
  avgDurationSec: number;
  viewsCV: number | null;
  uploadGapDays: number | null;
  shortsCount: number;
  longFormCount: number;
  totalViews: number;
  trends: AuditTrends;
};

type ArchetypeMatcher = {
  id: string;
  match: (ctx: MatchContext) => boolean;
};

const MATCHERS: ArchetypeMatcher[] = [
  // Distribution
  { id: "SEARCH_PRISON", match: (c) => c.searchPct > 50 && c.browsePct < 20 },
  { id: "ALGO_FAVORITE", match: (c) => c.browsePct > 60 && c.trends.views.direction === "up" },
  { id: "SUGGESTED_LEECH", match: (c) => c.suggestedPct > 40 },
  { id: "EXTERNAL_DEPENDENT", match: (c) => c.externalPct > 30 && c.browsePct < 20 },

  // Loyalty
  { id: "LEAKY_BUCKET", match: (c) => c.subChurn > 0.3 },
  { id: "PASSERBY_CHANNEL", match: (c) => c.trends.views.direction === "up" && c.subConversionPer1k < 0.5 },
  { id: "THE_CULT_LEADER", match: (c) => c.trends.views.direction === "flat" && c.trends.subscribers.direction === "up" && c.avgRetention > 50 },
  { id: "BRAND_BURN_OUT", match: (c) => c.trends.subscribers.direction === "down" && c.trends.watchTime.direction === "down" },

  // Binge-ability
  { id: "THE_DEAD_END", match: (c) => c.endScreenCtr < 1 && c.avgRetention > 30 },
  { id: "THE_BINGE_MASTER", match: (c) => c.endScreenCtr > 5 && c.trends.watchTime.direction === "up" },
  { id: "SHALLOW_HOOKS", match: (c) => c.trends.views.direction === "up" && c.avgRetention < 20 },

  // Momentum
  { id: "THE_RECOVERY", match: (c) => c.trends.views.direction === "up" && c.trends.watchTime.direction === "up" && c.trends.subscribers.direction === "up" },
  { id: "THE_SLOW_DEATH", match: (c) => c.trends.views.direction === "flat" && c.trends.watchTime.direction === "down" && c.trends.subscribers.direction === "down" },
  { id: "THE_VERTICAL_LIMIT", match: (c) => c.trends.views.direction === "up" && c.trends.watchTime.direction === "flat" },

  // Permutations
  { id: "UTILITY_OBLIVION", match: (c) => c.searchPct > 40 && c.endScreenCtr < 2 && c.subConversionPer1k < 0.5 },
  { id: "CONTENT_MISMATCH", match: (c) => c.browsePct > 40 && c.avgRetention < 30 },
  { id: "HIDDEN_GEMS", match: (c) => c.avgRetention > 60 && c.trends.views.direction === "down" },
  { id: "THE_WALL", match: (c) => c.trends.views.direction === "flat" && c.trends.watchTime.direction === "up" && c.trends.subscribers.direction === "flat" },
  { id: "AUDIENCE_FATIGUE", match: (c) => c.trends.views.direction === "down" && c.trends.subscribers.direction === "down" },
  { id: "THE_CLIMBER", match: (c) => (c.trends.watchTime.value ?? 0) > (c.trends.views.value ?? 0) && c.trends.watchTime.direction === "up" },
  { id: "THE_DIVE", match: (c) => (c.trends.watchTime.value ?? 0) < (c.trends.views.value ?? 0) && c.trends.views.direction === "up" },
  { id: "THE_GHOST_CHANNEL", match: (c) => Math.abs(c.trends.views.value ?? 0) < 10 && Math.abs(c.trends.watchTime.value ?? 0) < 10 && Math.abs(c.trends.subscribers.value ?? 0) < 10 },

  // Retention diagnostics
  { id: "HOOK_CRISIS", match: (c) => c.avgRetention > 0 && c.avgRetention < 40 },
  { id: "LONG_FORM_TRAP", match: (c) => c.avgDurationSec > 900 && c.avgRetention > 0 && c.avgRetention < 30 },
  { id: "CLICKBAIT_DECAY", match: (c) => c.likeRate > 0.04 && c.avgRetention > 0 && c.avgRetention < 25 },

  // Packaging diagnostics
  { id: "THUMBNAIL_BLINDNESS", match: (c) => c.browsePct > 15 && c.likeRate < 0.02 && c.avgRetention < 35 },
  { id: "TITLE_KEYWORD_MISS", match: (c) => c.searchPct < 15 },

  // Engagement diagnostics
  { id: "SILENT_AUDIENCE", match: (c) => c.likeRate < 0.02 && c.commentsPer1k < 1 },
  { id: "ENGAGEMENT_WITHOUT_GROWTH", match: (c) => c.likeRate > 0.05 && c.trends.views.direction !== "up" },

  // Conversion diagnostics
  { id: "LEAKY_FUNNEL", match: (c) => c.avgViews > 1000 && c.subConversionPer1k < 0.5 },
  { id: "END_SCREEN_WASTE", match: (c) => c.endScreenCtr < 1 && c.avgRetention > 40 },
  { id: "THE_CONVERTER", match: (c) => c.subConversionPer1k > 5 },
  { id: "THE_SKEPTIC_AUDIENCE", match: (c) => c.subConversionPer1k < 0.1 && c.totalViews > 1000 },

  // Growth patterns
  { id: "TOPIC_SCATTER", match: (c) => c.viewsCV != null && c.viewsCV > 1 },
  { id: "UPLOAD_GHOST", match: (c) => c.uploadGapDays != null && c.uploadGapDays > 15 && c.trends.views.direction === "down" },
];

function extractTrafficPcts(input: ChannelInsightsInput) {
  const ts = input.trafficSources;
  return {
    searchPct: ts?.search?.percentage ?? 0,
    browsePct: ts?.browse?.percentage ?? 0,
    suggestedPct: ts?.suggested?.percentage ?? 0,
    externalPct: ts?.external?.percentage ?? 0,
  };
}

function buildMatchContext(input: ChannelInsightsInput): MatchContext {
  const vs = input.videoSummary;
  const subChurn =
    input.subscribersGained > 0
      ? input.subscribersLost / input.subscribersGained
      : 0;

  return {
    ...extractTrafficPcts(input),
    endScreenCtr: input.endScreenCtr ?? 0,
    avgRetention: vs.avgRetention ?? 0,
    subChurn,
    subConversionPer1k: vs.avgSubsPer1k ?? 0,
    likeRate: vs.avgLikeRate,
    commentsPer1k: vs.avgCommentsPer1k,
    avgViews: vs.avgViews,
    avgDurationSec: vs.avgDurationSec ?? 0,
    viewsCV: vs.viewsCoeffOfVariation,
    uploadGapDays: vs.uploadGapDays,
    shortsCount: vs.shortsCount,
    longFormCount: vs.longFormCount,
    totalViews: input.totalViews,
    trends: input.trends,
  };
}

function matchArchetypes(input: ChannelInsightsInput): ChannelArchetype[] {
  const ctx = buildMatchContext(input);
  const archetypeMap = new Map(
    CHANNEL_HEALTH_ARCHETYPES.map((a) => [a.id, a]),
  );

  return MATCHERS.filter((m) => m.match(ctx))
    .map((m) => archetypeMap.get(m.id))
    .filter((a): a is ChannelArchetype => a !== undefined)
    .slice(0, 8);
}

// ── Context Builder ─────────────────────────────────────────

function fmtNullable(
  value: number | null,
  formatter: (v: number) => string,
  fallback = "N/A",
): string {
  return value != null ? formatter(value) : fallback;
}

function buildVideoLines(vs: ChannelInsightsVideoSummary): string {
  return `VIDEO-LEVEL AVERAGES (${vs.count} videos):
Avg Views: ${Math.round(vs.avgViews).toLocaleString()}
Avg Retention: ${fmtNullable(vs.avgRetention, (v) => `${v.toFixed(1)}%`)}
Avg Like Rate: ${(vs.avgLikeRate * 100).toFixed(1)}%
Avg Comments/1K Views: ${vs.avgCommentsPer1k.toFixed(1)}
Avg Subs/1K Views: ${fmtNullable(vs.avgSubsPer1k, (v) => v.toFixed(1))}
Avg Duration: ${fmtNullable(vs.avgDurationSec, (v) => `${Math.round(v / 60)} min`)}
Format Mix: ${vs.shortsCount} Shorts, ${vs.longFormCount} long-form
Views Consistency (CV): ${fmtNullable(vs.viewsCoeffOfVariation, (v) => v.toFixed(2))}
Avg Upload Gap: ${fmtNullable(vs.uploadGapDays, (v) => `${Math.round(v)} days`)}`;
}

function fmtTrend(t: AuditTrends[keyof AuditTrends]): string {
  return `${t.direction} ${t.value ?? 0}%`;
}

function buildTrafficLines(input: ChannelInsightsInput): string {
  const ts = input.trafficSources;
  return `TRAFFIC SOURCES:
Browse/Home: ${ts?.browse?.percentage ?? 0}%
Suggested: ${ts?.suggested?.percentage ?? 0}%
Search: ${ts?.search?.percentage ?? 0}%
External: ${ts?.external?.percentage ?? 0}%`;
}

function subscriberTier(count: number | null): string {
  if (count == null) {return "Unknown";}
  if (count < 1_000) {return "Nano (<1K subs)";}
  if (count < 10_000) {return "Micro (1K-10K subs)";}
  if (count < 100_000) {return "Established (10K-100K subs)";}
  return "Large (100K+ subs)";
}

function buildBaselineNorms(baselines?: ChannelInsightsInput["channelBaselines"]): string {
  if (!baselines) {return "";}
  const ctr = baselines.avgCtr != null ? `${baselines.avgCtr.toFixed(1)}%` : "N/A";
  const avd = baselines.avgAvdPct != null ? `${baselines.avgAvdPct.toFixed(1)}%` : "N/A";
  const subs = baselines.avgSubsPer1kViews != null ? baselines.avgSubsPer1kViews.toFixed(1) : "N/A";
  return `\nBASELINE NORMS (30-DAY):
Average CTR: ${ctr}
Average Retention (AVD%): ${avd}
Average Subs/1K Views: ${subs}
Use these to judge whether current metrics are healthy for THIS channel.\n`;
}

function buildChannelContext(input: ChannelInsightsInput): string {
  const t = input.trends;
  const churnPct =
    input.subscribersGained > 0
      ? ((input.subscribersLost / input.subscribersGained) * 100).toFixed(1)
      : "0";

  const scaleBlock = `CHANNEL SCALE:
Subscribers: ${input.channelSubscribers != null ? input.channelSubscribers.toLocaleString() : "Unknown"}
Tier: ${subscriberTier(input.channelSubscribers)}`;

  const channelBlock = `CHANNEL PERFORMANCE (last 30 days):
Total Views: ${input.totalViews.toLocaleString()} (${fmtTrend(t.views)})
Net Subscribers: ${input.netSubscribers} (${fmtTrend(t.subscribers)})
Subscriber Churn: ${churnPct}% (lost vs gained)
Watch Time Trend: ${fmtTrend(t.watchTime)}
End Screen CTR: ${input.endScreenCtr ?? "N/A"}%`;

  return `${scaleBlock}${buildBaselineNorms(input.channelBaselines)}\n${channelBlock}\n\n${buildVideoLines(input.videoSummary)}\n\n${buildTrafficLines(input)}`;
}

// ── LLM Prompt ──────────────────────────────────────────────

function buildSystemPrompt(archetypes: ChannelArchetype[]): string {
  const lenses = archetypes
    .map((a) => `[${a.logic}] - ${a.meaning}`)
    .join("\n");

  return `You are a YouTube Growth Strategist analyzing a creator's channel health.

--- DIAGNOSTIC LENSES (use these to shape your analysis) ---
${lenses}

--- RULES ---
1. DO NOT mention archetype names. Use their logic to explain the WHY behind the data.
2. NO REPEATING DATA: Don't say "Your retention is 32%." Say "Most viewers are leaving before your video delivers its core value."
3. EXPLAIN THE VIEWER PSYCHOLOGY: Every insight must answer "What is the viewer thinking/feeling that causes this?"
4. BE SPECIFIC: Name exact actions. Not "improve your thumbnails" but "Use a single facial expression with 2-3 words of text and high-contrast colors."
5. ONLY DIAGNOSE REAL PROBLEMS: If a metric is healthy, say so briefly and move on. Don't invent issues.
6. LIMIT TO 3-5 INSIGHTS: Focus on the most important findings. Quality over quantity. Order by impact (most important first).
7. CONTEXTUAL CALIBRATION: Adjust advice based on channel size. A 5% CTR for a channel with 100 subscribers is a "High-Signal Win," while 5% for a 1M sub channel is "Saturation." Do not give enterprise-level advice to nano-creators.
8. BASELINE AWARENESS: The user's 30-day baselines are provided. Use them to determine if metrics are outliers for THIS channel. A 2% CTR on a channel with 1.2% baseline is a "Breakthrough" — not "low CTR."

--- OUTPUT FORMAT (JSON ONLY, NO MARKDOWN) ---
Each insight MUST have exactly three parts:
  - "title": A punchy 3-5 word verdict heading (e.g., "Packaging Win, Retention Crisis" or "Breakthrough Engagement").
  - "explanation": WHY the data looks this way based on viewer psychology. 1-2 sentences. Do NOT repeat raw numbers.
  - "fix": A tactical, specific 1-sentence instruction the creator can act on today.

{
  "insights": [
    { "title": "...", "explanation": "...", "fix": "..." }
  ]
}

CRITICAL: Return ONLY the JSON object. No markdown code blocks, no explanations.`;
}

// ── JSON Parsing ────────────────────────────────────────────

type LlmInsightItem = {
  title: string;
  explanation: string;
  fix: string;
};

type LlmInsightsOutput = {
  insights: LlmInsightItem[];
};

function toKebab(title: string): string {
  return title.toLowerCase().replaceAll(/[^a-z\d]+/g, "-").replaceAll(/^-|-$/g, "");
}

// ── Main Entry Point ────────────────────────────────────────

export async function generateChannelInsights(
  input: ChannelInsightsInput,
  deps: ChannelInsightsDeps,
): Promise<ActionableInsight[]> {
  if (input.videoSummary.count < 3) {
    return [];
  }

  const matched = matchArchetypes(input);
  if (matched.length === 0) {
    return [];
  }

  const systemPrompt = buildSystemPrompt(matched);
  const channelContext = buildChannelContext(input);

  const result = await deps.callLlm(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: channelContext },
    ],
    { maxTokens: 1000, temperature: 0.3, responseFormat: "json_object" },
  );

  const parsed = parseRecommendationsJson(
    result.content,
  ) as LlmInsightsOutput | null;
  if (!parsed?.insights || !Array.isArray(parsed.insights)) {
    throw new ChannelAuditError(
      "EXTERNAL_FAILURE",
      "Failed to generate channel insights - invalid LLM response",
    );
  }

  return parsed.insights
    .filter((d) => d.title && d.explanation && d.fix)
    .slice(0, 5)
    .map((d, index) => ({
      id: toKebab(d.title),
      title: d.title,
      explanation: d.explanation,
      fix: d.fix,
      priority: index + 1,
    }));
}

// ── Video Summary Builder (pure helper) ─────────────────────

/**
 * Aggregate per-video metrics into a summary for channel-level analysis.
 * Exported for use by the API route.
 */
export function buildVideoSummary(
  videos: Array<{
    views: number;
    likes: number;
    comments: number;
    durationSec: number | null;
    publishedAt: string | null;
    avgViewPercentage: number | null;
    subscribersGained: number | null;
  }>,
): ChannelInsightsVideoSummary {
  const count = videos.length;
  if (count === 0) {
    return {
      count: 0,
      avgViews: 0,
      avgRetention: null,
      avgLikeRate: 0,
      avgCommentsPer1k: 0,
      avgSubsPer1k: null,
      avgDurationSec: null,
      shortsCount: 0,
      longFormCount: 0,
      viewsCoeffOfVariation: null,
      uploadGapDays: null,
    };
  }

  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const avgViews = totalViews / count;

  const withViews = videos.filter((v) => v.views > 0);
  const avgLikeRate =
    withViews.length > 0
      ? withViews.reduce((s, v) => s + v.likes / v.views, 0) /
        withViews.length
      : 0;
  const avgCommentsPer1k =
    withViews.length > 0
      ? withViews.reduce(
          (s, v) => s + (v.comments / v.views) * 1000,
          0,
        ) / withViews.length
      : 0;

  const withRetention = videos.filter((v) => v.avgViewPercentage != null);
  const avgRetention =
    withRetention.length > 0
      ? withRetention.reduce((s, v) => s + v.avgViewPercentage!, 0) /
        withRetention.length
      : null;

  const withSubs = videos.filter(
    (v) => v.subscribersGained != null && v.views > 0,
  );
  const avgSubsPer1k =
    withSubs.length > 0
      ? withSubs.reduce(
          (s, v) => s + (v.subscribersGained! / v.views) * 1000,
          0,
        ) / withSubs.length
      : null;

  const withDuration = videos.filter((v) => v.durationSec != null);
  const avgDurationSec =
    withDuration.length > 0
      ? withDuration.reduce((s, v) => s + v.durationSec!, 0) /
        withDuration.length
      : null;

  const shortsCount = videos.filter(
    (v) => v.durationSec != null && v.durationSec <= 60,
  ).length;
  const longFormCount = videos.filter(
    (v) => v.durationSec != null && v.durationSec > 60,
  ).length;

  // Coefficient of variation for views
  let viewsCoeffOfVariation: number | null = null;
  if (count >= 3 && avgViews > 0) {
    const variance =
      videos.reduce((s, v) => s + (v.views - avgViews) ** 2, 0) / count;
    const stdDev = Math.sqrt(variance);
    viewsCoeffOfVariation = stdDev / avgViews;
  }

  // Average gap between uploads
  let uploadGapDays: number | null = null;
  const withDates = videos
    .filter((v) => v.publishedAt)
    .sort(
      (a, b) =>
        new Date(a.publishedAt!).getTime() -
        new Date(b.publishedAt!).getTime(),
    );
  if (withDates.length >= 2) {
    let totalGap = 0;
    for (let i = 1; i < withDates.length; i++) {
      totalGap +=
        (new Date(withDates[i].publishedAt!).getTime() -
          new Date(withDates[i - 1].publishedAt!).getTime()) /
        86_400_000;
    }
    uploadGapDays = totalGap / (withDates.length - 1);
  }

  return {
    count,
    avgViews,
    avgRetention,
    avgLikeRate,
    avgCommentsPer1k,
    avgSubsPer1k,
    avgDurationSec,
    shortsCount,
    longFormCount,
    viewsCoeffOfVariation,
    uploadGapDays,
  };
}
