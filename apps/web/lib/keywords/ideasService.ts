/**
 * Keywords Ideas Service
 *
 * Orchestrates the flow: User topic → LLM seeds → DataForSEO K4K + Volume → LLM video ideas
 *
 * Flow:
 * 1. User provides topic description
 * 2. LLM #1 generates 10-20 seed keywords
 * 3. DataForSEO Keywords For Keywords expands seeds to candidates
 * 4. DataForSEO Search Volume enriches top candidates
 * 5. LLM #2 generates video ideas using enriched keyword data
 */

import "server-only";
import { z } from "zod";

import { callLLM } from "@/lib/llm";
import { logger } from "@/lib/shared/logger";
import {
  postKeywordsForKeywordsTask,
  getKeywordsForKeywordsTask,
  postSearchVolumeTask,
  getSearchVolumeTask,
  type RelatedKeywordRow,
  type KeywordMetrics,
} from "@/lib/dataforseo/client";
import { validateLocation } from "@/lib/dataforseo/utils";

// ============================================
// TYPES
// ============================================

export type AudienceLevel = "beginner" | "intermediate" | "advanced" | "all";
export type FormatPreference = "shorts" | "longform" | "mixed";

type GenerateIdeasInput = {
  topicDescription: string;
  locationCode?: string;
  languageCode?: string;
  audienceLevel?: AudienceLevel;
  formatPreference?: FormatPreference;
};

type VideoIdea = {
  id: string;
  title: string;
  hook: string;
  format: "shorts" | "longform";
  targetKeyword: string;
  whyItWins: string;
  outline: string[];
  seoNotes: {
    primaryKeyword: string;
    supportingKeywords: string[];
  };
};

type EnrichedKeyword = {
  keyword: string;
  searchVolume: number;
  competitionIndex: number;
  cpc: number;
  trend: number[];
  difficultyEstimate: number;
  intent: string | null;
};

type GenerateIdeasResult = {
  ideas: VideoIdea[];
  keywords: EnrichedKeyword[];
  seedKeywords: string[];
  meta: {
    topicDescription: string;
    location: string;
    generatedAt: string;
    cached?: boolean;
  };
};

// ============================================
// CONFIGURATION
// ============================================

const SEED_KEYWORD_COUNT_MIN = 10;
const SEED_KEYWORD_COUNT_MAX = 20;
const K4K_LIMIT = 500; // Max keywords from Keywords For Keywords
const VOLUME_ENRICHMENT_TOP_N = 500; // Enrich top N candidates with search volume
const VIDEO_IDEAS_COUNT = 12; // Number of video ideas to generate
const TASK_POLL_MAX_WAIT_MS = 12000;
const TASK_POLL_INTERVALS_MS = [500, 1000, 2000, 3000, 4000];

// Forbidden categories for seed keywords (safety)
const FORBIDDEN_PATTERNS = [
  /\b(weapon|gun|firearm|explosive|bomb)\b/i,
  /\b(tobacco|cigarette|vaping|vape|nicotine)\b/i,
  /\b(drug|narcotic|cocaine|heroin|meth)\b/i,
  /\b(violence|violent|murder|kill|terror)\b/i,
  /\b(terrorism|terrorist|extremist)\b/i,
];

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizeTopicDescription(topic: string): string {
  // Remove potential prompt injection attempts
  let sanitized = topic
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/system:|user:|assistant:/gi, "") // Remove role markers
    .replace(/ignore previous|forget everything|new instructions/gi, "") // Common injection patterns
    .replace(/[<>{}[\]]/g, "") // Remove brackets that might be used for injection
    .trim();

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.slice(0, 500);
  }

  return sanitized;
}

/**
 * Validate a seed keyword meets our constraints
 */
function isValidSeedKeyword(keyword: string): boolean {
  const trimmed = keyword.trim().toLowerCase();

  // Length constraints
  if (trimmed.length === 0 || trimmed.length > 80) return false;

  // Word count constraint
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 10) return false;

  // No emojis
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(trimmed)) {
    return false;
  }

  // Check forbidden categories
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  return true;
}

