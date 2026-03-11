import type { VideoIdea as PrismaVideoIdea } from "@prisma/client";

import type { VideoIdea } from "./types";

export function mapRowToVideoIdea(row: PrismaVideoIdea): VideoIdea {
  return {
    id: row.id,
    channelId: row.channelId,
    summary: row.summary,
    title: row.title,
    script: row.script,
    description: row.description,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
    postDate: row.postDate ? row.postDate.toISOString().split("T")[0] : null,
    status: row.status as VideoIdea["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
