import { getTestModeResponse } from "../tests/unit/llm-fixtures";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMResponse = {
  content: string;
  tokensUsed: number;
  model: string;
};

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TOKENS = 2000;

/**
 * Get the current date context string to inject into LLM system prompts.
 * This ensures the LLM knows the correct current date/year.
 */
function getCurrentDateContext(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString("en-US", { month: "long" });
  return `Today's date is ${month} ${now.getDate()}, ${year}. The current year is ${year}. IMPORTANT: If you reference any year in your response, use ${year} (not 2024 or any other year).`;
}

/**
 * Wrap a system prompt with current date context
 */
function withDateContext(systemPrompt: string): string {
  return `${getCurrentDateContext()}\n\n${systemPrompt}`;
}

/**
 * Call the OpenAI API with messages.
 * In TEST_MODE, returns fixture data instead of making real API calls.
 * Automatically injects current date context into system messages.
 */
export async function callLLM(
  messages: LLMMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: "json_object";
  }
): Promise<LLMResponse> {
  // Inject date context into system messages so LLM knows current year
  const messagesWithDate = messages.map((msg) =>
    msg.role === "system"
      ? { ...msg, content: withDateContext(msg.content) }
      : msg
  );

  // TEST_MODE: Return fixture response
  if (process.env.TEST_MODE === "1") {
    return getTestModeResponse(messagesWithDate);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const model = options?.model ?? DEFAULT_MODEL;
  const maxTokens = options?.maxTokens ?? MAX_TOKENS;
  const temperature = options?.temperature ?? 0.7;
  const responseFormat = options?.responseFormat;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messagesWithDate,
      max_tokens: maxTokens,
      temperature,
      store: false,
      ...(responseFormat ? { response_format: { type: responseFormat } } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content ?? "",
    tokensUsed: data.usage?.total_tokens ?? 0,
    model,
  };
}

export type PlanTopicJson = {
  id: string;
  title: string;
  why: string;
  confidence: "high" | "medium" | "exploratory";
  angles: string[];
  hooks: string[];
  titles: Array<{ text: string; tags?: string[] }>;
  keywords: string[];
  thumbnail: {
    overlayText?: string;
    layout?: string;
    notes: string[];
    avoid: string[];
  };
};

export type PlanOutputJson = {
  topics: PlanTopicJson[];
  nicheInsights: {
    whatIsWorkingNow: string[];
    formatsToCopy: string[];
    doDont: { do: string[]; dont: string[] };
  };
};

export type PatternAnalysisJson = {
  summary: string;
  commonPatterns: string[];
  ctaPatterns: string[];
  formatPatterns: string[];
  nextExperiments: string[];
  hooksToTry: string[];
  structuredInsights?: {
    commonPatterns: Array<{
      pattern: string;
      evidence: string;
      howToUse: string;
    }>;
    conversionRecipe: {
      titleFormulas: string[];
      ctaTiming: string;
      structure: string;
    };
    nextIdeas: Array<{
      title: string;
      hook: string;
      whyItConverts: string;
      ctaSuggestion: string;
    }>;
  };
};

/**
 * Generate structured subscriber insights for Subscriber Drivers page.
 * Returns patterns, recipe, and video ideas optimized for subscriber conversion.
 */
export async function generateSubscriberInsights(
  videos: Array<{
    title: string;
    subsPerThousand: number;
    views: number;
    viewsPerDay: number;
    engagedRate: number;
  }>,
  channelAvgSubsPerThousand: number
): Promise<PatternAnalysisJson> {
  const systemPrompt = `You are a YouTube growth expert specializing in subscriber conversion optimization.

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

  const userPrompt = `Analyze these top converting videos (channel avg: ${channelAvgSubsPerThousand.toFixed(
    1
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
   - ${(v.engagedRate * 100).toFixed(1)}% engagement`
  )
  .join("\n\n")}

Return ONLY JSON, no explanation.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.6, maxTokens: 2000 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as PatternAnalysisJson;
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to generate subscriber insights:", err);
  }

  // Fallback with reasonable defaults
  return {
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
}

/**
 * Analyze video comments for sentiment, themes, and hook inspiration.
 * Uses LLM to extract structured insights from viewer comments.
 * Throws on failure - caller should handle and show appropriate error state.
 */
export async function analyzeVideoComments(
  comments: Array<{
    text: string;
    likeCount: number;
    authorName: string;
  }>,
  videoTitle: string
): Promise<{
  topComments: Array<{
    text: string;
    likeCount: number;
    authorName: string;
    publishedAt: string;
  }>;
  sentiment: { positive: number; neutral: number; negative: number };
  themes: Array<{ theme: string; count: number; examples: string[] }>;
  viewerLoved: string[];
  viewerAskedFor: string[];
  hookInspiration: string[];
}> {
  if (!comments || comments.length === 0) {
    throw new Error("No comments to analyze");
  }

  const systemPrompt = `You are analyzing YouTube video comments to extract viewer insights.

Return ONLY valid JSON with this structure:
{
  "sentiment": { "positive": 70, "neutral": 20, "negative": 10 },
  "themes": [
    { "theme": "Theme name", "count": 15, "examples": ["quote 1", "quote 2"] }
  ],
  "viewerLoved": ["What viewers appreciated 1", "What viewers appreciated 2"],
  "viewerAskedFor": ["Request from viewers 1", "Follow-up topic 2"],
  "hookInspiration": ["Short quote that could be used as hook", "Another quote under 25 words"]
}

Rules:
- Sentiment percentages must add up to 100
- Extract 3-5 themes with real counts and short quote examples from ACTUAL comments provided
- 3-5 items for viewerLoved - summarize what viewers explicitly praised
- 3-5 items for viewerAskedFor - things viewers requested or asked about
- 3-5 hookInspiration quotes (under 25 words each, from actual comments that could inspire video hooks)`;

  const commentTexts = comments
    .slice(0, 30)
    .map((c) => `[${c.likeCount} likes] ${c.text}`)
    .join("\n");

  const userPrompt = `Analyze these ${comments.length} comments for the video "${videoTitle}":

${commentTexts}

Extract sentiment, themes, what viewers loved, what they asked for, and hook-worthy quotes from THESE ACTUAL COMMENTS.`;

  const result = await callLLM(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.5, maxTokens: 1000 }
  );

  const jsonMatch = result.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse LLM response for comment analysis");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate we got real sentiment data
  const sentiment = parsed.sentiment;
  if (
    !sentiment ||
    typeof sentiment.positive !== "number" ||
    typeof sentiment.neutral !== "number" ||
    typeof sentiment.negative !== "number"
  ) {
    throw new Error("Invalid sentiment data from LLM");
  }

  return {
    topComments: [], // Filled in by caller
    sentiment: {
      positive: sentiment.positive,
      neutral: sentiment.neutral,
      negative: sentiment.negative,
    },
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    viewerLoved: Array.isArray(parsed.viewerLoved) ? parsed.viewerLoved : [],
    viewerAskedFor: Array.isArray(parsed.viewerAskedFor)
      ? parsed.viewerAskedFor
      : [],
    hookInspiration: Array.isArray(parsed.hookInspiration)
      ? parsed.hookInspiration
      : [],
  };
}

// ============================================
// PARALLELIZED COMPETITOR ANALYSIS
// ============================================

type CompetitorVideoInput = {
  videoId: string;
  title: string;
  description?: string;
  tags?: string[];
  channelTitle: string;
  durationSec?: number;
  stats: { viewCount: number; likeCount?: number; commentCount?: number };
  derived: {
    viewsPerDay: number;
    likeRate?: number;
    commentRate?: number;
    engagementPerView?: number;
  };
};

type CommentsAnalysisInput = {
  sentiment?: { positive: number; neutral: number; negative: number };
  themes?: Array<{ theme: string; count: number; examples: string[] }>;
  viewerLoved?: string[];
  viewerAskedFor?: string[];
};

/**
 * Build shared video context for competitor analysis prompts
 */
function buildCompetitorContext(
  video: CompetitorVideoInput,
  userChannelTitle: string,
  commentsAnalysis?: CommentsAnalysisInput
): string {
  let commentsContext = "";
  if (commentsAnalysis) {
    if (commentsAnalysis.sentiment) {
      commentsContext += `\nComment sentiment: ${commentsAnalysis.sentiment.positive}% positive, ${commentsAnalysis.sentiment.neutral}% neutral, ${commentsAnalysis.sentiment.negative}% negative`;
    }
    if (commentsAnalysis.themes && commentsAnalysis.themes.length > 0) {
      commentsContext += `\nTop comment themes: ${commentsAnalysis.themes
        .map((t) => t.theme)
        .join(", ")}`;
    }
    if (
      commentsAnalysis.viewerLoved &&
      commentsAnalysis.viewerLoved.length > 0
    ) {
      commentsContext += `\nWhat viewers loved: ${commentsAnalysis.viewerLoved
        .slice(0, 3)
        .join("; ")}`;
    }
    if (
      commentsAnalysis.viewerAskedFor &&
      commentsAnalysis.viewerAskedFor.length > 0
    ) {
      commentsContext += `\nViewers asked for: ${commentsAnalysis.viewerAskedFor
        .slice(0, 3)
        .join("; ")}`;
    }
  }

  const cleanDesc = (video.description ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "")
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);

  // Compute precise duration string (never "0 minutes", always exact seconds for Shorts)
  let durationStr = "";
  if (video.durationSec) {
    const sec = video.durationSec;
    if (sec < 60) {
      durationStr = `Duration: ${sec}s (YouTube Shorts format)`;
    } else if (sec < 3600) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      durationStr = `Duration: ${m}m ${s}s`;
    } else {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      durationStr = `Duration: ${h}h ${m}m`;
    }
  }

  // Count description words for context
  const descWordCount = cleanDesc.split(/\s+/).filter(Boolean).length;

  // Extract hashtags from title/description (publicly visible, unlike tags)
  const hashtagMatches =
    `${video.title} ${video.description ?? ""}`.match(/#[\p{L}\p{N}_-]+/gu) ||
    [];
  const hashtags = [...new Set(hashtagMatches.map((h) => h.toLowerCase()))];

  // Compute like rate for context
  const likeRate =
    video.stats.viewCount > 0 && video.stats.likeCount
      ? ((video.stats.likeCount / video.stats.viewCount) * 100).toFixed(2)
      : null;

  return `Analyzing for channel: "${userChannelTitle}"

COMPETITOR VIDEO (PUBLIC DATA ONLY):
Title: "${video.title}"
Channel: ${video.channelTitle}
${durationStr}
Description: ${cleanDesc || "[empty - 0 words]"} (${descWordCount} words)
Hashtags (visible): ${
    hashtags.length > 0 ? hashtags.join(", ") : "[none visible]"
  }
Views: ${video.stats.viewCount.toLocaleString()}
Views/day: ${video.derived.viewsPerDay.toLocaleString()}
${
  video.stats.likeCount
    ? `Likes: ${video.stats.likeCount.toLocaleString()}`
    : ""
}
${likeRate ? `Like rate: ${likeRate}%` : ""}
${
  video.stats.commentCount
    ? `Comments: ${video.stats.commentCount.toLocaleString()}`
    : ""
}${commentsContext}

IMPORTANT - DATA LIMITATIONS:
- We CANNOT know: CTR, impressions, retention, watch time, traffic sources, subscriber conversion
- Do NOT claim anything about CTR, retention, or "ranking better"
- Only reference the public signals above
- Use "${
    durationStr || "video length"
  }" exactly as stated (never round to different units)`;
}

/**
 * Chunk 1: What It's About + Why It's Working
 */
async function generateCompetitorBasicAnalysis(
  video: CompetitorVideoInput,
  userChannelTitle: string,
  commentsAnalysis?: CommentsAnalysisInput
): Promise<{
  whatItsAbout: string;
  whyItsWorking: string[];
} | null> {
  const systemPrompt = `You are an expert YouTube growth strategist analyzing competitor videos.

Return ONLY valid JSON:
{
  "whatItsAbout": "2 sentences max describing the actual video content (NOT the description text)",
  "whyItsWorking": ["Observed signal 1", "Observed signal 2", "Observed signal 3", "Observed signal 4"]
}

CRITICAL RULES for "whatItsAbout":
- Describe what the VIDEO CONTENT actually is, NOT metadata
- NEVER copy or echo the description - it's often just social links
- NEVER output: social media handles, ▶TWITCH, ▶MERCH, stream dates
- INFER the topic from title, channel name
- Good: "A Minecraft stream featuring building challenges and viewer interactions."
- Bad: "▶TWITCH: ▶MERCH: ▶Twitter..." (copying garbage)
- Always use EXACT duration from input (e.g., "36s" not "1 minute")

For "whyItsWorking" (HYPOTHESES based on public signals):
- Provide 4-6 observations based ONLY on measured public data
- Each must cite a specific signal: title pattern, duration, views/day, like rate, comment themes
- NEVER claim: "high CTR", "good retention", "increases CTR", "ranks well", "compelling title alone is enough"
- NEVER claim effects we cannot measure
- Good: "Year in title (2025) signals timeliness - views/day is strong at ${">"}10K"
- Good: "Short duration (36s) matches Shorts format - comment themes show high curiosity"
- Bad: "High engagement through likes suggests..." (when like rate is below average)
- Bad: "Title alone is compelling enough..." (we don't know CTR)
- Bad: "Lack of tags allows for organic reach..." (unmeasurable)`;

  const context = buildCompetitorContext(
    video,
    userChannelTitle,
    commentsAnalysis
  );

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      { temperature: 0.5, maxTokens: 500, responseFormat: "json_object" }
    );
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Competitor basic analysis failed:", err);
    return null;
  }
}

/**
 * Chunk 2: Themes & Patterns
 */
async function generateCompetitorThemesPatterns(
  video: CompetitorVideoInput,
  userChannelTitle: string,
  commentsAnalysis?: CommentsAnalysisInput
): Promise<{
  themesToRemix: Array<{ theme: string; why: string }>;
  titlePatterns: string[];
  packagingNotes: string[];
} | null> {
  const systemPrompt = `You are an expert YouTube growth strategist analyzing competitor videos for patterns to steal.

Return ONLY valid JSON:
{
  "themesToRemix": [
    { "theme": "Theme name", "why": "Why this theme resonates (cite evidence from comments or public signals)" }
  ],
  "titlePatterns": ["Pattern 1 observed in this title", "Pattern 2"],
  "packagingNotes": ["Note about thumbnail/title combo", "Emotional trigger used"]
}

RULES:
- 2-3 themes that could be remixed for the user's channel
- 2-3 title patterns to learn from
- 2-3 packaging notes (only if clearly implied by title/description/comments)
- Keep insights specific and actionable
- Use EXACT duration from input (never round)
- No markdown

FORBIDDEN phrases (we cannot measure these):
- "increases CTR", "high CTR", "good retention"
- "ranks well", "rank better with tags"
- "title alone is compelling enough"
- Do NOT recommend "adding tags" - use "adding hashtags in description" instead`;

  const context = buildCompetitorContext(
    video,
    userChannelTitle,
    commentsAnalysis
  );

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      { temperature: 0.5, maxTokens: 500, responseFormat: "json_object" }
    );
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Competitor themes/patterns failed:", err);
    return null;
  }
}

