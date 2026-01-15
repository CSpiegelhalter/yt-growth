/**
 * Test mode fixtures for LLM responses.
 * These are used when TEST_MODE=1 to return fixture data instead of making real API calls.
 */

import type { LLMMessage, LLMResponse } from "../../lib/llm";

/**
 * Get the current year for use in fixtures
 */
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Test mode fixture responses
 */
export function getTestModeResponse(messages: LLMMessage[]): LLMResponse {
  const lastMessage = messages[messages.length - 1]?.content ?? "";
  const systemMessage =
    messages.find((m) => m.role === "system")?.content ?? "";

  // Detect Thumbnail Workflow V2 prompt builder (JSON variants contract)
  if (
    systemMessage.includes("prompt transformer for image generation") &&
    lastMessage.includes("Generate exactly") &&
    lastMessage.includes("variants")
  ) {
    const match = lastMessage.match(/Generate exactly\s+(\d+)\s+variants/i);
    const n = Math.max(1, Math.min(4, Number(match?.[1] ?? "3")));
    const variants = Array.from({ length: n }).map((_, idx) => ({
      variationNote:
        idx === 0
          ? "tight close-up"
          : idx === 1
          ? "medium shot with prop"
          : idx === 2
          ? "more negative space"
          : "dramatic angle",
      scene: "A clean, high-contrast scene matching the user's description.",
      composition:
        idx === 0
          ? "tight close-up, subject fills frame"
          : idx === 1
          ? "medium shot with one clear prop"
          : idx === 2
          ? "leave significant negative space on one side for later text"
          : "dynamic, slightly tilted framing with motion energy",
      lighting: "dramatic studio lighting, strong rim light, high contrast",
      background: "simple blurred background, uncluttered",
      camera: "35mm lens look, sharp focus, slight depth of field",
      props: "one relevant prop only, clean and recognizable",
      avoid: ["text", "letters", "watermark", "logo"],
    }));

    return {
      content: JSON.stringify({ variants }),
      tokensUsed: 350,
      model: "gpt-4o-mini-test",
    };
  }

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
                text: `Best AI Coding Assistant in ${CURRENT_YEAR} (Tested 10+)`,
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
          title: `How I'd Learn to Code in ${CURRENT_YEAR} (If I Could Start Over)`,
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
              text: `How I'd Learn to Code in ${CURRENT_YEAR} (If I Could Start Over)`,
              tags: ["Personal", "Timely"],
            },
            {
              text: `The FASTEST Way to Learn Coding in ${CURRENT_YEAR}`,
              tags: ["Specific", "Outcome"],
            },
          ],
          keywords: [
            "learn to code",
            "coding for beginners",
            `programming ${CURRENT_YEAR}`,
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
            title: `The Upload Schedule That Actually Works in ${CURRENT_YEAR}`,
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

  // Detect Video Insights request
  if (
    systemMessage.includes("elite YouTube growth strategist") ||
    lastMessage.includes("ANALYZE THIS VIDEO") ||
    lastMessage.includes("PERFORMANCE DATA")
  ) {
    return {
      content: JSON.stringify(getTestModeVideoInsightsResponse(lastMessage)),
      tokensUsed: 2500,
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
 * Test mode fixture for Video Insights - DYNAMIC based on actual video data
 */
export function getTestModeVideoInsightsResponse(prompt: string) {
  // Parse video data from the prompt
  const titleMatch = prompt.match(/TITLE:\s*"([^"]+)"/);
  const title = titleMatch?.[1] ?? "Untitled Video";

  const tagsMatch = prompt.match(/TAGS:\s*\[([^\]]+)\]/);
  const tagsStr = tagsMatch?.[1] ?? "";
  const tags = tagsStr
    .split(",")
    .map((t) => t.trim().replace(/"/g, ""))
    .filter(Boolean);

  const durationMatch = prompt.match(/DURATION:\s*(\d+)\s*minutes/);
  const duration = parseInt(durationMatch?.[1] ?? "10", 10);

  const viewsMatch = prompt.match(/Total Views:\s*([\d,]+)/);
  const views = parseInt((viewsMatch?.[1] ?? "1000").replace(/,/g, ""), 10);

  const viewsPerDayMatch = prompt.match(/Views\/Day:\s*([\d.]+)/);
  const viewsPerDay = parseFloat(viewsPerDayMatch?.[1] ?? "100");

  const avgViewedMatch = prompt.match(/Avg % Viewed:\s*([\d.]+)%/);
  const avgViewed = parseFloat(avgViewedMatch?.[1] ?? "40");

  const engagementMatch = prompt.match(/Engagement Rate:\s*([\d.]+)%/);
  const engagementRate = parseFloat(engagementMatch?.[1] ?? "5");

  const subsMatch = prompt.match(/Net Subs Gained:\s*([\d.]+)\/1K/);
  const subsPer1k = parseFloat(subsMatch?.[1] ?? "2");

  const healthMatch = prompt.match(
    /OVERALL HEALTH:\s*(\d+)\/100\s*\(([^)]+)\)/
  );
  const healthScore = parseInt(healthMatch?.[1] ?? "70", 10);

  // Analyze title characteristics
  const titleLength = title.length;
  const hasNumber = /\d/.test(title);
  const hasQuestion = /\?/.test(title);
  const hasHowTo = /how\s+(to|i)/i.test(title);
  const hasPowerWords =
    /(secret|amazing|ultimate|best|worst|never|always|shocking|insane|crazy)/i.test(
      title
    );
  const isShort = titleLength < 40;
  const isLong = titleLength > 70;

  // Score the title (1-10)
  let titleScore = 5;
  if (hasNumber) titleScore += 1;
  if (hasQuestion) titleScore += 0.5;
  if (hasHowTo) titleScore += 1;
  if (hasPowerWords) titleScore += 1;
  if (isShort && titleLength > 20) titleScore += 0.5;
  if (isLong) titleScore -= 1;
  titleScore = Math.min(10, Math.max(1, Math.round(titleScore)));

  // Generate title-specific feedback
  const titleStrengths: string[] = [];
  const titleWeaknesses: string[] = [];
  const titleSuggestions: string[] = [];

  if (hasNumber)
    titleStrengths.push(`Uses a specific number which creates curiosity`);
  else
    titleWeaknesses.push(
      `No specific number - adding one can boost CTR by 15-20%`
    );

  if (hasQuestion)
    titleStrengths.push(`Question format engages viewers directly`);
  if (hasHowTo)
    titleStrengths.push(`"How to" format signals clear value proposition`);
  else
    titleSuggestions.push(
      `Try: "How I ${title.split(" ").slice(0, 4).join(" ")}..."`
    );

  if (hasPowerWords)
    titleStrengths.push(`Contains power word(s) that drive emotional clicks`);
  else
    titleWeaknesses.push(
      `Missing emotional triggers - consider words like "secret", "shocking", or "ultimate"`
    );

  if (isLong)
    titleWeaknesses.push(
      `Title is ${titleLength} chars - YouTube truncates around 60-70 chars on mobile`
    );
  if (isShort && titleLength > 20)
    titleStrengths.push(`Concise title that won't get cut off`);
  if (titleLength < 20)
    titleWeaknesses.push(`Title might be too short to convey enough value`);

  // Generate specific title alternatives based on this video
  const titleWords = title.split(" ").filter((w) => w.length > 3);
  const mainTopic = titleWords.slice(0, 3).join(" ");
  titleSuggestions.push(
    `"${hasNumber ? "" : "5 "}${mainTopic} ${
      hasNumber ? "" : "Secrets "
    }Nobody Talks About"`
  );
  titleSuggestions.push(
    `"I Tried ${mainTopic} for 30 Days - Here's What Happened"`
  );
  if (!hasQuestion)
    titleSuggestions.push(
      `"Why ${mainTopic} Will Change Everything in ${CURRENT_YEAR}"`
    );

  // Analyze tags
  const tagCount = tags.length;
  let tagScore = Math.min(8, Math.round(tagCount / 3) + 3);
  const missingTags: string[] = [];

  if (!tags.some((t) => /202\d/.test(t)))
    missingTags.push(
      `Add "${mainTopic} ${CURRENT_YEAR}" for time-sensitive searches`
    );
  if (!tags.some((t) => /tutorial|guide|how/i.test(t)))
    missingTags.push(`Add "tutorial" or "guide" variations`);
  if (!tags.some((t) => /beginner|advanced|pro/i.test(t)))
    missingTags.push(
      `Add skill level tags like "beginner guide" or "advanced tips"`
    );
  if (tagCount < 10)
    missingTags.push(
      `Only ${tagCount} tags - YouTube allows up to 500 chars, aim for 10-15 relevant tags`
    );

  // Determine performance level
  const isHighPerformer =
    healthScore >= 75 || engagementRate > 6 || subsPer1k > 3;
  const isLowPerformer =
    healthScore < 50 || engagementRate < 3 || avgViewed < 30;
  const retentionStrong = avgViewed >= 50;
  const retentionWeak = avgViewed < 35;
  const engagementStrong = engagementRate > 5;
  const engagementWeak = engagementRate < 3;
  const subsStrong = subsPer1k > 2.5;
  const subsWeak = subsPer1k < 1.5;

  // Build dynamic headline based on THIS video
  let headline = "";
  if (isHighPerformer) {
    headline = `"${title.slice(
      0,
      30
    )}..." is outperforming your channel average`;
  } else if (isLowPerformer) {
    headline = `"${title.slice(0, 30)}..." has room for growth - here's how`;
  } else {
    headline = `"${title.slice(0, 30)}..." is performing at baseline`;
  }

  // Build dynamic one-liner based on actual metrics
  let oneLiner = "";
  if (retentionWeak && engagementStrong) {
    oneLiner = `Strong engagement signals this topic resonates, but the ${avgViewed.toFixed(
      0
    )}% retention suggests viewers are leaving before your key points. Tightening the middle section could significantly boost watch time.`;
  } else if (retentionStrong && engagementWeak) {
    oneLiner = `Great retention at ${avgViewed.toFixed(
      0
    )}% shows your content delivers, but the low engagement suggests viewers aren't feeling compelled to interact. Add more discussion prompts and CTAs.`;
  } else if (retentionStrong && engagementStrong) {
    oneLiner = `This video is hitting on all cylinders - ${avgViewed.toFixed(
      0
    )}% retention with ${engagementRate.toFixed(
      1
    )}% engagement. Document what made this work and replicate it.`;
  } else if (retentionWeak && engagementWeak) {
    oneLiner = `Both retention (${avgViewed.toFixed(
      0
    )}%) and engagement (${engagementRate.toFixed(
      1
    )}%) are below target. Focus on tightening the first 30 seconds and adding more hooks throughout.`;
  } else {
    oneLiner = `This ${duration}-minute video is performing reasonably with ${views.toLocaleString()} views. There's opportunity to optimize both retention and engagement.`;
  }

  // Build key findings based on ACTUAL metrics from this video
  const keyFindings: Array<{
    finding: string;
    dataPoint: string;
    significance: string;
    recommendation: string;
  }> = [];

  if (retentionStrong) {
    keyFindings.push({
      finding: `Strong retention for a ${duration}-minute video`,
      dataPoint: `${avgViewed.toFixed(1)}% average viewed`,
      significance: "positive",
      recommendation:
        "Your pacing is working. Note the structure and hooks you used here for future videos.",
    });
  } else if (retentionWeak) {
    keyFindings.push({
      finding: `Retention drops off early for this ${duration}-minute video`,
      dataPoint: `${avgViewed.toFixed(1)}% average viewed`,
      significance: "negative",
      recommendation: `For ${duration}min content, aim for 45%+ retention. Add preview hooks and pattern interrupts every 2-3 minutes.`,
    });
  } else {
    keyFindings.push({
      finding: `Average retention for this video length`,
      dataPoint: `${avgViewed.toFixed(1)}% average viewed`,
      significance: "neutral",
      recommendation:
        "Consider adding chapter markers to help viewers navigate and find value faster.",
    });
  }

  if (engagementStrong) {
    keyFindings.push({
      finding: `Engagement rate well above typical YouTube videos`,
      dataPoint: `${engagementRate.toFixed(2)}% engagement rate`,
      significance: "positive",
      recommendation: `This topic sparked discussion. Create follow-up content diving deeper into viewer questions.`,
    });
  } else if (engagementWeak) {
    keyFindings.push({
      finding: `Low engagement relative to views`,
      dataPoint: `${engagementRate.toFixed(2)}% engagement rate`,
      significance: "negative",
      recommendation: `Ask a specific, easy-to-answer question. "What's your experience with ${mainTopic}?" drives 3x more comments.`,
    });
  }

  if (subsStrong) {
    keyFindings.push({
      finding: `Strong subscriber conversion`,
      dataPoint: `${subsPer1k.toFixed(2)} subs per 1K views`,
      significance: "positive",
      recommendation: `This topic attracts your ideal audience. Create more content in this category.`,
    });
  } else if (subsWeak) {
    keyFindings.push({
      finding: `Subscribers not converting from views`,
      dataPoint: `${subsPer1k.toFixed(2)} subs per 1K views`,
      significance: "negative",
      recommendation: `Add a subscribe CTA at the moment of highest value delivery - not just at the end.`,
    });
  }

  if (viewsPerDay > 500) {
    keyFindings.push({
      finding: `High velocity indicates algorithm favor`,
      dataPoint: `${viewsPerDay.toFixed(0)} views/day`,
      significance: "positive",
      recommendation: `Ride this momentum - post a related video within 7 days to capture the interested audience.`,
    });
  } else if (viewsPerDay < 50) {
    keyFindings.push({
      finding: `Low daily views suggest limited reach`,
      dataPoint: `${viewsPerDay.toFixed(0)} views/day`,
      significance: "negative",
      recommendation: `Consider updating the title/thumbnail. A/B test with a more curiosity-driven hook.`,
    });
  }

  // Build wins and leaks based on THIS video's performance
  const wins: Array<{ label: string; why: string; metricKey: string }> = [];
  const leaks: Array<{ label: string; why: string; metricKey: string }> = [];

  if (retentionStrong)
    wins.push({
      label: `${avgViewed.toFixed(0)}% retention`,
      why: `Above the 45% target for ${duration}min videos - your pacing works`,
      metricKey: "avdRatio",
    });
  else if (retentionWeak)
    leaks.push({
      label: `${avgViewed.toFixed(0)}% retention`,
      why: `Below target - viewers are leaving before your key insights`,
      metricKey: "avdRatio",
    });

  if (engagementStrong)
    wins.push({
      label: `${engagementRate.toFixed(1)}% engagement`,
      why: `This topic sparked real discussion - viewers care`,
      metricKey: "engagementPerView",
    });
  else if (engagementWeak)
    leaks.push({
      label: `${engagementRate.toFixed(1)}% engagement`,
      why: `Viewers watched but didn't interact - add more prompts`,
      metricKey: "engagementPerView",
    });

  if (subsStrong)
    wins.push({
      label: `${subsPer1k.toFixed(1)} subs/1K`,
      why: `Converting viewers to subscribers effectively`,
      metricKey: "subsPer1k",
    });
  else if (subsWeak)
    leaks.push({
      label: `${subsPer1k.toFixed(1)} subs/1K`,
      why: `Missing subscribe conversions - CTA timing matters`,
      metricKey: "subsPer1k",
    });

  // Build actions based on THIS video's specific weaknesses
  const actions: Array<{
    lever: string;
    action: string;
    reason: string;
    expectedImpact: string;
    priority: string;
  }> = [];

  if (retentionWeak) {
    actions.push({
      lever: "Retention",
      action: `Add a "here's what's coming" preview at the 30-second mark`,
      reason: `Your ${avgViewed.toFixed(0)}% retention suggests early drop-off`,
      expectedImpact: "+8-15% average view duration",
      priority: "high",
    });
    actions.push({
      lever: "Retention",
      action: `Insert pattern interrupts (B-roll, graphics, story) every ${Math.max(
        2,
        Math.floor(duration / 4)
      )} minutes`,
      reason: `${duration}-minute videos need visual variety to maintain attention`,
      expectedImpact: "+5-10% retention in mid-video",
      priority: "high",
    });
  }

  if (engagementWeak) {
    actions.push({
      lever: "Engagement",
      action: `Pin a comment asking: "What's your biggest challenge with ${mainTopic}?"`,
      reason: `Low engagement often means viewers don't have an easy entry point to comment`,
      expectedImpact: "+20-40% comment rate",
      priority: "medium",
    });
  }

  if (subsWeak) {
    actions.push({
      lever: "Conversion",
      action: `Move your subscribe CTA to immediately after your first valuable insight (around ${Math.floor(
        duration * 0.25
      )}:00)`,
      reason: `Only ${subsPer1k.toFixed(
        1
      )} subs/1K means viewers aren't hearing or acting on your CTA`,
      expectedImpact: "+0.5-1.0 subs per 1K views",
      priority: "high",
    });
  }

  if (titleScore < 7) {
    actions.push({
      lever: "Discovery",
      action: `A/B test a new title: "${titleSuggestions[0]}"`,
      reason: `Your title scores ${titleScore}/10 - ${
        titleWeaknesses[0] ?? "there's room to optimize"
      }`,
      expectedImpact: "+15-30% click-through rate",
      priority: "high",
    });
  }

  if (missingTags.length > 0) {
    actions.push({
      lever: "Discovery",
      action: missingTags[0],
      reason: `Expanding your tag coverage helps YouTube understand and recommend your content`,
      expectedImpact: "+10-20% search impressions",
      priority: "medium",
    });
  }

  // Ensure we have at least 3 actions
  if (actions.length < 3) {
    actions.push({
      lever: "Engagement",
      action: `End the video with a specific question: "Comment below: ${mainTopic} - what worked for you?"`,
      reason: `Specific questions get 3x more comments than generic CTAs`,
      expectedImpact: "+15-25% comment rate",
      priority: "medium",
    });
  }

  // Build thumbnail hints based on THIS video's title
  const thumbnailHints = [
    `Show a visual that represents "${mainTopic}" - make viewers curious`,
    hasNumber
      ? `Display the number "${
          title.match(/\d+/)?.[0]
        }" prominently in the thumbnail`
      : `Consider adding a specific number as text overlay`,
    `Your face showing ${
      isHighPerformer ? "excitement/celebration" : "curiosity/intrigue"
    } matching the title energy`,
    `Use contrasting colors (complementary to your brand) to stand out in suggested videos`,
  ];

  // Build remix ideas based on THIS video's topic
  const remixIdeas = [
    {
      title: `${mainTopic}: The Mistakes Everyone Makes (And How to Avoid Them)`,
      hook: `After my video on "${title.slice(
        0,
        40
      )}...", so many of you had questions about what NOT to do...`,
      keywords: [mainTopic.toLowerCase(), "mistakes", "avoid", "tips"],
      inspiredByVideoIds: [],
    },
    {
      title: `I Tested ${mainTopic} for 30 Days - The Results Shocked Me`,
      hook: `You asked for proof. So I spent an entire month testing everything I talked about in my ${mainTopic} video...`,
      keywords: [mainTopic.toLowerCase(), "experiment", "results", "30 days"],
      inspiredByVideoIds: [],
    },
    {
      title: `${mainTopic} for Complete Beginners (Start Here)`,
      hook: `A lot of you said my last video on ${mainTopic} was too advanced. This is the beginner's version...`,
      keywords: [mainTopic.toLowerCase(), "beginner", "tutorial", "start"],
      inspiredByVideoIds: [],
    },
  ];

  return {
    summary: {
      headline,
      oneLiner,
    },
    titleAnalysis: {
      score: titleScore,
      strengths:
        titleStrengths.length > 0
          ? titleStrengths
          : ["Title is clear and readable"],
      weaknesses:
        titleWeaknesses.length > 0
          ? titleWeaknesses
          : ["Could test more curiosity-driven variations"],
      suggestions: titleSuggestions.slice(0, 3),
    },
    tagAnalysis: {
      score: tagScore,
      coverage:
        tagCount >= 10 ? "good" : tagCount >= 5 ? "moderate" : "limited",
      missing:
        missingTags.length > 0
          ? missingTags
          : ["Tags look well-optimized - consider adding trending variations"],
      feedback:
        tagCount < 5
          ? `Only ${tagCount} tags detected - you're leaving search traffic on the table`
          : `${tagCount} tags covering the basics. Add year-specific and skill-level variations for more reach.`,
    },
    thumbnailHints,
    keyFindings,
    wins:
      wins.length > 0
        ? wins
        : [
            {
              label: "Baseline performance",
              why: "Metrics are at channel average",
              metricKey: "views",
            },
          ],
    leaks:
      leaks.length > 0
        ? leaks
        : [
            {
              label: "Opportunity to optimize",
              why: "No critical issues, but room for growth",
              metricKey: "views",
            },
          ],
    actions,
    experiments: [
      {
        type: "Title",
        test: [
          titleSuggestions[0] ?? "Add a specific number",
          `"${hasQuestion ? "Statement version" : "Question version"}: ${
            hasQuestion ? title.replace("?", "") : title + "?"
          }"`,
          `Add "[Year]" at the end for freshness signals`,
        ],
        successMetric: "CTR improvement in Analytics",
      },
      {
        type: "Hook",
        test: [
          `Open with the result: "After doing ${mainTopic}, here's what happened..."`,
          `Start with a surprising stat about ${mainTopic}`,
          `Begin with viewer pain point: "If you've struggled with ${mainTopic}..."`,
        ],
        successMetric: "First 30s retention",
      },
    ],
    packaging: {
      titleAngles: [
        hasNumber
          ? "Your number hook is working - test different numbers"
          : `Add a specific number: "5 ${mainTopic} Tips..."`,
        hasPowerWords
          ? "Power words are good - ensure they match content delivery"
          : "Add emotional trigger words",
        hasHowTo
          ? "How-to format converts - stay consistent"
          : `Test "How I..." personal framing`,
      ],
      hookSetups: [
        `Show the transformation/result from ${mainTopic} in the first 3 seconds`,
        `Open with a bold claim about ${mainTopic} - then prove it`,
        `Start with viewer frustration, then promise the solution`,
      ],
      visualMoments: [
        `Before/after comparison related to ${mainTopic}`,
        `Screen recording or demo showing ${mainTopic} in action`,
        `Your genuine reaction to results`,
      ],
    },
    competitorTakeaways: [
      {
        channelName: "Top creators covering similar topics",
        insight: `Videos about "${mainTopic}" that use numbered lists tend to rank higher`,
        applicableAction: `Structure your next ${mainTopic} video as a list format`,
      },
    ],
    remixIdeas,
  };
}

/**
 * Test mode fixture for IdeaBoard generation
 */
export function getTestModeIdeaBoardResponse() {
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
          text: `youtube algorithm ${CURRENT_YEAR}`,
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
          text: `My Favorite Tools and Resources (${CURRENT_YEAR} Edition)`,
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
export function getTestModeMoreIdeasResponse() {
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
