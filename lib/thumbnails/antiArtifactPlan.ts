/**
 * Anti-AI Artifact Plan Builder
 *
 * Creates structured ThumbnailPlans that:
 * 1. Extract topic anchors from title + description
 * 2. Apply anti-artifact constraints (hands, screens, UI)
 * 3. Select appropriate fallback mode based on risk
 * 4. Self-check for potential AI failures
 *
 * Goal: Generate thumbnails that look human-designed, not AI-generated.
 */

import { callLLM } from "@/lib/llm";
import type {
  ThumbnailPlan,
  RiskReview,
  ThumbnailJobInput,
} from "./types";

// ============================================
// CONSTANTS
// ============================================

/**
 * High-risk elements that commonly cause AI artifacts
 */
const HIGH_RISK_ELEMENTS = [
  "hands",
  "fingers",
  "multiple screens",
  "detailed UI",
  "text on screen",
  "crowds",
  "complex machinery",
  "vehicles",
  "animals",
  "full body",
];

/**
 * Standard anti-artifact constraints for human subjects
 */
const HUMAN_CONSTRAINTS = [
  "natural face proportions, no distortions",
  "if hands visible: exactly 5 fingers per hand, natural pose",
  "no extra limbs or duplicated body parts",
  "realistic skin tones and textures",
  "natural eye placement and size",
];

/**
 * Standard anti-artifact constraints for tech/screen subjects
 */
const SCREEN_CONSTRAINTS = [
  "laptop: single screen on front only, correct hinge angle, proper keyboard layout",
  "monitor: rectangular, proper aspect ratio, no warped edges",
  "UI elements: keep simple, avoid overly complex interfaces",
  "cables: simple, following natural curves, no impossible tangles",
];

/**
 * Standard quality bar requirements
 */
const STANDARD_QUALITY_BAR = [
  "photorealistic objects OR clean illustration style (pick ONE, not mixed)",
  "include bold, readable headline text as part of the image",
  "high contrast between subject and background",
  "BOGY palette dominant (Blue/Orange/Green/Yellow)",
];

// ============================================
// SYSTEM PROMPTS
// ============================================

const PLAN_SYSTEM_PROMPT = `You are an expert YouTube thumbnail designer who creates TOPIC-ACCURATE, BELIEVABLE thumbnails.

Your job is to create a ThumbnailPlan that:
1. Clearly represents the video topic (derived from title + description)
2. Avoids common AI generation mistakes (weird hands, broken screens, gibberish UI)
3. Follows YouTube CTR best practices (BOGY colors, clean composition, readable at small sizes)
4. Includes a PUNCHY HEADLINE (2-4 words) that will be rendered in the thumbnail

CRITICAL RULES:
- headline.text: Create an ATTENTION-GRABBING phrase (2-4 words) that triggers emotion. NOT the full title!
- topicAnchors: Extract 3-6 SPECIFIC nouns from the title+description that MUST appear visually
- scene.prohibitedProps: List things that would cause AI artifacts or confusion
- subject.constraints: Add anti-artifact rules if humans or tech appear
- For humans: Always add constraints about correct anatomy
- fallbackMode: Choose the SAFEST mode that still conveys the topic

HEADLINE PATTERNS THAT WORK (use these):
- Numbers: "$10K SECRET", "10X FASTER", "99% FAIL AT THIS"
- Challenge viewer: "YOU'RE WRONG", "STOP DOING THIS", "DON'T DO THIS"
- Promise: "GAME CHANGER", "THIS WORKS", "CHANGED MY LIFE"
- Shock/curiosity: "I QUIT", "THE TRUTH", "THEY LIED"

HEADLINE EXAMPLES:
- "10 Common JavaScript Mistakes" → "STOP THIS" or "YOU'RE WRONG"
- "How to Build a React App" → "BUILD THIS" or "SO EASY"
- "Why Your Videos Fail" → "THE TRUTH" or "FIX THIS NOW"
- "Making Money Online" → "$10K SECRET" or "I QUIT MY JOB"

NEVER USE: "Headline Text", generic titles, placeholder text

FALLBACK MODES (choose lowest risk that works):
- "icon_driven": Icons, shapes, simple objects. NO humans, NO hands, NO complex screens. SAFEST.
- "face_only": Close-up face with 1-2 simple props. NO full body, NO hands, NO complex scenes. MEDIUM.
- "full_scene": Complete scene with multiple elements. HIGHEST RISK - only if absolutely needed.

OUTPUT: Valid JSON matching the ThumbnailPlan structure exactly.`;

