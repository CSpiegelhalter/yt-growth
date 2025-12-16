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

/**
 * Generate a "Decide-for-Me" plan for a YouTube channel.
 */
export async function generateDecideForMePlan(input: {
  channelTitle: string;
  recentVideoTitles: string[];
  topPerformingTitles: string[];
  nicheKeywords: string[];
  competitorTitles?: string[];
}): Promise<LLMResponse> {
  const systemPrompt = `You are a YouTube growth consultant. Generate a comprehensive content plan based on the channel data provided. Be specific and actionable.

Output format (use markdown):
## 🎯 Best Next Video Topic
[Primary recommendation with rationale]

### Alternative Topics
1. [Alternative 1]
2. [Alternative 2]

## 📝 Title Options
1. [Title option 1 - explain why it works]
2. [Title option 2 - explain why it works]
3. [Title option 3 - explain why it works]

## 🖼️ Thumbnail Guidance
[Specific visual recommendations - colors, text, composition, emotions to convey]

## 🏷️ Top 5 Tags/Keywords
1. [tag1]
2. [tag2]
3. [tag3]
4. [tag4]
5. [tag5]

## ✅ One-Week Checklist
- [ ] Day 1: [task]
- [ ] Day 2: [task]
- [ ] Day 3: [task]
- [ ] Day 4: [task]
- [ ] Day 5: [task]
- [ ] Day 6: [task]
- [ ] Day 7: [task]`;

  const userPrompt = `Channel: ${input.channelTitle}

Recent videos:
${input.recentVideoTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Top performing videos:
${input.topPerformingTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Niche keywords: ${input.nicheKeywords.join(", ")}

${input.competitorTitles?.length ? `Competitor video titles for inspiration:\n${input.competitorTitles.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join("\n")}` : ""}

Generate a detailed content plan for their next video.`;

  return callLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
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
- Cliff at: ${Math.floor(v.cliffTimeSec / 60)}:${(v.cliffTimeSec % 60).toString().padStart(2, "0")} (${Math.round((v.cliffTimeSec / v.durationSec) * 100)}% through)
- Reason: ${v.cliffReason === "crossed_50" ? "Dropped below 50% retention" : "Steepest drop in retention"}`
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
 * Generate subscriber magnet pattern analysis.
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

${videos.map((v, i) => `${i + 1}. "${v.title}" - ${v.subsPerThousand} subs/1k views (${v.views.toLocaleString()} total views)`).join("\n")}

Analyze:
1. What patterns do you see in the titles/topics?
2. What makes these videos convert viewers to subscribers?
3. Template/formula for replicating this success`;

  return callLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
}

/**
 * Test mode fixture responses
 */
function getTestModeResponse(messages: LLMMessage[]): LLMResponse {
  const lastMessage = messages[messages.length - 1]?.content ?? "";

  // Detect which type of response to return based on the prompt
  if (lastMessage.includes("content plan")) {
    return {
      content: `## 🎯 Best Next Video Topic
**"5 VS Code Extensions That Will 10x Your Productivity"**
This topic combines your proven productivity niche with specific, curiosity-driving numbers.

### Alternative Topics
1. "I Tried Every AI Coding Assistant - Here's the Winner"
2. "The Terminal Setup Senior Developers Don't Share"

## 📝 Title Options
1. "5 VS Code Extensions That Will 10x Your Productivity" - Number + benefit
2. "I Found the BEST VS Code Setup After 5 Years" - Personal journey + authority
3. "Stop Using VS Code Wrong (Do This Instead)" - Challenge + solution

## 🖼️ Thumbnail Guidance
- Use a split composition: your face (surprised expression) on left, VS Code logo on right
- Bold yellow/orange accent color on dark background
- Large "10x" text overlay
- Clean, minimal - avoid clutter

## 🏷️ Top 5 Tags/Keywords
1. vscode extensions
2. developer productivity
3. coding setup
4. best ide extensions
5. programming tools 2024

## ✅ One-Week Checklist
- [ ] Day 1: Research and test 10 extensions, narrow to top 5
- [ ] Day 2: Write script with hook and timestamps
- [ ] Day 3: Record main footage with screen recordings
- [ ] Day 4: Record B-roll and reaction shots
- [ ] Day 5: Edit video, add captions and graphics
- [ ] Day 6: Create thumbnail, write description and tags
- [ ] Day 7: Schedule publish, prepare community post`,
      tokensUsed: 450,
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

  if (lastMessage.includes("subscriber")) {
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

  // Default response
  return {
    content: "This is a test mode response. Configure OPENAI_API_KEY for real responses.",
    tokensUsed: 10,
    model: "gpt-4o-mini-test",
  };
}

