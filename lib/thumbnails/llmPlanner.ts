/**
 * LLM Concept Planner
 *
 * Uses OpenAI to generate concept-driven thumbnail plans.
 * Focus: Visual storytelling, not just "title on background".
 *
 * The LLM must:
 * 1. Extract intent: what is the video REALLY about?
 * 2. Pick a concept pattern that communicates it fast
 * 3. Rewrite the title into a short hook (2-5 words)
 * 4. Specify subjects/props that visually represent the idea
 */

import { callLLM } from "@/lib/llm";
import type { ConceptPlan, ThumbnailJobInput, ThumbnailPalette } from "./types";
import {
  CONCEPT_IDS,
  CONCEPT_LIBRARY,
  getAllConceptsMeta,
  getConcept,
  isValidConceptId,
  type ConceptId,
} from "./concepts";
import { conceptPlanSchema, isHookTooSimilarToTitle, shortenHookText, containsBannedTerms, ensurePromptSafety } from "./schemas";
import { getPalettesForStyle } from "./palettes";

// ============================================
// SYSTEM PROMPT - CONCEPT-DRIVEN PLANNING
// ============================================

const SYSTEM_PROMPT = `You are an expert YouTube thumbnail strategist. Your job is to create CONCEPT PLANS that tell visual stories, NOT just put titles on backgrounds.

CRITICAL MINDSET:
- Thumbnails must communicate the video's VALUE in under 2 seconds
- The hook text is NOT the video title - it's a curiosity-inducing REWRITE (2-5 words MAX)
- The base image must tell a visual story with a clear focal subject
- Every element serves click-worthiness: surprise, curiosity, contrast, or clarity

AVAILABLE CONCEPT PATTERNS:
${getAllConceptsMeta()
  .map(
    (c) => `- ${c.id}: ${c.description} (best for: ${c.bestFor})`
  )
  .join("\n")}

HOOK TEXT RULES (CRITICAL):
1. Must be 2-5 words, MAX 28 characters total
2. Must NOT be the video title verbatim
3. Must create curiosity or clearly state the benefit
4. Examples:
   - Title: "10 Common Mistakes Beginners Make When Starting a YouTube Channel" 
   - Good hooks: "STOP DOING THIS", "10 MISTAKES", "You're Doing It WRONG"
   - Bad hook: "Common Mistakes Beginners Make" (too long, too boring)

BASE PROMPT RULES (CRITICAL):
1. Describe a SCENE with a clear focal subject
2. Must include: "no text, no words, no letters, no watermark, no logos"
3. Never mention brand names, logos, real people, or copyrighted characters
4. Focus on composition: where the subject sits, lighting, mood
5. Leave space for text overlay (specified in composition.textSafeArea)

OUTPUT FORMAT:
Return ONLY valid JSON with a "plans" array of ConceptPlan objects.
Each plan must have these exact fields:
{
  "conceptId": "one of the concept IDs listed above",
  "hookText": "2-5 words, max 28 chars",
  "subHook": "optional, max 18 chars",
  "emotionTone": "urgent|curious|clean|dramatic|playful|professional|shocking|mysterious",
  "palette": { "bg1": "#HEX", "bg2": "#HEX", "accent": "#HEX", "text": "#HEX" },
  "composition": {
    "textSafeArea": "left|right|top|bottom|center",
    "focalSubjectPosition": "left|right|center|split",
    "backgroundComplexity": "low|medium|high"
  },
  "basePrompt": "Scene description..., no text, no words, no letters, no watermark, no logos",
  "negativePrompt": "text, words, letters, logos, watermarks, brands",
  "overlayDirectives": {
    "badges": [{ "text": "...", "style": "pill|corner-flag|stamp|ribbon|circle" }],
    "highlights": [{ "type": "arrow|circle|glow|blur-region|split-line" }],
    "bigSymbol": "X|CHECK|VS|ARROW|QUESTION|NONE"
  },
  "subjects": "Description of main subjects/props in the scene"
}`;

// ============================================
// USER PROMPT BUILDER
// ============================================

