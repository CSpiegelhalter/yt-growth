/**
 * Recommendation generation for channel audits.
 *
 * Contains:
 * - Action generation based on detected bottleneck
 * - Channel archetype classification
 * - LLM prompt construction for strategic recommendations
 *
 * Extracted from:
 * - app/api/me/channels/[channelId]/audit/route.ts (generateActions)
 * - app/api/me/channels/[channelId]/audit/recommendations/route.ts
 *   (CHANNEL_ARCHETYPES, getChannelLenses, buildPrompt)
 */

import { ChannelAuditError } from "../errors";
import type {
  AuditAction,
  AuditBottleneck,
  AuditTrafficSources,
  AuditTrends,
  ChannelArchetype,
  LlmRecommendationsResult,
  RecommendationsDeps,
  RecommendationsInput,
  RecommendationsMetrics,
} from "../types";

// ── Action Generation ───────────────────────────────────────

/**
 * Generate up to 3 tactical actions based on the detected bottleneck.
 * Each action includes category and effort level for prioritisation.
 */
export function generateActions(
  bottleneck: Pick<AuditBottleneck, "type">,
): AuditAction[] {
  const actions: AuditAction[] = [];

  switch (bottleneck.type) {
    case "CTR": {
      actions.push(
        {
          title: "Simplify your thumbnails",
          description:
            "Use 2-3 words max, high contrast, and one clear focal point. Test different styles.",
          category: "packaging",
          effort: "low",
        },
        {
          title: "Rewrite titles for clarity + curiosity",
          description:
            "Make sure title and thumbnail express the same promise from two angles.",
          category: "packaging",
          effort: "low",
        },
        {
          title: "A/B test your next 3 thumbnails",
          description:
            "Prepare 2 thumbnail options for each video and swap if CTR is below 4% after 24 hours.",
          category: "packaging",
          effort: "medium",
        },
      );
      break;
    }

    case "RETENTION": {
      actions.push(
        {
          title: "Strengthen your first 15 seconds",
          description:
            "Start with a hook that creates tension or promises specific value. Skip long intros.",
          category: "content",
          effort: "medium",
        },
        {
          title: "Add pattern interrupts every 30-45 seconds",
          description:
            "Change visuals, add b-roll, zoom in/out, or add text overlays to maintain attention.",
          category: "content",
          effort: "medium",
        },
        {
          title: "Use the YouTube trim tool on underperformers",
          description:
            "For videos with weak intros, trim the first 10-15 seconds to start where value begins.",
          category: "content",
          effort: "low",
        },
      );
      break;
    }

    case "DISTRIBUTION": {
      actions.push(
        {
          title: "Create topic clusters",
          description:
            "Make 3-5 videos on related topics to help YouTube understand what your channel is about.",
          category: "strategy",
          effort: "high",
        },
        {
          title: "Optimize for suggested traffic",
          description:
            "Reference popular videos in your niche and create content that naturally follows them.",
          category: "strategy",
          effort: "medium",
        },
        {
          title: "Improve early engagement signals",
          description:
            "Ask a question in the first minute to drive comments. Pin a comment to spark discussion.",
          category: "engagement",
          effort: "low",
        },
      );
      break;
    }

    case "CONVERSION": {
      actions.push(
        {
          title: "Add a clear subscribe CTA",
          description:
            "Verbally ask viewers to subscribe at a natural point (after delivering value, not at the start).",
          category: "engagement",
          effort: "low",
        },
        {
          title: "Optimize your end screens",
          description:
            "Link to your best-performing video and verbally pitch why they should watch it.",
          category: "engagement",
          effort: "low",
        },
        {
          title: "Clarify your channel promise",
          description:
            "Make sure viewers know what they'll get if they subscribe. Update your channel banner and about section.",
          category: "strategy",
          effort: "medium",
        },
      );
      break;
    }

    default: {
      actions.push(
        {
          title: "Experiment with a new format",
          description:
            "Try a different video length, style, or topic to discover what resonates most.",
          category: "strategy",
          effort: "medium",
        },
        {
          title: "Double down on top performers",
          description:
            "Look at your best videos and create follow-up content on similar topics.",
          category: "strategy",
          effort: "medium",
        },
        {
          title: "Engage more with comments",
          description:
            "Reply to comments in the first hour after upload to boost engagement signals.",
          category: "engagement",
          effort: "low",
        },
      );
    }
  }

  return actions.slice(0, 3);
}

