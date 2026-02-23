/**
 * Generate Summary Use-Case
 *
 * Produces an AI-powered core analysis of a video's performance,
 * combining metrics, competitive context, and viewer journey insights.
 */

import { VideoInsightError } from "../errors";
import type { CoreAnalysis, LlmCallFn } from "../types";

// ── Input Types ─────────────────────────────────────────────

type VideoData = {
  title: string;
  description?: string;
  tags: string[];
  durationSec: number;
};

type DerivedData = {
  totalViews: number;
  viewsPerDay: number;
  avdRatio: number | null;
  engagementPerView: number | null;
  subsPer1k: number | null;
  daysInRange: number;
  impressionsCtr?: number | null;
  trafficSources?: { search?: number; total?: number } | null;
};

type ComparisonData = {
  viewsPerDay: { vsBaseline: string; delta?: number | null };
  avgViewPercentage: { vsBaseline: string; delta?: number | null };
  engagementPerView: { vsBaseline: string; delta?: number | null };
  subsPer1k: { vsBaseline: string; delta?: number | null };
};

type BottleneckData = {
  bottleneck: string;
  evidence: string;
  severity?: string;
} | null;

type SubscriberBreakdownData = {
  subscriberViewPct?: number | null;
  subscribers?: { avgViewPct?: number | null; ctr?: number | null } | null;
  nonSubscribers?: { avgViewPct?: number | null } | null;
} | null;

type GeoBreakdownData = {
  topCountries?: Array<{
    countryName: string;
    viewsPct: number;
    avgViewPct: number | null;
  }>;
  primaryMarket?: string | null;
} | null;

type TrafficDetailData = {
  searchTerms?: Array<{ term: string; views: number }> | null;
  suggestedVideos?: Array<{ videoId: string; views: number }> | null;
  browseFeatures?: Array<{ feature: string; views: number }> | null;
} | null;

type DemographicData = {
  hasData?: boolean;
  byAge: Array<{ ageGroup: string; viewsPct: number }>;
  byGender: Array<{ gender: string; viewsPct: number }>;
} | null;

export type CompetitiveContextData = {
  searchRankings?: Array<{
    term: string;
    position: number | null;
    expectedCtr: number;
    actualCtr: number;
  }> | null;
  topicTrends?: { trend: string; recentInterest: number } | null;
  similarVideos?: Array<{ videoId: string }> | null;
} | null;

type GenerateSummaryInput = {
  video: VideoData;
  derived: DerivedData;
  comparison: ComparisonData;
  bottleneck: BottleneckData;
  subscriberBreakdown?: SubscriberBreakdownData;
  geoBreakdown?: GeoBreakdownData;
  trafficDetail?: TrafficDetailData;
  demographicBreakdown?: DemographicData;
  competitiveContext?: CompetitiveContextData;
};

// ── Archetype Library ───────────────────────────────────────

