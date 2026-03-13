import "server-only";

import { buildContext } from "@/lib/features/suggestions/use-cases/buildContext";
import { callLLM } from "@/lib/llm";
import { createLogger } from "@/lib/shared/logger";

const log = createLogger({ module: "suggestProfileField" });

type SuggestProfileFieldInput = {
  userId: number;
  channelId: number;
  field: string;
  section: string;
  currentInput: Record<string, unknown>;
};

type SuggestProfileFieldResult = {
  field: string;
  value: string;
};

const FIELD_PROMPTS: Record<string, string> = {
  // Idea Guidance
  topicsToLeanInto:
    "Suggest 3-5 specific topics this creator should lean into based on their niche, audience, and recent video performance. Be specific and actionable. Return JSON: { \"value\": \"the suggestion\" }",
  topicsToAvoid:
    "Suggest topics this creator should avoid based on their niche and positioning. Explain briefly why each should be avoided. Return JSON: { \"value\": \"the suggestion\" }",
  idealVideo:
    "Describe what this creator's ideal video looks like — format, length, energy, structure, and what it accomplishes for the viewer. Return JSON: { \"value\": \"the suggestion\" }",
  viewerFeeling:
    "Suggest what viewers should feel after watching this creator's content, based on their niche and style. Keep it to 1-2 sentences. Return JSON: { \"value\": \"the suggestion\" }",

  // Script Guidance
  tone:
    "Suggest the best tone for this creator's scripts based on their niche and audience. Return a single tone label (e.g., 'Conversational & Energetic'). Return JSON: { \"value\": \"the tone\" }",
  structurePreference:
    "Suggest a script structure for this creator's videos (e.g., hook > story > lesson > CTA). Be specific to their content style. Return JSON: { \"value\": \"the suggestion\" }",
  styleNotes:
    "Suggest style notes, recurring segments, or catchphrases that would fit this creator's brand and niche. Return JSON: { \"value\": \"the suggestion\" }",
  neverInclude:
    "Suggest things this creator's scripts should never include, based on their niche and audience expectations. Return JSON: { \"value\": \"the suggestion\" }",

  // Description Guidance
  descriptionFormat:
    "Suggest an optimal video description format/structure for this creator's niche (e.g., summary > timestamps > links > social). Return JSON: { \"value\": \"the suggestion\" }",
  standardLinks:
    "Suggest standard links, calls-to-action, or boilerplate text this creator should include in every video description. Return JSON: { \"value\": \"the suggestion\" }",

  // Competitors
  channelName:
    "Suggest a competitor or inspiration channel name that this creator should study, based on their niche and content style. Return just the channel name. Return JSON: { \"value\": \"the channel name\" }",
};

function buildProfileContext(input: Record<string, unknown>): string {
  const parts: string[] = [];

  const overview = input.overview as Record<string, unknown> | undefined;
  const ideaGuidance = input.ideaGuidance as Record<string, unknown> | undefined;
  const scriptGuidance = input.scriptGuidance as Record<string, unknown> | undefined;
  const competitors = input.competitors as Record<string, unknown> | undefined;

  if (overview?.channelDescription) {
    parts.push(`CHANNEL DESCRIPTION: ${overview.channelDescription}`);
  }
  if (Array.isArray(overview?.coreTopics) && overview.coreTopics.length > 0) {
    parts.push(`CORE TOPICS: ${overview.coreTopics.join(", ")}`);
  }
  if (overview?.knownFor) {
    parts.push(`KNOWN FOR: ${overview.knownFor}`);
  }
  if (ideaGuidance?.topicsToLeanInto) {
    parts.push(`TOPICS TO LEAN INTO: ${ideaGuidance.topicsToLeanInto}`);
  }
  if (scriptGuidance?.tone) {
    parts.push(`CURRENT TONE: ${scriptGuidance.tone}`);
  }
  if (competitors?.differentiation) {
    parts.push(`DIFFERENTIATION: ${competitors.differentiation}`);
  }

  return parts.join("\n\n");
}

export async function suggestProfileField(
  input: SuggestProfileFieldInput,
): Promise<SuggestProfileFieldResult> {
  const { userId, channelId, field, currentInput } = input;

  const fieldPrompt = FIELD_PROMPTS[field];
  if (!fieldPrompt) {
    throw new Error(`Unknown profile field: ${field}`);
  }

  const context = await buildContext({ userId, channelId });

  const channelContext = [
    context.channelNiche && `CHANNEL NICHE: ${context.channelNiche}`,
    context.targetAudience && `TARGET AUDIENCE: ${context.targetAudience}`,
    context.contentPillars.length > 0 &&
      `CONTENT PILLARS: ${context.contentPillars.join(", ")}`,
    context.recentVideoTitles.length > 0 &&
      `RECENT VIDEOS:\n${context.recentVideoTitles.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const profileContext = buildProfileContext(currentInput);
  const userPrompt = `${channelContext}\n\n${profileContext}\n\nGenerate the "${field}" field for this creator's channel profile.`;

  const result = await callLLM(
    [
      {
        role: "system",
        content: `You are an expert YouTube content strategist helping a creator fill out their channel profile. ${fieldPrompt}`,
      },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 800, temperature: 0.7, responseFormat: "json_object" },
  );

  const extracted = extractValue(result.content);
  if (extracted) {
    return { field, value: extracted };
  }

  // Retry with a simplified prompt when first attempt returns empty
  log.warn("First LLM attempt returned empty value, retrying with simplified prompt", {
    field,
    rawContent: result.content.slice(0, 300),
  });

  const retryResult = await callLLM(
    [
      {
        role: "system",
        content: `You are an expert YouTube content strategist. Respond with a JSON object: { "value": "your suggestion" }. The value MUST be a non-empty string.`,
      },
      {
        role: "user",
        content: `${channelContext}\n\nGenerate the "${field}" field: ${fieldPrompt}`,
      },
    ],
    { maxTokens: 800, temperature: 0.8, responseFormat: "json_object" },
  );

  const retryExtracted = extractValue(retryResult.content);
  if (!retryExtracted) {
    log.error("LLM returned empty value after retry", {
      field,
      rawContent: retryResult.content.slice(0, 300),
    });
    throw new Error("LLM returned empty value");
  }

  return { field, value: retryExtracted };
}

function extractValue(content: string): string | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {return null;}

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    // Check parsed.value first
    if (typeof parsed.value === "string" && parsed.value.trim().length > 0) {
      return parsed.value.trim();
    }

    // Fallback: find any non-empty string value in the object
    const fallback = Object.values(parsed).find(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );
    return fallback?.trim() ?? null;
  } catch {
    return null;
  }
}