// ── Channel Archetypes ──────────────────────────────────────

const CHANNEL_ARCHETYPES: ChannelArchetype[] = [
  // GROUP 1: DISTRIBUTION & TRAFFIC
  {
    id: "SEARCH_PRISON",
    logic: "Search > 50% + Browse < 20%",
    meaning:
      "The Help Desk. You are solving problems but not building a brand. You lack homepage 'pull'.",
  },
  {
    id: "ALGO_FAVORITE",
    logic: "Browse > 60% + Views Trend UP",
    meaning:
      "The Momentum Wave. The algorithm is actively testing your content on homepages. High pressure to maintain quality.",
  },
  {
    id: "SUGGESTED_LEECH",
    logic: "Suggested > 40% + High Watch Time",
    meaning:
      "The Parasite. You are successfully drafting off a larger creator's audience. Great for growth, risky for identity.",
  },
  {
    id: "EXTERNAL_DEPENDENT",
    logic: "External > 30% + Low Browse",
    meaning:
      "The Ghost Town. Your views come from Reddit/Discord, but YouTube's internal system isn't recommending you yet.",
  },

  // GROUP 2: LOYALTY & CHURN
  {
    id: "LEAKY_BUCKET",
    logic: "Net Subs < 0 or Subs Lost > 30% of Gained",
    meaning:
      "The Alienator. You are gaining views but losing core fans. Your new direction might be pushing people away.",
  },
  {
    id: "PASSERBY_CHANNEL",
    logic: "Views UP + Net Subs FLAT",
    meaning:
      "The Empty Show. People enjoy individual videos but see no reason to follow the journey or the creator.",
  },
  {
    id: "THE_CULT_LEADER",
    logic: "Views FLAT + Net Subs UP + High Retention",
    meaning:
      "The Niche Authority. You have a small, obsessed tribe. You need to broaden your topics to find more people like them.",
  },
  {
    id: "BRAND_BURN_OUT",
    logic: "Subs Lost UP + Retention DOWN",
    meaning:
      "The Fatigue Phase. Your audience is tired of the current format. The 'Novelty' has worn off.",
  },

  // GROUP 3: BINGE-ABILITY
  {
    id: "THE_DEAD_END",
    logic: "End Screen CTR < 1% + High Watch Time",
    meaning:
      "The One-Hit Wonder. Viewers watch to the end but then leave the platform. You aren't 'chaining' your videos into sessions.",
  },
  {
    id: "THE_BINGE_MASTER",
    logic: "End Screen CTR > 5% + Watch Time UP",
    meaning:
      "The Rabbit Hole. You are successfully keeping viewers on your channel for multiple videos. This is what the algorithm loves most.",
  },
  {
    id: "SHALLOW_HOOKS",
    logic: "Views UP + Avg Retention < 20%",
    meaning:
      "The High-Churn Shop. You are good at getting clicks but bad at keeping them. Your intro/content isn't matching the hype.",
  },

  // GROUP 4: TRENDS & MOMENTUM
  {
    id: "THE_RECOVERY",
    logic: "Trends turning UP after long FLAT period",
    meaning:
      "The Pivot Success. A recent change in strategy is finally being recognized by the algorithm.",
  },
  {
    id: "THE_SLOW_DEATH",
    logic: "Views FLAT + Watch Time DOWN + Subs DOWN",
    meaning:
      "The Relevancy Crisis. Your niche is shrinking or your style is becoming outdated.",
  },
  {
    id: "THE_VERTICAL_LIMIT",
    logic: "Views UP + Watch Time FLAT",
    meaning:
      "The Short-Form Trap. You're getting more views, but people are watching less total time. The 'value' is thinning out.",
  },

  // GROUP 5: SPECIFIC PERMUTATIONS
  {
    id: "UTILITY_OBLIVION",
    logic: "Search HIGH + End Screen LOW + Subs LOW",
    meaning:
      "The Tutorial Trap. You provide great answers but zero personality. You are a 'one-and-done' resource.",
  },
  {
    id: "VIRAL_AFTERSHOCK",
    logic: "Views DOWN + Subs UP",
    meaning:
      "The Residual Growth. A previous hit is still converting, but you haven't followed it up with something equally strong.",
  },
  {
    id: "CONTENT_MISMATCH",
    logic: "Browse HIGH + Retention LOW",
    meaning:
      "The Homepage Failure. YouTube is trying to help you, but the viewers who click are disappointed by the content.",
  },
  {
    id: "HIDDEN_GEMS",
    logic: "Retention HIGH + Trends DOWN",
    meaning:
      "The Distribution Bottleneck. The quality is there, but your current titles/thumbnails are invisible to the system.",
  },
  {
    id: "THE_WALL",
    logic: "Views FLAT + Watch Time UP + Subs FLAT",
    meaning:
      "The Deep Niche. You've reached everyone in your current sub-niche. You need to expand to an adjacent topic.",
  },
  {
    id: "DIVERSIFIED_STRENGTH",
    logic: "Browse/Search/Suggested all > 20%",
    meaning:
      "The Balanced Ecosystem. Your channel is healthy and safe. You aren't reliant on a single traffic source.",
  },
  {
    id: "BROAD_APPEAL_STRUGGLE",
    logic: "External LOW + Browse LOW + Search HIGH",
    meaning:
      "The SEO Shackles. You are stuck in a 'search-only' box. Your content needs more 'clickable' curiosity.",
  },
  {
    id: "AUDIENCE_FATIGUE",
    logic: "Views DOWN + Subs Lost UP",
    meaning:
      "The Identity Crisis. You are likely repeating yourself too much, causing fans to unsubscribe out of boredom.",
  },
  {
    id: "THE_CLIMBER",
    logic: "Watch Time Trend > Views Trend",
    meaning:
      "The Quality Gain. People are watching LONGER even if view counts aren't exploding yet. Success is coming.",
  },
  {
    id: "THE_DIVE",
    logic: "Watch Time Trend < Views Trend",
    meaning:
      "The Pacing Crisis. People are clicking more but leaving faster. Your content is losing its 'stickiness'.",
  },
  {
    id: "THE_CONVERTER",
    logic: "Subs Gained > 5% of Views",
    meaning:
      "The High-Value Channel. Your 'pitch' or brand is incredibly strong. You just need more traffic.",
  },
  {
    id: "THE_SKEPTIC_AUDIENCE",
    logic: "Subs Gained < 0.1% of Views",
    meaning:
      "The Trust Gap. Viewers watch your content but don't feel a 'connection' to you or the brand.",
  },
  {
    id: "THE_REVIVAL",
    logic: "Net Subs UP + Trends UP after Down",
    meaning:
      "The Second Wind. You have successfully navigated a pivot or a comeback.",
  },
  {
    id: "SEARCH_SUCCESS_STORY",
    logic: "Search Traffic UP + Subs Gained UP",
    meaning:
      "The Intent Winner. People find you for answers and stay for your personality. The rarest win.",
  },
  {
    id: "THE_INFLUENCER_START",
    logic: "External HIGH + Subs Gained HIGH",
    meaning:
      "The Social Bridge. You are successfully migrating an audience from another platform (Twitter/TikTok).",
  },
  {
    id: "THE_GHOST_CHANNEL",
    logic: "All Metrics < 10% change + Flat trends",
    meaning:
      "The Stagnation Plateau. The channel is on autopilot. It needs a 'pattern interrupt' to restart growth.",
  },
];

