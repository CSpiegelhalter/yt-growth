/**
 * DELETE/PATCH /api/me/saved-ideas/[ideaId]
 *
 * Manage individual saved ideas.
 *
 * DELETE - Remove a saved idea
 * PATCH - Update notes/status of a saved idea
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";

const UpdateIdeaSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(["saved", "in_progress", "filmed", "published"]).optional(),
  ideaJson: z.record(z.unknown()).optional(),
});

type RouteContext = { params: Promise<{ ideaId: string }> };

/**
 * DELETE - Remove a saved idea
 */
async function DELETEHandler(req: NextRequest, ctx: RouteContext) {
  void req;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ideaId } = await ctx.params;

    // Find by original ideaId (not db id)
    const existing = await prisma.savedIdea.findUnique({
      where: {
        userId_ideaId: {
          userId: user.id,
          ideaId,
        },
      },
    });

    if (!existing) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    await prisma.savedIdea.delete({
      where: { id: existing.id },
    });

    return Response.json({ success: true, ideaId });
  } catch (err) {
    console.error("Failed to delete saved idea:", err);
    return Response.json(
      { error: "Failed to delete saved idea" },
      { status: 500 }
    );
  }
}

export const DELETE = createApiRoute(
  { route: "/api/me/saved-ideas/[ideaId]" },
  async (req, ctx) => DELETEHandler(req, ctx as any)
);

/**
 * PATCH - Update a saved idea (notes, status)
 */
async function PATCHHandler(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ideaId } = await ctx.params;

    const body = await req.json();
    const parsed = UpdateIdeaSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { notes, status, ideaJson } = parsed.data;

    // Find by original ideaId
    const existing = await prisma.savedIdea.findUnique({
      where: {
        userId_ideaId: {
          userId: user.id,
          ideaId,
        },
      },
    });

    if (!existing) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    const updated = await prisma.savedIdea.update({
      where: { id: existing.id },
      data: {
        ...(notes !== undefined ? { notes } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(ideaJson !== undefined ? { ideaJson: ideaJson as object } : {}),
      },
    });

    return Response.json({
      success: true,
      savedIdea: {
        id: updated.id,
        ideaId: updated.ideaId,
        notes: updated.notes,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Failed to update saved idea:", err);
    return Response.json(
      { error: "Failed to update saved idea" },
      { status: 500 }
    );
  }
}

export const PATCH = createApiRoute(
  { route: "/api/me/saved-ideas/[ideaId]" },
  async (req, ctx) => PATCHHandler(req, ctx as any)
);

