/**
 * Domain types for the thumbnails feature.
 *
 * Covers thumbnail generation (text-to-image and img2img), project management
 * (editor state persistence), and prompt building via LLM.
 */

// ── Thumbnail Styles ────────────────────────────────────────

export type ThumbnailStyle = "compare" | "subject" | "object" | "hold";

export type StyleModelConfig = {
  style: ThumbnailStyle;
  model: string;
  version: string;
  triggerWord: string;
};

// ── Prompt Building ─────────────────────────────────────────

export type BuildPromptInput = {
  style: ThumbnailStyle;
  styleTriggerWord: string;
  userText: string;
  identityTriggerWord?: string;
  variants: number;
};

export type BuiltVariant = {
  finalPrompt: string;
  negativePrompt: string;
  replicateInput: Record<string, unknown>;
  variationNote: string;
};

export type BuildPromptOutput = {
  variants: BuiltVariant[];
};