/**
 * Chunk 3: Remix Ideas for User's Channel
 */
async function generateCompetitorRemixIdeas(
  video: CompetitorVideoInput,
  userChannelTitle: string,
  commentsAnalysis?: CommentsAnalysisInput
): Promise<{
  remixIdeasForYou: Array<{
    title: string;
    hook: string;
    overlayText: string;
    angle: string;
  }>;
} | null> {
  const systemPrompt = `You are an expert YouTube creative strategist helping creators remix competitor content.

Return ONLY valid JSON:
{
  "remixIdeasForYou": [
    {
      "title": "Specific title idea for the user's channel",
      "hook": "Opening line for the video",
      "overlayText": "3-4 word thumbnail text",
      "angle": "Brief description of the unique angle"
    }
  ]
}

RULES:
- Generate 3-4 remix ideas tailored for "${userChannelTitle}"
- Each idea should put a unique spin on the competitor's topic
- Titles should be complete, ready-to-use
- Hooks should be compelling opening lines
- Overlay text should be punchy thumbnail text
- No markdown`;

  const context = buildCompetitorContext(
    video,
    userChannelTitle,
    commentsAnalysis
  );

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      { temperature: 0.6, maxTokens: 600, responseFormat: "json_object" }
    );
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Competitor remix ideas failed:", err);
    return null;
  }
}