function buildUserPrompt(input: ThumbnailJobInput, count: number): string {
  const { title, topic, audience, style = "Bold" } = input;
  const palettes = getPalettesForStyle(style);

  return `Generate ${count} unique CONCEPT PLANS for this video:

VIDEO TITLE: "${title}"
${topic ? `TOPIC/NICHE: ${topic}` : ""}
${audience ? `TARGET AUDIENCE: ${audience}` : ""}
STYLE PREFERENCE: ${style}

REQUIREMENTS:
1. Generate exactly ${count} plans with VARIETY:
   - Use at least 4-5 different conceptIds (from: ${CONCEPT_IDS.slice(0, 8).join(", ")})
   - Each plan should have a DIFFERENT visual approach
   - Mix up emotion tones (urgent, curious, dramatic, etc.)

2. HOOK TEXT (most important):
   - Extract the CORE message/benefit of the video
   - Rewrite as 2-5 punchy words that create curiosity
   - DO NOT just shorten the title - transform it
   - Examples of good transformations:
     * "How to lose weight fast" → "SECRET WEAPON" or "I Lost 30lbs"
     * "Best budget laptops 2024" → "UNDER $500" or "Budget BEAST"
     * "Why your videos fail" → "STOP THIS" or "You're WRONG"

3. BASE PROMPT (scene description):
   - Describe a compelling SCENE, not just a background
   - Include a clear focal subject related to the topic
   - Specify lighting, mood, and composition
   - MUST end with: "no text, no words, no letters, no watermark, no logos"

4. COMPOSITION:
   - textSafeArea: where to leave space for the hook text
   - focalSubjectPosition: where the main visual element sits
   - Match these to create visual balance

5. OVERLAY DIRECTIVES:
   - badges: Optional text badges (e.g., "NEW", "SECRET", "#1")
   - highlights: Visual attention elements (arrows, circles, glows)
   - bigSymbol: For concepts that use X/CHECK/VS overlays

SUGGESTED PALETTES (for ${style} style):
${palettes
  .slice(0, 3)
  .map(
    (p, i) =>
      `${i + 1}. bg1:${p.bg1}, bg2:${p.bg2}, accent:${p.accent}, text:${p.text}`
  )
  .join("\n")}

Return ONLY the JSON object with "plans" array containing exactly ${count} plans.`;
}

// ============================================
// PLAN GENERATION
// ============================================

/**
 * Generate concept plans using LLM.
 */
export async function generateConceptPlans(
  input: ThumbnailJobInput,
  count: number = 12
): Promise<ConceptPlan[]> {
  try {
    const response = await callLLM(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input, count) },
      ],
      {
        model: "gpt-4o-mini",
        temperature: 0.9, // High for variety
        maxTokens: 6000,
        responseFormat: "json_object",
      }
    );

    // Parse and validate response
    const parsed = JSON.parse(response.content);
    const plans: ConceptPlan[] = [];

    if (!Array.isArray(parsed.plans)) {
      console.error("[llmPlanner] Invalid response structure:", parsed);
      return generateFallbackPlans(input, count);
    }

    for (const rawPlan of parsed.plans) {
      // Apply guardrails before validation
      const guardrailedPlan = applyGuardrails(rawPlan, input);

      const validated = conceptPlanSchema.safeParse(guardrailedPlan);
      if (validated.success) {
        plans.push(validated.data as ConceptPlan);
      } else {
        console.warn(
          "[llmPlanner] Plan validation failed:",
          validated.error.flatten()
        );
        // Try to salvage with fallback values
        const salvaged = salvagePlan(rawPlan, input);
        if (salvaged) plans.push(salvaged);
      }
    }

    // If we didn't get enough valid plans, supplement with fallbacks
    if (plans.length < count) {
      const fallbacks = generateFallbackPlans(input, count - plans.length);
      plans.push(...fallbacks);
    }

    return plans.slice(0, count);
  } catch (err) {
    console.error("[llmPlanner] LLM call failed:", err);
    return generateFallbackPlans(input, count);
  }
}

// ============================================
// GUARDRAILS (Post-LLM Processing)
// ============================================

