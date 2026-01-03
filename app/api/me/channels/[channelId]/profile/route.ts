/**
 * GET/PUT /api/me/channels/[channelId]/profile
 *
 * Manages the user-defined channel profile.
 * - GET: Retrieve the current profile (input + AI)
 * - PUT: Save/update the profile input
 *
 * Auth: Required
 * Subscription: NOT required (free feature)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";
import {
  ChannelProfileInputSchema,
  ChannelProfile,
  ChannelProfileInput,
  ChannelProfileAI,
} from "@/lib/channel-profile/types";
import {
  computeProfileInputHash,
  sanitizeProfileInput,
} from "@/lib/channel-profile/utils";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

// Database row type for raw SQL queries
type ProfileRow = {
  id: string;
  channelId: number;
  inputJson: string;
  inputHash: string;
  aiProfileJson: string | null;
  lastGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Convert DB row to API response format
 */
function dbToProfile(row: ProfileRow): ChannelProfile {
  let input: ChannelProfileInput;
  let aiProfile: ChannelProfileAI | null = null;

  try {
    input = JSON.parse(row.inputJson) as ChannelProfileInput;
  } catch {
    input = {
      description: "",
      categories: [],
    };
  }

  if (row.aiProfileJson) {
    try {
      aiProfile = JSON.parse(row.aiProfileJson) as ChannelProfileAI;
    } catch {
      aiProfile = null;
    }
  }

  return {
    id: row.id,
    channelId: row.channelId,
    input,
    inputHash: row.inputHash,
    aiProfile,
    lastGeneratedAt: row.lastGeneratedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * GET - Retrieve channel profile
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paramsObj = await params;
  const parsed = ParamsSchema.safeParse(paramsObj);
  if (!parsed.success) {
    return Response.json({ error: "Invalid channel ID" }, { status: 400 });
  }

  const { channelId: youtubeChannelId } = parsed.data;

  // Get channel and verify ownership
  const channel = await prisma.channel.findFirst({
    where: {
      youtubeChannelId,
      userId: user.id,
    },
  });

  if (!channel) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  // Get profile using raw SQL (model may not be in Prisma types yet)
  let profiles: ProfileRow[];
  try {
    profiles = await prisma.$queryRaw<ProfileRow[]>`
      SELECT id, "channelId", "inputJson", "inputHash", "aiProfileJson", 
             "lastGeneratedAt", "createdAt", "updatedAt"
      FROM "ChannelProfile"
      WHERE "channelId" = ${channel.id}
      LIMIT 1
    `;
  } catch {
    // Table doesn't exist yet - return null profile
    return Response.json({ profile: null });
  }

  if (profiles.length === 0) {
    return Response.json({ profile: null });
  }

  const profile = dbToProfile(profiles[0]);
  return Response.json({ profile });
}

/**
 * PUT - Save/update channel profile input
 */
async function PUTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paramsObj = await params;
  const parsed = ParamsSchema.safeParse(paramsObj);
  if (!parsed.success) {
    return Response.json({ error: "Invalid channel ID" }, { status: 400 });
  }

  const { channelId: youtubeChannelId } = parsed.data;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bodyParsed = z.object({ input: ChannelProfileInputSchema }).safeParse(body);
  if (!bodyParsed.success) {
    return Response.json(
      { error: "Validation failed", details: bodyParsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get channel and verify ownership
  const channel = await prisma.channel.findFirst({
    where: {
      youtubeChannelId,
      userId: user.id,
    },
  });

  if (!channel) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  // Sanitize and compute hash
  const sanitizedInput = sanitizeProfileInput(bodyParsed.data.input);
  const inputHash = computeProfileInputHash(sanitizedInput);
  const inputJson = JSON.stringify(sanitizedInput);

  // Check if profile exists to preserve AI profile if hash unchanged
  let existing: ProfileRow | null = null;
  try {
    const existingProfiles = await prisma.$queryRaw<ProfileRow[]>`
      SELECT id, "channelId", "inputJson", "inputHash", "aiProfileJson", 
             "lastGeneratedAt", "createdAt", "updatedAt"
      FROM "ChannelProfile"
      WHERE "channelId" = ${channel.id}
      LIMIT 1
    `;
    existing = existingProfiles[0] || null;
  } catch {
    // Table might not exist
    return Response.json(
      { error: "Profile system not available. Please run database migrations." },
      { status: 503 }
    );
  }

  // If input hash changed, we should clear the AI profile (will need regeneration)
  const shouldClearAI = existing && existing.inputHash !== inputHash;

  let updatedProfile: ProfileRow;

  if (existing) {
    // Update existing profile
    if (shouldClearAI) {
      await prisma.$executeRaw`
        UPDATE "ChannelProfile"
        SET "inputJson" = ${inputJson},
            "inputHash" = ${inputHash},
            "aiProfileJson" = NULL,
            "lastGeneratedAt" = NULL,
            "updatedAt" = NOW()
        WHERE "channelId" = ${channel.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "ChannelProfile"
        SET "inputJson" = ${inputJson},
            "inputHash" = ${inputHash},
            "updatedAt" = NOW()
        WHERE "channelId" = ${channel.id}
      `;
    }

    // Fetch updated profile
    const updated = await prisma.$queryRaw<ProfileRow[]>`
      SELECT id, "channelId", "inputJson", "inputHash", "aiProfileJson", 
             "lastGeneratedAt", "createdAt", "updatedAt"
      FROM "ChannelProfile"
      WHERE "channelId" = ${channel.id}
      LIMIT 1
    `;
    updatedProfile = updated[0];
  } else {
    // Insert new profile
    await prisma.$executeRaw`
      INSERT INTO "ChannelProfile" ("channelId", "inputJson", "inputHash", "createdAt", "updatedAt")
      VALUES (${channel.id}, ${inputJson}, ${inputHash}, NOW(), NOW())
    `;

    // Fetch created profile
    const created = await prisma.$queryRaw<ProfileRow[]>`
      SELECT id, "channelId", "inputJson", "inputHash", "aiProfileJson", 
             "lastGeneratedAt", "createdAt", "updatedAt"
      FROM "ChannelProfile"
      WHERE "channelId" = ${channel.id}
      LIMIT 1
    `;
    updatedProfile = created[0];
  }

  const profile = dbToProfile(updatedProfile);

  return Response.json({
    profile,
    message: shouldClearAI
      ? "Profile saved. AI summary needs regeneration."
      : "Profile saved successfully.",
  });
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/profile" },
  async (req, ctx) => GETHandler(req, ctx as { params: Promise<{ channelId: string }> })
);

export const PUT = createApiRoute(
  { route: "/api/me/channels/[channelId]/profile" },
  async (req, ctx) => PUTHandler(req, ctx as { params: Promise<{ channelId: string }> })
);