/**
 * Chunk 4: Beat This Video Checklist (parallel version)
 */
async function generateCompetitorBeatChecklistParallel(
  video: CompetitorVideoInput,
  userChannelTitle: string,
  commentsAnalysis?: CommentsAnalysisInput
): Promise<Array<{
  action: string;
  difficulty: "Easy" | "Medium" | "Hard";
  impact: "Low" | "Medium" | "High";
}> | null> {
  const systemPrompt = `You are an expert YouTube growth strategist creating ideas to outperform a competitor video.

Return ONLY valid JSON:
{
  "beatThisVideo": [
    { "action": "Concrete differentiation idea specific to THIS video", "difficulty": "Easy|Medium|Hard", "impact": "Low|Medium|High" }
  ]
}

CRITICAL RULES:
- Provide 5-6 differentiated ideas (not a checklist)
- Each item must reference something from the inputs (topic, format, duration, comments, metrics)
- Focus on how to be DIFFERENT, not just "better"
- Use EXACT duration from input (e.g., "36s" not "1 minute")

FORBIDDEN (we cannot measure these):
- "rank better with tags" - instead say "add relevant hashtags in description"
- "improve retention" - we don't have retention data
- "increase CTR" - we don't have CTR data
- Generic items like "make a better thumbnail" without specifics

Good examples:
- "Address the #1 viewer request from comments: [specific request]"
- "Create a longer deep-dive version (theirs is only 36s)"
- "Take a contrarian angle: why [topic] might NOT be the answer"
- No markdown`;

  const context = buildCompetitorContext(
    video,
    userChannelTitle,
    commentsAnalysis
  );

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      { temperature: 0.5, maxTokens: 600, responseFormat: "json_object" }
    );
    const parsed = JSON.parse(result.content);
    const list = Array.isArray(parsed.beatThisVideo)
      ? parsed.beatThisVideo
      : [];
    return list
      .map((x: any) => ({
        action: typeof x?.action === "string" ? x.action.trim() : "",
        difficulty:
          x?.difficulty === "Easy" ||
          x?.difficulty === "Medium" ||
          x?.difficulty === "Hard"
            ? x.difficulty
            : "Medium",
        impact:
          x?.impact === "Low" || x?.impact === "Medium" || x?.impact === "High"
            ? x.impact
            : "High",
      }))
      .filter((x: any) => x.action.length >= 16)
      .slice(0, 8);
  } catch (err) {
    console.error("Competitor beat checklist failed:", err);
    return null;
  }
}

