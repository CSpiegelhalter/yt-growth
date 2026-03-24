import { prisma } from "@/prisma";

import { SuggestionError } from "../errors";
import type {
  ActOnSuggestionInput,
  ActOnSuggestionResult,
  SuggestionContext,
  VideoSuggestion,
  VideoSuggestionStatus,
} from "../types";

const ACTION_TO_STATUS: Record<string, VideoSuggestionStatus> = {
  save: "saved",
  dismiss: "dismissed",
  use: "used",
};

function mapRow(row: {
  id: string;
  title: string;
  description: string;
  sourceContext: unknown;
  status: string;
  generatedAt: Date;
}): VideoSuggestion {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sourceContext: row.sourceContext as unknown as SuggestionContext,
    status: row.status as VideoSuggestion["status"],
    generatedAt: row.generatedAt.toISOString(),
  };
}

export async function actOnSuggestion(
  input: ActOnSuggestionInput,
): Promise<ActOnSuggestionResult> {
  const { userId, channelId, suggestionId, action } = input;

  const newStatus = ACTION_TO_STATUS[action];
  if (!newStatus) {
    throw new SuggestionError("INVALID_INPUT", `Unknown action: ${action}`);
  }

  try {
    const existing = await prisma.videoSuggestion.findFirst({
      where: { id: suggestionId, userId, channelId },
    });

    if (!existing) {
      throw new SuggestionError("NOT_FOUND", "Suggestion not found");
    }

    if (existing.status !== "active") {
      throw new SuggestionError(
        "INVALID_INPUT",
        `Cannot act on suggestion with status "${existing.status}"`,
      );
    }

    const updated = await prisma.videoSuggestion.update({
      where: { id: suggestionId },
      data: { status: newStatus, actedAt: new Date() },
    });

    let videoIdeaId: string | undefined;
    if (action === "save" || action === "use") {
      // Extract provenance from sourceContext if present
      const sourceCtx = existing.sourceContext as Record<string, unknown> | null;
      const provenance = sourceCtx?.provenance ?? null;
      const sourceProvenanceJson = provenance
        ? JSON.stringify(provenance)
        : null;

      // Extract tags from the source CompetitorVideo if provenance references one
      let tags: string | null = null;
      if (provenance && typeof provenance === "object") {
        const prov = provenance as { sourceVideos?: Array<{ videoId: string }> };
        const sourceVideoId = prov.sourceVideos?.[0]?.videoId;
        if (sourceVideoId) {
          const competitorVideo = await prisma.competitorVideo.findUnique({
            where: { videoId: sourceVideoId },
            select: { tags: true },
          });
          if (competitorVideo?.tags && competitorVideo.tags.length > 0) {
            tags = JSON.stringify(competitorVideo.tags);
          }
        }
      }

      const videoIdea = await prisma.videoIdea.create({
        data: {
          userId,
          channelId,
          summary: existing.title.slice(0, 150),
          title: existing.title.slice(0, 500),
          description: existing.description,
          status: "draft",
          sourceProvenanceJson,
          ...(tags ? { tags } : {}),
        },
      });
      videoIdeaId = String(videoIdea.id);
    }

    const nextActive = await prisma.videoSuggestion.findFirst({
      where: {
        userId,
        channelId,
        status: "active",
        id: { not: suggestionId },
      },
      orderBy: { generatedAt: "desc" },
    });

    const replacement: VideoSuggestion = nextActive
      ? mapRow(nextActive)
      : {
          id: "",
          title: "",
          description: "",
          sourceContext: {} as SuggestionContext,
          status: "active",
          generatedAt: new Date().toISOString(),
        };

    return {
      suggestion: { id: updated.id, status: newStatus },
      replacement,
      videoIdeaId,
      ideaFlowUrl: videoIdeaId
        ? `/videos?tab=planned&channelId=${channelId}&ideaId=${videoIdeaId}`
        : undefined,
    };
  } catch (error) {
    if (error instanceof SuggestionError) {throw error;}
    throw new SuggestionError(
      "EXTERNAL_FAILURE",
      "Failed to act on suggestion",
      error,
    );
  }
}