const RISK_REVIEW_PROMPT = `You are a QA reviewer checking a ThumbnailPlan for potential AI generation problems.

Review the plan and identify:
1. Does it clearly map to the video description?
2. Are there high-risk elements? (hands, detailed screens, crowds, complex machinery)
3. Could the AI generate artifacts or weird results?

If risks exist, suggest revisions:
- Replace hands with face-only or icon-driven approach
- Replace detailed UI with simplified blocks
- Replace complex scenes with focused close-ups
- Reduce the number of elements

OUTPUT: Valid JSON with { approved: boolean, risks: string[], suggestedMode: FallbackMode, revisions?: Partial<ThumbnailPlan> }`;

// ============================================
// PLAN GENERATION
// ============================================

/**
 * Generate a structured ThumbnailPlan from title + description.
 * Uses LLM to extract topic anchors and create a safe composition.
 */
export async function generateThumbnailPlan(
  input: ThumbnailJobInput
): Promise<ThumbnailPlan> {
  const { title, description, topic, audience } = input;

  const userPrompt = `Create a ThumbnailPlan for this video:

TITLE: "${title}"
DESCRIPTION: "${description}"
${topic ? `TOPIC/NICHE: ${topic}` : ""}
${audience ? `AUDIENCE: ${audience}` : ""}

Requirements:
1. Extract 3-6 topicAnchors from the title and description
2. Design a scene that clearly represents these anchors
3. Choose the SAFEST fallbackMode that conveys the topic
4. Add appropriate anti-artifact constraints
5. If tech/screens needed: use "simplified UI blocks" not detailed interfaces
6. If humans needed: prefer "face close-up" over full body

Return ONLY valid JSON:
{
  "topicSummary": "...",
  "topicAnchors": ["...", "...", "..."],
  "scene": {
    "setting": "...",
    "props": ["...", "..."],
    "prohibitedProps": ["...", "..."]
  },
  "subject": {
    "type": "human_face|hands_only|mascot|object|icon_only",
    "description": "...",
    "pose": "...",
    "emotion": "curious|shocked|confident|focused|excited|neutral",
    "constraints": ["...", "..."]
  },
  "layout": "subject-left_text-right|subject-right_text-left|center",
  "headline": {
    "text": "... (2-4 words max)",
    "style": "bold|clean|dramatic"
  },
  "palette": {
    "primary": "blue|orange|green|yellow",
    "secondary": "#HEX",
    "accent": "#HEX"
  },
  "qualityBar": ["...", "..."],
  "fallbackMode": "icon_driven|face_only|full_scene"
}`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: PLAN_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1500,
      }
    );

    const content = response.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[generateThumbnailPlan] No JSON found in response");
      return createDefaultPlan(input);
    }

    const plan = JSON.parse(jsonMatch[0]) as ThumbnailPlan;
    
    // Ensure required fields and add default constraints
    return normalizePlan(plan, input);
  } catch (err) {
    console.error("[generateThumbnailPlan] Error:", err);
    return createDefaultPlan(input);
  }
}

/**
 * Review a ThumbnailPlan for AI artifact risks.
 * Returns approval status and suggested revisions.
 */
export async function reviewPlanRisks(
  plan: ThumbnailPlan,
  input: ThumbnailJobInput
): Promise<RiskReview> {
  const userPrompt = `Review this ThumbnailPlan for AI artifact risks:

VIDEO TITLE: "${input.title}"
VIDEO DESCRIPTION: "${input.description}"

PLAN:
${JSON.stringify(plan, null, 2)}

Check for:
1. Does the plan match the video description?
2. High-risk elements (hands, detailed screens, crowds)?
3. Potential AI artifacts?

Return JSON:
{
  "approved": true|false,
  "risks": ["list of identified risks"],
  "suggestedMode": "icon_driven|face_only|full_scene",
  "revisions": { ...partial plan updates if needed... }
}`;

  try {
    const response = await callLLM(
      [
        { role: "system", content: RISK_REVIEW_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        model: "gpt-4o-mini",
        temperature: 0.3,
        maxTokens: 1000,
      }
    );

    const content = response.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Default to approving simple plans
      return {
        approved: plan.fallbackMode !== "full_scene",
        risks: [],
        suggestedMode: plan.fallbackMode,
      };
    }

    return JSON.parse(jsonMatch[0]) as RiskReview;
  } catch (err) {
    console.error("[reviewPlanRisks] Error:", err);
    return {
      approved: plan.fallbackMode !== "full_scene",
      risks: ["Review failed, defaulting to safe mode"],
      suggestedMode: plan.fallbackMode === "full_scene" ? "face_only" : plan.fallbackMode,
    };
  }
}