/**
 * Generate competitor video analysis using 4 parallel LLM calls for faster response
 */
export async function generateCompetitorVideoAnalysisParallel(
  video: CompetitorVideoInput,
  userChannelTitle: string,
  commentsAnalysis?: CommentsAnalysisInput
): Promise<{
  whatItsAbout: string;
  whyItsWorking: string[];
  themesToRemix: Array<{ theme: string; why: string }>;
  titlePatterns: string[];
  packagingNotes: string[];
  beatThisVideo: Array<{
    action: string;
    difficulty: "Easy" | "Medium" | "Hard";
    impact: "Low" | "Medium" | "High";
  }>;
  remixIdeasForYou: Array<{
    title: string;
    hook: string;
    overlayText: string;
    angle: string;
  }>;
}> {
  console.log(
    "[CompetitorAnalysis] Starting parallel LLM generation (4 chunks)"
  );
  const startTime = Date.now();

  // Run all 4 LLM calls in parallel
  const [basicResult, themesResult, remixResult, beatResult] =
    await Promise.all([
      generateCompetitorBasicAnalysis(
        video,
        userChannelTitle,
        commentsAnalysis
      ),
      generateCompetitorThemesPatterns(
        video,
        userChannelTitle,
        commentsAnalysis
      ),
      generateCompetitorRemixIdeas(video, userChannelTitle, commentsAnalysis),
      generateCompetitorBeatChecklistParallel(
        video,
        userChannelTitle,
        commentsAnalysis
      ),
    ]);

  const elapsed = Date.now() - startTime;
  console.log(`[CompetitorAnalysis] Parallel LLM completed in ${elapsed}ms`);

  // Merge results with fallbacks
  return {
    whatItsAbout:
      basicResult?.whatItsAbout ??
      `A video about "${video.title.slice(0, 50)}..."`,
    whyItsWorking: basicResult?.whyItsWorking ?? [
      "Strong initial hook captures attention",
      "Title creates clear curiosity gap",
      "High engagement indicates audience resonance",
    ],
    themesToRemix: themesResult?.themesToRemix ?? [
      {
        theme: "Personal take",
        why: "Your unique experience adds authenticity",
      },
    ],
    titlePatterns: themesResult?.titlePatterns ?? [
      "Uses specific numbers",
      "Creates urgency",
    ],
    packagingNotes: themesResult?.packagingNotes ?? ["Clear value proposition"],
    beatThisVideo: beatResult ?? [
      {
        action: "Create a more comprehensive version with additional examples",
        difficulty: "Medium",
        impact: "High",
      },
      {
        action: "Target a specific audience segment they missed",
        difficulty: "Easy",
        impact: "Medium",
      },
    ],
    remixIdeasForYou: remixResult?.remixIdeasForYou ?? [
      {
        title: `My Take on ${video.title.slice(0, 30)}`,
        hook: "What if there's an even better approach?",
        overlayText: "MY VERSION",
        angle: "Your personal experience and unique results",
      },
    ],
  };
}

