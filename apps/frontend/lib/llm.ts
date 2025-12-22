/**
 * LLM client for OpenAI API
 *
 * Hard constraints:
 * - Max 3 calls per plan generation
 * - Prefer batching (one call for retention hypotheses across all videos)
 * - Store outputs and do not re-run if cached
 */

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
 * Call the OpenAI API with messages.
 * In TEST_MODE, returns fixture data instead of making real API calls.
 */
export async function callLLM(
  messages: LLMMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<LLMResponse> {
  // TEST_MODE: Return fixture response
  if (process.env.TEST_MODE === "1") {
    return getTestModeResponse(messages);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const model = options?.model ?? DEFAULT_MODEL;
  const maxTokens = options?.maxTokens ?? MAX_TOKENS;
  const temperature = options?.temperature ?? 0.7;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
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

/**
 * Generate a "Decide-for-Me" plan for a YouTube channel.
 * Returns structured JSON with multiple topic ideas.
 */
export async function generateDecideForMePlan(input: {
  channelTitle: string;
  recentVideoTitles: string[];
  topPerformingTitles: string[];
  nicheKeywords: string[];
  competitorTitles?: string[];
  topicCount?: number;
}): Promise<{
  json: PlanOutputJson | null;
  markdown: string;
  tokensUsed: number;
  model: string;
}> {
  const topicCount = input.topicCount ?? 5;

  const systemPrompt = `You are an elite YouTube growth strategist. Generate ${topicCount} video topic ideas as a structured JSON object.

IMPORTANT: Return ONLY valid JSON matching this exact structure:
{
  "topics": [
    {
      "id": "topic-1",
      "title": "The main video topic/concept",
      "why": "1-2 sentence rationale why this will perform",
      "confidence": "high" | "medium" | "exploratory",
      "angles": ["Different angle 1", "Different angle 2"],
      "hooks": ["Opening hook idea 1", "Opening hook idea 2"],
      "titles": [
        { "text": "Title option 1", "tags": ["Curiosity", "Specific"] },
        { "text": "Title option 2", "tags": ["Authority", "Timely"] },
        { "text": "Title option 3", "tags": ["Challenge"] }
      ],
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
      "thumbnail": {
        "overlayText": "3-4 words max",
        "layout": "Face left, product right",
        "notes": ["Use contrasting colors", "Show emotion"],
        "avoid": ["Cluttered background", "Small text"]
      }
    }
  ],
  "nicheInsights": {
    "whatIsWorkingNow": ["Trend or pattern 1", "Trend or pattern 2"],
    "formatsToCopy": ["Format that's working", "Another format"],
    "doDont": {
      "do": ["Do this", "And this"],
      "dont": ["Avoid this", "And this"]
    }
  }
}

Rules:
- Generate exactly ${topicCount} topics, ordered by confidence (high first)
- Each topic must have at least 2 angles, 2 hooks, and 3 title options
- Be specific to the channel's niche and existing content
- Hooks should be 1-2 sentences that grab attention in the first 5 seconds
- Title tags can be: Curiosity, Specific, Authority, Challenge, Timely, Personal, Outcome
- Thumbnail advice must be concrete and actionable`;

  const userPrompt = `Channel: ${input.channelTitle}

Recent videos:
${input.recentVideoTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Top performing videos:
${input.topPerformingTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Niche keywords: ${input.nicheKeywords.join(", ")}

${
  input.competitorTitles?.length
    ? `Competitor videos for inspiration:\n${input.competitorTitles
        .slice(0, 10)
        .map((t, i) => `${i + 1}. ${t}`)
        .join("\n")}`
    : ""
}

Generate ${topicCount} video topic ideas with full details.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 3000, temperature: 0.7 }
    );

    // Parse JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as PlanOutputJson;
      const markdown = generatePlanMarkdown(parsed);
      return {
        json: parsed,
        markdown,
        tokensUsed: result.tokensUsed,
        model: result.model,
      };
    }

    // Fallback if JSON parsing fails
    return {
      json: null,
      markdown: result.content,
      tokensUsed: result.tokensUsed,
      model: result.model,
    };
  } catch (err) {
    console.error("Failed to generate plan:", err);
    throw err;
  }
}

/**
 * Generate additional topics for an existing plan
 */
export async function generateMoreTopics(input: {
  channelTitle: string;
  existingTopics: string[];
  nicheKeywords: string[];
  count?: number;
}): Promise<{ topics: PlanTopicJson[]; tokensUsed: number; model: string }> {
  const count = input.count ?? 3;

  const systemPrompt = `You are a YouTube growth strategist. Generate ${count} NEW video topic ideas that are different from the existing ones.

Return ONLY valid JSON array:
[
  {
    "id": "topic-new-1",
    "title": "...",
    "why": "...",
    "confidence": "high" | "medium" | "exploratory",
    "angles": ["...", "..."],
    "hooks": ["...", "..."],
    "titles": [{ "text": "...", "tags": ["..."] }],
    "keywords": ["..."],
    "thumbnail": { "overlayText": "...", "layout": "...", "notes": ["..."], "avoid": ["..."] }
  }
]`;

  const userPrompt = `Channel: ${input.channelTitle}
Niche: ${input.nicheKeywords.join(", ")}

EXISTING topics to avoid duplicating:
${input.existingTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Generate ${count} completely different topic ideas.`;

  const result = await callLLM(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 2000, temperature: 0.8 }
  );

  const jsonMatch = result.content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    const topics = JSON.parse(jsonMatch[0]) as PlanTopicJson[];
    return { topics, tokensUsed: result.tokensUsed, model: result.model };
  }

  return { topics: [], tokensUsed: result.tokensUsed, model: result.model };
}

function generatePlanMarkdown(plan: PlanOutputJson): string {
  let md = "";

  for (const topic of plan.topics) {
    md += `## ${topic.title}\n`;
    md += `${topic.why}\n\n`;
    md += `**Confidence:** ${topic.confidence}\n\n`;

    if (topic.angles.length > 0) {
      md += `### Angles\n`;
      topic.angles.forEach((a) => {
        md += `- ${a}\n`;
      });
      md += "\n";
    }

    if (topic.hooks.length > 0) {
      md += `### Hooks\n`;
      topic.hooks.forEach((h) => {
        md += `- "${h}"\n`;
      });
      md += "\n";
    }

    if (topic.titles.length > 0) {
      md += `### Title Options\n`;
      topic.titles.forEach((t, i) => {
        md += `${i + 1}. ${t.text}${
          t.tags?.length ? ` (${t.tags.join(", ")})` : ""
        }\n`;
      });
      md += "\n";
    }

    if (topic.keywords.length > 0) {
      md += `### Keywords\n`;
      md += topic.keywords.join(", ") + "\n\n";
    }

    md += "---\n\n";
  }

  if (plan.nicheInsights) {
    md += `## Niche Insights\n\n`;

    if (plan.nicheInsights.whatIsWorkingNow.length > 0) {
      md += `### What's Working Now\n`;
      plan.nicheInsights.whatIsWorkingNow.forEach((w) => {
        md += `- ${w}\n`;
      });
      md += "\n";
    }

    if (plan.nicheInsights.formatsToCopy.length > 0) {
      md += `### Formats to Try\n`;
      plan.nicheInsights.formatsToCopy.forEach((f) => {
        md += `- ${f}\n`;
      });
      md += "\n";
    }

    if (plan.nicheInsights.doDont) {
      md += `### Do's and Don'ts\n`;
      md += `**Do:**\n`;
      plan.nicheInsights.doDont.do.forEach((d) => {
        md += `- ✓ ${d}\n`;
      });
      md += `\n**Don't:**\n`;
      plan.nicheInsights.doDont.dont.forEach((d) => {
        md += `- ✗ ${d}\n`;
      });
    }
  }

  return md;
}

/**
 * Generate retention cliff hypotheses and fixes for multiple videos in one call.
 */
export async function generateRetentionHypotheses(
  videos: Array<{
    title: string;
    cliffTimeSec: number;
    cliffReason: string;
    durationSec: number;
  }>
): Promise<LLMResponse> {
  const systemPrompt = `You are a YouTube analytics expert. For each video, analyze the retention cliff and provide:
1. A hypothesis for why viewers dropped off at that point
2. Three specific fixes to improve retention

Be concise and actionable. Format as markdown.`;

  const userPrompt = `Analyze retention cliffs for these videos:

${videos
  .map(
    (v, i) => `### Video ${i + 1}: "${v.title}"
- Cliff at: ${Math.floor(v.cliffTimeSec / 60)}:${(v.cliffTimeSec % 60)
      .toString()
      .padStart(2, "0")} (${Math.round(
      (v.cliffTimeSec / v.durationSec) * 100
    )}% through)
- Reason: ${
      v.cliffReason === "crossed_50"
        ? "Dropped below 50% retention"
        : "Steepest drop in retention"
    }`
  )
  .join("\n\n")}

For each video, provide:
1. **Hypothesis**: Why did viewers leave at this point?
2. **Fix 1**: [Specific improvement]
3. **Fix 2**: [Specific improvement]
4. **Fix 3**: [Specific improvement]`;

  return callLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
}

/**
 * Generate subscriber magnet pattern analysis (legacy markdown).
 */
export async function generateSubscriberMagnetAnalysis(
  videos: Array<{
    title: string;
    subsPerThousand: number;
    views: number;
  }>
): Promise<LLMResponse> {
  const systemPrompt = `You are a YouTube growth expert. Analyze the top performing videos by subscriber conversion rate and identify patterns. Provide actionable insights.`;

  const userPrompt = `These are the top videos by subscribers gained per 1,000 views:

${videos
  .map(
    (v, i) =>
      `${i + 1}. "${v.title}" - ${
        v.subsPerThousand
      } subs/1k views (${v.views.toLocaleString()} total views)`
  )
  .join("\n")}

Analyze:
1. What patterns do you see in the titles/topics?
2. What makes these videos convert viewers to subscribers?
3. Template/formula for replicating this success`;

  return callLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
}

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
 * Generate subscriber magnet pattern analysis as structured JSON.
 */
export async function generateSubscriberMagnetAnalysisJson(
  videos: Array<{
    title: string;
    subsPerThousand: number;
    views: number;
    viewsPerDay: number;
  }>
): Promise<{ json: PatternAnalysisJson | null; markdown: string }> {
  const systemPrompt = `You are a YouTube growth expert. Analyze the top performing videos by subscriber conversion rate.

IMPORTANT: Return ONLY valid JSON matching this exact structure:
{
  "summary": "One sentence summary of what makes these videos convert",
  "commonPatterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
  "ctaPatterns": ["CTA pattern 1", "CTA pattern 2"],
  "formatPatterns": ["Format 1", "Format 2"],
  "nextExperiments": ["Experiment 1", "Experiment 2", "Experiment 3"],
  "hooksToTry": ["Hook idea 1", "Hook idea 2"]
}

Keep each array item to 1-2 sentences max. Be specific and actionable.`;

  const userPrompt = `Analyze these top converting videos:

${videos
  .map(
    (v, i) =>
      `${i + 1}. "${v.title}" - ${
        v.subsPerThousand
      } subs/1k views, ${v.views.toLocaleString()} views, ${v.viewsPerDay}/day`
  )
  .join("\n")}

Return JSON analysis only.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.5 }
    );

    // Try to parse JSON from response
    const content = result.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as PatternAnalysisJson;
      // Generate markdown fallback from JSON
      const markdown = generateMarkdownFromAnalysis(parsed);
      return { json: parsed, markdown };
    }

    // Fallback: return content as markdown only
    return { json: null, markdown: content };
  } catch (err) {
    console.warn("Failed to generate JSON analysis:", err);
    return { json: null, markdown: null as unknown as string };
  }
}

function generateMarkdownFromAnalysis(analysis: PatternAnalysisJson): string {
  return `## Summary
${analysis.summary}

## Common Patterns
${analysis.commonPatterns.map((p) => `- ${p}`).join("\n")}

## CTA Patterns
${analysis.ctaPatterns.map((p) => `- ${p}`).join("\n")}

## Format Patterns
${analysis.formatPatterns.map((p) => `- ${p}`).join("\n")}

## Try Next
${analysis.nextExperiments.map((p) => `- ${p}`).join("\n")}

## Hooks to Try
${analysis.hooksToTry.map((p) => `- ${p}`).join("\n")}`;
}

/**
 * Generate structured converter insights for Subscriber Drivers page.
 * Returns patterns, recipe, and video ideas optimized for subscriber conversion.
 */
export async function generateConverterInsights(
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
    console.warn("Failed to generate converter insights:", err);
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
          evidence: "Top converters give value first",
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
 * Generate insights for similar channels.
 */
export async function generateSimilarChannelInsights(
  userChannelTitle: string,
  similarChannels: Array<{
    title: string;
    recentVideos: string[];
  }>
): Promise<{
  whatTheyreDoing: string[];
  ideasToSteal: string[];
  formatsToTry: string[];
}> {
  const systemPrompt = `You are a YouTube growth strategist. Analyze what similar channels are doing successfully.

Return ONLY valid JSON:
{
  "whatTheyreDoing": ["Insight 1", "Insight 2", "Insight 3"],
  "ideasToSteal": ["Idea 1", "Idea 2", "Idea 3"],
  "formatsToTry": ["Format 1", "Format 2"]
}`;

  const userPrompt = `Channel: ${userChannelTitle}

Similar channels and their recent videos:
${similarChannels
  .map(
    (c) => `
${c.title}:
${c.recentVideos.map((v, i) => `  ${i + 1}. ${v}`).join("\n")}
`
  )
  .join("\n")}

Analyze what's working for these similar channels.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.5 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn("Failed to generate similar channel insights:", err);
  }

  return {
    whatTheyreDoing: ["Unable to generate insights"],
    ideasToSteal: [],
    formatsToTry: [],
  };
}

/**
 * Analyze video comments for sentiment, themes, and hook inspiration.
 * Uses LLM to extract structured insights from viewer comments.
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
- Extract 3-5 themes with real counts and short quote examples
- 3-5 items for viewerLoved and viewerAskedFor
- 3-5 hookInspiration quotes (under 25 words each, from actual comments)`;

  const commentTexts = comments
    .slice(0, 30)
    .map((c) => `[${c.likeCount} likes] ${c.text}`)
    .join("\n");

  const userPrompt = `Analyze these comments for the video "${videoTitle}":

${commentTexts}

Extract sentiment, themes, what viewers loved, what they asked for, and hook-worthy quotes.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.5, maxTokens: 1000 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        topComments: [], // Filled in by caller
        sentiment: parsed.sentiment ?? {
          positive: 50,
          neutral: 30,
          negative: 20,
        },
        themes: parsed.themes ?? [],
        viewerLoved: parsed.viewerLoved ?? [],
        viewerAskedFor: parsed.viewerAskedFor ?? [],
        hookInspiration: parsed.hookInspiration ?? [],
      };
    }
  } catch (err) {
    console.warn("Failed to analyze video comments:", err);
  }

  // Fallback
  return {
    topComments: [],
    sentiment: { positive: 50, neutral: 30, negative: 20 },
    themes: [],
    viewerLoved: [],
    viewerAskedFor: [],
    hookInspiration: [],
  };
}

/**
 * Generate deep analysis for a competitor video.
 * Focus on actionable insights: what's working and what to steal.
 * Optionally incorporates comment analysis for richer insights.
 */
export async function generateCompetitorVideoAnalysis(
  video: {
    videoId: string;
    title: string;
    description?: string;
    tags?: string[];
    channelTitle: string;
    stats: { viewCount: number; likeCount?: number; commentCount?: number };
    derived: {
      viewsPerDay: number;
      likeRate?: number;
      commentRate?: number;
      engagementPerView?: number;
    };
  },
  userChannelTitle: string,
  commentsAnalysis?: {
    sentiment?: { positive: number; neutral: number; negative: number };
    themes?: Array<{ theme: string; count: number; examples: string[] }>;
    viewerLoved?: string[];
    viewerAskedFor?: string[];
  }
): Promise<{
  whatItsAbout: string;
  whyItsWorking: string[];
  themesToRemix: Array<{ theme: string; why: string }>;
  titlePatterns: string[];
  packagingNotes: string[];
  remixIdeasForYou: Array<{
    title: string;
    hook: string;
    overlayText: string;
    angle: string;
  }>;
}> {
  function cleanDescriptionForAbout(raw: string): string {
    // Strip URLs, timestamps, and normalize whitespace so the model sees the actual topic.
    const noUrls = raw.replace(/https?:\/\/\S+/gi, "");
    const noTimestamps = noUrls.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "");
    const noHashtags = noTimestamps.replace(/#[\p{L}\p{N}_-]+/gu, "");
    return noHashtags.replace(/\s+/g, " ").trim();
  }

  const ABOUT_STOPWORDS = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "from",
    "by",
    "my",
    "your",
    "our",
    "this",
    "that",
    "these",
    "those",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "how",
    "why",
    "what",
    "when",
    "where",
    "video",
    "youtube",
  ]);

  function normalizeForSimilarity(s: string): string {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function significantWords(s: string): string[] {
    return normalizeForSimilarity(s)
      .split(" ")
      .filter((w) => w.length >= 4 && !ABOUT_STOPWORDS.has(w));
  }

  function jaccardSimilarity(a: string[], b: string[]): number {
    const sa = new Set(a);
    const sb = new Set(b);
    let inter = 0;
    for (const w of sa) if (sb.has(w)) inter++;
    const union = sa.size + sb.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  function aboutSeemsTitleLike(about: string, title: string): boolean {
    const a = normalizeForSimilarity(about);
    const t = normalizeForSimilarity(title);
    if (!a || !t) return false;
    // Hard check: it literally contains (most of) the title.
    if (t.length >= 18 && a.includes(t)) return true;
    // Soft check: very high word overlap with the title.
    const sim = jaccardSimilarity(
      significantWords(about),
      significantWords(title)
    );
    return sim >= 0.75;
  }

  async function rewriteWhatItsAbout(input: {
    title: string;
    description?: string;
    tags?: string[];
    channelTitle: string;
    previous: string;
  }): Promise<string | null> {
    const sys = `You write high-signal YouTube topic summaries.
Return ONLY valid JSON:
{ "whatItsAbout": "2 sentences max. Plain English. Overall feel + what viewers get." }

Rules:
- Do NOT quote or restate the title.
- Use the description + tags to infer the true subject matter.
- Mention format/tone implicitly (e.g., tutorial, breakdown, story, review) if clear.
- No markdown. No bullets. No colons.`;

    const user = `TITLE: ${input.title}
CHANNEL: ${input.channelTitle}
TAGS: ${(input.tags ?? []).slice(0, 25).join(", ")}
DESCRIPTION: ${cleanDescriptionForAbout(input.description ?? "").slice(0, 1400)}

BAD SUMMARY (too title-like): ${input.previous}

Rewrite the summary.`;

    try {
      const result = await callLLM(
        [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        { temperature: 0.4, maxTokens: 160 }
      );
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]) as { whatItsAbout?: string };
      const rewritten = (parsed.whatItsAbout ?? "").trim();
      return rewritten ? rewritten : null;
    } catch {
      return null;
    }
  }

  const systemPrompt = `You are an expert YouTube growth strategist analyzing competitor videos.
Your goal is to extract actionable insights from a competitor's successful video.

Return ONLY valid JSON with this structure:
{
  "whatItsAbout": "2 sentences max. What it is actually about (topic + promise) and the overall feel/format implied by description + tags (e.g., tutorial, breakdown, story, review). Do NOT restate the title.",
  "whyItsWorking": ["Specific reason 1", "Specific reason 2", "Specific reason 3", "..."],
  "themesToRemix": [
    { "theme": "Theme name", "why": "Why this theme resonates with viewers" }
  ],
  "titlePatterns": ["Pattern 1 observed in this title", "Pattern 2", "..."],
  "packagingNotes": ["Note about thumbnail/title combo", "Emotional trigger used", "..."],
  "remixIdeasForYou": [
    {
      "title": "Specific title idea for the user's channel",
      "hook": "Opening line for the video",
      "overlayText": "3-4 word thumbnail text",
      "angle": "Brief description of the unique angle"
    }
  ]
}

Rules:
- Keep insights specific and actionable, not generic
- For whatItsAbout: do not quote, copy, or closely paraphrase the title; use description + tags
- 4-6 items for whyItsWorking
- 2-3 items for themesToRemix
- 2-3 items for titlePatterns and packagingNotes
- 3-4 remix ideas tailored for the user's channel
- No markdown formatting within JSON values`;

  // Build comments context if available
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

  const cleanedDescription = cleanDescriptionForAbout(video.description ?? "");
  const userPrompt = `Analyze this competitor video for "${userChannelTitle}":

Title: "${video.title}"
Channel: ${video.channelTitle}
Description: ${cleanedDescription.slice(0, 1400)}
Tags: ${(video.tags ?? []).slice(0, 25).join(", ")}
Views: ${video.stats.viewCount.toLocaleString()}
Views/day: ${video.derived.viewsPerDay.toLocaleString()}
${
  video.stats.likeCount
    ? `Likes: ${video.stats.likeCount.toLocaleString()}`
    : ""
}
${
  video.stats.commentCount
    ? `Comments: ${video.stats.commentCount.toLocaleString()}`
    : ""
}
${
  video.derived.engagementPerView
    ? `Engagement rate: ${(video.derived.engagementPerView * 100).toFixed(2)}%`
    : ""
}${commentsContext}

Extract:
1. What the video is actually about (2 sentences max; use description + tags; don't restate title)
2. Specific reasons why it's working (incorporate comment insights if available)
3. Themes that could be remixed for my channel
4. Title patterns to learn from
5. 3-4 specific remix ideas for "${userChannelTitle}"
6. Optional packaging notes ONLY if clearly implied by title/description/comments (keep short)`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.6, maxTokens: 1500 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        whatItsAbout?: string;
        whyItsWorking?: string[];
        themesToRemix?: Array<{ theme: string; why: string }>;
        titlePatterns?: string[];
        packagingNotes?: string[];
        remixIdeasForYou?: Array<{
          title: string;
          hook: string;
          overlayText: string;
          angle: string;
        }>;
      };

      const about = (parsed.whatItsAbout ?? "").trim();
      if (about && aboutSeemsTitleLike(about, video.title)) {
        const rewritten = await rewriteWhatItsAbout({
          title: video.title,
          description: video.description,
          tags: video.tags,
          channelTitle: video.channelTitle,
          previous: about,
        });
        if (rewritten) parsed.whatItsAbout = rewritten;
      }

      return parsed as any;
    }
  } catch (err) {
    console.warn("Failed to generate competitor video analysis:", err);
  }

  // Default fallback
  return {
    whatItsAbout: `A video about "${video.title.slice(0, 50)}..."`,
    whyItsWorking: [
      "Strong initial hook captures attention in the first few seconds",
      "Title creates clear curiosity gap without revealing the answer",
      "Specific outcome or transformation promised",
      "High engagement indicates strong audience resonance",
    ],
    themesToRemix: [
      {
        theme: "Personal take",
        why: "Your unique experience adds authenticity",
      },
      {
        theme: "Contrarian view",
        why: "Challenging the mainstream drives engagement",
      },
    ],
    titlePatterns: [
      "Uses specific, believable numbers",
      "Creates urgency or FOMO",
    ],
    packagingNotes: [
      "Clear value proposition visible at a glance",
      "Likely uses emotional triggers in thumbnail",
    ],
    remixIdeasForYou: [
      {
        title: `My Version of ${video.title.slice(0, 30)}`,
        hook: "What if there's an even better approach nobody talks about?",
        overlayText: "MY WAY",
        angle: "Your personal experience and unique results",
      },
    ],
  };
}

