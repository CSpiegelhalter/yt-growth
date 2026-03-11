import { prisma } from "@/prisma";

import { SuggestionError } from "../errors";
import type { SuggestionContext, VideoSuggestion } from "../types";

type GetSuggestionsInput = {
  userId: number;
  channelId: number;
};

type GetSuggestionsResult = {
  suggestions: VideoSuggestion[];
};

export async function getSuggestions(
  input: GetSuggestionsInput,
): Promise<GetSuggestionsResult> {
  try {
    const rows = await prisma.videoSuggestion.findMany({
      where: {
        userId: input.userId,
        channelId: input.channelId,
        status: "active",
      },
      orderBy: { generatedAt: "desc" },
      take: 3,
    });

    const suggestions: VideoSuggestion[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sourceContext: row.sourceContext as unknown as SuggestionContext,
      status: row.status as VideoSuggestion["status"],
      generatedAt: row.generatedAt.toISOString(),
    }));

    return { suggestions };
  } catch (error) {
    if (error instanceof SuggestionError) {throw error;}
    throw new SuggestionError(
      "EXTERNAL_FAILURE",
      "Failed to fetch suggestions",
      error,
    );
  }
}