// ============================================
// NICHE PERSONA CACHE
// ============================================

// Cache TTL: 3 days
const PERSONA_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

// In-memory cache for niche personas (system prompts)
// Key format: "channelId:contentHash"
type PersonaCacheEntry = {
  niche: string;
  systemPrompt: string;
  contentHash: string;
  cachedAt: number;
};
const personaCache = new Map<string, PersonaCacheEntry>();

/**
 * Compute a stable hash of content (titles + tags + category) for cache invalidation.
 * Uses a simple hash function since crypto might not be available in all contexts.
 */
function computeContentHash(
  titles: string[],
  tags: string[],
  category: string | null
): string {
  // Normalize and combine all content
  const normalizedTitles = titles.map((t) => t.toLowerCase().trim()).sort();
  const normalizedTags = tags.map((t) => t.toLowerCase().trim()).sort();
  const content = [
    ...normalizedTitles,
    "|TAGS|",
    ...normalizedTags,
    "|CAT|",
    category?.toLowerCase() ?? "",
  ].join("|");

  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 33) ^ content.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Get persona cache key for a channel.
 */
function getPersonaCacheKey(channelId: number, contentHash: string): string {
  return `${channelId}:${contentHash}`;
}

/**
 * Try to get a cached persona, respecting TTL and content changes.
 */
function getCachedPersona(
  channelId: number,
  contentHash: string
): PersonaCacheEntry | null {
  // First, try exact match with current content hash
  const exactKey = getPersonaCacheKey(channelId, contentHash);
  const exactMatch = personaCache.get(exactKey);

  if (exactMatch) {
    const age = Date.now() - exactMatch.cachedAt;
    if (age < PERSONA_CACHE_TTL_MS) {
      console.log(
        `[generateNichePersona] Using exact cache match for channel ${channelId}`
      );
      return exactMatch;
    }
    // Expired, remove it
    personaCache.delete(exactKey);
  }

  // Look for any cached entry for this channel that's still valid
  // If content hash differs but entry is recent (< 1 day), reuse it
  for (const [key, entry] of personaCache.entries()) {
    if (!key.startsWith(`${channelId}:`)) continue;

    const age = Date.now() - entry.cachedAt;
    if (age >= PERSONA_CACHE_TTL_MS) {
      personaCache.delete(key);
      continue;
    }

    // We need the original titles to compute similarity
    // For now, if content hash differs but entry is fresh, we can still use it
    // if the hash change is minor (this is a "tiny change" optimization)
    // Since we don't store original titles in cache, we use a simpler heuristic:
    // if the entry is less than 1 day old and channelId matches, reuse it
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (age < ONE_DAY_MS) {
      console.log(
        `[generateNichePersona] Reusing recent cache for channel ${channelId} (age: ${Math.round(
          age / 1000 / 60
        )}m)`
      );
      return entry;
    }
  }

  return null;
}