// ── Channel Lens Classification ─────────────────────────────

type LensContext = {
  searchPct: number;
  browsePct: number;
  suggestedPct: number;
  externalPct: number;
  endScreenCtr: number;
  avgRetention: number;
  subChurn: number;
  subConversionRate: number;
  metrics: RecommendationsMetrics;
  trends: AuditTrends;
};

type ArchetypeMatcher = {
  id: string;
  match: (ctx: LensContext) => boolean;
};

function findArchetype(id: string): ChannelArchetype | undefined {
  return CHANNEL_ARCHETYPES.find((a) => a.id === id);
}

const ARCHETYPE_MATCHERS: ArchetypeMatcher[] = [
  // GROUP 1: DISTRIBUTION & TRAFFIC
  { id: "SEARCH_PRISON", match: (c) => c.searchPct > 50 && c.browsePct < 20 },
  { id: "ALGO_FAVORITE", match: (c) => c.browsePct > 60 && c.trends.views.direction === "up" },
  { id: "SUGGESTED_LEECH", match: (c) => c.suggestedPct > 40 && c.metrics.totalWatchTimeMin > 0 },
  { id: "EXTERNAL_DEPENDENT", match: (c) => c.externalPct > 30 && c.browsePct < 20 },

  // GROUP 2: LOYALTY & CHURN
  { id: "LEAKY_BUCKET", match: (c) => c.metrics.netSubscribers < 0 || c.subChurn > 0.3 },
  { id: "PASSERBY_CHANNEL", match: (c) => c.trends.views.direction === "up" && Math.abs(c.metrics.netSubscribers) < c.metrics.totalViews * 0.001 },
  { id: "THE_CULT_LEADER", match: (c) => c.trends.views.direction === "flat" && c.metrics.netSubscribers > 0 && c.avgRetention > 50 },
  { id: "BRAND_BURN_OUT", match: (c) => c.trends.subscribers.direction === "down" && c.trends.watchTime.direction === "down" },

  // GROUP 3: BINGE-ABILITY
  { id: "THE_DEAD_END", match: (c) => c.endScreenCtr < 1 && c.avgRetention > 30 },
  { id: "THE_BINGE_MASTER", match: (c) => c.endScreenCtr > 5 && c.trends.watchTime.direction === "up" },
  { id: "SHALLOW_HOOKS", match: (c) => c.trends.views.direction === "up" && c.avgRetention < 20 },

  // GROUP 4: TRENDS & MOMENTUM
  { id: "THE_RECOVERY", match: (c) => c.trends.views.direction === "up" && c.trends.watchTime.direction === "up" && c.trends.subscribers.direction === "up" },
  { id: "THE_SLOW_DEATH", match: (c) => c.trends.views.direction === "flat" && c.trends.watchTime.direction === "down" && c.trends.subscribers.direction === "down" },
  { id: "THE_VERTICAL_LIMIT", match: (c) => c.trends.views.direction === "up" && c.trends.watchTime.direction === "flat" },

  // GROUP 5: SPECIFIC PERMUTATIONS
  { id: "UTILITY_OBLIVION", match: (c) => c.searchPct > 40 && c.endScreenCtr < 2 && c.subConversionRate < 0.5 },
  { id: "VIRAL_AFTERSHOCK", match: (c) => c.trends.views.direction === "down" && c.trends.subscribers.direction === "up" },
  { id: "CONTENT_MISMATCH", match: (c) => c.browsePct > 40 && c.avgRetention < 30 },
  { id: "HIDDEN_GEMS", match: (c) => c.avgRetention > 60 && c.trends.views.direction === "down" },
  { id: "THE_WALL", match: (c) => c.trends.views.direction === "flat" && c.trends.watchTime.direction === "up" && c.trends.subscribers.direction === "flat" },
  { id: "DIVERSIFIED_STRENGTH", match: (c) => c.browsePct > 20 && c.searchPct > 20 && c.suggestedPct > 20 },
  { id: "BROAD_APPEAL_STRUGGLE", match: (c) => c.externalPct < 10 && c.browsePct < 20 && c.searchPct > 40 },
  { id: "AUDIENCE_FATIGUE", match: (c) => c.trends.views.direction === "down" && c.trends.subscribers.direction === "down" },
  { id: "THE_CLIMBER", match: (c) => (c.trends.watchTime.value ?? 0) > (c.trends.views.value ?? 0) && c.trends.watchTime.direction === "up" },
  { id: "THE_DIVE", match: (c) => (c.trends.watchTime.value ?? 0) < (c.trends.views.value ?? 0) && c.trends.views.direction === "up" },
  { id: "THE_CONVERTER", match: (c) => c.subConversionRate > 5 },
  { id: "THE_SKEPTIC_AUDIENCE", match: (c) => c.subConversionRate < 0.1 },
  { id: "THE_REVIVAL", match: (c) => c.metrics.netSubscribers > 0 && c.trends.views.direction === "up" && c.trends.subscribers.direction === "up" },
  { id: "SEARCH_SUCCESS_STORY", match: (c) => c.searchPct > 30 && c.metrics.subscribersGained > c.metrics.totalViews * 0.01 },
  { id: "THE_INFLUENCER_START", match: (c) => c.externalPct > 40 && c.metrics.subscribersGained > c.metrics.totalViews * 0.02 },
  { id: "THE_GHOST_CHANNEL", match: (c) => Math.abs(c.trends.views.value ?? 0) < 10 && Math.abs(c.trends.watchTime.value ?? 0) < 10 && Math.abs(c.trends.subscribers.value ?? 0) < 10 },
];

