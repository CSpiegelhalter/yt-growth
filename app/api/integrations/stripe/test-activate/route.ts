/**
 * GET /api/integrations/stripe/test-activate
 *
 * TEST_MODE only: Activate subscription without going through Stripe.
 * This endpoint only works when TEST_MODE=1 is set.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { LIMITS } from "@/lib/product";
import { createApiRoute } from "@/lib/api/route";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

const QuerySchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const GET = createApiRoute(
  { route: "/api/integrations/stripe/test-activate" },
  withValidation({ query: QuerySchema }, async (req: NextRequest, _ctx, api, v) => {
    if (process.env.TEST_MODE !== "1") {
      throw new ApiError({
        code: "FORBIDDEN",
        status: 403,
        message: "This endpoint is only available in test mode",
      });
    }

    const userId = v.query!.userId;

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        status: "active",
        plan: "pro",
        channelLimit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        stripeCustomerId: `test_customer_${userId}`,
        stripeSubscriptionId: `test_sub_${userId}`,
      },
      create: {
        userId,
        status: "active",
        plan: "pro",
        channelLimit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeCustomerId: `test_customer_${userId}`,
        stripeSubscriptionId: `test_sub_${userId}`,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const res = NextResponse.redirect(
      new URL("/dashboard?checkout=success", appUrl)
    );
    res.headers.set("x-request-id", api.requestId);
    return res;
  })
);

