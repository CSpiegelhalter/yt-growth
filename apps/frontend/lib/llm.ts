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
    md += `## 🎯 ${topic.title}\n`;
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
    md += `## 📊 Niche Insights\n\n`;

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
 * Test mode fixture responses
 */
function getTestModeResponse(messages: LLMMessage[]): LLMResponse {
  const lastMessage = messages[messages.length - 1]?.content ?? "";

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

  // Default response
  return {
    content:
      "This is a test mode response. Configure OPENAI_API_KEY for real responses.",
    tokensUsed: 10,
    model: "gpt-4o-mini-test",
  };
}
