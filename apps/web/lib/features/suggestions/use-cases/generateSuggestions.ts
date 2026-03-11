import { callLLM } from "@/lib/llm";
import { prisma } from "@/prisma";

import { SuggestionError } from "../errors";
import type {
  GenerateSuggestionsInput,
  SuggestionContext,
  VideoSuggestion,
} from "../types";

type LlmSuggestion = {
  title: string;
  description: string;
};

function buildSystemPrompt(): string {
  return `You are an expert YouTube content strategist. Generate video ideas tailored to a creator's niche, audience, and recent performance.

Return ONLY valid JSON matching this structure:
{
  "suggestions": [
    {
      "title": "A compelling, specific video title (under 80 characters)",
      "description": "2-3 sentences explaining the video concept, angle, and why it would resonate with the target audience"
    }
  ]
}

RULES:
- Each title must be specific, clickable, and under 80 characters
- Descriptions should explain the unique angle and expected audience appeal
- Ideas must be distinct from each other and from the creator's recent videos
- Draw from the creator's niche strengths while introducing fresh angles
- Consider trending topics in the niche when relevant
- NO emojis, NO generic advice, NO filler`;
}

function buildUserPrompt(context: SuggestionContext, count: number): string {
  const parts: string[] = [];

  if (context.channelNiche) {
    parts.push(`CHANNEL NICHE: ${context.channelNiche}`);
  }
  if (context.targetAudience) {
    parts.push(`TARGET AUDIENCE: ${context.targetAudience}`);
  }
  if (context.contentPillars.length > 0) {
    parts.push(`CONTENT PILLARS: ${context.contentPillars.join(", ")}`);
  }
  if (context.recentVideoTitles.length > 0) {
    parts.push(
      `RECENT VIDEOS:\n${context.recentVideoTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
    );
  }
  if (context.recentVideoPerformance.length > 0) {
    const topPerformers = [...context.recentVideoPerformance]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    parts.push(
      `TOP PERFORMING VIDEOS:\n${topPerformers.map((v) => `- "${v.title}" (${v.views.toLocaleString()} views, ${v.avgViewPercentage.toFixed(0)}% avg watch)`).join("\n")}`,
    );
  }
  if (context.trendingTopics.length > 0) {
    parts.push(`TRENDING IN NICHE: ${context.trendingTopics.join(", ")}`);
  }

  parts.push(
    `\nGenerate exactly ${count} unique video ideas that complement (not duplicate) the recent videos.`,
  );

  return parts.join("\n\n");
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

export async function generateSuggestions(
  input: GenerateSuggestionsInput,
): Promise<VideoSuggestion[]> {
  const { userId, channelId, count, context } = input;

  try {
    const result = await callLLM(
      [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(context, count) },
      ],
      { maxTokens: 1500, temperature: 0.8, responseFormat: "json_object" },
    );

    const suggestions = parseLlmResponse(result.content).slice(0, count);

    const created = await prisma.$transaction(
      suggestions.map((s) =>
        prisma.videoSuggestion.create({
          data: {
            userId,
            channelId,
            title: s.title.slice(0, 500),
            description: s.description,
            sourceContext: structuredClone(context),
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
