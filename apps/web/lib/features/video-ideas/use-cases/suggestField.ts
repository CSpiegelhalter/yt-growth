import { buildContext } from "@/lib/features/suggestions/use-cases/buildContext";
import { callLLM } from "@/lib/llm";

import { VideoIdeaError } from "../errors";
import type { SuggestFieldInput, SuggestFieldResult } from "../types";

const FIELD_PROMPTS: Record<string, string> = {
  title: "Generate a catchy, clickable YouTube video title (under 80 characters) based on the summary and channel context. Return JSON: { \"value\": \"the title\" }",
  script: "Generate an engaging video script outline with key talking points, hooks, and structure based on the summary and channel context. Return JSON: { \"value\": \"the script outline\" }",
  description: "Generate an SEO-optimized YouTube video description (200-400 words) with relevant keywords, timestamps placeholder, and call-to-action based on the summary and channel context. Return JSON: { \"value\": \"the description\" }",
  tags: "Generate 8-12 relevant YouTube tags as a comma-separated string based on the summary, channel niche, and trending topics. Return JSON: { \"value\": \"tag1, tag2, tag3, ...\" }",
  postDate: "Suggest an optimal posting date (YYYY-MM-DD format) considering the channel's typical posting schedule and the current date. Return JSON: { \"value\": \"YYYY-MM-DD\" }",
};

function buildIdeaContext(input: SuggestFieldInput): string {
  const parts: string[] = [];

  if (input.currentIdea.summary) {
    parts.push(`VIDEO SUMMARY: ${input.currentIdea.summary}`);
  }
  if (input.currentIdea.title) {
    parts.push(`CURRENT TITLE: ${input.currentIdea.title}`);
  }
  if (input.currentIdea.script) {
    parts.push(`CURRENT SCRIPT: ${input.currentIdea.script.slice(0, 500)}`);
  }
  if (input.currentIdea.description) {
    parts.push(`CURRENT DESCRIPTION: ${input.currentIdea.description.slice(0, 300)}`);
  }
  if (input.currentIdea.tags && input.currentIdea.tags.length > 0) {
    parts.push(`CURRENT TAGS: ${input.currentIdea.tags.join(", ")}`);
  }

  return parts.join("\n\n");
}

export async function suggestField(input: SuggestFieldInput): Promise<SuggestFieldResult> {
  const { userId, channelId, field } = input;

  const fieldPrompt = FIELD_PROMPTS[field];
  if (!fieldPrompt) {
    throw new VideoIdeaError("VALIDATION_FAILED", `Unknown field: ${field}`);
  }

  try {
    const context = await buildContext({ userId, channelId });

    const contextParts: string[] = [];
    if (context.channelNiche) {
      contextParts.push(`CHANNEL NICHE: ${context.channelNiche}`);
    }
    if (context.targetAudience) {
      contextParts.push(`TARGET AUDIENCE: ${context.targetAudience}`);
    }
    if (context.contentPillars.length > 0) {
      contextParts.push(`CONTENT PILLARS: ${context.contentPillars.join(", ")}`);
    }
    if (context.recentVideoTitles.length > 0) {
      contextParts.push(`RECENT VIDEOS:\n${context.recentVideoTitles.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join("\n")}`);
    }
    if (context.trendingTopics.length > 0) {
      contextParts.push(`TRENDING IN NICHE: ${context.trendingTopics.join(", ")}`);
    }

    const ideaContext = buildIdeaContext(input);
    const userPrompt = `${contextParts.join("\n\n")}\n\n${ideaContext}\n\nGenerate the ${field} field for this video idea.`;

    const result = await callLLM(
      [
        { role: "system", content: `You are an expert YouTube content strategist. ${fieldPrompt}` },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 800, temperature: 0.7, responseFormat: "json_object" },
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new VideoIdeaError("GENERATION_FAILED", "LLM did not return valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]) as { value?: string };
    if (!parsed.value || typeof parsed.value !== "string") {
      throw new VideoIdeaError("GENERATION_FAILED", "LLM returned empty value");
    }

    return { field, value: parsed.value };
  } catch (error) {
    if (error instanceof VideoIdeaError) {throw error;}
    throw new VideoIdeaError("GENERATION_FAILED", `Failed to generate ${field}`, error);
  }
}
