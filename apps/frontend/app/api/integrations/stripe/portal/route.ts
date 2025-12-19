/**
 * GET/POST /api/integrations/stripe/portal
 *
 * Create a Stripe billing portal session for subscription management.
 * GET: Redirects directly to Stripe portal
 * POST: Returns JSON with portal URL
 *
 * Auth: Required
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { createPortalSession } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function handlePortal(returnJson: boolean) {
  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    if (returnJson) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", APP_URL));
  }

  // Create portal session
  const { url } = await createPortalSession(user.id);

  if (returnJson) {
    return Response.json({ url });
  }
  
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  try {
    return await handlePortal(false);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Portal error:", err);
    
    // If no Stripe customer, redirect to checkout instead
    if (message.includes("No Stripe customer")) {
      return NextResponse.redirect(new URL("/api/integrations/stripe/checkout", APP_URL));
    }
    
    return NextResponse.redirect(
      new URL(`/profile?error=portal_failed&message=${encodeURIComponent(message)}`, APP_URL)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handlePortal(true);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Portal error:", err);
    
    // If no Stripe customer, tell them to subscribe first
    if (message.includes("No Stripe customer")) {
      return Response.json(
        { error: "No active subscription found. Please subscribe first.", needsSubscription: true },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: "Failed to create billing portal", detail: message },
      { status: 500 }
    );
  }
}