/**
 * Normalize and dedupe keywords
 */
function normalizeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const kw of keywords) {
    const normalized = kw.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

/**
 * Generate deterministic fallback seeds from topic description
 */
function generateFallbackSeeds(topic: string): string[] {
  const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const seeds: string[] = [];

  // Extract key phrases (2-3 word combinations)
  if (words.length >= 2) {
    seeds.push(words.slice(0, 2).join(" "));
    seeds.push(words.slice(0, 3).join(" "));
  }

  // Add template variations
  const templates = [
    "how to",
    "best",
    "for beginners",
    "tutorial",
    "tips",
    "mistakes",
    "guide",
  ];

  const corePhrase = words.slice(0, 2).join(" ");
  for (const template of templates) {
    if (template === "how to" || template === "best") {
      seeds.push(`${template} ${corePhrase}`);
    } else {
      seeds.push(`${corePhrase} ${template}`);
    }
  }

  return normalizeKeywords(seeds).slice(0, SEED_KEYWORD_COUNT_MIN);
}

// ============================================
// LLM #1: GENERATE SEED KEYWORDS FROM TOPIC
// ============================================

const SeedKeywordsSchema = z.object({
  seed_keywords: z.array(z.string()).min(5).max(25),
});

/**
 * Generate 10-20 seed keywords from a topic description using LLM
 */
async function generateSeedKeywordsFromTopic(input: {
  topicDescription: string;
  audienceLevel?: AudienceLevel;
  formatPreference?: FormatPreference;
}): Promise<string[]> {
  const { topicDescription, audienceLevel = "all", formatPreference = "mixed" } = input;

  const sanitizedTopic = sanitizeTopicDescription(topicDescription);
  if (!sanitizedTopic || sanitizedTopic.length < 3) {
    logger.warn("keywords.ideas.invalid_topic", { topic: topicDescription });
    return generateFallbackSeeds(topicDescription);
  }

  const audienceContext = audienceLevel !== "all"
    ? `Target audience: ${audienceLevel} level viewers.`
    : "";

  const formatContext = formatPreference === "shorts"
    ? "Focus on topics suitable for short-form vertical video (under 60 seconds)."
    : formatPreference === "longform"
    ? "Focus on topics suitable for long-form content (8-20+ minutes)."
    : "Include a mix of topics for both short-form and long-form content.";

  const systemPrompt = `You are a YouTube keyword research expert. Generate seed keywords for discovering video ideas.

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{"seed_keywords": ["keyword 1", "keyword 2", ...]}

RULES:
1. Generate exactly 15 seed keywords
2. Each keyword MUST be:
   - Under 80 characters
   - Under 10 words
   - No emojis
   - Lowercase
   - Safe for all audiences (no weapons, drugs, violence, tobacco, terrorism)
3. Include a MIX of:
   - 2-3 broad head terms (1-2 words)
   - 5-8 mid-tail phrases (2-4 words)
   - 4-6 long-tail questions/phrases (4-8 words)
4. Use YouTube-friendly phrasing:
   - "how to [action]"
   - "best [thing] for [audience]"
   - "[topic] for beginners"
   - "[topic] mistakes"
   - "[thing] vs [thing]"
   - "[thing] review"
   - "[thing] setup"
   - "[topic] tutorial"
5. Ensure variety - no near-duplicates
6. Focus on searchable, discoverable terms

${audienceContext}
${formatContext}

CRITICAL: Output ONLY the JSON object. No explanation, no markdown, no other text.`;

  const userPrompt = `Generate 15 YouTube seed keywords for this topic:

"${sanitizedTopic}"

Return ONLY JSON: {"seed_keywords": [...]}`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.5,
        maxTokens: 800,
        responseFormat: "json_object",
      }
    );

    // Parse and validate
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn("keywords.ideas.seed_parse_failed", { response: response.content.slice(0, 200) });
      return generateFallbackSeeds(sanitizedTopic);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = SeedKeywordsSchema.safeParse(parsed);

    if (!validated.success) {
      logger.warn("keywords.ideas.seed_validation_failed", { error: validated.error.message });
      return generateFallbackSeeds(sanitizedTopic);
    }

    // Filter valid keywords and normalize
    const validKeywords = validated.data.seed_keywords
      .filter(isValidSeedKeyword)
      .map((k) => k.trim().toLowerCase());

    const normalized = normalizeKeywords(validKeywords);

    if (normalized.length < SEED_KEYWORD_COUNT_MIN) {
      logger.warn("keywords.ideas.insufficient_seeds", { count: normalized.length });
      // Supplement with fallback seeds
      const fallback = generateFallbackSeeds(sanitizedTopic);
      return normalizeKeywords([...normalized, ...fallback]).slice(0, SEED_KEYWORD_COUNT_MAX);
    }

    logger.info("keywords.ideas.seeds_generated", { count: normalized.length });
    return normalized.slice(0, SEED_KEYWORD_COUNT_MAX);

  } catch (err) {
    logger.error("keywords.ideas.seed_generation_error", { error: String(err) });
    // Retry once with stricter prompt
    try {
      const retryResponse = await callLLM(
        [
          {
            role: "system",
            content: `You are a keyword generator. Output ONLY a JSON object with seed_keywords array. No other text.
Example: {"seed_keywords": ["how to cook pasta", "best budget camera", "photography tips"]}`,
          },
          {
            role: "user",
            content: `Generate 12 keyword phrases for: "${sanitizedTopic}"
Output: {"seed_keywords": [...]}`,
          },
        ],
        { temperature: 0.3, maxTokens: 500, responseFormat: "json_object" }
      );

      const retryMatch = retryResponse.content.match(/\{[\s\S]*\}/);
      if (retryMatch) {
        const retryParsed = JSON.parse(retryMatch[0]);
        if (Array.isArray(retryParsed.seed_keywords)) {
          const retryValid = retryParsed.seed_keywords
            .filter(isValidSeedKeyword)
            .map((k: string) => k.trim().toLowerCase());
          if (retryValid.length >= 5) {
            return normalizeKeywords(retryValid).slice(0, SEED_KEYWORD_COUNT_MAX);
          }
        }
      }
    } catch {
      // Retry also failed
    }

    return generateFallbackSeeds(sanitizedTopic);
  }
}