/**
 * Apply deterministic guardrails to LLM output.
 */
function applyGuardrails(
  rawPlan: Record<string, unknown>,
  input: ThumbnailJobInput
): Record<string, unknown> {
  const plan = { ...rawPlan };

  // 1. Validate/fix conceptId
  if (!plan.conceptId || !isValidConceptId(plan.conceptId as string)) {
    plan.conceptId = "clean-hero"; // Safe default
  }

  // 2. Fix hookText if too long
  if (typeof plan.hookText === "string") {
    let hookText = shortenHookText(plan.hookText, 5);
    // Truncate to 28 chars
    if (hookText.length > 28) {
      hookText = hookText.slice(0, 28).trim();
    }
    plan.hookText = hookText;
  }

  // 3. Check if hookText is too similar to title
  if (
    typeof plan.hookText === "string" &&
    isHookTooSimilarToTitle(plan.hookText, input.title, 0.8)
  ) {
    // Generate a compressed hook
    plan.hookText = compressToHook(input.title);
  }

  // 4. Fix basePrompt banned terms
  if (typeof plan.basePrompt === "string") {
    const { banned, term } = containsBannedTerms(plan.basePrompt);
    if (banned) {
      // Replace with generic equivalent
      plan.basePrompt = (plan.basePrompt as string)
        .toLowerCase()
        .replace(new RegExp(term!, "gi"), "item");
    }
    // Ensure safety suffix
    plan.basePrompt = ensurePromptSafety(plan.basePrompt as string);
  }

  // 5. Fix subHook length
  if (typeof plan.subHook === "string" && plan.subHook.length > 18) {
    plan.subHook = plan.subHook.slice(0, 18).trim();
  }

  // 6. Ensure overlayDirectives structure
  if (!plan.overlayDirectives || typeof plan.overlayDirectives !== "object") {
    const concept = getConcept(plan.conceptId as ConceptId);
    plan.overlayDirectives = {
      badges: [],
      highlights: concept.overlayStyle.allowedHighlights
        .slice(0, 1)
        .map((type) => ({ type })),
      bigSymbol: concept.requiredElements.symbolOptions?.[0] ?? "NONE",
    };
  }

  // 7. Ensure composition structure
  if (!plan.composition || typeof plan.composition !== "object") {
    const concept = getConcept(plan.conceptId as ConceptId);
    plan.composition = {
      textSafeArea: concept.overlayStyle.textSafeArea,
      focalSubjectPosition: concept.constraints.focalPosition,
      backgroundComplexity: concept.constraints.backgroundComplexity,
    };
  }

  // 8. Ensure negativePrompt
  if (!plan.negativePrompt) {
    plan.negativePrompt =
      "text, words, letters, logos, watermarks, brands, signatures";
  }

  return plan;
}

/**
 * Compress a title into a short hook using rules.
 */
function compressToHook(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);

  // Strategy 1: Extract key action words
  const actionPatterns = [
    /^how to/i,
    /^why/i,
    /^what/i,
    /^the (?:best|worst|top|secret)/i,
  ];

  for (const pattern of actionPatterns) {
    if (pattern.test(title)) {
      // Find the core concept after the pattern
      const match = title.replace(pattern, "").trim();
      const coreWords = match.split(/\s+/).slice(0, 2);
      if (coreWords.length > 0) {
        return coreWords.join(" ").toUpperCase();
      }
    }
  }

  // Strategy 2: Find numbers and use "X TIPS" style
  const numberMatch = title.match(/\b(\d+)\b/);
  if (numberMatch) {
    const tipWords = ["TIPS", "WAYS", "SECRETS", "MISTAKES"];
    const category = tipWords.find((w) =>
      title.toLowerCase().includes(w.toLowerCase())
    );
    return `${numberMatch[1]} ${category || "TIPS"}`;
  }

  // Strategy 3: First 2-3 impactful words
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "to",
    "for",
    "of",
    "in",
    "on",
    "with",
    "is",
    "are",
    "your",
    "you",
    "that",
    "this",
  ]);
  const impactWords = words.filter((w) => !stopWords.has(w.toLowerCase()));
  return impactWords.slice(0, 3).join(" ").toUpperCase().slice(0, 28);
}

