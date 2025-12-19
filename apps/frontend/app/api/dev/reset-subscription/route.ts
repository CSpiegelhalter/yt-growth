/**
 * POST /api/dev/reset-subscription
 *
 * DEV ONLY: Reset the current user's subscription to test the Stripe flow.
 * This endpoint only works in development mode.
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/prisma";

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the subscription record
    const deleted = await prisma.subscription.deleteMany({
      where: { userId: user.id },
    });

    return Response.json({
      success: true,
      message: `Subscription reset. Deleted ${deleted.count} record(s).`,
      nextStep: "Go to /api/integrations/stripe/checkout to subscribe with real Stripe.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Reset subscription error:", err);
    return Response.json(
      { error: "Failed to reset subscription", detail: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Convenience: allow GET to trigger POST behavior
  return POST(req);
}