/**
 * Generate a plan with risk review and automatic fallback.
 * This is the main entry point for safe plan generation.
 */
export async function generateSafePlan(
  input: ThumbnailJobInput
): Promise<{ plan: ThumbnailPlan; review: RiskReview }> {
  // Step 1: Generate initial plan
  console.log("[generateSafePlan] Generating plan for:", input.title);
  const initialPlan = await generateThumbnailPlan(input);
  console.log("[generateSafePlan] Initial plan mode:", initialPlan.fallbackMode);

  // Step 2: Risk review
  console.log("[generateSafePlan] Reviewing risks...");
  const review = await reviewPlanRisks(initialPlan, input);
  console.log("[generateSafePlan] Review:", {
    approved: review.approved,
    risks: review.risks.length,
    suggestedMode: review.suggestedMode,
  });

  // Step 3: Apply revisions if needed
  let finalPlan = initialPlan;
  if (!review.approved && review.revisions) {
    console.log("[generateSafePlan] Applying revisions...");
    finalPlan = {
      ...initialPlan,
      ...review.revisions,
      fallbackMode: review.suggestedMode,
    };
  } else if (!review.approved) {
    // Downgrade to suggested mode
    finalPlan = {
      ...initialPlan,
      fallbackMode: review.suggestedMode,
    };
  }

  // Ensure constraints are present
  finalPlan = ensureAntiArtifactConstraints(finalPlan);

  return { plan: finalPlan, review };
}

// ============================================
// HELPERS
// ============================================

/**
 * Normalize a plan to ensure all required fields are present.
 */
function normalizePlan(plan: ThumbnailPlan, input: ThumbnailJobInput): ThumbnailPlan {
  return {
    topicSummary: plan.topicSummary || input.title,
    topicAnchors: plan.topicAnchors?.length ? plan.topicAnchors : extractTopicAnchors(input),
    scene: {
      setting: plan.scene?.setting || "clean, minimal background",
      props: plan.scene?.props || [],
      prohibitedProps: plan.scene?.prohibitedProps || [
        "gibberish text",
        "unreadable UI",
        "extra screens",
      ],
    },
    subject: {
      type: plan.subject?.type || "icon_only",
      description: plan.subject?.description || "simple iconographic representation",
      pose: plan.subject?.pose || "n/a",
      emotion: plan.subject?.emotion || "neutral",
      constraints: plan.subject?.constraints || [],
    },
    layout: plan.layout || "subject-left_text-right",
    headline: {
      text: plan.headline?.text || extractHeadline(input.title),
      style: plan.headline?.style || "bold",
    },
    palette: {
      primary: plan.palette?.primary || "blue",
      secondary: plan.palette?.secondary || "#1E3A8A",
      accent: plan.palette?.accent || "#FF6B00",
    },
    qualityBar: plan.qualityBar?.length ? plan.qualityBar : STANDARD_QUALITY_BAR,
    fallbackMode: plan.fallbackMode || "icon_driven",
  };
}

/**
 * Create a safe default plan when LLM fails.
 */
function createDefaultPlan(input: ThumbnailJobInput): ThumbnailPlan {
  const anchors = extractTopicAnchors(input);
  
  return {
    topicSummary: input.title,
    topicAnchors: anchors,
    scene: {
      setting: "clean gradient background with subtle depth",
      props: anchors.slice(0, 2).map((a) => `${a} icon or symbol`),
      prohibitedProps: [
        "hands",
        "detailed screens",
        "readable text",
        "complex machinery",
      ],
    },
    subject: {
      type: "icon_only",
      description: `Simple, bold iconographic representation of ${anchors[0] || "the topic"}`,
      pose: "n/a",
      emotion: "neutral",
      constraints: ["clean vector style", "no small details", "bold shapes"],
    },
    layout: "subject-left_text-right",
    headline: {
      text: extractHeadline(input.title),
      style: "bold",
    },
    palette: {
      primary: "blue",
      secondary: "#1E3A8A",
      accent: "#FF6B00",
    },
    qualityBar: STANDARD_QUALITY_BAR,
    fallbackMode: "icon_driven",
  };
}