// ============================================
// DATAFORSEO: KEYWORDS FOR KEYWORDS + VOLUME
// ============================================

/**
 * Fetch related keywords using DataForSEO Keywords For Keywords
 */
async function fetchKeywordsForKeywords(
  seeds: string[],
  location: string
): Promise<RelatedKeywordRow[]> {
  const locationInfo = validateLocation(location);

  // Post task
  const postResult = await postKeywordsForKeywordsTask({
    keywords: seeds.slice(0, 20), // DataForSEO limit
    location: locationInfo.region,
    limit: K4K_LIMIT,
  });

  const taskId = postResult.taskId;

  // Poll for results
  const startTime = Date.now();
  let attemptIndex = 0;

  while (Date.now() - startTime < TASK_POLL_MAX_WAIT_MS) {
    const waitTime = TASK_POLL_INTERVALS_MS[attemptIndex] ?? 2000;
    await sleep(waitTime);

    const result = await getKeywordsForKeywordsTask(taskId);

    if (result.status === "completed") {
      logger.info("keywords.ideas.k4k_completed", {
        taskId,
        keywordCount: result.data?.length ?? 0,
        waitTimeMs: Date.now() - startTime,
      });
      return result.data ?? [];
    }

    if (result.status === "error") {
      logger.error("keywords.ideas.k4k_error", { taskId, error: result.error });
      throw new Error(result.error || "Keywords For Keywords task failed");
    }

    attemptIndex++;
  }

  logger.warn("keywords.ideas.k4k_timeout", { taskId });
  return [];
}