/**
 * Store persona in cache.
 */
function setCachedPersona(
  channelId: number,
  contentHash: string,
  niche: string,
  systemPrompt: string
): void {
  const key = getPersonaCacheKey(channelId, contentHash);

  // Clean up old entries for this channel
  for (const k of personaCache.keys()) {
    if (k.startsWith(`${channelId}:`)) {
      personaCache.delete(k);
    }
  }

  personaCache.set(key, {
    niche,
    systemPrompt,
    contentHash,
    cachedAt: Date.now(),
  });

  console.log(
    `[generateNichePersona] Cached persona for channel ${channelId} (hash: ${contentHash})`
  );
}

// ============================================
// STEP A: NICHE PERSONA GENERATOR
// ============================================

/**
 * Meta-prompt for generating niche-specific personas.
 * This prompt asks the LLM to act as a Prompt Engineer and create
 * a custom system prompt tailored to the detected niche.
 */
const PERSONA_GENERATOR_SYSTEM_PROMPT = `You are an expert Prompt Engineer. Analyze these video titles and tags to determine the exact specific niche (e.g., 'Senior Backend Engineering', 'Minecraft Bedwars Gameplay', 'Vegan Meal Prep').

Return JSON with:
- niche: string (a concise, specific niche label)
- systemPrompt: string (THIS MUST BE A SYSTEM PROMPT for another AI)

The systemPrompt must:
1. Define the persona (e.g., 'You are a veteran Minecraft player...', 'You are a senior software engineer with 10+ years experience...').
2. Set specific rules for search queries (e.g., 'For this niche, prioritize specific game mod names' or 'Prioritize specific ingredients' or 'Include programming language names and framework versions').
3. Define what 'High Quality' means for this niche (e.g., 'channels with professional editing', 'channels that explain concepts clearly', 'channels with tested recipes').
4. Enforce specificity over brevity - the queries should capture the EXACT niche, not generic terms.

Keep it niche-specific and actionable. The systemPrompt should be detailed enough that another AI can generate highly relevant search queries for finding competitor channels in this exact niche.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.`;

export type NichePersona = {
  niche: string;
  systemPrompt: string;
};

/**
 * Generate a niche-specific persona and system prompt (Step A of 2-step flow).
 * This function calls the LLM to analyze the channel's content and create
 * a custom system prompt tailored to their specific niche.
 */
export async function generateNichePersona(
  titles: string[],
  tags: string[],
  category?: string | null
): Promise<NichePersona> {
  // TEST_MODE: Return fixture
  if (process.env.TEST_MODE === "1") {
    return {
      niche: "YouTube Creator Education",
      systemPrompt: `You are a YouTube growth expert who helps creators find competitor channels. You specialize in the YouTube education and creator coaching space.

For this niche, prioritize:
- Channels teaching YouTube strategy, algorithm tips, and growth tactics
- Creator coaching and consulting channels
- Analytics and data-driven content creation channels

High Quality in this niche means:
- Channels with proven track records (showing real results)
- Educational content that's actionable and specific
- Professional production quality with clear explanations

Generate search queries that would find established YouTube educators and creator coaches.`,
    };
  }

  const userPrompt = `Analyze this YouTube channel's content to determine their exact niche and create a specialized system prompt for finding competitor channels:

VIDEO TITLES (raw, unfiltered):
${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

TAGS USED (all tags, unfiltered):
${tags.join(", ") || "None available"}

YOUTUBE CATEGORY:
${category || "Unknown"}

Based on ALL the context above (including short tokens like AI, Go, F1, S3, 2.0, etc. which may indicate specific niches), determine the exact niche and create a system prompt for another AI to generate search queries.`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: PERSONA_GENERATOR_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.4,
        maxTokens: 800,
      }
    );

    // Parse JSON response - try multiple extraction methods
    let parsed: { niche?: string; systemPrompt?: string } | null = null;

    // Try to find JSON in response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        console.warn(
          "[generateNichePersona] Failed to parse extracted JSON, trying cleanup"
        );
        // Try to clean up common JSON issues
        const cleaned = jsonMatch[0]
          .replace(/[\u0000-\u001F]+/g, " ") // Remove control characters
          .replace(/,\s*}/g, "}") // Remove trailing commas
          .replace(/,\s*]/g, "]");
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          console.error(
            "[generateNichePersona] JSON cleanup failed, using fallback"
          );
        }
      }
    }

    // Validate parsed response
    if (
      parsed &&
      typeof parsed.niche === "string" &&
      parsed.niche.length > 0 &&
      typeof parsed.systemPrompt === "string" &&
      parsed.systemPrompt.length > 20
    ) {
      console.log(
        `[generateNichePersona] Generated persona for niche: "${parsed.niche}"`
      );
      return {
        niche: parsed.niche,
        systemPrompt: parsed.systemPrompt,
      };
    }

    console.warn(
      "[generateNichePersona] Invalid response structure, using fallback"
    );
    return getFallbackPersona(category);
  } catch (err) {
    console.error("[generateNichePersona] Error:", err);
    return getFallbackPersona(category);
  }
}

