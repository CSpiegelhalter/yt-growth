import { callLLM } from "@/lib/llm";
import { prisma } from "@/prisma";

import { SuggestionError } from "../errors";
import type {
  CompetitorBackedSuggestionContext,
  CompetitorVideoForContext,
  GenerateSuggestionsInput,
  NicheKeywordForContext,
  SourceProvenance,
  SourceVideoSnapshot,
  SuggestionContext,
  VideoSuggestion,
} from "../types";
import { buildContextPromptParts } from "./buildContextPrompt";
import { findCompetitorKeywordGaps } from "./competitorKeywordGaps";

type LlmSuggestion = {
  title: string;
  description: string;
  sourceVideoIds?: string[];
  targetKeywords?: string[];
  pattern?: string;
  rationale?: string;
  adaptationAngle?: string;
  publishTimingHint?: string;
};

function isCompetitorBacked(
  context: SuggestionContext,
): context is CompetitorBackedSuggestionContext {
  return "competitorVideos" in context && Array.isArray((context as CompetitorBackedSuggestionContext).competitorVideos);
}

function hasKeywords(context: SuggestionContext): context is CompetitorBackedSuggestionContext & { nicheKeywords: NicheKeywordForContext[] } {
  return isCompetitorBacked(context) && Array.isArray(context.nicheKeywords) && context.nicheKeywords.length > 0;
}

// ── Composable prompt builder ───────────────────────────────

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function buildSystemPrompt(ctx: SuggestionContext): string {
  const hasCompetitorData = isCompetitorBacked(ctx) && ctx.competitorVideos.length > 0;
  const hasKeywordData = hasKeywords(ctx);

  // Base instruction
  let prompt = `You are an expert YouTube content strategist. Generate video ideas`;

  if (hasKeywordData && hasCompetitorData) {
    prompt += ` that target high-opportunity search keywords AND are validated by competitor videos performing well in the creator's niche.`;
  } else if (hasKeywordData) {
    prompt += ` that target high-opportunity search keywords in the creator's niche.`;
  } else if (hasCompetitorData) {
    prompt += ` based on competitor videos that are performing well in the creator's niche.`;
  } else {
    prompt += ` tailored to a creator's niche, audience, and recent performance.`;
  }

  // JSON schema — build fields based on available data
  const fields: string[] = [
    `"title": "A compelling, specific video title (under 80 characters)"`,
    `"description": "2-3 sentences explaining the video concept and why it would resonate"`,
  ];
  if (hasKeywordData) fields.push(`"targetKeywords": ["keyword1", "keyword2"]`);
  if (hasCompetitorData) fields.push(`"sourceVideoIds": ["id1", "id2"]`);
  if (hasCompetitorData || hasKeywordData) {
    fields.push(`"pattern": "What pattern you observed (1-2 sentences)"`);
    fields.push(`"rationale": "Why this will perform well (1-2 sentences)"`);
    fields.push(`"adaptationAngle": "How to adapt for this creator's unique channel (1-2 sentences)"`);
  }
  if (hasKeywordData) {
    fields.push(`"publishTimingHint": "When to publish for maximum impact based on keyword seasonality (1 sentence, or null if no seasonal pattern)"`);
  }

  prompt += `\n\nReturn ONLY valid JSON matching this structure:\n{\n  "suggestions": [\n    {\n      ${fields.join(",\n      ")}\n    }\n  ]\n}`;

  // Rules — composable
  const rules: string[] = [
    "Titles must be specific, clickable, and under 80 characters",
    "Ideas must be distinct from each other and from the creator's recent videos",
    "NO emojis, NO generic advice, NO filler",
  ];

  if (hasKeywordData) {
    rules.unshift("Each idea MUST target 1-2 specific keywords from the KEYWORD OPPORTUNITIES list");
    rules.push("Titles must include the target keyword naturally — no keyword stuffing");
    rules.push("Prioritize keywords with highest search volume and lowest difficulty");
  }
  if (hasCompetitorData) {
    rules.push("Each idea MUST reference 1-3 source videos by their videoId");
    rules.push("Identify a common pattern across the referenced videos");
  }

  prompt += `\n\nRULES:\n${rules.map((r) => `- ${r}`).join("\n")}`;

  return prompt;
}