function buildLensContext(
  metrics: RecommendationsMetrics,
  traffic: NonNullable<AuditTrafficSources>,
  trends: AuditTrends,
): LensContext {
  return {
    searchPct: traffic.search?.percentage ?? 0,
    browsePct: traffic.browse?.percentage ?? 0,
    suggestedPct: traffic.suggested?.percentage ?? 0,
    externalPct: traffic.external?.percentage ?? 0,
    endScreenCtr: metrics.endScreenCtr ?? 0,
    avgRetention: metrics.avgViewPercentage ?? 0,
    subChurn: metrics.subscribersGained > 0
      ? metrics.subscribersLost / metrics.subscribersGained
      : 0,
    subConversionRate: metrics.totalViews > 0
      ? (metrics.subscribersGained / metrics.totalViews) * 100
      : 0,
    metrics,
    trends,
  };
}

/**
 * Classify the channel into one or more strategic archetypes
 * based on metrics, traffic distribution, and trend direction.
 * Returns a human-readable lens string for LLM context.
 */
function getChannelLenses(
  metrics: RecommendationsMetrics | null,
  traffic: AuditTrafficSources,
  trends: AuditTrends,
): string {
  if (!metrics || !traffic) {return "";}

  const ctx = buildLensContext(metrics, traffic, trends);

  const matched = ARCHETYPE_MATCHERS
    .filter((m) => m.match(ctx))
    .map((m) => findArchetype(m.id))
    .filter((a): a is ChannelArchetype => a !== undefined);

  if (matched.length === 0) {
    return "No specific archetypes detected. Channel shows mixed signals.";
  }

  return matched
    .map((l) => `[${l.logic}] - Meaning: ${l.meaning}`)
    .join("\n");
}