// ============================================
// FALLBACK PLAN GENERATION
// ============================================

/**
 * Generate fallback plans when LLM fails.
 */
function generateFallbackPlans(
  input: ThumbnailJobInput,
  count: number
): ConceptPlan[] {
  const { title, topic, style = "Bold" } = input;
  const palettes = getPalettesForStyle(style);
  const hookText = compressToHook(title);

  // Distribute across different concepts
  const conceptRotation: ConceptId[] = [
    "clean-hero",
    "problem-solution",
    "tool-spotlight",
    "big-number",
    "shock-reaction",
    "mistake-x",
    "before-after-split",
    "vs-face-off",
  ];

  const emotionRotation = [
    "curious",
    "urgent",
    "professional",
    "dramatic",
    "playful",
  ] as const;

  const plans: ConceptPlan[] = [];

  for (let i = 0; i < count; i++) {
    const conceptId = conceptRotation[i % conceptRotation.length];
    const concept = getConcept(conceptId);
    const palette = palettes[i % palettes.length];
    const emotionTone = emotionRotation[i % emotionRotation.length];

    // Build base prompt from concept scaffold
    const basePrompt = buildBasePromptFromScaffold(concept, topic || title);

    plans.push({
      conceptId,
      hookText: i === 0 ? hookText : generateHookVariant(hookText, i),
      subHook: i % 3 === 0 ? topic?.slice(0, 18) : undefined,
      emotionTone,
      palette,
      composition: {
        textSafeArea: concept.overlayStyle.textSafeArea,
        focalSubjectPosition: concept.constraints.focalPosition,
        backgroundComplexity: concept.constraints.backgroundComplexity,
      },
      basePrompt,
      negativePrompt:
        "text, words, letters, logos, watermarks, brands, signatures",
      overlayDirectives: {
        badges:
          i % 4 === 0
            ? [{ text: "NEW", style: concept.overlayStyle.badgeStyle || "pill" }]
            : [],
        highlights: concept.overlayStyle.allowedHighlights
          .slice(0, i % 2 === 0 ? 1 : 2)
          .map((type) => ({ type })),
        bigSymbol: concept.requiredElements.symbolOptions?.[0] ?? "NONE",
      },
      subjects: topic || "relevant subject for the topic",
    });
  }

  return plans;
}

/**
 * Build a base prompt from concept scaffold.
 */
function buildBasePromptFromScaffold(
  concept: ReturnType<typeof getConcept>,
  topic: string
): string {
  const { promptScaffold, constraints } = concept;
  return `${promptScaffold.prefix} ${topic}, ${promptScaffold.subjectGuidance}, ${promptScaffold.compositionGuidance}. ${constraints.emptySpaceNote}. ${promptScaffold.suffix}`;
}

/**
 * Generate a hook variant for variety.
 */
function generateHookVariant(baseHook: string, index: number): string {
  const transforms = [
    (h: string) => h, // Original
    (h: string) => `${h}!`,
    (h: string) => h.split(" ").slice(0, 2).join(" "),
    (h: string) => `THE ${h.split(" ")[0]}`,
    (h: string) => (h.length > 15 ? h.slice(0, 15).trim() : h),
  ];

  const transformed = transforms[index % transforms.length](baseHook);
  return transformed.slice(0, 28);
}

/**
 * Salvage an invalid plan with defaults.
 */
