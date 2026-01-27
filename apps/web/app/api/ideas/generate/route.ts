/**
 * POST /api/ideas/generate
 *
 * Public idea generation endpoint for the Video Ideas Generator tool.
 * This is a gated feature that works as follows:
 * - Anonymous users: Returns 401, redirected to sign-in by client
 * - Free users: Get limited generations per day (from entitlements config)
 * - Pro users: Get higher limits per day
 *
 * Accepts optional reference video and content type to customize ideas.
 *
 * Auth: Required
 * Rate limit: Enforced via entitlements (idea_generate)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import { generatePublicIdeas } from "@/lib/idea-generator-public";

/**
 * Request validation schema
 */
const RequestSchema = z.object({
  // User's description of what kind of videos they want
  topic: z
    .string()
    .max(500, "Topic must be 500 characters or less")
    .optional(),
  // Video ID extracted from URL (not the raw URL for security)
  referenceVideoId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid video ID format")
    .nullable()
    .optional(),
  // Content type: true = Short, false = Long-form
  isShort: z.boolean().default(false),
});

/**
 * POST handler - Generate video ideas
 */
async function POSTHandler(req: NextRequest) {
  try {
    // Check entitlement (auth + usage limit)
    const entitlement = await checkEntitlement({
      featureKey: "idea_generate",
      increment: true,
      amount: 1,
    });

    if (!entitlement.ok) {
      return entitlementErrorResponse(entitlement.error);
    }

    const { user, usage } = entitlement.context;

    // Parse and validate request body
    let body: z.infer<typeof RequestSchema>;
    try {
      const raw = await req.json();
      body = RequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return Response.json(
          {
            error: "Invalid request",
            details: err.errors,
          },
          { status: 400 }
        );
      }
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { topic, referenceVideoId, isShort } = body;

    // Generate ideas
    const ideas = await generatePublicIdeas({
      userId: user.id,
      topic: topic ?? undefined,
      referenceVideoId: referenceVideoId ?? undefined,
      isShort,
    });

    // Return ideas with usage info
    return Response.json({
      ideas,
      generatedAt: new Date().toISOString(),
      usage: usage
        ? {
            used: usage.used,
            limit: usage.limit,
            remaining: usage.remaining,
          }
        : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Ideas Generate] Error:", err);

    return Response.json(
      { error: "Failed to generate ideas", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/ideas/generate" },
  async (req) => POSTHandler(req)
);