/**
 * Test mode fixture responses
 */
function getTestModeResponse(messages: LLMMessage[]): LLMResponse {
  const lastMessage = messages[messages.length - 1]?.content ?? "";
  const systemMessage =
    messages.find((m) => m.role === "system")?.content ?? "";

  // Detect IdeaBoard request
  if (
    systemMessage.includes("elite YouTube creative") ||
    lastMessage.includes("CREATOR PROFILE") ||
    lastMessage.includes("COMPETITOR PROOF VIDEOS")
  ) {
    return {
      content: JSON.stringify(getTestModeIdeaBoardResponse()),
      tokensUsed: 2500,
      model: "gpt-4o-mini",
    };
  }

  // Detect "generate more ideas" request
  if (
    lastMessage.includes("EXISTING IDEAS") &&
    lastMessage.includes("completely different")
  ) {
    return {
      content: JSON.stringify(getTestModeMoreIdeasResponse()),
      tokensUsed: 1500,
      model: "gpt-4o-mini",
    };
  }

  // Detect which type of response to return based on the prompt
  if (
    lastMessage.includes("content plan") ||
    lastMessage.includes("topic ideas")
  ) {
    // Return new JSON format for plan generation
    return {
      content: JSON.stringify({
        topics: [
          {
            id: "topic-1",
            title: "5 VS Code Extensions That Will 10x Your Productivity",
            why: "Combines your proven productivity niche with specific, curiosity-driving numbers that perform well.",
            confidence: "high",
            angles: [
              "Focus on lesser-known extensions that pros use",
              "Show before/after productivity metrics",
              "Compare against popular alternatives",
            ],
            hooks: [
              "I've tested over 200 VS Code extensions, and these 5 changed everything.",
              "Stop wasting time on the wrong tools. Here's what actually works.",
            ],
            titles: [
              {
                text: "5 VS Code Extensions That Will 10x Your Productivity",
                tags: ["Specific", "Outcome"],
              },
              {
                text: "I Found the BEST VS Code Setup After 5 Years",
                tags: ["Personal", "Authority"],
              },
              {
                text: "Stop Using VS Code Wrong (Do This Instead)",
                tags: ["Challenge"],
              },
            ],
            keywords: [
              "vscode extensions",
              "developer productivity",
              "coding setup",
              "ide extensions",
              "programming tools",
            ],
            thumbnail: {
              overlayText: "10X FASTER",
              layout: "Face left showing surprise, VS Code logo right",
              notes: [
                "Bold yellow/orange accent on dark background",
                "Show the 5 extension icons small",
              ],
              avoid: [
                "Cluttered layout",
                "Too much text",
                "Generic stock imagery",
              ],
            },
          },
          {
            id: "topic-2",
            title: "I Tried Every AI Coding Assistant - Here's the Winner",
            why: "AI tools are trending and comparison content drives high engagement and watch time.",
            confidence: "high",
            angles: [
              "Real coding tasks to benchmark each tool",
              "Cost vs value analysis",
              "Different tools for different use cases",
            ],
            hooks: [
              "I spent $500 testing every AI coding tool so you don't have to.",
              "The AI assistant everyone's using isn't actually the best. Here's proof.",
            ],
            titles: [
              {
                text: "I Tried Every AI Coding Assistant - Here's the Winner",
                tags: ["Personal", "Curiosity"],
              },
              {
                text: "Best AI Coding Assistant in 2024 (Tested 10+)",
                tags: ["Specific", "Timely"],
              },
              {
                text: "GitHub Copilot vs Cursor vs ChatGPT - Which One Wins?",
                tags: ["Curiosity"],
              },
            ],
            keywords: [
              "ai coding assistant",
              "github copilot",
              "cursor ide",
              "chatgpt coding",
              "best ai tools",
            ],
            thumbnail: {
              overlayText: "THE WINNER",
              layout: "Three tool logos in competition format, crown on winner",
              notes: ["High contrast colors", "Trophy or crown visual"],
              avoid: ["Too many logos", "No clear hierarchy"],
            },
          },
          {
            id: "topic-3",
            title: "The Terminal Setup Senior Developers Don't Share",
            why: "Exclusivity angle combined with practical value appeals to ambitious developers.",
            confidence: "medium",
            angles: [
              "Secrets from FAANG engineers",
              "Speed optimization focus",
              "From scratch setup tutorial",
            ],
            hooks: [
              "My terminal setup took 3 years to perfect. I'm giving it to you in 10 minutes.",
              "Senior devs guard their dotfiles like treasure. Here's why.",
            ],
            titles: [
              {
                text: "The Terminal Setup Senior Developers Don't Share",
                tags: ["Curiosity", "Authority"],
              },
              {
                text: "My Perfect Terminal Setup (3 Years in the Making)",
                tags: ["Personal", "Specific"],
              },
              {
                text: "Copy My Exact Terminal Config (Senior Dev Edition)",
                tags: ["Authority", "Outcome"],
              },
            ],
            keywords: [
              "terminal setup",
              "developer dotfiles",
              "zsh config",
              "developer workflow",
              "command line tips",
            ],
            thumbnail: {
              overlayText: "SECRET SETUP",
              layout:
                "Terminal screenshot with glowing effect, your face in corner",
              notes: ["Dark theme matches content", "Matrix-style aesthetic"],
              avoid: ["Boring screenshot only", "No personality"],
            },
          },
          {
            id: "topic-4",
            title: "Build a SaaS in 48 Hours Challenge",
            why: "Challenge format drives watch time and the startup angle attracts ambitious viewers.",
            confidence: "medium",
            angles: [
              "Document the entire journey with timestamps",
              "Focus on revenue/launch metrics",
              "Share the tech stack decisions live",
            ],
            hooks: [
              "Can I build a profitable SaaS in just 48 hours? Let's find out.",
              "48 hours. One developer. Zero code to launch. Here's what happened.",
            ],
            titles: [
              {
                text: "I Built a SaaS in 48 Hours - Here's What Happened",
                tags: ["Personal", "Curiosity"],
              },
              {
                text: "Building a SaaS From Scratch in 48 Hours (Full Build)",
                tags: ["Specific", "Outcome"],
              },
              {
                text: "48 Hour SaaS Challenge - $0 to Launch",
                tags: ["Challenge", "Specific"],
              },
            ],
            keywords: [
              "build a saas",
              "saas development",
              "indie hacker",
              "startup challenge",
              "48 hour challenge",
            ],
            thumbnail: {
              overlayText: "48 HOURS",
              layout:
                "Timer/countdown visual with laptop and your determined face",
              notes: ["Red urgency color", "Progress bar element"],
              avoid: ["Too calm expression", "No sense of challenge"],
            },
          },
          {
            id: "topic-5",
            title: "Why I Mass-Deleted My Old Code (And You Should Too)",
            why: "Contrarian take that challenges assumptions and drives discussion in comments.",
            confidence: "exploratory",
            angles: [
              "Technical debt horror stories",
              "Refactoring case study",
              "Clean code philosophy",
            ],
            hooks: [
              "I deleted 50,000 lines of code last week. Best decision I ever made.",
              "Your old code is killing your productivity. Here's the proof.",
            ],
            titles: [
              {
                text: "Why I Mass-Deleted My Old Code (And You Should Too)",
                tags: ["Challenge", "Personal"],
              },
              {
                text: "Delete Your Code: The Counterintuitive Path to Better Software",
                tags: ["Challenge", "Authority"],
              },
              {
                text: "I Deleted 50,000 Lines of Code - Here's Why",
                tags: ["Specific", "Personal"],
              },
            ],
            keywords: [
              "clean code",
              "technical debt",
              "refactoring",
              "code quality",
              "software maintenance",
            ],
            thumbnail: {
              overlayText: "DELETE IT",
              layout: "Trash can with code symbols, shocked face",
              notes: ["Destructive action feel", "Bright red warning colors"],
              avoid: ["Too negative", "Confusing imagery"],
            },
          },
        ],
        nicheInsights: {
          whatIsWorkingNow: [
            "Tutorial + vlog hybrid format (show your face + screen)",
            "Numbered lists in titles (5 things, 10 tools, etc.)",
            "Challenge/experiment format with real stakes",
            "AI tools comparison content is peaking right now",
          ],
          formatsToCopy: [
            "Fireship-style rapid-fire explanations (100 seconds format)",
            "ThePrimeagen reaction/commentary style",
            "Day-in-the-life with productivity tips woven in",
          ],
          doDont: {
            do: [
              "Hook viewers in first 5 seconds with a bold claim or question",
              "Add chapters for longer videos",
              "Include actionable takeaways every 2-3 minutes",
              "Respond to comments in first hour",
            ],
            dont: [
              "Long intros before delivering value",
              "Generic thumbnails with no emotion",
              "Upload without a description and tags",
              "Ignore trending topics in your niche",
            ],
          },
        },
      }),
      tokensUsed: 850,
      model: "gpt-4o-mini-test",
    };
  }

  // More topics generation
  if (
    lastMessage.includes("different topic ideas") ||
    lastMessage.includes("NEW video topic")
  ) {
    return {
      content: JSON.stringify([
        {
          id: "topic-new-1",
          title: "How I'd Learn to Code in 2024 (If I Could Start Over)",
          why: "Retrospective content with clear value proposition for beginners.",
          confidence: "high",
          angles: [
            "Focus on mistakes to avoid",
            "Fastest path to job-ready",
            "Resource recommendations",
          ],
          hooks: [
            "If I could go back 10 years, this is exactly what I'd do differently.",
            "The coding bootcamp industry doesn't want you to know this.",
          ],
          titles: [
            {
              text: "How I'd Learn to Code in 2024 (If I Could Start Over)",
              tags: ["Personal", "Timely"],
            },
            {
              text: "The FASTEST Way to Learn Coding in 2024",
              tags: ["Specific", "Outcome"],
            },
          ],
          keywords: [
            "learn to code",
            "coding for beginners",
            "programming 2024",
            "coding roadmap",
          ],
          thumbnail: {
            overlayText: "START HERE",
            layout: "Before/after split with younger self",
            notes: ["Time travel concept"],
            avoid: ["Too generic"],
          },
        },
        {
          id: "topic-new-2",
          title: "I Automated My Entire Morning Routine with Code",
          why: "Relatable daily life + technical skills crossover content.",
          confidence: "medium",
          angles: [
            "Show real automations running",
            "Cost savings calculation",
            "Smart home integration",
          ],
          hooks: [
            "My code wakes me up, makes my coffee, and briefs me on the day. Here's how.",
            "I spent 100 hours automating tasks that take 10 minutes.",
          ],
          titles: [
            {
              text: "I Automated My Entire Morning Routine with Code",
              tags: ["Personal", "Curiosity"],
            },
            {
              text: "Code That Runs My Life (Full Automation Tour)",
              tags: ["Authority", "Curiosity"],
            },
          ],
          keywords: [
            "home automation",
            "python automation",
            "smart home coding",
            "life hacks coding",
          ],
          thumbnail: {
            overlayText: "AUTOMATED",
            layout: "Robot/automation visual with morning items",
            notes: ["Futuristic feel"],
            avoid: ["Too technical looking"],
          },
        },
        {
          id: "topic-new-3",
          title: "Why Every Developer Should Learn SQL (Not Just Backend Devs)",
          why: "Educational content with slightly contrarian angle.",
          confidence: "exploratory",
          angles: [
            "Frontend SQL use cases",
            "Career impact statistics",
            "Quick wins to learn",
          ],
          hooks: [
            "SQL is the most underrated skill in tech. Here's the data to prove it.",
            "Frontend devs, you're missing out on a superpower.",
          ],
          titles: [
            {
              text: "Why Every Developer Should Learn SQL",
              tags: ["Challenge", "Authority"],
            },
            {
              text: "SQL for Frontend Developers (Yes, You Need This)",
              tags: ["Specific", "Challenge"],
            },
          ],
          keywords: [
            "learn sql",
            "sql for beginners",
            "frontend development",
            "database skills",
          ],
          thumbnail: {
            overlayText: "LEARN SQL",
            layout: "SQL code with surprised face",
            notes: ["Educational feel"],
            avoid: ["Boring database imagery"],
          },
        },
      ]),
      tokensUsed: 400,
      model: "gpt-4o-mini-test",
    };
  }

  if (lastMessage.includes("retention cliff")) {
    return {
      content: `### Video 1: "Building a SaaS in 24 Hours"

**Hypothesis**: The intro was too long. Viewers came for the build challenge but got a 2-minute backstory first.

**Fix 1**: Start with a 5-second preview of the finished product to hook viewers immediately.
**Fix 2**: Cut the backstory entirely or move it to the middle after demonstrating value.
**Fix 3**: Add a progress bar overlay showing "Hour 1/24" to maintain urgency.

### Video 2: "Why I Quit My Tech Job"

**Hypothesis**: The story got too personal/emotional without enough concrete takeaways at the 3-minute mark.

**Fix 1**: Intercut personal story with bullet-point lessons on screen.
**Fix 2**: Add chapter markers so viewers can skip to the "what I learned" section.
**Fix 3**: Tease the key insight earlier: "The real reason will surprise you..."`,
      tokensUsed: 280,
      model: "gpt-4o-mini-test",
    };
  }

  if (
    lastMessage.includes("subscriber") ||
    lastMessage.includes("converting")
  ) {
    // Return JSON for the new structured format
    if (lastMessage.includes("JSON")) {
      return {
        content: JSON.stringify({
          summary:
            "Tutorial-style content with specific outcomes converts best - viewers subscribe when they get clear, actionable value.",
          commonPatterns: [
            "Tutorial format with step-by-step instructions",
            "Beginner-friendly language ('Complete Guide', 'From Scratch')",
            "Transformation promise - viewer gains a specific skill",
            "Specific numbers in titles (5 tips, 10 tools, 30 days)",
          ],
          ctaPatterns: [
            "CTA placed 2-3 minutes in, right after first value delivery",
            "Soft CTA: 'Subscribe if you want more tutorials like this'",
            "End screen CTA with related video recommendation",
          ],
          formatPatterns: [
            "Screen recording + face cam in corner",
            "Chapters with clear timestamps",
            "Quick recap at the end",
          ],
          nextExperiments: [
            "Create a 'Complete Guide' for your most-asked topic",
            "Add specific numbers to your next 3 titles",
            "Move your subscribe CTA to the 2-minute mark",
          ],
          hooksToTry: [
            "'By the end of this video, you'll be able to...'",
            "'Most people get this wrong. Here's the fix.'",
            "'I wish someone told me this when I started...'",
          ],
        }),
        tokensUsed: 220,
        model: "gpt-4o-mini-test",
      };
    }
    return {
      content: `## Subscriber Magnet Pattern Analysis

### Patterns Identified
1. **Tutorial format** - All top videos teach something specific and actionable
2. **Beginner-friendly** - Titles signal accessibility ("Complete Guide", "From Scratch")
3. **Transformation promise** - Each implies the viewer will gain a skill

### Why These Convert
- **Perceived value**: Viewers feel they got enough value to warrant a subscription for more
- **Topic positioning**: These cover foundational topics that signal "more great content coming"
- **Call-to-action placement**: Likely placed CTAs at high-engagement moments

### Replication Template
**Title formula**: "[Outcome] [Topic] - [Qualifier that adds credibility]"
Examples:
- "Build [Thing] from Scratch - Complete Beginner Guide"
- "Master [Skill] in [Timeframe] - Everything You Need"

Place your subscribe CTA immediately after delivering the first major value moment (usually 2-3 minutes in).`,
      tokensUsed: 220,
      model: "gpt-4o-mini-test",
    };
  }

  if (lastMessage.includes("similar") || lastMessage.includes("Similar")) {
    return {
      content: JSON.stringify({
        whatTheyreDoing: [
          "Posting consistently 2-3x per week with series content",
          "Using trending sounds/formats within 48 hours",
          "Creating 'vs' comparison content that drives engagement",
        ],
        ideasToSteal: [
          "Their 'Day in my life as a...' format gets 2x average views",
          "Tutorial + commentary hybrid style keeps retention high",
          "Community posts before videos build anticipation",
        ],
        formatsToTry: [
          "Challenge videos with time limits",
          "Reaction/commentary on trending topics in your niche",
        ],
      }),
      tokensUsed: 150,
      model: "gpt-4o-mini-test",
    };
  }

  if (
    lastMessage.includes("competitor video analysis") ||
    lastMessage.includes("whyItsWorking")
  ) {
    return {
      content: JSON.stringify({
        whatItsAbout:
          "A creator shares their strategy for doubling channel growth through focused, high-quality content instead of frequent uploads.",
        whyItsWorking: [
          "Addresses the universal quality vs quantity debate that creators struggle with",
          "Specific, believable metric (doubled growth) creates trust",
          "Timely topic during creator burnout discussions",
          "Strong curiosity gap in title without clickbait",
          "High comment engagement shows topic resonance",
        ],
        themesToRemix: [
          {
            theme: "Quality over quantity",
            why: "Gives creators permission to slow down without guilt",
          },
          {
            theme: "Data-driven approach",
            why: "Appeals to analytical creators wanting proof",
          },
          {
            theme: "Sustainable growth",
            why: "Long-term thinking resonates with serious creators",
          },
        ],
        titlePatterns: [
          "'This One Change' creates focus on a single actionable insight",
          "'DOUBLED' is specific and believable, not hyperbolic",
          "Personal pronoun 'My' adds authenticity",
        ],
        packagingNotes: [
          "Thumbnail likely shows before/after contrast",
          "Creator face with surprised/realized expression",
          "Numbers visible for social proof",
        ],
        remixIdeasForYou: [
          {
            title: "I Tried Posting Less for 30 Days (Here's What Happened)",
            hook: "I was posting 5 times a week and burning out. Then I tried something counterintuitive...",
            overlayText: "I STOPPED",
            angle:
              "Personal experiment documenting your shift to quality over quantity",
          },
          {
            title: "The Upload Schedule That Actually Works in 2024",
            hook: "Forget everything you've heard about consistency. Here's what the data shows...",
            overlayText: "NEW STRATEGY",
            angle: "Data-backed breakdown of optimal posting frequency",
          },
        ],
      }),
      tokensUsed: 350,
      model: "gpt-4o-mini-test",
    };
  }

  if (
    lastMessage.includes("comment analysis") ||
    lastMessage.includes("sentiment")
  ) {
    return {
      content: JSON.stringify({
        sentiment: { positive: 72, neutral: 22, negative: 6 },
        themes: [
          {
            theme: "Quality over quantity",
            count: 45,
            examples: [
              "finally permission to slow down",
              "quality matters more",
            ],
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
          "Permission to post less without guilt",
          "Specific data and proof, not just theory",
          "Relatable burnout acknowledgment",
        ],
        viewerAskedFor: [
          "How to decide which video topics to prioritize",
          "Case studies for smaller channels",
          "Deep dive on retention optimization",
        ],
        hookInspiration: [
          "This completely changed my approach",
          "The data was mind-blowing",
          "Finally someone said what we all needed to hear",
        ],
      }),
      tokensUsed: 200,
      model: "gpt-4o-mini-test",
    };
  }

  // Default response
  return {
    content:
      "This is a test mode response. Configure OPENAI_API_KEY for real responses.",
    tokensUsed: 10,
    model: "gpt-4o-mini-test",
  };
}

/**
 * Test mode fixture for IdeaBoard generation
 */
function getTestModeIdeaBoardResponse() {
  const ideas = [
    {
      id: "idea-1",
      title: "The algorithm secret nobody talks about",
      angle: "Reveal the hidden factor that determines 80% of video success",
      whyNow:
        "Algorithm discussions are trending, but everyone focuses on the wrong metrics",
      format: "long",
      difficulty: "easy",
      estimatedViews: "50K-100K based on similar content",
      hooks: [
        {
          text: "I analyzed 500 videos and found the ONE thing that matters most",
          typeTags: ["shock", "promise"],
        },
        {
          text: "Forget everything you know about the algorithm. This changes everything.",
          typeTags: ["contrarian", "curiosity"],
        },
        {
          text: "The metric YouTube actually cares about isn't what you think",
          typeTags: ["curiosity", "story"],
        },
      ],
      titles: [
        {
          text: "The YouTube Algorithm Secret Nobody Talks About",
          styleTags: ["curiosity", "authority"],
        },
        {
          text: "I Analyzed 500 Videos - Here's What Actually Matters",
          styleTags: ["personal", "specific"],
        },
        {
          text: "Why Your Videos Aren't Getting Views (It's Not What You Think)",
          styleTags: ["contrarian", "outcome"],
        },
        {
          text: "The ONE Metric That Determines If YouTube Promotes Your Video",
          styleTags: ["specific", "promise"],
        },
      ],
      thumbnailConcept: {
        overlayText: "THE SECRET",
        composition:
          "Face showing surprised/enlightened expression, algorithm visualization graphic",
        emotionToConvey: "Revelation and insider knowledge",
        colorScheme: "Dark purple/blue with bright yellow accent",
        avoid: ["Generic YouTube logo", "Boring charts"],
      },
      scriptOutline: {
        hook: "Show the shocking stat that contradicts common belief",
        setup: "Explain why most creators focus on the wrong things",
        mainPoints: [
          "The real metric YouTube optimizes for",
          "How to measure it",
          "3 ways to improve it",
        ],
        payoff: "Concrete action plan for next video",
        cta: "Comment which metric you thought mattered most",
      },
      keywords: [
        {
          text: "youtube algorithm",
          intent: "search",
          monthlySearches: "50K+",
          competition: "high",
        },
        {
          text: "youtube algorithm 2024",
          intent: "search",
          monthlySearches: "20K",
          competition: "medium",
        },
        {
          text: "how to grow on youtube",
          intent: "browse",
          monthlySearches: "30K",
          competition: "high",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-2",
      title: "My exact workflow for consistent uploads",
      angle:
        "Behind-the-scenes system reveal that enables sustainable content creation",
      whyNow: "Burnout is a hot topic and creators want sustainable systems",
      format: "long",
      difficulty: "easy",
      estimatedViews: "30K-60K based on similar content",
      hooks: [
        {
          text: "I used to spend 40 hours on one video. Now I do it in 8.",
          typeTags: ["shock", "promise"],
        },
        {
          text: "Here's the system that lets me post weekly without burning out",
          typeTags: ["promise", "tutorial"],
        },
      ],
      titles: [
        {
          text: "My Exact Workflow for Weekly YouTube Videos",
          styleTags: ["personal", "specific"],
        },
        {
          text: "How I Cut My Video Production Time by 80%",
          styleTags: ["outcome", "specific"],
        },
        {
          text: "The Content System That Changed Everything",
          styleTags: ["personal", "curiosity"],
        },
      ],
      thumbnailConcept: {
        overlayText: "MY SYSTEM",
        composition:
          "You at desk with organized setup, workflow diagram overlay",
        emotionToConvey: "Efficiency and control",
        colorScheme: "Clean whites with blue accents",
        avoid: ["Messy desk", "Overwhelming complexity"],
      },
      keywords: [
        {
          text: "youtube workflow",
          intent: "search",
          monthlySearches: "5K",
          competition: "low",
        },
        {
          text: "content creation system",
          intent: "search",
          monthlySearches: "3K",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-3",
      title: "Reaction to viral competitor video",
      angle: "Break down why a trending video is exploding and extract lessons",
      whyNow: "Riding the wave of trending content in your niche",
      format: "long",
      difficulty: "easy",
      estimatedViews: "40K-80K based on trending topic boost",
      hooks: [
        {
          text: "This video got 2 million views in 3 days. Here's exactly why.",
          typeTags: ["curiosity", "story"],
        },
        {
          text: "I watched this viral video 50 times. Here's what I learned.",
          typeTags: ["curiosity", "promise"],
        },
      ],
      titles: [
        {
          text: "Why This Video Went VIRAL (Creator Breakdown)",
          styleTags: ["curiosity", "authority"],
        },
        {
          text: "Analyzing the Most Viral Video in Our Niche",
          styleTags: ["specific", "authority"],
        },
      ],
      thumbnailConcept: {
        overlayText: "2M VIEWS?!",
        composition: "Split screen - competitor thumbnail + your reaction face",
        emotionToConvey: "Curiosity and insight",
        colorScheme: "Match competitor colors for recognition",
        avoid: ["Looking negative", "Clickbait drama"],
      },
      keywords: [
        {
          text: "viral video breakdown",
          intent: "browse",
          monthlySearches: "10K",
          competition: "medium",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-4",
      title: "Deep dive on underrated strategy",
      angle: "Explore a tactic that works but few creators use",
      whyNow: "Creators are looking for competitive advantages",
      format: "long",
      difficulty: "medium",
      hooks: [
        {
          text: "This strategy grew my channel 40% and nobody talks about it",
          typeTags: ["shock", "contrarian"],
        },
      ],
      titles: [
        {
          text: "The Underrated YouTube Strategy That Actually Works",
          styleTags: ["contrarian", "promise"],
        },
        {
          text: "Why I Stopped Doing What Everyone Says (And Grew 40%)",
          styleTags: ["personal", "contrarian"],
        },
      ],
      thumbnailConcept: {
        overlayText: "40% GROWTH",
        composition: "Before/after analytics screenshot with your face",
        emotionToConvey: "Proof and results",
        colorScheme: "Green growth colors",
        avoid: ["Fake looking numbers", "No proof"],
      },
      keywords: [
        {
          text: "youtube growth strategy",
          intent: "search",
          monthlySearches: "15K",
          competition: "medium",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-5",
      title: "Common mistakes holding creators back",
      angle: "Identify and fix the most damaging errors",
      whyNow: "Educational content that positions you as authority",
      format: "long",
      difficulty: "medium",
      hooks: [
        {
          text: "These 5 mistakes are killing your channel. I made all of them.",
          typeTags: ["shock", "story"],
        },
      ],
      titles: [
        {
          text: "5 YouTube Mistakes I Made (So You Don't Have To)",
          styleTags: ["personal", "specific"],
        },
        {
          text: "Stop Making These YouTube Mistakes",
          styleTags: ["contrarian", "specific"],
        },
      ],
      thumbnailConcept: {
        overlayText: "STOP THIS",
        composition: "Face with 'X' graphic, concerned expression",
        emotionToConvey: "Warning and helpfulness",
        colorScheme: "Red accent for urgency",
        avoid: ["Too negative", "Scary imagery"],
      },
      keywords: [
        {
          text: "youtube mistakes",
          intent: "search",
          monthlySearches: "8K",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-6",
      title: "Step-by-step beginner tutorial",
      angle: "Complete guide for newcomers to your niche",
      whyNow: "Evergreen content that consistently drives new subscribers",
      format: "long",
      difficulty: "medium",
      hooks: [
        {
          text: "If you're just starting out, this is the only video you need",
          typeTags: ["promise", "tutorial"],
        },
      ],
      titles: [
        {
          text: "Complete Beginner's Guide (Everything You Need to Know)",
          styleTags: ["authority", "specific"],
        },
        {
          text: "Start Here: The Ultimate Guide for Beginners",
          styleTags: ["specific", "authority"],
        },
      ],
      thumbnailConcept: {
        overlayText: "START HERE",
        composition: "Welcoming face, roadmap or checklist graphic",
        emotionToConvey: "Friendly and comprehensive",
        colorScheme: "Inviting blues and greens",
        avoid: ["Intimidating complexity", "Advanced jargon"],
      },
      keywords: [
        {
          text: "beginner guide",
          intent: "search",
          monthlySearches: "20K",
          competition: "medium",
        },
        {
          text: "how to start",
          intent: "search",
          monthlySearches: "30K",
          competition: "high",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-7",
      title: "Advanced technique deep dive",
      angle: "Pro-level content for experienced audience",
      whyNow: "Establishes authority and drives high engagement",
      format: "long",
      difficulty: "stretch",
      hooks: [
        {
          text: "This advanced technique took me 2 years to figure out",
          typeTags: ["authority", "curiosity"],
        },
      ],
      titles: [
        {
          text: "Advanced Techniques Most Creators Don't Know",
          styleTags: ["authority", "curiosity"],
        },
        {
          text: "The Pro-Level Strategy That Changes Everything",
          styleTags: ["authority", "promise"],
        },
      ],
      thumbnailConcept: {
        overlayText: "PRO LEVEL",
        composition: "Serious expression, premium/sophisticated look",
        emotionToConvey: "Expertise and exclusivity",
        colorScheme: "Dark premium colors - black/gold",
        avoid: ["Looking too basic", "Beginner vibes"],
      },
      keywords: [
        {
          text: "advanced tips",
          intent: "search",
          monthlySearches: "5K",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-8",
      title: "Tools and resources roundup",
      angle: "Curated list of best tools for your audience",
      whyNow: "Practical content that viewers bookmark and share",
      format: "long",
      difficulty: "easy",
      hooks: [
        {
          text: "These are the exact tools I use every single day",
          typeTags: ["promise", "authority"],
        },
      ],
      titles: [
        {
          text: "My Favorite Tools and Resources (2024 Edition)",
          styleTags: ["personal", "timebound"],
        },
        {
          text: "10 Tools That Changed My Workflow",
          styleTags: ["specific", "outcome"],
        },
      ],
      thumbnailConcept: {
        overlayText: "MY TOOLS",
        composition: "Grid of tool logos with your face",
        emotionToConvey: "Helpful and curated",
        colorScheme: "Clean organized look",
        avoid: ["Too many logos", "Overwhelming grid"],
      },
      keywords: [
        {
          text: "best tools",
          intent: "search",
          monthlySearches: "25K",
          competition: "medium",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-9",
      title: "Quick tips compilation",
      angle: "Fast-paced, high-value density content",
      whyNow: "Short attention span friendly, high shareability",
      format: "shorts",
      difficulty: "easy",
      hooks: [
        {
          text: "5 tips in 60 seconds that will change your game",
          typeTags: ["promise", "specific"],
        },
      ],
      titles: [
        {
          text: "5 Tips in 60 Seconds #Shorts",
          styleTags: ["specific", "timebound"],
        },
        {
          text: "Quick Tips You NEED to Know #Shorts",
          styleTags: ["promise", "specific"],
        },
      ],
      thumbnailConcept: {
        overlayText: "5 TIPS",
        composition: "Dynamic action shot or key visual",
        emotionToConvey: "Energy and quick value",
        colorScheme: "Bright, attention-grabbing",
        avoid: ["Static boring image", "Too much text"],
      },
      keywords: [
        {
          text: "quick tips",
          intent: "browse",
          monthlySearches: "15K",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "idea-10",
      title: "Controversial take on industry trend",
      angle: "Challenge common wisdom with data and reasoning",
      whyNow: "Drives engagement, comments, and establishes thought leadership",
      format: "long",
      difficulty: "stretch",
      hooks: [
        {
          text: "Everyone is wrong about this. And I can prove it.",
          typeTags: ["contrarian", "shock"],
        },
        {
          text: "The popular advice is actually hurting you. Here's why.",
          typeTags: ["contrarian", "promise"],
        },
      ],
      titles: [
        {
          text: "Why Popular Advice Is Wrong (Unpopular Opinion)",
          styleTags: ["contrarian", "personal"],
        },
        {
          text: "I Disagree With Everyone About This",
          styleTags: ["contrarian", "personal"],
        },
      ],
      thumbnailConcept: {
        overlayText: "I DISAGREE",
        composition: "Face with skeptical/questioning expression",
        emotionToConvey: "Challenge and debate",
        colorScheme: "Bold contrast - red/black",
        avoid: ["Looking arrogant", "Pure negativity"],
      },
      keywords: [
        {
          text: "unpopular opinion",
          intent: "browse",
          monthlySearches: "10K",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
  ];

  return {
    ideas,
    nicheInsights: {
      momentumNow: [
        "Algorithm and growth content is consistently trending",
        "Behind-the-scenes and transparency content performing well",
        "Tool comparisons and reviews driving high engagement",
      ],
      winningPatterns: [
        "Personal story + data combination in hooks",
        "Numbered lists in titles (5 things, 7 mistakes)",
        "Before/after transformations in thumbnails",
      ],
      contentGaps: [
        "Intermediate-level content (between beginner and advanced)",
        "Niche-specific case studies",
        "Sustainable workflow content",
      ],
      avoidThese: [
        "Generic motivation without actionable advice",
        "Overly long tutorials without timestamps",
        "Clickbait titles that don't deliver",
      ],
    },
  };
}

/**
 * Test mode fixture for "generate more ideas"
 */
function getTestModeMoreIdeasResponse() {
  return [
    {
      id: `new-idea-${Date.now()}-1`,
      title: "Day in the life as a content creator",
      angle: "Authentic behind-the-scenes look at your process",
      format: "long",
      difficulty: "easy",
      hooks: [
        {
          text: "Here's what creating content actually looks like",
          typeTags: ["story", "curiosity"],
        },
      ],
      titles: [
        {
          text: "A Day in My Life as a Content Creator",
          styleTags: ["personal"],
        },
      ],
      thumbnailConcept: {
        overlayText: "MY DAY",
        composition: "Candid work setup shot",
        emotionToConvey: "Authenticity",
        colorScheme: "Natural warm tones",
        avoid: ["Overly staged", "Fake perfection"],
      },
      keywords: [
        {
          text: "day in the life",
          intent: "browse",
          monthlySearches: "50K",
          competition: "medium",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: `new-idea-${Date.now()}-2`,
      title: "Q&A answering your top questions",
      angle: "Direct engagement with audience questions",
      format: "long",
      difficulty: "easy",
      hooks: [
        {
          text: "You asked, I'm answering. Let's do this.",
          typeTags: ["promise", "story"],
        },
      ],
      titles: [
        {
          text: "Answering Your Most Asked Questions",
          styleTags: ["personal", "specific"],
        },
      ],
      thumbnailConcept: {
        overlayText: "Q&A",
        composition: "You with question mark graphics",
        emotionToConvey: "Approachable and helpful",
        colorScheme: "Friendly blues",
        avoid: ["Looking unapproachable", "Too formal"],
      },
      keywords: [
        {
          text: "q&a",
          intent: "browse",
          monthlySearches: "20K",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: `new-idea-${Date.now()}-3`,
      title: "Collaborating with another creator",
      angle: "Cross-audience exposure and fresh perspectives",
      format: "long",
      difficulty: "medium",
      hooks: [
        {
          text: "I brought in an expert to settle this debate once and for all",
          typeTags: ["curiosity", "authority"],
        },
      ],
      titles: [
        {
          text: "We Need to Talk About This (feat. @Creator)",
          styleTags: ["curiosity", "personal"],
        },
      ],
      thumbnailConcept: {
        overlayText: "COLLAB",
        composition: "Both faces side by side",
        emotionToConvey: "Collaboration and expertise",
        colorScheme: "Blend both creators' brand colors",
        avoid: ["One person overshadowing the other", "Crowded layout"],
      },
      keywords: [
        {
          text: "collaboration",
          intent: "browse",
          monthlySearches: "10K",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: `new-idea-${Date.now()}-4`,
      title: "What I'd do differently starting over",
      angle: "Hindsight wisdom for newer creators",
      format: "long",
      difficulty: "easy",
      hooks: [
        {
          text: "If I could start over, I'd change everything",
          typeTags: ["story", "contrarian"],
        },
      ],
      titles: [
        {
          text: "What I'd Do Differently If I Started Over",
          styleTags: ["personal", "contrarian"],
        },
      ],
      thumbnailConcept: {
        overlayText: "START OVER",
        composition: "Thoughtful expression, rewind graphic",
        emotionToConvey: "Reflection and wisdom",
        colorScheme: "Muted nostalgic tones",
        avoid: ["Looking regretful", "Negative energy"],
      },
      keywords: [
        {
          text: "starting over",
          intent: "search",
          monthlySearches: "8K",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: `new-idea-${Date.now()}-5`,
      title: "The thing nobody tells you about",
      angle: "Reveal hidden truths and insider knowledge",
      format: "long",
      difficulty: "medium",
      hooks: [
        {
          text: "Nobody talks about this, but it's the most important thing",
          typeTags: ["curiosity", "contrarian"],
        },
      ],
      titles: [
        {
          text: "The Thing Nobody Tells You About [Topic]",
          styleTags: ["curiosity", "contrarian"],
        },
      ],
      thumbnailConcept: {
        overlayText: "THE TRUTH",
        composition: "Serious expression, secretive vibe",
        emotionToConvey: "Insider knowledge",
        colorScheme: "Dark mysterious tones",
        avoid: ["Clickbaity drama", "Misleading"],
      },
      keywords: [
        {
          text: "truth about",
          intent: "search",
          monthlySearches: "15K",
          competition: "medium",
        },
      ],
      proof: { basedOn: [] },
    },
  ];
}