const ARCHETYPE_LIBRARY = [
  { id: "PACKAGING_CRISIS", label: "The Packaging Crisis", logic: "High Rank + Low CTR + Rising Trend", conditions: { rank: "HIGH", ctr: "LOW", trend: "HIGH" } },
  { id: "ALGORITHM_GHOST", label: "The Algorithm Ghost", logic: "High CTR + High Retention + Low Impressions", conditions: { ctr: "HIGH", retention: "HIGH", impressions: "LOW" } },
  { id: "SEARCH_SABOTAGE", label: "The Search Sabotage", logic: "High Search Rank + Low CTR", conditions: { rank: "HIGH", ctr: "LOW" } },
  { id: "RISING_TIDE", label: "The Rising Tide", logic: "Low Rank + Low Views + Rising Trend", conditions: { rank: "LOW", trend: "HIGH" } },
  { id: "SEO_LONG_GAME", label: "The SEO Long-Game", logic: "Low CTR + High Search Traffic + Long Duration", conditions: { ctr: "LOW", trafficSource: "SEARCH", isLongForm: true } },
  { id: "CLICKBAIT_GAP", label: "The Clickbait Gap", logic: "High CTR + Low Retention + High Browse", conditions: { ctr: "HIGH", retention: "LOW", trafficSource: "BROWSE" } },
  { id: "DEAD_ZONE", label: "The Dead Zone", logic: "Low CTR + Low Rank + Falling Trend", conditions: { ctr: "LOW", rank: "LOW", trend: "LOW" } },
  { id: "INVISIBLE_AUTHORITY", label: "The Invisible Authority", logic: "High Search Rank + High Retention + Low CTR", conditions: { rank: "HIGH", retention: "HIGH", ctr: "LOW" } },
  { id: "ECHO_CHAMBER", label: "The Echo Chamber", logic: "High Sub % + High Sub-Retention + Low Non-Sub Views", conditions: { subViewsPct: "HIGH", subRetention: "HIGH", nonSubViews: "LOW" } },
  { id: "SUB_REJECTION", label: "The Subscriber Rejection", logic: "High Sub-Impressions + Low Sub-CTR", conditions: { subImpressions: "HIGH", subCtr: "LOW" } },
  { id: "BREAKOUT_DISCOVERY", label: "The Breakout Discovery", logic: "Low Sub % + High Non-Sub Retention", conditions: { subViewsPct: "LOW", nonSubRetention: "HIGH" } },
  { id: "INSIDE_JOKE", label: "The Inside Joke", logic: "High Sub-Retention + Low Non-Sub Retention", conditions: { subRetention: "HIGH", nonSubRetention: "LOW" } },
  { id: "IDENTITY_CRISIS", label: "The Identity Crisis", logic: "Low Sub-Retention + Low Non-Sub Retention", conditions: { subRetention: "LOW", nonSubRetention: "LOW" } },
  { id: "BRIDGE_CONTENT", label: "The Bridge Content", logic: "Balanced Sub/Non-Sub + High Retention", conditions: { subViewsPct: "MED", retention: "HIGH" } },
  { id: "PERSONALITY_MAGNET", label: "The Personality Magnet", logic: "Low CTR + High Retention Across All", conditions: { ctr: "LOW", retention: "HIGH" } },
  { id: "COMMUNITY_PILLAR", label: "The Community Pillar", logic: "High Sub-Retention + High Engagement + Low Views", conditions: { subRetention: "HIGH", engagement: "HIGH", views: "LOW" } },
  { id: "WATCH_TIME_KING", label: "The Watch-Time King", logic: "Long Duration + Low % Viewed + High Raw Minutes", conditions: { isLongForm: true, retention: "LOW" } },
  { id: "TOURIST_TRAP", label: "The Tourist Trap", logic: "High Non-Sub Views + Low Non-Sub Retention", conditions: { nonSubViews: "HIGH", nonSubRetention: "LOW" } },
  { id: "UTILITY_HIT", label: "The Utility Hit", logic: "High Search + Low % Viewed + 0 Subs", conditions: { trafficSource: "SEARCH", retention: "LOW", subConversion: "NONE" } },
  { id: "PACING_TRAP", label: "The Pacing Trap", logic: "Steady Retention + Sharp Mid-Video Drop", conditions: { retention: "MED", hookRetention: "HIGH" } },
  { id: "FALSE_START", label: "The False Start", logic: "Low Intro Retention + High Mid-Video Retention", conditions: { hookRetention: "LOW", retention: "HIGH" } },
  { id: "ENGAGEMENT_MIRAGE", label: "The Engagement Mirage", logic: "High Engagement + Low Total Retention", conditions: { engagement: "HIGH", retention: "LOW" } },
  { id: "VALUE_DEAD_END", label: "The Value Dead-End", logic: "High Retention + 0 Subs/1k Views", conditions: { retention: "HIGH", subConversion: "NONE" } },
  { id: "SLOW_BURN_SUCCESS", label: "The Slow-Burn Success", logic: "Low Initial Retention + Rising End Retention", conditions: { hookRetention: "LOW", retention: "MED" } },
  { id: "LOCALIZED_STAR", label: "The Localized Star", logic: "80%+ Views from 1 Country + High Retention There", conditions: { geoSkew: "HIGH", geoRetention: "HIGH" } },
  { id: "DEMO_SHIFT", label: "The Demographic Shift", logic: "Age/Gender Skew != Channel Avg + High Retention", conditions: { demoSkew: "HIGH", retention: "HIGH" } },
  { id: "LANGUAGE_BARRIER", label: "The Language Barrier", logic: "High Views + Low Retention in Non-Primary Markets", conditions: { geoSkew: "LOW", geoRetention: "LOW" } },
  { id: "CULTURAL_MISMATCH", label: "The Cultural Mismatch", logic: "High Impressions in Secondary Market + Low CTR", conditions: { geoImpressions: "HIGH", ctr: "LOW" } },
  { id: "GEN_Z_PIVOT", label: "The Gen-Z/Alpha Pivot", logic: "Younger Demo Skew + High Engagement", conditions: { demoAge: "YOUNG", engagement: "HIGH" } },
  { id: "LEGACY_APPEAL", label: "The Legacy Appeal", logic: "Older Demo Skew + High AVD", conditions: { demoAge: "OLD", retention: "HIGH" } },
  { id: "BROAD_SHALLOW_HIT", label: "The Broad but Shallow Hit", logic: "High Views + Low Subs/1k + High Retention", conditions: { views: "HIGH", subConversion: "LOW", retention: "HIGH" } },
  { id: "GROWTH_ENGINE", label: "The Growth Engine", logic: "High Subs/1k + High Retention + Low Views", conditions: { subConversion: "HIGH", retention: "HIGH", views: "LOW" } },
  { id: "COMPETITIVE_UNDERDOG", label: "The Competitive Underdog", logic: "High Rank + Lower CTR than Expected", conditions: { rank: "HIGH", ctr: "LOW" } },
  { id: "TOPIC_PIONEER", label: "The Topic Pioneer", logic: "No Rankings + High Browse + High Trend", conditions: { rank: "NONE", trafficSource: "BROWSE", trend: "HIGH" } },
  { id: "EFFICIENCY_EXPERT", label: "The Efficiency Expert", logic: "Short Duration + High Retention + High Subs/1k", conditions: { isLongForm: false, retention: "HIGH", subConversion: "HIGH" } },
  { id: "HIGH_EFFORT_FLOP", label: "The High-Effort Flop", logic: "High Duration + Low Retention + High Production", conditions: { isLongForm: true, retention: "LOW", views: "LOW" } },
  { id: "LOW_EFFORT_WIN", label: "The Low-Effort Win", logic: "Short Duration + High Retention + Low Effort", conditions: { isLongForm: false, retention: "HIGH", views: "HIGH" } },
  { id: "NICHE_DEEP_DIVE", label: "The Niche Deep-Dive", logic: "High Sub-Retention + Low Non-Sub Views", conditions: { subRetention: "HIGH", nonSubViews: "LOW" } },
  { id: "BRAND_BUILDER", label: "The Brand Builder", logic: "High Engagement + High Subs + Low Views", conditions: { engagement: "HIGH", subConversion: "HIGH", views: "LOW" } },
  { id: "PERFECT_STORM", label: "The Perfect Storm", logic: "High CTR + High Retention + High Conversion", conditions: { ctr: "HIGH", retention: "HIGH", subConversion: "HIGH" } },
] as const;