/**
 * Enrich keywords with search volume data
 */
async function enrichWithSearchVolume(
  keywords: string[],
  location: string
): Promise<Map<string, KeywordMetrics>> {
  if (keywords.length === 0) return new Map();

  const locationInfo = validateLocation(location);
  const keywordsToEnrich = keywords.slice(0, VOLUME_ENRICHMENT_TOP_N);

  // Split into chunks to avoid near-duplicates in same request
  const chunkSize = 200;
  const chunks: string[][] = [];
  for (let i = 0; i < keywordsToEnrich.length; i += chunkSize) {
    chunks.push(keywordsToEnrich.slice(i, i + chunkSize));
  }

  const results = new Map<string, KeywordMetrics>();

  for (const chunk of chunks) {
    try {
      const postResult = await postSearchVolumeTask({
        keywords: chunk,
        location: locationInfo.region,
      });

      const taskId = postResult.taskId;
      const startTime = Date.now();
      let attemptIndex = 0;

      while (Date.now() - startTime < TASK_POLL_MAX_WAIT_MS) {
        const waitTime = TASK_POLL_INTERVALS_MS[attemptIndex] ?? 2000;
        await sleep(waitTime);

        const result = await getSearchVolumeTask(taskId);

        if (result.status === "completed" && result.data) {
          for (const item of result.data) {
            results.set(item.keyword.toLowerCase(), item);
          }
          break;
        }

        if (result.status === "error") {
          logger.warn("keywords.ideas.volume_chunk_error", { error: result.error });
          break;
        }

        attemptIndex++;
      }
    } catch (err) {
      logger.warn("keywords.ideas.volume_chunk_failed", { error: String(err) });
    }
  }

  logger.info("keywords.ideas.volume_enriched", { count: results.size });
  return results;
}

/**
 * Rank and filter keywords for video idea generation
 */
function rankKeywords(
  k4kResults: RelatedKeywordRow[],
  volumeData: Map<string, KeywordMetrics>
): EnrichedKeyword[] {
  const enriched: EnrichedKeyword[] = [];

  for (const row of k4kResults) {
    const volumeInfo = volumeData.get(row.keyword.toLowerCase());

    enriched.push({
      keyword: row.keyword,
      searchVolume: volumeInfo?.searchVolume ?? row.searchVolume,
      competitionIndex: volumeInfo?.competitionIndex ?? row.competitionIndex,
      cpc: volumeInfo?.cpc ?? row.cpc,
      trend: volumeInfo?.trend ?? row.trend,
      difficultyEstimate: volumeInfo?.difficultyEstimate ?? row.difficultyEstimate,
      intent: volumeInfo?.intent ?? row.intent ?? null,
    });
  }

  // Sort by a score combining volume and low competition
  enriched.sort((a, b) => {
    // Higher volume is better, lower competition is better
    const aScore = (a.searchVolume || 0) * (1 - (a.competitionIndex || 50) / 100);
    const bScore = (b.searchVolume || 0) * (1 - (b.competitionIndex || 50) / 100);
    return bScore - aScore;
  });

  return enriched;
}

// ============================================
// LLM #2: GENERATE VIDEO IDEAS FROM KEYWORD DATA
// ============================================

const VideoIdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      hook: z.string(),
      format: z.enum(["shorts", "longform"]),
      target_keyword: z.string(),
      why_it_wins: z.string(),
      outline: z.array(z.string()),
      seo_notes: z.object({
        primary_keyword: z.string(),
        supporting_keywords: z.array(z.string()),
      }),
    })
  ),
});

/**
 * Generate video ideas using enriched keyword data
 */