function salvagePlan(
  rawPlan: unknown,
  input: ThumbnailJobInput
): ConceptPlan | null {
  if (!rawPlan || typeof rawPlan !== "object") return null;

  const plan = rawPlan as Record<string, unknown>;
  const style = input.style || "Bold";
  const palettes = getPalettesForStyle(style);
  const defaultPalette = palettes[0];
  const conceptId = isValidConceptId(plan.conceptId as string)
    ? (plan.conceptId as ConceptId)
    : "clean-hero";
  const concept = getConcept(conceptId);

  try {
    const hookText =
      typeof plan.hookText === "string"
        ? shortenHookText(plan.hookText, 5).slice(0, 28)
        : compressToHook(input.title);

    return {
      conceptId,
      hookText,
      subHook:
        typeof plan.subHook === "string"
          ? plan.subHook.slice(0, 18)
          : undefined,
      emotionTone:
        (plan.emotionTone as ConceptPlan["emotionTone"]) || "curious",
      palette:
        plan.palette && typeof plan.palette === "object"
          ? {
              bg1:
                (plan.palette as ThumbnailPalette).bg1 ?? defaultPalette.bg1,
              bg2:
                (plan.palette as ThumbnailPalette).bg2 ?? defaultPalette.bg2,
              accent:
                (plan.palette as ThumbnailPalette).accent ??
                defaultPalette.accent,
              text:
                (plan.palette as ThumbnailPalette).text ?? defaultPalette.text,
            }
          : defaultPalette,
      composition: {
        textSafeArea: concept.overlayStyle.textSafeArea,
        focalSubjectPosition: concept.constraints.focalPosition,
        backgroundComplexity: concept.constraints.backgroundComplexity,
      },
      basePrompt: ensurePromptSafety(
        typeof plan.basePrompt === "string"
          ? plan.basePrompt.slice(0, 1000)
          : buildBasePromptFromScaffold(concept, input.topic || input.title)
      ),
      negativePrompt:
        "text, words, letters, logos, watermarks, brands, signatures",
      overlayDirectives: {
        badges: [],
        highlights: concept.overlayStyle.allowedHighlights
          .slice(0, 1)
          .map((type) => ({ type })),
        bigSymbol: concept.requiredElements.symbolOptions?.[0] ?? "NONE",
      },
      subjects: input.topic || "relevant subject",
    };
  } catch {
    return null;
  }
}

// ============================================
// MODERATION CHECK
// ============================================

/**
 * Check if input content is safe for thumbnail generation.
 * Uses OpenAI moderation API.
 */
export async function moderateContent(
  content: string
): Promise<{ safe: boolean; reason?: string }> {
  // TEST_MODE: Always safe
  if (process.env.TEST_MODE === "1") {
    return { safe: true };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[moderateContent] No API key, skipping moderation");
    return { safe: true };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: content }),
    });

    if (!response.ok) {
      console.error("[moderateContent] API error:", response.status);
      return { safe: true }; // Fail open for API errors
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (result?.flagged) {
      const categories = Object.entries(result.categories || {})
        .filter(([, flagged]) => flagged)
        .map(([cat]) => cat);
      return {
        safe: false,
        reason: `Content flagged for: ${categories.join(", ")}`,
      };
    }

    return { safe: true };
  } catch (err) {
    console.error("[moderateContent] Error:", err);
    return { safe: true }; // Fail open
  }
}

// ============================================
// HOOK REGENERATION (LLM-only, no image)
// ============================================

/**
 * Regenerate just the hook text for a plan.
 */
export async function regenerateHook(
  plan: ConceptPlan,
  input: ThumbnailJobInput
): Promise<string> {
  try {
    const response = await callLLM(
      [
        {
          role: "system",
          content: `You rewrite video titles into short, punchy thumbnail hooks.
Rules:
- Output ONLY 2-5 words
- Max 28 characters
- Create curiosity or state benefit clearly
- Do NOT just shorten the title
Output format: Just the hook text, nothing else.`,
        },
        {
          role: "user",
          content: `Current hook: "${plan.hookText}"
Original title: "${input.title}"
Concept: ${plan.conceptId}

Generate a NEW, different hook that creates more curiosity:`,
        },
      ],
      {
        model: "gpt-4o-mini",
        temperature: 0.95,
        maxTokens: 50,
      }
    );

    const newHook = response.content.trim().slice(0, 28);
    return shortenHookText(newHook, 5);
  } catch {
    // Fallback to rule-based
    return compressToHook(input.title);
  }
}

// ============================================
// LEGACY ALIAS
// ============================================

/** @deprecated Use generateConceptPlans */
export const generateThumbnailPlans = generateConceptPlans;