// ── Archetype State Resolvers ────────────────────────────────

function resolvePerformanceStates(
  derived: DerivedData,
  comparison: ComparisonData,
): Record<string, string> {
  return {
    ctr: (derived.impressionsCtr ?? 0) > 5 ? "HIGH" : "LOW",
    views: comparison.viewsPerDay?.vsBaseline === "above" ? "HIGH" : "LOW",
    retention: (derived.avdRatio ?? 0) > 0.4 ? "HIGH" : "LOW",
    engagement: comparison.engagementPerView?.vsBaseline === "above" ? "HIGH" : "LOW",
  };
}

function resolveConversionStates(
  derived: DerivedData,
  video: VideoData,
): Record<string, string | boolean> {
  const subsPer1k = derived.subsPer1k ?? 0;
  let subConversion: string;
  if (subsPer1k === 0) {
    subConversion = "NONE";
  } else if (subsPer1k > 2) {
    subConversion = "HIGH";
  } else {
    subConversion = "LOW";
  }

  return {
    subConversion,
    isLongForm: (video.durationSec ?? 0) > 1800,
  };
}

function resolveSubscriberStates(
  sub: SubscriberBreakdownData | undefined,
): Record<string, string> {
  const subViewPct = sub?.subscriberViewPct ?? 0;
  const subAvgView = sub?.subscribers?.avgViewPct ?? 0;
  const nonSubAvgView = sub?.nonSubscribers?.avgViewPct ?? 0;

  return {
    subViewsPct: subViewPct > 40 ? "HIGH" : "LOW",
    subRetention: subAvgView > nonSubAvgView + 10 ? "HIGH" : "LOW",
    nonSubRetention: nonSubAvgView > 20 ? "HIGH" : "LOW",
  };
}