async function generateVideoIdeasFromKeywordData(input: {
  topicDescription: string;
  seedKeywords: string[];
  enrichedKeywords: EnrichedKeyword[];
  audienceLevel?: AudienceLevel;
  formatPreference?: FormatPreference;
}): Promise<VideoIdea[]> {
  const {
    topicDescription,
    seedKeywords,
    enrichedKeywords,
    audienceLevel = "all",
    formatPreference = "mixed",
  } = input;

  const sanitizedTopic = sanitizeTopicDescription(topicDescription);

  // Select top keywords for the prompt (limit context size)
  const topKeywords = enrichedKeywords.slice(0, 50);

  const keywordContext = topKeywords
    .map((k) => {
      const volumeStr = k.searchVolume > 0 ? `vol: ${k.searchVolume.toLocaleString()}` : "vol: unknown";
      const compStr = k.competitionIndex > 0 ? `comp: ${k.competitionIndex}` : "";
      const trendStr = k.trend.length > 0
        ? (k.trend[k.trend.length - 1] > k.trend[0] ? "↑ rising" : k.trend[k.trend.length - 1] < k.trend[0] ? "↓ declining" : "→ stable")
        : "";
      return `- "${k.keyword}" (${[volumeStr, compStr, trendStr].filter(Boolean).join(", ")})`;
    })
    .join("\n");

  const formatInstructions = formatPreference === "shorts"
    ? "Generate ALL ideas for YouTube Shorts format (under 60 seconds, vertical video)."
    : formatPreference === "longform"
    ? "Generate ALL ideas for long-form format (8-20+ minutes)."
    : "Generate a MIX of ideas: about half for Shorts, half for long-form.";

  const audienceInstructions = audienceLevel !== "all"
    ? `Target audience: ${audienceLevel} level. Adjust complexity and depth accordingly.`
    : "";

  const systemPrompt = `You are a YouTube content strategist helping creators find winning video ideas backed by keyword data.

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{
  "ideas": [
    {
      "title": "Specific, compelling video title",
      "hook": "Opening line that grabs attention in first 3 seconds",
      "format": "shorts" or "longform",
      "target_keyword": "primary keyword from the data",
      "why_it_wins": "One sentence explaining why this video will perform well, referencing keyword signals",
      "outline": ["Point 1", "Point 2", "Point 3"],
      "seo_notes": {
        "primary_keyword": "main keyword to target",
        "supporting_keywords": ["related keyword 1", "related keyword 2"]
      }
    }
  ]
}

RULES:
1. Generate exactly ${VIDEO_IDEAS_COUNT} video ideas
2. Each idea MUST target a keyword from the provided data
3. Reference keyword signals in "why_it_wins":
   - "rising trend" if trend is increasing
   - "low competition" if competition index < 40
   - "solid volume" if search volume > 1000
   - "long-tail opportunity" for specific phrases
4. DO NOT hallucinate metrics - only cite values from the provided data
5. If metrics are missing, don't claim volume/difficulty
6. Titles should be specific, clickable, and include the target keyword naturally
7. Hooks should be conversational and create curiosity
8. Outlines should be 3-5 actionable points
9. Be creator-first: practical, filmable ideas - not SEO-slop

${formatInstructions}
${audienceInstructions}

CRITICAL: Output ONLY the JSON object. No markdown, no explanation.`;

  const userPrompt = `Generate ${VIDEO_IDEAS_COUNT} video ideas for this creator:

TOPIC: "${sanitizedTopic}"

SEED KEYWORDS: ${seedKeywords.join(", ")}

KEYWORD DATA (with metrics):
${keywordContext}

Create practical, filmable video ideas that target these keywords. Reference the data in your reasoning.

Return ONLY JSON.`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.6,
        maxTokens: 3000,
        responseFormat: "json_object",
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn("keywords.ideas.video_ideas_parse_failed");
      return generateFallbackVideoIdeas(topKeywords, formatPreference);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = VideoIdeasSchema.safeParse(parsed);

    if (!validated.success) {
      logger.warn("keywords.ideas.video_ideas_validation_failed", { error: validated.error.message });
      return generateFallbackVideoIdeas(topKeywords, formatPreference);
    }

    // Transform to our type
    const ideas: VideoIdea[] = validated.data.ideas.map((idea, index) => ({
      id: `idea-${index + 1}`,
      title: idea.title,
      hook: idea.hook,
      format: idea.format,
      targetKeyword: idea.target_keyword,
      whyItWins: idea.why_it_wins,
      outline: idea.outline,
      seoNotes: {
        primaryKeyword: idea.seo_notes.primary_keyword,
        supportingKeywords: idea.seo_notes.supporting_keywords,
      },
    }));

    logger.info("keywords.ideas.video_ideas_generated", { count: ideas.length });
    return ideas;

  } catch (err) {
    logger.error("keywords.ideas.video_ideas_error", { error: String(err) });

    // Retry with simpler prompt
    try {
      const retryResponse = await callLLM(
        [
          {
            role: "system",
            content: `Generate video ideas. Output ONLY JSON: {"ideas": [{title, hook, format, target_keyword, why_it_wins, outline, seo_notes}]}`,
          },
          {
            role: "user",
            content: `Topic: "${sanitizedTopic}". Keywords: ${topKeywords.slice(0, 10).map(k => k.keyword).join(", ")}. Generate 6 ideas.`,
          },
        ],
        { temperature: 0.5, maxTokens: 2000, responseFormat: "json_object" }
      );

      const retryMatch = retryResponse.content.match(/\{[\s\S]*\}/);
      if (retryMatch) {
        const retryParsed = JSON.parse(retryMatch[0]);
        if (Array.isArray(retryParsed.ideas)) {
          return retryParsed.ideas.slice(0, VIDEO_IDEAS_COUNT).map((idea: any, index: number) => ({
            id: `idea-${index + 1}`,
            title: idea.title || `Video about ${topKeywords[index]?.keyword || "this topic"}`,
            hook: idea.hook || "Let me show you something interesting...",
            format: idea.format === "shorts" ? "shorts" : "longform",
            targetKeyword: idea.target_keyword || topKeywords[index]?.keyword || "",
            whyItWins: idea.why_it_wins || "Targets a relevant keyword with search demand",
            outline: Array.isArray(idea.outline) ? idea.outline : ["Introduction", "Main content", "Conclusion"],
            seoNotes: {
              primaryKeyword: idea.seo_notes?.primary_keyword || idea.target_keyword || "",
              supportingKeywords: Array.isArray(idea.seo_notes?.supporting_keywords) ? idea.seo_notes.supporting_keywords : [],
            },
          }));
        }
      }
    } catch {
      // Retry also failed
    }

    return generateFallbackVideoIdeas(topKeywords, formatPreference);
  }
}

