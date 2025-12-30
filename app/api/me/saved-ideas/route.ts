/**
 * GET/POST /api/me/saved-ideas
 *
 * Manage user's saved video ideas.
 *
 * GET - Fetch all saved ideas for the current user
 * POST - Save a new idea
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";
import type { Idea } from "@/types/api";

const SaveIdeaSchema = z.object({
  ideaId: z.string().min(1),
  // Historically this was Channel.id (number). We now also accept a YouTube channel id (string)
  // and resolve it server-side to the numeric Channel.id for storage.
  channelId: z.union([z.number(), z.string()]).nullable().optional(),
  title: z.string().min(1).max(500),
  angle: z.string().nullable().optional(),
  format: z.string().min(1), // "long", "shorts", etc.
  difficulty: z.string().min(1), // "easy", "medium", "stretch", etc.
  ideaJson: z.record(z.unknown()), // Full idea object
  notes: z.string().optional(),
});

export type SavedIdeaResponse = {
  id: string;
  ideaId: string;
  youtubeChannelId: string | null;
  title: string;
  angle: string | null;
  format: string;
  difficulty: string;
  ideaJson: Idea;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * GET - Fetch all saved ideas
 */
async function GETHandler(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // Filter by status

    const savedIdeas = await prisma.savedIdea.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const channelIds = Array.from(
      new Set(
        savedIdeas
          .map((i) => i.channelId)
          .filter((id): id is number => typeof id === "number")
      )
    );
    const channels = channelIds.length
      ? await prisma.channel.findMany({
          where: { userId: user.id, id: { in: channelIds } },
          select: { id: true, youtubeChannelId: true },
        })
      : [];
    const channelMap = new Map<number, string>(
      channels.map((c) => [c.id, c.youtubeChannelId])
    );

    const response: SavedIdeaResponse[] = savedIdeas.map((idea) => ({
      id: idea.id,
      ideaId: idea.ideaId,
      youtubeChannelId:
        typeof idea.channelId === "number"
          ? channelMap.get(idea.channelId) ?? null
          : null,
      title: idea.title,
      angle: idea.angle,
      format: idea.format,
      difficulty: idea.difficulty,
      ideaJson: idea.ideaJson as Idea,
      notes: idea.notes,
      status: idea.status,
      createdAt: idea.createdAt.toISOString(),
      updatedAt: idea.updatedAt.toISOString(),
    }));

    return Response.json({
      savedIdeas: response,
      total: response.length,
    });
  } catch (err) {
    console.error("Failed to fetch saved ideas:", err);
    return Response.json(
      { error: "Failed to fetch saved ideas" },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/saved-ideas" },
  async (req) => GETHandler(req)
);

/**
 * POST - Save a new idea
 */
async function POSTHandler(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("[SaveIdea] Request body:", JSON.stringify(body, null, 2));

    const parsed = SaveIdeaSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[SaveIdea] Validation failed:", parsed.error.flatten());
      return Response.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      ideaId,
      channelId,
      title,
      angle,
      format,
      difficulty,
      ideaJson,
      notes,
    } = parsed.data;

    let resolvedChannelId: number | null = null;
    if (typeof channelId === "number") {
      resolvedChannelId = channelId;
    } else if (typeof channelId === "string" && channelId.trim()) {
      // Treat as YouTube channel id
      const ch = await prisma.channel.findFirst({
        where: { userId: user.id, youtubeChannelId: channelId.trim() },
        select: { id: true },
      });
      resolvedChannelId = ch?.id ?? null;
    }

    // Check if already saved
    const existing = await prisma.savedIdea.findUnique({
      where: {
        userId_ideaId: {
          userId: user.id,
          ideaId,
        },
      },
    });

    if (existing) {
      return Response.json(
        { error: "Idea already saved", savedIdea: existing },
        { status: 409 }
      );
    }

    const savedIdea = await prisma.savedIdea.create({
      data: {
        userId: user.id,
        channelId: resolvedChannelId,
        ideaId,
        title,
        angle: angle ?? null,
        format,
        difficulty,
        ideaJson: ideaJson as object,
        notes: notes ?? null,
        status: "saved",
      },
    });

    return Response.json({
      success: true,
      savedIdea: {
        id: savedIdea.id,
        ideaId: savedIdea.ideaId,
        title: savedIdea.title,
        status: savedIdea.status,
        createdAt: savedIdea.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Failed to save idea:", err);
    return Response.json({ error: "Failed to save idea" }, { status: 500 });
  }
}

export const POST = createApiRoute(
  { route: "/api/me/saved-ideas" },
  async (req) => POSTHandler(req)
);
