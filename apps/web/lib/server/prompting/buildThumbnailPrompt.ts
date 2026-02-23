/**
 * Re-export barrel — moved to lib/features/thumbnails/use-cases/buildPrompt.ts
 *
 * This wrapper preserves the original callLLM-based signature so existing
 * callers (routes, tests) continue to work without changes.
 */
import "server-only";

import { buildPrompt } from "@/lib/features/thumbnails";
import type { BuildPromptInput, BuildPromptOutput } from "@/lib/features/thumbnails/types";
import { callLLM } from "@/lib/llm";

export async function buildThumbnailPrompt(
  input: BuildPromptInput,
): Promise<BuildPromptOutput> {
  return buildPrompt(input, {
    llm: {
      async complete(params) {
        const result = await callLLM(
          params.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            temperature: params.temperature,
            maxTokens: params.maxTokens,
            responseFormat: "json_object",
          },
        );
        return {
          content: result.content,
          tokensUsed: result.tokensUsed,
          model: result.model,
        };
      },
    },
  });
}