/**
 * Generate deterministic fallback video ideas
 */
function generateFallbackVideoIdeas(
  keywords: EnrichedKeyword[],
  formatPreference: FormatPreference
): VideoIdea[] {
  const templates = [
    { prefix: "How to", suffix: "for Beginners", format: "longform" as const },
    { prefix: "5 Best", suffix: "Tips", format: "shorts" as const },
    { prefix: "Complete Guide to", suffix: "", format: "longform" as const },
    { prefix: "", suffix: "Mistakes to Avoid", format: "shorts" as const },
    { prefix: "Why", suffix: "Matters", format: "longform" as const },
    { prefix: "Quick", suffix: "Tutorial", format: "shorts" as const },
  ];

  const ideas: VideoIdea[] = [];
  const usedKeywords = new Set<string>();

  for (let i = 0; i < Math.min(VIDEO_IDEAS_COUNT, keywords.length); i++) {
    const kw = keywords[i];
    if (usedKeywords.has(kw.keyword)) continue;
    usedKeywords.add(kw.keyword);

    const template = templates[i % templates.length];
    const format = formatPreference === "mixed"
      ? template.format
      : formatPreference === "shorts"
      ? "shorts"
      : "longform";

    const title = template.prefix
      ? `${template.prefix} ${kw.keyword}${template.suffix ? " " + template.suffix : ""}`
      : `${kw.keyword} ${template.suffix}`;

    ideas.push({
      id: `idea-${i + 1}`,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      hook: `Here's what you need to know about ${kw.keyword}...`,
      format,
      targetKeyword: kw.keyword,
      whyItWins: kw.searchVolume > 1000
        ? `Targets "${kw.keyword}" with ${kw.searchVolume.toLocaleString()} monthly searches`
        : `Targets the keyword "${kw.keyword}"`,
      outline: ["Introduction", "Key points", "Summary and next steps"],
      seoNotes: {
        primaryKeyword: kw.keyword,
        supportingKeywords: keywords.slice(i + 1, i + 4).map((k) => k.keyword),
      },
    });
  }

  return ideas;
}