function resolveDiscoveryStates(
  ctx: CompetitiveContextData | undefined,
): Record<string, string> {
  const position = ctx?.searchRankings?.[0]?.position;
  let rank: string;
  if (position == null) {
    rank = "NONE";
  } else if (position <= 5) {
    rank = "HIGH";
  } else {
    rank = "LOW";
  }

  const interest = ctx?.topicTrends?.recentInterest ?? 0;
  return {
    rank,
    trend: interest > 60 ? "HIGH" : "LOW",
  };
}

// ── Archetype Matching ──────────────────────────────────────

function getRelevantArchetypes(
  video: VideoData,
  derived: DerivedData,
  comparison: ComparisonData,
  subscriberBreakdown: SubscriberBreakdownData | undefined,
  competitiveContext: CompetitiveContextData | undefined,
) {
  const states: Record<string, string | boolean> = {
    ...resolvePerformanceStates(derived, comparison),
    ...resolveConversionStates(derived, video),
    ...resolveSubscriberStates(subscriberBreakdown),
    ...resolveDiscoveryStates(competitiveContext),
  };

  return ARCHETYPE_LIBRARY.filter((arch) => {
    const conditionKeys = Object.keys(arch.conditions);
    const matches = conditionKeys.filter(
      (key) =>
        states[key as keyof typeof states] ===
        arch.conditions[key as keyof typeof arch.conditions],
    );
    return matches.length >= 2;
  }).slice(0, 6);
}

// ── Section Builders ─────────────────────────────────────────

function formatComparison(
  comp: { vsBaseline: string; delta?: number | null },
  label: string,
): string {
  if (comp.vsBaseline === "unknown") {
    return "";
  }
  return `(${comp.delta?.toFixed(0)}% vs ${label})`;
}

function buildSubscriberSection(sub: SubscriberBreakdownData | undefined): string {
  if (!sub) {
    return "\nSUBSCRIBER BEHAVIOR:\n• Subscriber data not available";
  }

  const viewPct = sub.subscriberViewPct?.toFixed(0) ?? "N/A";
  const subRet = sub.subscribers?.avgViewPct?.toFixed(1) ?? "N/A";
  const nonSubRet = sub.nonSubscribers?.avgViewPct?.toFixed(1) ?? "N/A";
  const ctrLine = sub.subscribers?.ctr
    ? `\n• Subscriber CTR: ${sub.subscribers.ctr.toFixed(1)}%`
    : "";

  return `\nSUBSCRIBER BEHAVIOR:\n• ${viewPct}% of views from subscribers\n• Subscriber retention: ${subRet}%\n• Non-subscriber retention: ${nonSubRet}%${ctrLine}`;
}

function buildGeoSection(geo: GeoBreakdownData | undefined): string {
  if (!geo?.topCountries?.length) {
    return "\nGEOGRAPHIC PERFORMANCE:\n• Geographic data not available";
  }

  const countryLines = geo.topCountries.slice(0, 5).map((c) => {
    const retNote = c.avgViewPct ? ` (${c.avgViewPct.toFixed(1)}% retention)` : "";
    return `• ${c.countryName}: ${c.viewsPct.toFixed(0)}% of views${retNote}`;
  });
  const marketLine = geo.primaryMarket ? `\n• Primary market: ${geo.primaryMarket}` : "";

  return `\nGEOGRAPHIC PERFORMANCE:\n${countryLines.join("\n")}${marketLine}`;
}

function buildTrafficSection(detail: TrafficDetailData | undefined): string {
  if (!detail) {
    return "\nTRAFFIC SOURCE DETAIL:\n• Traffic detail not available";
  }

  const parts: string[] = [];

  if (detail.searchTerms?.length) {
    const terms = detail.searchTerms.slice(0, 5).map((t) => `"${t.term}" (${t.views} views)`);
    parts.push(`• Search Terms: ${terms.join(", ")}`);
  }
  if (detail.suggestedVideos?.length) {
    const top = detail.suggestedVideos[0];
    parts.push(`• Top Suggested Video: ${top.videoId} (${top.views} views)`);
  }
  if (detail.browseFeatures?.length) {
    const features = detail.browseFeatures.slice(0, 3).map((b) => `${b.feature} (${b.views} views)`);
    parts.push(`• Browse Features: ${features.join(", ")}`);
  }
  if (parts.length === 0) {
    parts.push("• Traffic detail not available");
  }

  return `\nTRAFFIC SOURCE DETAIL:\n${parts.join("\n")}`;
}

