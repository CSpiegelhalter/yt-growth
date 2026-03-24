import type { CompetitorBackedSuggestionContext, SourceProvenance } from "@/lib/features/suggestions/types";
import { buildCompetitorBackedContext } from "@/lib/features/suggestions/use-cases/buildCompetitorBackedContext";
import { buildContextPromptParts } from "@/lib/features/suggestions/use-cases/buildContextPrompt";
import { callLLM } from "@/lib/llm";

import { VideoIdeaError } from "../errors";
import type { SuggestFieldInput, SuggestFieldResult } from "../types";

// ── Field-specific system prompts ───────────────────────────

const FIELD_PROMPTS: Record<string, string> = {
  title: `Generate a catchy, clickable YouTube video title (under 80 characters).

RULES:
- Include a high-opportunity keyword naturally if one fits
- Use proven title patterns: numbers, "how to", curiosity gaps, brackets [2026]
- Make it specific — not generic. "5 Index Fund Mistakes Costing You $10K" not "How to Invest Better"
- Reference competitor video patterns that are working if relevant

Return JSON: { "value": "the title" }`,

  script: `Generate an engaging video script outline with hooks, key talking points, and structure.

RULES:
- Start with a strong hook (first 30 seconds matter most)
- Include a pattern interrupt every 2-3 minutes
- Reference the source video's approach if provenance exists — what to keep, what to do differently
- End with a clear CTA

Return JSON: { "value": "the script outline" }`,

  description: `Generate a complete, SEO-optimized YouTube video description (300-500 words).

STRUCTURE (follow this exact order):
1. Hook paragraph (2-3 sentences summarizing value, front-load the primary keyword)
2. Timestamps placeholder: "TIMESTAMPS:\\n0:00 - Intro\\n..." (use realistic section names)
3. Key takeaways (3-5 bullet points of what viewers will learn)
4. About section (1-2 sentences about the creator/channel)
5. Related videos section: "WATCH NEXT:\\n- [Related video concept 1]\\n- [Related video concept 2]"
6. Social links placeholder: "CONNECT WITH ME:\\n..."
7. Hashtags line: 3-5 relevant hashtags (e.g., #investing #personalfinance #budgeting)

RULES:
- Front-load the primary keyword in the first 2 sentences (YouTube truncates after ~120 chars)
- Include 3-5 target keywords naturally throughout — no stuffing
- Include 3-5 hashtags at the end (YouTube indexes these for discovery)
- Reference the source/competitor video approach if provenance exists
- Use line breaks for readability — YouTube descriptions are not paragraphs
- Include a CTA ("Subscribe", "Drop a comment", etc.)

Return JSON: { "value": "the full description" }`,

  tags: `Generate 10-15 relevant YouTube tags as a comma-separated string.

RULES:
- Start with the exact primary keyword (most important tag)
- Include 2-3 long-tail variations of the primary keyword
- Include the channel's niche as a tag
- Include competitor channel names if relevant (people search for alternatives)
- Include 2-3 broad category tags
- Include trending/timely tags if the topic is current
- Mix specific and broad: "index fund investing 2026, investing for beginners, how to invest, personal finance, money tips"

Return JSON: { "value": "tag1, tag2, tag3, ..." }`,

  postDate: `Suggest an optimal posting date (YYYY-MM-DD format) considering the channel's typical posting schedule, keyword seasonality, and the current date. Return JSON: { "value": "YYYY-MM-DD" }`,
};

// ── Context builders ────────────────────────────────────────

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

function buildSourceContext(provenanceJson: string | undefined | null): string {
  if (!provenanceJson) {return "";}
  try {
    const provenance = JSON.parse(provenanceJson) as SourceProvenance;
    const lines: string[] = [];
    if (provenance.sourceVideos?.[0]) {
      const sv = provenance.sourceVideos[0];
      lines.push(`SOURCE VIDEO: "${sv.title}" by ${sv.channelTitle} (${sv.stats.viewCount.toLocaleString()} views, ${Math.round(sv.stats.viewsPerDay).toLocaleString()} views/day)`);
    }
    if (provenance.pattern) {lines.push(`PATTERN: ${provenance.pattern}`);}
    if (provenance.rationale) {lines.push(`WHY IT WORKS: ${provenance.rationale}`);}
    if (provenance.adaptationAngle) {lines.push(`ADAPTATION ANGLE: ${provenance.adaptationAngle}`);}
    return lines.length > 0 ? `\n\nSOURCE CONTEXT (use this to inform your suggestion):\n${lines.join("\n")}` : "";
  } catch {
    return "";
  }
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function buildCompetitorSection(context: CompetitorBackedSuggestionContext): string {
  if (context.competitorVideos.length === 0) return "";

  const videoList = context.competitorVideos
    .slice(0, 5)
    .map((v) => `- "${v.title}" by ${v.channelTitle} (${v.viewCount.toLocaleString()} views, ${Math.round(v.viewsPerDay).toLocaleString()} views/day)`)
    .join("\n");

  return `\n\nCOMPETITOR VIDEOS (what's working in this niche — use for inspiration):\n${videoList}`;
}

function buildKeywordSection(context: CompetitorBackedSuggestionContext, field: string): string {
  if (!context.nicheKeywords || context.nicheKeywords.length === 0) return "";
  if (!["title", "description", "tags"].includes(field)) return "";

  const kwList = context.nicheKeywords
    .slice(0, 10)
    .map((k) => `- "${k.keyword}" (${formatVolume(k.searchVolume)} searches/mo, difficulty: ${k.difficulty})`)
    .join("\n");

  return `\n\nKEYWORD OPPORTUNITIES (weave these in naturally):\n${kwList}`;
}

// ── Main entry point ────────────────────────────────────────

export async function suggestField(input: SuggestFieldInput): Promise<SuggestFieldResult> {
  const { userId, channelId, field } = input;

  const fieldPrompt = FIELD_PROMPTS[field];
  if (!fieldPrompt) {
    throw new VideoIdeaError("VALIDATION_FAILED", `Unknown field: ${field}`);
  }

  try {
    // Use the full competitor-backed context (includes keywords, competitor videos, niche data)
    const context = await buildCompetitorBackedContext({ userId, channelId });
    const contextParts = buildContextPromptParts(context);
    const ideaContext = buildIdeaContext(input);
    const sourceContext = buildSourceContext(input.currentIdea.sourceProvenanceJson);
    const competitorSection = buildCompetitorSection(context);
    const keywordSection = buildKeywordSection(context, field);

    const userPrompt = `${contextParts.join("\n\n")}\n\n${ideaContext}${sourceContext}${competitorSection}${keywordSection}\n\nGenerate the ${field} field for this video idea.`;

    const result = await callLLM(
      [
        { role: "system", content: `You are an expert YouTube content strategist and SEO specialist. ${fieldPrompt}` },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: field === "description" ? 1500 : 800, temperature: 0.7, responseFormat: "json_object" },
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