function buildUserPrompt(context: SuggestionContext, count: number): string {
  const parts = buildContextPromptParts(context);

  if (context.recentVideoPerformance.length > 0) {
    const topPerformers = [...context.recentVideoPerformance]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    parts.push(
      `TOP PERFORMING VIDEOS:\n${topPerformers.map((v) => `- "${v.title}" (${v.views.toLocaleString()} views, ${v.avgViewPercentage.toFixed(0)}% avg watch)`).join("\n")}`,
    );
  }

  // Keyword opportunities section (before competitor videos for hierarchy)
  if (hasKeywords(context)) {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const kwList = context.nicheKeywords
      .slice(0, 15)
      .map((k) => {
        const ytTag = k.youtubeValidated ? " [YT validated]" : "";
        const gapTag = k.youtubeGapScore && k.youtubeGapScore > 500 ? " [LOW YouTube competition]" : "";
        const seasonTag = k.seasonalPeak ? ` [peaks in ${monthNames[k.seasonalPeak]}]` : "";
        return `- "${k.keyword}" (${formatVolume(k.searchVolume)} searches/mo, difficulty: ${k.difficulty}, ${k.trendDirection}${ytTag}${gapTag}${seasonTag})`;
      })
      .join("\n");
    parts.push(`KEYWORD OPPORTUNITIES (sorted by opportunity — high volume, low difficulty):\n${kwList}\n\nTARGET THESE KEYWORDS. Each idea should be built around 1-2 of these keywords. For seasonal keywords, note the best time to publish.`);
  }

  // Competitor videos section
  if (isCompetitorBacked(context) && context.competitorVideos.length > 0) {
    const videoList = context.competitorVideos
      .map(
        (v) =>
          `- [${v.videoId}] "${v.title}" by ${v.channelTitle} (${v.viewCount.toLocaleString()} views, ${Math.round(v.viewsPerDay).toLocaleString()} views/day, published ${v.publishedAt})`,
      )
      .join("\n");
    parts.push(`COMPETITOR VIDEOS (performing well in this niche):\n${videoList}`);
  }

  parts.push(
    `\nGenerate exactly ${count} unique video ideas that complement (not duplicate) the recent videos.`,
  );

  return parts.join("\n\n");
}