// ── LLM Prompt Construction ─────────────────────────────────

/**
 * Build the user-message prompt for LLM-powered recommendations.
 * Includes channel metrics snapshot and a diagnosis task.
 */
function buildRecommendationsPrompt(
  metrics: RecommendationsMetrics | null,
  trafficSources: AuditTrafficSources,
  trends: AuditTrends,
): string {
  if (!metrics) {return "";}

  const subChurnRatio = (
    (metrics.subscribersLost / metrics.subscribersGained) *
    100
  ).toFixed(1);
  const entries = Object.entries(trafficSources || {});
  const primarySource =
    entries.length > 0
      ? entries.reduce((a, b) =>
          (a[1]?.percentage ?? 0) > (b[1]?.percentage ?? 0) ? a : b,
        )[0]
      : "Unknown";

  let prompt = `
--- CHANNEL PERFORMANCE SNAPSHOT ---
VIEWS: ${metrics.totalViews.toLocaleString()} (${trends.views.direction} ${trends.views.value}%)
WATCH TIME: ${Math.round(metrics.totalWatchTimeMin / 60)}h (${trends.watchTime.direction} ${trends.watchTime.value}%)
RETENTION AVG: ${metrics.avgViewPercentage}%
END SCREEN CTR: ${metrics.endScreenCtr}%

--- GROWTH & LOYALTY ---
NET SUBS: ${metrics.netSubscribers} (${trends.subscribers.direction} ${trends.subscribers.value}%)
SUB CHURN: ${subChurnRatio}% (Lost vs Gained)`;

  if (trafficSources) {
    prompt += `
TRAFFIC SOURCES:
- Browse/Home: ${trafficSources.browse?.percentage ?? 0}%
- Suggested: ${trafficSources.suggested?.percentage ?? 0}%
- Search: ${trafficSources.search?.percentage ?? 0}%
- External: ${trafficSources.external?.percentage ?? 0}%
`;
  }

  prompt += `
DIAGNOSIS TASK:
Analyze the relationship between the ${primarySource} traffic and the ${subChurnRatio}% churn. Does the End Screen CTR of ${metrics.endScreenCtr}% suggest a failure to 'binge' viewers? Give me a high-level strategic roadmap.
`;

  return prompt;
}

