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
import { getCurrentUser } from "@/lib/user";
import type { Idea } from "@/types/api";

const SaveIdeaSchema = z.object({
  ideaId: z.string().min(1),
  channelId: z.number().nullable().optional(), // Can be number, null, or undefined
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
export async function GET(req: NextRequest) {
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

    const response: SavedIdeaResponse[] = savedIdeas.map((idea) => ({
      id: idea.id,
      ideaId: idea.ideaId,
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

/**
 * POST - Save a new idea
 */
export async function POST(req: NextRequest) {
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

    const { ideaId, channelId, title, angle, format, difficulty, ideaJson, notes } =
      parsed.data;

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
        channelId: channelId ?? null,
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