// ============================================
// MAIN ORCHESTRATION
// ============================================

/**
 * Main orchestration function for generating video ideas from a topic
 *
 * Flow:
 * 1. LLM #1: Generate seed keywords from topic
 * 2. DataForSEO: Keywords For Keywords to expand seeds
 * 3. DataForSEO: Search Volume to enrich top candidates
 * 4. LLM #2: Generate video ideas using enriched data
 */
export async function generateVideoIdeasFromTopic(
  input: GenerateIdeasInput
): Promise<GenerateIdeasResult> {
  const {
    topicDescription,
    locationCode = "us",
    audienceLevel = "all",
    formatPreference = "mixed",
  } = input;

  const startTime = Date.now();
  logger.info("keywords.ideas.orchestration_start", { topic: topicDescription.slice(0, 100) });

  // Step 1: Generate seed keywords
  const seedKeywords = await generateSeedKeywordsFromTopic({
    topicDescription,
    audienceLevel,
    formatPreference,
  });

  logger.info("keywords.ideas.step1_complete", { seedCount: seedKeywords.length });

  // Step 2: Keywords For Keywords
  let k4kResults: RelatedKeywordRow[] = [];
  try {
    k4kResults = await fetchKeywordsForKeywords(seedKeywords, locationCode);
  } catch (err) {
    logger.error("keywords.ideas.k4k_failed", { error: String(err) });
    // Continue with seed keywords only
  }

  logger.info("keywords.ideas.step2_complete", { k4kCount: k4kResults.length });

  // Step 3: Enrich with search volume
  const keywordsToEnrich = k4kResults.length > 0
    ? k4kResults.map((r) => r.keyword)
    : seedKeywords;

  let volumeData = new Map<string, KeywordMetrics>();
  try {
    volumeData = await enrichWithSearchVolume(keywordsToEnrich, locationCode);
  } catch (err) {
    logger.error("keywords.ideas.volume_failed", { error: String(err) });
    // Continue without volume data
  }

  logger.info("keywords.ideas.step3_complete", { volumeCount: volumeData.size });

  // Rank and prepare enriched keywords
  const enrichedKeywords = k4kResults.length > 0
    ? rankKeywords(k4kResults, volumeData)
    : seedKeywords.map((kw) => {
        const vol = volumeData.get(kw.toLowerCase());
        return {
          keyword: kw,
          searchVolume: vol?.searchVolume ?? 0,
          competitionIndex: vol?.competitionIndex ?? 50,
          cpc: vol?.cpc ?? 0,
          trend: vol?.trend ?? [],
          difficultyEstimate: vol?.difficultyEstimate ?? 50,
          intent: vol?.intent ?? null,
        };
      });

  // Step 4: Generate video ideas
  const ideas = await generateVideoIdeasFromKeywordData({
    topicDescription,
    seedKeywords,
    enrichedKeywords,
    audienceLevel,
    formatPreference,
  });

  logger.info("keywords.ideas.step4_complete", { ideasCount: ideas.length });

  const elapsed = Date.now() - startTime;
  logger.info("keywords.ideas.orchestration_complete", { elapsedMs: elapsed });

  return {
    ideas,
    keywords: enrichedKeywords.slice(0, 100), // Return top 100 keywords
    seedKeywords,
    meta: {
      topicDescription,
      location: locationCode,
      generatedAt: new Date().toISOString(),
    },
  };
}