function buildDemoSection(demo: DemographicData | undefined): string {
  if (!demo?.hasData) {
    return "\nDEMOGRAPHIC BREAKDOWN:\n• Demographic data not available (needs more views)";
  }
  const ageStr = demo.byAge.map((a) => `${a.ageGroup} (${a.viewsPct.toFixed(0)}%)`).join(", ");
  const genderStr = demo.byGender.map((g) => `${g.gender} (${g.viewsPct.toFixed(0)}%)`).join(", ");
  return `\nDEMOGRAPHIC BREAKDOWN:\n• By Age: ${ageStr}\n• By Gender: ${genderStr}`;
}

function buildCompetitiveSection(ctx: CompetitiveContextData | undefined): string {
  if (!ctx) {
    return "";
  }

  const parts: string[] = [];

  if (ctx.searchRankings?.length) {
    const rankings = ctx.searchRankings.map((r) => {
      if (!r.position) {
        return `"${r.term}" → not ranking top 20`;
      }
      return `"${r.term}" → #${r.position} (expected ${r.expectedCtr.toFixed(1)}% CTR, actual ${r.actualCtr.toFixed(1)}%)`;
    });
    parts.push(`• Search Rankings: ${rankings.join(" | ")}`);
  }
  if (ctx.topicTrends) {
    parts.push(`• Topic Trend: ${ctx.topicTrends.trend} (interest: ${ctx.topicTrends.recentInterest}/100)`);
  }
  if (ctx.similarVideos?.length) {
    parts.push(`• Similar Videos: Found ${ctx.similarVideos.length} competitors ranking for main search term`);
  }

  return parts.length > 0 ? `\nCOMPETITIVE CONTEXT:\n${parts.join("\n")}` : "";
}

// ── Prompt Building ─────────────────────────────────────────

function buildVideoContext(input: GenerateSummaryInput): string {
  const { video, derived, comparison, bottleneck } = input;

  const durationMin = Math.round(video.durationSec / 60);
  const descSnippet = video.description?.slice(0, 300) ?? "No description";

  const avdDisplay = derived.avdRatio != null ? (derived.avdRatio * 100).toFixed(1) : "N/A";
  const engDisplay = derived.engagementPerView != null ? (derived.engagementPerView * 100).toFixed(2) : "N/A";
  const subsDisplay = derived.subsPer1k?.toFixed(2) ?? "N/A";
  const bottleneckLine = bottleneck ? `\nBOTTLENECK: ${bottleneck.bottleneck} - ${bottleneck.evidence}` : "";

  const competitive = buildCompetitiveSection(input.competitiveContext);

  return `VIDEO INFO:
TITLE: "${video.title}"
DESCRIPTION (first 300 chars): "${descSnippet}"
TAGS: [${video.tags.slice(0, 10).map((t) => `"${t}"`).join(", ")}]
DURATION: ${durationMin} minutes

PERFORMANCE DATA (${derived.daysInRange} day period):
• Total Views: ${derived.totalViews.toLocaleString()}
• Views/Day: ${derived.viewsPerDay.toFixed(0)} ${formatComparison(comparison.viewsPerDay, "your channel avg")}
• Avg % Viewed: ${avdDisplay}% ${formatComparison(comparison.avgViewPercentage, "avg")}
• Engagement Rate: ${engDisplay}% ${formatComparison(comparison.engagementPerView, "avg")}
• Subs/1K Views: ${subsDisplay} ${formatComparison(comparison.subsPer1k, "avg")}
${bottleneckLine}
${buildSubscriberSection(input.subscriberBreakdown)}
${buildGeoSection(input.geoBreakdown)}
${buildTrafficSection(input.trafficDetail)}
${buildDemoSection(input.demographicBreakdown)}
${competitive ? `\n${competitive}` : ""}`;
}

// ── Main Use-Case ───────────────────────────────────────────

export async function generateSummary(
  input: GenerateSummaryInput,
  callLlm: LlmCallFn,
): Promise<CoreAnalysis> {
  const relevantArchetypes = getRelevantArchetypes(
    input.video,
    input.derived,
    input.comparison,
    input.subscriberBreakdown,
    input.competitiveContext,
  );

  const archetypeString = relevantArchetypes
    .map((a) => `${a.label}: ${a.logic}`)
    .join("\n");

  const videoContext = buildVideoContext(input);

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
    const result = await callLlm(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: videoContext },
      ],
      { maxTokens: 800, temperature: 0.3, responseFormat: "json_object" },
    );
    return JSON.parse(result.content);
  } catch (error) {
    throw new VideoInsightError(
      "EXTERNAL_FAILURE",
      "Failed to generate AI summary",
      error,
    );
  }
}