/**
 * Fallback persona when Step A fails.
 * Returns a generic but reasonable system prompt.
 */
function getFallbackPersona(category: string | null | undefined): NichePersona {
  const categoryLabel = category || "General Content";
  return {
    niche: categoryLabel,
    systemPrompt: `You are a YouTube niche analyst specializing in the ${categoryLabel} category. Given a creator's video data, identify their specific niche and generate YouTube search queries to find POPULAR, HIGH-QUALITY channels making similar content.

Rules:
- Be SPECIFIC about the niche (not just the broad category, but the exact sub-niche)
- Generate 8-10 search queries that would find SUCCESSFUL channels making similar content
- Queries should find channels with good production quality and established audiences
- Generate TWO types of queries:
  1. FORMAT-BASED queries (the type of content): reviews, tutorials, commentary, gameplay, etc.
  2. TOPIC-BASED queries (specific subjects that appear frequently in the titles)
- Keep queries SHORT (2-4 words max) - YouTube search works better with concise queries
- Think about what POPULAR creators in this niche would title their videos
- Output valid JSON only`,
  };
}

// ============================================
// STEP B: QUERY GENERATOR (using dynamic persona)
// ============================================

/**
 * Channel profile context for niche generation
 * When present, this is used as the anchor/ground truth for niche identification
 */
export type ChannelProfileContext = {
  nicheLabel: string;
  nicheDescription: string;
  primaryCategories: string[];
  keywords: string[];
  competitorSearchHints: string[];
  targetAudience: string;
};

/**
 * Use LLM to determine the user's niche and generate search queries
 * for finding competitor channels.
 *
 * This implements a 2-step flow:
 * 1. Step A: Generate a niche-specific persona/system prompt (cached for 3 days)
 * 2. Step B: Use that persona to generate highly relevant search queries
 *
 * When channelProfile is provided, it's used as the primary context/anchor.
 * Video data is then used to refine and validate the niche.
 */