async function buildKeywordGapContext(
  userId: number,
  channelId: number,
  nicheKeywords: NicheKeywordForContext[],
): Promise<string> {
  if (nicheKeywords.length === 0) return "";
  try {
    const gaps = await findCompetitorKeywordGaps({ userId, channelId, nicheKeywords });
    if (gaps.length === 0) return "";

    const lines = gaps.slice(0, 5).map((g) => {
      if (g.source === "uncovered_opportunity") {
        return `- "${g.keyword}" — NO competitor covers this (${g.searchVolume ? `${g.searchVolume.toLocaleString()} searches/mo` : "volume unknown"})`;
      }
      return `- "${g.keyword}" — ${g.competitorCount} competitors cover this, you don't${g.searchVolume ? ` (${g.searchVolume.toLocaleString()} searches/mo)` : ""}`;
    });
    return `\n\nCOMPETITOR KEYWORD GAPS (opportunities your competitors found that you haven't):\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

// ── Keyword validation ──────────────────────────────────────

function validateTargetKeywords(
  targetKeywords: string[] | undefined,
  nicheKeywords: NicheKeywordForContext[],
): string[] {
  if (!targetKeywords || targetKeywords.length === 0) return [];
  if (nicheKeywords.length === 0) return targetKeywords.slice(0, 2);

  const validKws = new Set(nicheKeywords.map((k) => k.keyword.toLowerCase()));

  return targetKeywords
    .filter((kw) => {
      const lower = kw.toLowerCase();
      // Exact match or close substring match
      return validKws.has(lower) || [...validKws].some((v) => v.includes(lower) || lower.includes(v));
    })
    .slice(0, 2);
}

function getKeywordVolume(
  targetKeywords: string[],
  nicheKeywords: NicheKeywordForContext[],
): number {
  let total = 0;
  for (const kw of targetKeywords) {
    const match = findMatchingKeyword(kw, nicheKeywords);
    if (match) total += match.searchVolume;
  }
  return total;
}

function getKeywordDifficulty(
  targetKeywords: string[],
  nicheKeywords: NicheKeywordForContext[],
): number | null {
  if (targetKeywords.length === 0) return null;
  const difficulties: number[] = [];
  for (const kw of targetKeywords) {
    const match = findMatchingKeyword(kw, nicheKeywords);
    if (match) difficulties.push(match.difficulty);
  }
  if (difficulties.length === 0) return null;
  return Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length);
}

function findMatchingKeyword(
  kw: string,
  nicheKeywords: NicheKeywordForContext[],
): NicheKeywordForContext | undefined {
  const lower = kw.toLowerCase();
  return nicheKeywords.find((nk) =>
    nk.keyword.toLowerCase() === lower ||
    nk.keyword.toLowerCase().includes(lower) ||
    lower.includes(nk.keyword.toLowerCase()),
  );
}

function getKeywordTrend(
  targetKeywords: string[],
  nicheKeywords: NicheKeywordForContext[],
): string | null {
  if (targetKeywords.length === 0) return null;
  const match = findMatchingKeyword(targetKeywords[0], nicheKeywords);
  return match?.trendDirection ?? null;
}

function getKeywordYTValidated(
  targetKeywords: string[],
  nicheKeywords: NicheKeywordForContext[],
): boolean {
  if (targetKeywords.length === 0) return false;
  const match = findMatchingKeyword(targetKeywords[0], nicheKeywords);
  return match?.youtubeValidated ?? false;
}

function parseLlmResponse(content: string): LlmSuggestion[] {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new SuggestionError("EXTERNAL_FAILURE", "LLM did not return JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    suggestions?: LlmSuggestion[];
  };

  if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
    throw new SuggestionError(
      "EXTERNAL_FAILURE",
      "LLM returned empty suggestions",
    );
  }

  return parsed.suggestions.filter(
    (s) =>
      typeof s.title === "string" &&
      s.title.length > 0 &&
      typeof s.description === "string" &&
      s.description.length > 0,
  );
}

function buildProvenance(
  suggestion: LlmSuggestion,
  competitorVideos: CompetitorVideoForContext[],
): SourceProvenance | null {
  if (
    !suggestion.sourceVideoIds?.length ||
    !suggestion.pattern ||
    !suggestion.rationale ||
    !suggestion.adaptationAngle
  ) {
    return null;
  }

  const videoMap = new Map(competitorVideos.map((v) => [v.videoId, v]));
  const sourceVideos: SourceVideoSnapshot[] = [];

  for (const id of suggestion.sourceVideoIds.slice(0, 5)) {
    const cv = videoMap.get(id);
    if (!cv) {continue;}
    sourceVideos.push({
      videoId: cv.videoId,
      title: cv.title,
      channelId: cv.channelId,
      channelTitle: cv.channelTitle,
      thumbnailUrl: cv.thumbnailUrl,
      stats: { viewCount: cv.viewCount, viewsPerDay: cv.viewsPerDay },
      publishedAt: cv.publishedAt,
    });
  }

  if (sourceVideos.length === 0) {return null;}

  return {
    sourceVideos,
    pattern: suggestion.pattern,
    rationale: suggestion.rationale,
    adaptationAngle: suggestion.adaptationAngle,
  };
}

/**
 * Compute confidence score (1-3) based on:
 * - Source video velocity vs niche average
 * - Whether provenance was successfully extracted
 * - Adaptation angle specificity (non-empty)
 */
function computeConfidence(
  provenance: SourceProvenance | null,
  nicheAvgViewsPerDay: number | null,
): number {
  if (!provenance || provenance.sourceVideos.length === 0) return 1;

  let score = 1;

  // Velocity signal: source video significantly above niche average
  const topSource = provenance.sourceVideos[0];
  if (nicheAvgViewsPerDay && nicheAvgViewsPerDay > 0) {
    const velocityRatio = topSource.stats.viewsPerDay / nicheAvgViewsPerDay;
    if (velocityRatio >= 3) score += 1;
    if (velocityRatio >= 5) score += 1;
  } else {
    // No niche avg → give 1 point for having any provenance
    score += 1;
  }

  return Math.min(score, 3);
}

/**
 * Check existing VideoIdeas for keyword overlap with a suggestion title.
 * Returns the ID of a similar idea if found, null otherwise.
 * Uses simple token overlap ratio (no embeddings needed for 150-char summaries).
 */
async function findSimilarIdea(
  userId: number,
  channelId: number,
  title: string,
): Promise<string | null> {
  const existingIdeas = await prisma.videoIdea.findMany({
    where: { userId, channelId, status: { in: ["draft", "planned"] } },
    select: { id: true, summary: true, title: true },
    take: 50,
  });

  const titleTokens = new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((t) => t.length > 2),
  );
  if (titleTokens.size === 0) return null;

  for (const idea of existingIdeas) {
    const ideaText = (idea.title ?? idea.summary).toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const ideaTokens = new Set(ideaText.split(/\s+/).filter((t) => t.length > 2));
    if (ideaTokens.size === 0) continue;

    const overlap = [...titleTokens].filter((t) => ideaTokens.has(t)).length;
    const overlapRatio = overlap / Math.min(titleTokens.size, ideaTokens.size);

    if (overlapRatio >= 0.6) return idea.id;
  }

  return null;
}

export async function generateSuggestions(
  input: GenerateSuggestionsInput,
): Promise<VideoSuggestion[]> {
  const { userId, channelId, count, context } = input;
  const hasCompetitorData =
    isCompetitorBacked(context) && context.competitorVideos.length > 0;
  const hasKeywordData = hasKeywords(context);

  try {
    // Build keyword gap context in parallel with prompt assembly
    const nicheKwsForGap = hasKeywordData ? context.nicheKeywords : [];
    const gapContext = await buildKeywordGapContext(userId, channelId, nicheKwsForGap);
    const userPrompt = buildUserPrompt(context, count) + gapContext;

    const result = await callLLM(
      [
        { role: "system", content: buildSystemPrompt(context) },
        { role: "user", content: userPrompt },
      ],
      {
        maxTokens: (hasCompetitorData || hasKeywordData) ? 2500 : 1500,
        temperature: 0.8,
        responseFormat: "json_object",
      },
    );

    const suggestions = parseLlmResponse(result.content).slice(0, count);

    // Build source context to store — enriched with provenance when available
    const cbContext = hasCompetitorData
      ? (context as CompetitorBackedSuggestionContext)
      : null;
    const nicheAvg = cbContext?.nicheAvgViewsPerDay ?? null;
    const nicheKws = hasKeywordData ? context.nicheKeywords : [];

    const sourceContexts = suggestions.map((s) => {
      if (!cbContext) {
        return { ...structuredClone(context), confidence: 1 as number, similarIdeaId: null as string | null };
      }

      const provenance = buildProvenance(s, cbContext.competitorVideos);
      const confidence = computeConfidence(provenance, nicheAvg);
      const validatedKeywords = validateTargetKeywords(s.targetKeywords, nicheKws);
      const keywordVolume = getKeywordVolume(validatedKeywords, nicheKws);

      return {
        channelNiche: cbContext.channelNiche,
        contentPillars: cbContext.contentPillars,
        targetAudience: cbContext.targetAudience,
        recentVideoTitles: cbContext.recentVideoTitles,
        recentVideoPerformance: cbContext.recentVideoPerformance,
        trendingTopics: cbContext.trendingTopics,
        provenance,
        generationMode: provenance ? "competitor_backed" : "profile_only",
        nicheAvgViewsPerDay: nicheAvg,
        confidence,
        similarIdeaId: null as string | null,
        targetKeywords: validatedKeywords,
        keywordVolume,
        keywordDifficulty: getKeywordDifficulty(validatedKeywords, nicheKws),
        keywordTrend: getKeywordTrend(validatedKeywords, nicheKws),
        keywordYouTubeValidated: getKeywordYTValidated(validatedKeywords, nicheKws),
        publishTimingHint: s.publishTimingHint ?? null,
      };
    });

    // Duplicate detection: check each suggestion against existing ideas
    await Promise.all(
      suggestions.map(async (s, i) => {
        const similarId = await findSimilarIdea(userId, channelId, s.title);
        if (similarId) {
          sourceContexts[i].similarIdeaId = similarId;
        }
      }),
    );

    const created = await prisma.$transaction(
      suggestions.map((s, i) =>
        prisma.videoSuggestion.create({
          data: {
            userId,
            channelId,
            title: s.title.slice(0, 500),
            description: s.description,
            sourceContext: sourceContexts[i] as unknown as object,
            status: "active",
          },
        }),
      ),
    );

    return created.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sourceContext: row.sourceContext as unknown as SuggestionContext,
      status: row.status as VideoSuggestion["status"],
      generatedAt: row.generatedAt.toISOString(),
    }));
  } catch (error) {
    if (error instanceof SuggestionError) {throw error;}
    throw new SuggestionError(
      "EXTERNAL_FAILURE",
      "Failed to generate suggestions",
      error,
    );
  }
}