/**
 * Extract topic anchors from title and description.
 */
function extractTopicAnchors(input: ThumbnailJobInput): string[] {
  const text = `${input.title} ${input.description || ""}`.toLowerCase();
  
  // Common YouTube topic nouns to look for
  const topicNouns = [
    // Tech
    "code", "api", "website", "app", "software", "database", "server",
    "javascript", "python", "react", "nodejs", "oauth", "authentication",
    // Finance
    "money", "invest", "stock", "crypto", "bitcoin", "income", "budget",
    // Gaming
    "game", "gameplay", "character", "level", "boss", "strategy",
    // General
    "mistake", "tip", "hack", "secret", "guide", "tutorial", "review",
  ];

  const found: string[] = [];
  for (const noun of topicNouns) {
    if (text.includes(noun) && found.length < 6) {
      found.push(noun);
    }
  }

  // Extract capitalized words as potential topic anchors
  const words = `${input.title} ${input.description || ""}`.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (
      clean.length > 3 &&
      clean[0] === clean[0].toUpperCase() &&
      !found.includes(clean.toLowerCase()) &&
      found.length < 6
    ) {
      found.push(clean);
    }
  }

  return found.length ? found : ["topic", "concept", "idea"];
}

/**
 * Extract a short headline from the title.
 */
function extractHeadline(title: string): string {
  // Try to find key patterns
  const patterns = [
    /^(\d+)\s+(things?|ways?|tips?|mistakes?|secrets?)/i,
    /^how\s+to\s+(\w+)/i,
    /^why\s+(\w+)/i,
    /^(stop|don't|never)\s+(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return match[0].slice(0, 20).toUpperCase();
    }
  }

  // Fallback: first 2-3 significant words
  const words = title.split(/\s+/).filter((w) => w.length > 2).slice(0, 3);
  return words.join(" ").slice(0, 20).toUpperCase();
}

/**
 * Ensure anti-artifact constraints are present based on subject type.
 */
function ensureAntiArtifactConstraints(plan: ThumbnailPlan): ThumbnailPlan {
  const constraints = [...(plan.subject.constraints || [])];

  // Add human constraints if needed
  if (plan.subject.type === "human_face" || plan.subject.type === "hands_only") {
    for (const c of HUMAN_CONSTRAINTS) {
      if (!constraints.some((existing) => existing.toLowerCase().includes(c.split(",")[0].toLowerCase()))) {
        constraints.push(c);
      }
    }
  }

  // Add screen constraints if tech-related
  const hasTech =
    plan.scene.props.some((p) =>
      ["laptop", "computer", "screen", "monitor", "phone", "tablet"].some((t) =>
        p.toLowerCase().includes(t)
      )
    ) ||
    plan.topicAnchors.some((a) =>
      ["code", "api", "software", "app", "website", "ui"].some((t) =>
        a.toLowerCase().includes(t)
      )
    );

  if (hasTech) {
    for (const c of SCREEN_CONSTRAINTS) {
      if (!constraints.some((existing) => existing.toLowerCase().includes(c.split(":")[0].toLowerCase()))) {
        constraints.push(c);
      }
    }
  }

  // Add prohibited props based on fallback mode
  const prohibitedProps = [...(plan.scene.prohibitedProps || [])];
  
  if (plan.fallbackMode === "icon_driven") {
    const iconProhibited = [
      "human hands",
      "human face",
      "detailed screens",
      "readable text",
      "complex machinery",
    ];
    for (const p of iconProhibited) {
      if (!prohibitedProps.includes(p)) {
        prohibitedProps.push(p);
      }
    }
  } else if (plan.fallbackMode === "face_only") {
    const faceOnlyProhibited = [
      "hands",
      "full body",
      "multiple people",
      "complex backgrounds",
    ];
    for (const p of faceOnlyProhibited) {
      if (!prohibitedProps.includes(p)) {
        prohibitedProps.push(p);
      }
    }
  }

  return {
    ...plan,
    subject: {
      ...plan.subject,
      constraints,
    },
    scene: {
      ...plan.scene,
      prohibitedProps,
    },
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  HIGH_RISK_ELEMENTS,
  HUMAN_CONSTRAINTS,
  SCREEN_CONSTRAINTS,
  STANDARD_QUALITY_BAR,
};
