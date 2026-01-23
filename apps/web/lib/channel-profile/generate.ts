/**
 * Channel Profile AI Generation
 * 
 * Uses LLM to generate a structured channel profile from user input.
 */

import { callLLM } from "@/lib/llm";
import {
  ChannelProfileInput,
  ChannelProfileAI,
  ChannelProfileAISchema,
  createFallbackAIProfile,
} from "./types";
import { formatInputForLLM } from "./utils";

const SYSTEM_PROMPT = `You are an expert YouTube strategist and taxonomy builder. Your job is to analyze a creator's channel description and categorize it into a structured profile that can be used for:
- Generating video ideas
- Finding similar competitor channels
- Providing personalized insights

You must be SPECIFIC - avoid generic labels like "Lifestyle" when more specific ones like "Minimalist Home Organization" apply.

IMPORTANT: Respond with STRICT JSON only. No markdown, no explanation, no extra keys.`;

const USER_PROMPT_TEMPLATE = `Analyze this YouTube channel and create a structured profile:

{INPUT}

Generate a structured profile with these exact fields:

{{
  "nicheLabel": "Short, specific niche label (e.g., 'Budget meal prep for busy parents')",
  "nicheDescription": "1-2 sentence description of what the channel is about",
  "primaryCategories": ["Category1", "Category2"], // 1-3 normalized categories
  "contentPillars": [
    {{ "name": "Pillar name", "description": "What this pillar covers" }}
  ], // 3-6 content pillars/themes
  "targetAudience": "Concise description of who watches",
  "channelValueProposition": "Why should someone watch this channel?",
  "keywords": ["keyword1", "keyword2", ...], // 15-30 niche-specific terms including acronyms
  "competitorSearchHints": ["hint1", "hint2", ...], // 8-15 search queries to find similar channels
  "videoIdeaAngles": ["angle1", "angle2", ...], // 8-15 content angles/directions
  "toneAndStyle": ["Tone1", "Style2"] // Normalized tone descriptors
}}

Rules:
1. nicheLabel must be SHORT and SPECIFIC (not generic)
2. keywords should include short tokens, acronyms, and niche-specific jargon
3. competitorSearchHints should be 2-4 word search queries
4. videoIdeaAngles should be actionable content directions
5. Use the creator's own words/categories as ground truth

Respond with JSON only:`;

/**
 * Generate an AI-structured profile from user input
 */
export async function generateChannelProfileAI(
  input: ChannelProfileInput
): Promise<ChannelProfileAI> {
  const formattedInput = formatInputForLLM(input);
  const userPrompt = USER_PROMPT_TEMPLATE.replace("{INPUT}", formattedInput);

  try {
    const response = await callLLM(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.4, // Moderate creativity with consistency
        maxTokens: 1500,
        responseFormat: "json_object",
      }
    );

    // Parse JSON response
    const parsed = JSON.parse(response.content);

    // Validate with Zod
    const validated = ChannelProfileAISchema.safeParse(parsed);

    if (!validated.success) {
      console.error("[generateChannelProfileAI] Validation failed:", validated.error);
      // Return fallback
      return createFallbackAIProfile(input);
    }

    console.log(`[generateChannelProfileAI] Generated profile: "${validated.data.nicheLabel}"`);
    return validated.data;
  } catch (err) {
    console.error("[generateChannelProfileAI] Error:", err);
    // Return fallback on any error
    return createFallbackAIProfile(input);
  }
}