export async function generateNicheQueries(input: {
  channelId: number;
  videoTitles: string[];
  topTags: string[];
  categoryName: string | null;
  channelProfile?: ChannelProfileContext;
}): Promise<{
  niche: string;
  queries: string[];
}> {
  const { channelId, videoTitles, topTags, categoryName, channelProfile } =
    input;

  // TEST_MODE: Return fixture
  if (process.env.TEST_MODE === "1") {
    return {
      niche: channelProfile?.nicheLabel || "YouTube Creator Education",
      queries: channelProfile?.competitorSearchHints || [
        "youtube tips",
        "grow youtube channel",
        "youtube strategy",
        "content creator tips",
        "youtube analytics",
      ],
    };
  }

  // HIGHEST PRIORITY: If we have a channel profile, use it as the primary source
  // The user's stated intent is more valuable than video-inferred data
  if (channelProfile) {
    // If we have competitor hints from AI profile, use them directly
    if (
      channelProfile.competitorSearchHints &&
      channelProfile.competitorSearchHints.length > 0
    ) {
      console.log(
        `[generateNicheQueries] Using channel profile hints for channel ${channelId} (${channelProfile.competitorSearchHints.length} hints)`
      );
      return {
        niche: channelProfile.nicheLabel,
        queries: channelProfile.competitorSearchHints.slice(0, 12),
      };
    }

    // Even without competitor hints, use profile keywords + categories
    const profileQueries: string[] = [];

    // Add keywords as search terms (first 8)
    if (channelProfile.keywords && channelProfile.keywords.length > 0) {
      profileQueries.push(...channelProfile.keywords.slice(0, 8));
    }

    // Add categories as search terms
    channelProfile.primaryCategories.forEach((cat) => {
      if (!profileQueries.includes(cat.toLowerCase())) {
        profileQueries.push(cat.toLowerCase());
      }
    });

    if (profileQueries.length > 0) {
      console.log(
        `[generateNicheQueries] Using channel profile keywords for channel ${channelId} (${profileQueries.length} queries)`
      );
      return {
        niche: channelProfile.nicheLabel,
        queries: profileQueries.slice(0, 12),
      };
    }
  }

  // ============================================
  // STEP A: Get or generate niche persona
  // ============================================
  let persona: NichePersona;

  // If we have a channel profile, use it as the base niche
  if (channelProfile) {
    console.log(
      `[generateNicheQueries] Using channel profile as persona anchor for channel ${channelId}`
    );
    persona = {
      niche: channelProfile.nicheLabel,
      systemPrompt: `You are an expert YouTube niche analyst specializing in ${
        channelProfile.nicheLabel
      }. 
The creator has described their channel as: "${channelProfile.nicheDescription}"
Their target audience is: ${channelProfile.targetAudience}
Primary categories: ${channelProfile.primaryCategories.join(", ")}
Key keywords: ${channelProfile.keywords.slice(0, 15).join(", ")}

Given their video data, generate YouTube search queries to find POPULAR, HIGH-QUALITY channels making similar content to help them find competitors and inspiration.

Rules:
- Be SPECIFIC about the niche - use the creator's self-description as the anchor
- Generate 8-10 search queries that would find SUCCESSFUL channels in this exact niche
- Queries should find channels with good production quality and established audiences
- Keep queries SHORT (2-4 words max)
- Output valid JSON only`,
    };
  } else {
    // Compute content hash for cache key
    const contentHash = computeContentHash(videoTitles, topTags, categoryName);

    const cached = getCachedPersona(channelId, contentHash);
    if (cached) {
      persona = { niche: cached.niche, systemPrompt: cached.systemPrompt };
    } else {
      // Generate new persona
      try {
        persona = await generateNichePersona(
          videoTitles,
          topTags,
          categoryName
        );
        // Cache it
        setCachedPersona(
          channelId,
          contentHash,
          persona.niche,
          persona.systemPrompt
        );
      } catch (err) {
        console.error("[generateNicheQueries] Step A failed:", err);
        persona = getFallbackPersona(categoryName);
      }
    }
  }

  // ============================================
  // STEP B: Generate queries using the dynamic persona
  // ============================================
  const profileContext = channelProfile
    ? `
CREATOR'S CHANNEL PROFILE (use as PRIMARY context):
- Niche: ${channelProfile.nicheLabel}
- Description: ${channelProfile.nicheDescription}
- Categories: ${channelProfile.primaryCategories.join(", ")}
- Target Audience: ${channelProfile.targetAudience}
- Keywords: ${channelProfile.keywords.slice(0, 15).join(", ")}

`
    : "";

  const userPrompt = `Analyze this YouTube channel and generate search queries to find POPULAR competitor channels with established audiences (20K+ subscribers):
${profileContext}
VIDEO TITLES (raw, unfiltered - pay attention to ALL tokens including short ones like AI, Go, F1, etc.):
${videoTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

ALL TAGS USED:
${topTags.join(", ") || "None available"}

YOUTUBE CATEGORY:
${categoryName || "Unknown"}

DETECTED NICHE: ${persona.niche}

Generate 8-10 search queries that will find SUCCESSFUL creators in this exact niche.

IMPORTANT RULES FOR QUERIES:
- Keep queries SHORT (2-4 words)
- Be SPECIFIC to this niche (use exact terms, game names, technologies, etc.)
- Generate BOTH format-based queries (tutorials, reviews, gameplay) AND topic-based queries (specific subjects)
- DON'T combine format + topic in one query
- Think about what successful channels in "${persona.niche}" would be titled

Respond with JSON only:
{
  "niche": "${persona.niche}",
  "queries": ["query 1", "query 2", ...] // 8-10 SHORT, SPECIFIC queries
}`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: persona.systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.3, // Lower temperature for more consistent results
        maxTokens: 500,
      }
    );

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        "[generateNicheQueries] Failed to parse JSON from Step B response"
      );
      return fallbackNicheQueries(topTags, categoryName, persona.niche);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      !parsed.niche ||
      !Array.isArray(parsed.queries) ||
      parsed.queries.length === 0
    ) {
      console.error("[generateNicheQueries] Invalid Step B response structure");
      return fallbackNicheQueries(topTags, categoryName, persona.niche);
    }

    console.log(`[generateNicheQueries] Identified niche: "${parsed.niche}"`);
    console.log(
      `[generateNicheQueries] Generated ${parsed.queries.length} queries`
    );

    return {
      niche: parsed.niche || persona.niche,
      queries: parsed.queries.slice(0, 10),
    };
  } catch (err) {
    console.error("[generateNicheQueries] Step B Error:", err);
    return fallbackNicheQueries(topTags, categoryName, persona.niche);
  }
}

/**
 * Fallback niche queries when Step B fails.
 * Uses the niche from Step A if available.
 */
function fallbackNicheQueries(
  topTags: string[],
  categoryName: string | null,
  personaNiche?: string
): { niche: string; queries: string[] } {
  const queries = topTags.slice(0, 8);
  if (queries.length < 3 && categoryName) {
    queries.push(categoryName.toLowerCase());
  }
  return {
    niche: personaNiche || categoryName || "General Content",
    queries: queries.length > 0 ? queries : ["youtube videos"],
  };
}