// ── LLM-Powered Recommendations ─────────────────────────────

const RECOMMENDATIONS_SYSTEM_PROMPT = `
You are a YouTube Chief Content Officer analyzing this creator's channel performance. 

--- STRATEGIC LENSES (Use these to shape your analysis) ---
{{LENSES}}

--- GUIDELINES ---
1. DO NOT mention the names of the archetypes (e.g., don't say 'You are a Leaky Bucket').
2. NARRATIVE FIRST: Use the logic from the lenses to explain WHY the trends are moving.
3. BEYOND THE NUMBERS: If views are UP but net subscribers are FLAT, explain the 'Value Gap' (people like the videos but don't care about the creator).
4. ACTIONABLE TRUTH: Provide 3 strategic 'Pillars' for the next 28 days. Every action must be tied to a 'Why' from the data.
5. BE DIRECT: No fluff, no generic praise. Just truth and tactics.

--- FORMAT: RETURN ONLY VALID JSON (NO MARKDOWN, NO EXTRA TEXT) ---
{
  "channel_summary": "A 2-sentence direct assessment of what's actually happening with this channel's momentum and why.",
  "analysis_pillars": [
    {
      "title": "DISTRIBUTION",
      "what_is_happening": "Causal explanation of the current data.",
      "the_fix": "Specific tactical advice.",
      "psychology": "What the viewer is feeling that causes this data point."
    },
    {
      "title": "RETENTION",
      "what_is_happening": "Causal explanation of the current data.",
      "the_fix": "Specific tactical advice.",
      "psychology": "What the viewer is feeling that causes this data point."
    },
    {
      "title": "CONVERSION",
      "what_is_happening": "Causal explanation of the current data.",
      "the_fix": "Specific tactical advice.",
      "psychology": "What the viewer is feeling that causes this data point."
    }
  ],
  "next_move": "One final, direct piece of advice for what the creator should focus on immediately."
}

CRITICAL: Return ONLY the JSON object. No markdown code blocks, no explanations, no extra text.
`;

/**
 * Generate strategic recommendations via LLM analysis.
 * Returns parsed JSON recommendations or throws on failure.
 */
export async function generateLlmRecommendations(
  input: RecommendationsInput,
  deps: RecommendationsDeps,
): Promise<LlmRecommendationsResult> {
  const { metrics, trafficSources, trends } = input;

  if (!metrics) {
    return { recommendations: [] };
  }

  const prompt = buildRecommendationsPrompt(metrics, trafficSources, trends);
  const selectedLenses = getChannelLenses(metrics, trafficSources, trends);
  const systemPrompt = RECOMMENDATIONS_SYSTEM_PROMPT.replace(
    "{{LENSES}}",
    selectedLenses,
  );

  const result = await deps.callLlm(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    { maxTokens: 800, temperature: 0.6 },
  );

  const parsed = parseRecommendationsJson(result.content);
  if (!parsed) {
    throw new ChannelAuditError(
      "EXTERNAL_FAILURE",
      "Failed to generate recommendations - invalid LLM response",
    );
  }

  return { recommendations: parsed };
}

/**
 * Extract and parse JSON from an LLM response that may contain
 * markdown code fences or trailing text.
 */
function parseRecommendationsJson(content: string): unknown | null {
  try {
    const codeBlockMatch = content.match(
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
    );
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];
      jsonStr = jsonStr.replaceAll(/,(\s*[}\]])/g, "$1");

      let braceCount = 0;
      let lastValidIndex = -1;
      for (const [i, element] of [...jsonStr].entries()) {
        if (element === "{") {braceCount++;}
        if (element === "}") {
          braceCount--;
          if (braceCount === 0) {
            lastValidIndex = i;
            break;
          }
        }
      }

      if (lastValidIndex > 0) {
        jsonStr = jsonStr.slice(0, Math.max(0, lastValidIndex + 1));
      }

      return JSON.parse(jsonStr);
    }
  } catch {
    return null;
  }

  return null;
}
