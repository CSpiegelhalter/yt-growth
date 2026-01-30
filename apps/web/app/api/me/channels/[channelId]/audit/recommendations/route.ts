/**
 * LLM-powered channel recommendations
 *
 * Analyzes channel metrics and provides strategic recommendations
 * from a YouTube growth strategist perspective.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { callLLM } from "@/lib/llm";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  metrics: z
    .object({
      totalViews: z.number(),
      totalWatchTimeMin: z.number(),
      avgViewPercentage: z.number().nullable(),
      subscribersGained: z.number(),
      subscribersLost: z.number(),
      netSubscribers: z.number(),
      endScreenCtr: z.number().nullable(),
    })
    .nullable(),
  trafficSources: z
    .object({
      browse: z
        .object({ views: z.number(), percentage: z.number() })
        .nullable(),
      suggested: z
        .object({ views: z.number(), percentage: z.number() })
        .nullable(),
      search: z
        .object({ views: z.number(), percentage: z.number() })
        .nullable(),
      external: z
        .object({ views: z.number(), percentage: z.number() })
        .nullable(),
      other: z.object({ views: z.number(), percentage: z.number() }).nullable(),
    })
    .nullable(),
  trends: z.object({
    views: z.object({
      value: z.number().nullable(),
      direction: z.enum(["up", "down", "flat"]),
    }),
    watchTime: z.object({
      value: z.number().nullable(),
      direction: z.enum(["up", "down", "flat"]),
    }),
    subscribers: z.object({
      value: z.number().nullable(),
      direction: z.enum(["up", "down", "flat"]),
    }),
  }),
});

export const CHANNEL_ARCHETYPES = [
  // GROUP 1: DISTRIBUTION & TRAFFIC (Where views come from)
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

  // GROUP 2: LOYALTY & CHURN (Who stays)
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

  // GROUP 3: BINGE-ABILITY (The "Chain" effect)
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

  // GROUP 4: TRENDS & MOMENTUM (The direction)
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

  // GROUP 5: SPECIFIC PERMUTATIONS (Deep Logic)
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

function getChannelLenses(
  metrics: z.infer<typeof BodySchema>["metrics"],
  traffic: z.infer<typeof BodySchema>["trafficSources"],
  trends: z.infer<typeof BodySchema>["trends"],
): string {
  if (!metrics || !traffic) return "";

  const subChurn =
    metrics.subscribersGained > 0
      ? metrics.subscribersLost / metrics.subscribersGained
      : 0;
  const searchPct = traffic.search?.percentage ?? 0;
  const browsePct = traffic.browse?.percentage ?? 0;
  const suggestedPct = traffic.suggested?.percentage ?? 0;
  const externalPct = traffic.external?.percentage ?? 0;
  const endScreenCtr = metrics.endScreenCtr ?? 0;
  const avgRetention = metrics.avgViewPercentage ?? 0;
  const subConversionRate =
    metrics.totalViews > 0
      ? (metrics.subscribersGained / metrics.totalViews) * 100
      : 0;

  const lenses = [];

  // GROUP 1: DISTRIBUTION & TRAFFIC
  if (searchPct > 50 && browsePct < 20)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "SEARCH_PRISON"));
  if (browsePct > 60 && trends.views.direction === "up")
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "ALGO_FAVORITE"));
  if (suggestedPct > 40 && metrics.totalWatchTimeMin > 0)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "SUGGESTED_LEECH"));
  if (externalPct > 30 && browsePct < 20)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "EXTERNAL_DEPENDENT"));

  // GROUP 2: LOYALTY & CHURN
  if (metrics.netSubscribers < 0 || subChurn > 0.3)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "LEAKY_BUCKET"));
  if (
    trends.views.direction === "up" &&
    Math.abs(metrics.netSubscribers) < metrics.totalViews * 0.001
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "PASSERBY_CHANNEL"));
  if (
    trends.views.direction === "flat" &&
    metrics.netSubscribers > 0 &&
    avgRetention > 50
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_CULT_LEADER"));
  if (
    trends.subscribers.direction === "down" &&
    trends.watchTime.direction === "down"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "BRAND_BURN_OUT"));

  // GROUP 3: BINGE-ABILITY
  if (endScreenCtr < 1 && avgRetention > 30)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_DEAD_END"));
  if (endScreenCtr > 5 && trends.watchTime.direction === "up")
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_BINGE_MASTER"));
  if (trends.views.direction === "up" && avgRetention < 20)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "SHALLOW_HOOKS"));

  // GROUP 4: TRENDS & MOMENTUM
  if (
    trends.views.direction === "up" &&
    trends.watchTime.direction === "up" &&
    trends.subscribers.direction === "up"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_RECOVERY"));
  if (
    trends.views.direction === "flat" &&
    trends.watchTime.direction === "down" &&
    trends.subscribers.direction === "down"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_SLOW_DEATH"));
  if (trends.views.direction === "up" && trends.watchTime.direction === "flat")
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_VERTICAL_LIMIT"));

  // GROUP 5: SPECIFIC PERMUTATIONS
  if (searchPct > 40 && endScreenCtr < 2 && subConversionRate < 0.5)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "UTILITY_OBLIVION"));
  if (
    trends.views.direction === "down" &&
    trends.subscribers.direction === "up"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "VIRAL_AFTERSHOCK"));
  if (browsePct > 40 && avgRetention < 30)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "CONTENT_MISMATCH"));
  if (avgRetention > 60 && trends.views.direction === "down")
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "HIDDEN_GEMS"));
  if (
    trends.views.direction === "flat" &&
    trends.watchTime.direction === "up" &&
    trends.subscribers.direction === "flat"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_WALL"));
  if (browsePct > 20 && searchPct > 20 && suggestedPct > 20)
    lenses.push(
      CHANNEL_ARCHETYPES.find((a) => a.id === "DIVERSIFIED_STRENGTH"),
    );
  if (externalPct < 10 && browsePct < 20 && searchPct > 40)
    lenses.push(
      CHANNEL_ARCHETYPES.find((a) => a.id === "BROAD_APPEAL_STRUGGLE"),
    );
  if (
    trends.views.direction === "down" &&
    trends.subscribers.direction === "down"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "AUDIENCE_FATIGUE"));
  if (
    (trends.watchTime.value ?? 0) > (trends.views.value ?? 0) &&
    trends.watchTime.direction === "up"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_CLIMBER"));
  if (
    (trends.watchTime.value ?? 0) < (trends.views.value ?? 0) &&
    trends.views.direction === "up"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_DIVE"));
  if (subConversionRate > 5)
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_CONVERTER"));
  if (subConversionRate < 0.1)
    lenses.push(
      CHANNEL_ARCHETYPES.find((a) => a.id === "THE_SKEPTIC_AUDIENCE"),
    );
  if (
    metrics.netSubscribers > 0 &&
    trends.views.direction === "up" &&
    trends.subscribers.direction === "up"
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_REVIVAL"));
  if (searchPct > 30 && metrics.subscribersGained > metrics.totalViews * 0.01)
    lenses.push(
      CHANNEL_ARCHETYPES.find((a) => a.id === "SEARCH_SUCCESS_STORY"),
    );
  if (externalPct > 40 && metrics.subscribersGained > metrics.totalViews * 0.02)
    lenses.push(
      CHANNEL_ARCHETYPES.find((a) => a.id === "THE_INFLUENCER_START"),
    );
  if (
    Math.abs(trends.views.value ?? 0) < 10 &&
    Math.abs(trends.watchTime.value ?? 0) < 10 &&
    Math.abs(trends.subscribers.value ?? 0) < 10
  )
    lenses.push(CHANNEL_ARCHETYPES.find((a) => a.id === "THE_GHOST_CHANNEL"));

  // Filter out undefined values and format
  const validLenses = lenses.filter((l) => l !== undefined);

  if (validLenses.length === 0) {
    return "No specific archetypes detected. Channel shows mixed signals.";
  }

  return validLenses
    .map((l) => `[${l!.logic}] - Meaning: ${l!.meaning}`)
    .join("\n");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;

    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify channel ownership
    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Parse body
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { metrics, trafficSources, trends } = parsed.data;

    if (!metrics) {
      return NextResponse.json({ recommendations: [] });
    }

    // Build prompt for LLM
    const prompt = buildPrompt(metrics, trafficSources, trends);
    const selectedLenses = getChannelLenses(metrics, trafficSources, trends);

    const systemPrompt = `
You are a YouTube Chief Content Officer analyzing this creator's channel performance. 

--- STRATEGIC LENSES (Use these to shape your analysis) ---
${selectedLenses}

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

    console.log("[Recommendations] Starting analysis for channel:", channelId);
    console.log("[Recommendations] Metrics:", JSON.stringify(metrics, null, 2));
    console.log(
      "[Recommendations] Traffic sources:",
      JSON.stringify(trafficSources, null, 2),
    );
    console.log("[Recommendations] Trends:", JSON.stringify(trends, null, 2));

    try {
      // Use LLM to generate recommendations
      console.log("[Recommendations] Calling LLM...");
      const result = await callLLM(
        [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        { maxTokens: 800, temperature: 0.6 },
      );
      console.log(
        "[Recommendations] LLM response received, length:",
        result.content.length,
      );
      console.log("[Recommendations] Raw LLM response:", result.content);

      // Try to extract and parse JSON from response
      try {
        console.log("[Recommendations] Attempting to parse JSON...");

        // First, try to find JSON in code blocks (```json ... ```)
        const codeBlockMatch = result.content.match(
          /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
        );
        if (codeBlockMatch) {
          console.log("[Recommendations] Found JSON in code block");
          const recommendations = JSON.parse(codeBlockMatch[1]);
          console.log(
            "[Recommendations] Successfully parsed recommendations from code block",
          );
          return NextResponse.json({ recommendations });
        }

        // Second, try to find raw JSON object
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log("[Recommendations] Found raw JSON, cleaning...");
          // Clean up common JSON issues
          let jsonStr = jsonMatch[0];

          // Remove trailing commas before closing braces/brackets
          jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");

          // Try to find the last complete closing brace
          let braceCount = 0;
          let lastValidIndex = -1;
          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === "{") braceCount++;
            if (jsonStr[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                lastValidIndex = i;
                break;
              }
            }
          }

          if (lastValidIndex > 0) {
            jsonStr = jsonStr.substring(0, lastValidIndex + 1);
          }

          console.log("[Recommendations] Cleaned JSON length:", jsonStr.length);
          const recommendations = JSON.parse(jsonStr);
          console.log("[Recommendations] Successfully parsed recommendations");
          return NextResponse.json({ recommendations });
        }

        console.error("[Recommendations] No JSON pattern found in response");
      } catch (parseError) {
        console.error("[Recommendations] JSON parse error:", parseError);
        console.error("[Recommendations] Parse error details:", {
          message: (parseError as Error).message,
          stack: (parseError as Error).stack,
        });
        throw parseError;
      }

      // If we get here, no valid JSON was found
      console.error("[Recommendations] No valid JSON found in LLM response");
      return NextResponse.json(
        { error: "Failed to generate recommendations - invalid LLM response" },
        { status: 500 },
      );
    } catch (llmError: any) {
      console.error("[Recommendations] LLM error:", llmError);
      console.error("[Recommendations] Error details:", {
        message: llmError.message,
        stack: llmError.stack,
        name: llmError.name,
      });
      return NextResponse.json(
        { error: llmError.message || "Failed to generate recommendations" },
        { status: 500 },
      );
    }
  } catch (err: any) {
    console.error("[Recommendations] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}

function buildPrompt(
  metrics: z.infer<typeof BodySchema>["metrics"],
  trafficSources: z.infer<typeof BodySchema>["trafficSources"],
  trends: z.infer<typeof BodySchema>["trends"],
): string {
  if (!metrics) return "";

  // Pre-calculate ratios for the LLM
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
