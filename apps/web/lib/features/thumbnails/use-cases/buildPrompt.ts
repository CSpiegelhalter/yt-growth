/**
 * Build Thumbnail Prompt Use-Case
 *
 * Given a style, trigger words, and user text, calls an LLM to generate
 * creative prompt variants, then assembles final prompts for Replicate.
 * Falls back to deterministic variants when the LLM is unavailable.
 */

import { z } from "zod";
import type { LlmCompletionParams, LlmCompletionResult } from "@/lib/ports/LlmPort";
import { ThumbnailError } from "../errors";
import type { BuildPromptInput, BuildPromptOutput, BuiltVariant } from "../types";

// ── Dependencies ────────────────────────────────────────────

type BuildPromptDeps = {
  llm: {
    complete(params: LlmCompletionParams): Promise<LlmCompletionResult>;
  };
};

// ── Internal helpers ────────────────────────────────────────

const LLM_SCHEMA = z.object({
  variants: z
    .array(
      z.object({
        variationNote: z.string().min(1).max(80),
        scene: z.string().min(1).max(180),
        composition: z.string().min(1).max(180),
        lighting: z.string().min(1).max(120),
        background: z.string().min(1).max(140),
        camera: z.string().min(1).max(120),
        props: z.string().min(1).max(140),
        avoid: z.array(z.string().min(1).max(60)).max(12).default([]),
      })
    )
    .min(1)
    .max(4),
});

function stripControlChars(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F]/g, " ");
}

function clampPrompt(s: string, maxChars: number, opts?: { suffix?: string }) {
  const suffix = opts?.suffix ?? "";
  if (s.length <= maxChars) {return s;}
  const keep = maxChars - suffix.length - 1;
  if (keep <= 0) {return suffix.slice(0, maxChars);}
  return `${s.slice(0, keep).trim()} ${suffix}`.trim();
}

const BASE_NEGATIVE =
  "text, words, letters, watermark, logo, signature, extra fingers, deformed hands, blurry, low-res, jpeg artifacts";

// ── Use-case ────────────────────────────────────────────────

export async function buildPrompt(
  input: BuildPromptInput,
  deps: BuildPromptDeps,
): Promise<BuildPromptOutput> {
  const userText = stripControlChars(input.userText).trim().slice(0, 500);
  if (!userText) {throw new ThumbnailError("INVALID_INPUT", "Empty prompt");}

  const styleTrigger = input.styleTriggerWord.trim();
  const identityTrigger = input.identityTriggerWord?.trim();

  const prefix = identityTrigger
    ? `${styleTrigger} ${identityTrigger} YouTube thumbnail, 16:9, 1280x720, professional photo, correct human anatomy, natural proportions, ${identityTrigger} person, portrait of ${identityTrigger}, ${identityTrigger} face, highly detailed face, facial features of ${identityTrigger}, same person as ${identityTrigger},`
    : `${styleTrigger} YouTube thumbnail, 16:9, 1280x720, professional photo, correct human anatomy, natural proportions,`;

  const mustNoText =
    "absolutely no text, no words, no letters, no numbers, no writing, no watermark, no logos, no brand names, no signage, clean image without any typography";

  const suffix = input.style === "compare" ? "COMPARE" : "";

  const systemPrompt = `You are a prompt transformer for image generation.

Return ONLY valid JSON matching this exact schema:
{
  "variants": [
    {
      "variationNote": "short note describing the variation",
      "scene": "what is happening (no text described)",
      "composition": "tight close-up / medium shot with prop / negative space guidance",
      "lighting": "lighting description",
      "background": "background description (clean, simple)",
      "camera": "lens/angle guidance",
      "props": "key props",
      "avoid": ["things to avoid"]
    }
  ]
}

Rules:
- Do NOT include any trigger words; the server will add them.
- Absolutely never ask for text/letters/logos/signage in the image.
- Prefer simple, high-contrast, YouTube-thumbnail composition.
- Keep fields concise.`;

  const userPrompt = `User intent: ${userText}

Generate exactly ${input.variants} variants:
- v1: tight close-up
- v2: medium shot with prop
- v3: more negative space for later text overlay
${input.variants >= 4 ? "- v4: dramatic angle / dynamic motion" : ""}

Return JSON only.`;

  let validated: z.infer<typeof LLM_SCHEMA>;
  try {
    if (process.env.NODE_ENV === "test") {
      throw new Error("Skip LLM in test environment");
    }

    const llm = await deps.llm.complete({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      maxTokens: 900,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(llm.content);
    } catch {
      const m = llm.content.match(/\{[\s\S]*\}/);
      if (!m) {throw new Error("Failed to parse LLM JSON");}
      parsed = JSON.parse(m[0]);
    }

    validated = LLM_SCHEMA.parse(parsed);
  } catch {
    const fallbackVariants = Array.from({ length: input.variants }).map((_, i) => {
      const idx = i + 1;
      const variationNote =
        idx === 1
          ? "Tight close-up"
          : idx === 2
            ? "Medium shot with prop"
            : idx === 3
              ? "More negative space"
              : "Dramatic angle / motion";

      return {
        variationNote,
        scene: userText.slice(0, 180),
        composition:
          idx === 1
            ? "tight close-up, subject fills frame, strong focal point"
            : idx === 2
              ? "medium shot with one clear prop, clean framing"
              : idx === 3
                ? "clear subject + generous negative space on one side"
                : "dynamic angle, energetic framing, strong diagonals",
        lighting: "high contrast, studio lighting, crisp highlights",
        background: "simple background, uncluttered, high separation",
        camera: "sharp focus, shallow depth of field",
        props: "minimal props that reinforce the idea",
        avoid: [],
      };
    });

    validated = LLM_SCHEMA.parse({ variants: fallbackVariants });
  }

  const variants: BuiltVariant[] = validated.variants
    .slice(0, input.variants)
    .map((v) => {
      const body = [
        `scene: ${v.scene}`,
        `composition: ${v.composition}`,
        `lighting: ${v.lighting}`,
        `background: ${v.background}`,
        `camera: ${v.camera}`,
        `props: ${v.props}`,
        mustNoText,
      ]
        .join(", ")
        .replace(/\s+/g, " ")
        .trim();

      const raw = `${prefix} ${body}${suffix ? ` ${suffix}` : ""}`.trim();
      const finalPrompt = clampPrompt(raw, 700, { suffix });

      const avoidExtra = v.avoid
        .map((x) => stripControlChars(x).trim())
        .filter(Boolean)
        .slice(0, 12)
        .join(", ");

      const negativePrompt = avoidExtra
        ? `${BASE_NEGATIVE}, ${avoidExtra}`
        : BASE_NEGATIVE;

      return {
        finalPrompt,
        negativePrompt,
        variationNote: v.variationNote,
        replicateInput: {
          prompt: finalPrompt,
          negative_prompt: negativePrompt,
          width: 1280,
          height: 720,
          num_outputs: 1,
          output_format: "png",
        },
      };
    });

  return { variants };
}
