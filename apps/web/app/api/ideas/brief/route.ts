/**
 * POST /api/ideas/brief
 *
 * "What to make this week" generator — returns 3 enriched video ideas anchored
 * to a real per-niche keyword pool from DataForSEO (cached 24h per niche).
 *
 * Tier-aware rate limits:
 *  - Guests:        2 per day per IP   (signup CTA when capped)
 *  - Free signed-in: 3 per day per user (upgrade CTA when capped)
 *  - PRO:           unlimited
 *
 * Auth: Optional. Save and Refresh are gated client-side; this endpoint is the
 * single entry-point for both initial generation and refresh.
 */
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext, withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { getNicheKeywords } from "@/lib/features/trending/niche-keywords";
import {
  type BriefChannelSize,
  type BriefOptimizeFor,
  generateBrief,
} from "@/lib/llm";
import { hasActiveSubscription } from "@/lib/server/auth";
import { checkRateLimit, RATE_LIMITS, rateLimitKey } from "@/lib/shared/rate-limit";

const BodySchema = z.object({
  niche: z.string().min(1).max(50),
  optimizeFor: z
    .enum(["fast-subs", "fast-views", "evergreen", "shortform"])
    .optional()
    .default("fast-views"),
  channelSize: z
    .enum(["small", "medium", "large"])
    .optional()
    .default("small"),
});

type LimitDecision =
  | { kind: "skip" } // PRO: unlimited
  | {
      kind: "check";
      operation: "guestIdeas" | "briefFree";
      identifier: string;
      reason: "signup_required" | "upgrade_required";
    };

function pickLimitDecision(api: ApiAuthContext): LimitDecision | { kind: "missing-id" } {
  if (api.user) {
    const isPro = hasActiveSubscription(api.user.subscription);
    if (isPro) {return { kind: "skip" };}
    return {
      kind: "check",
      operation: "briefFree",
      identifier: `user:${api.user.id}`,
      reason: "upgrade_required",
    };
  }
  if (!api.ip) {return { kind: "missing-id" };}
  return {
    kind: "check",
    operation: "guestIdeas",
    identifier: `ip:${api.ip}`,
    reason: "signup_required",
  };
}

export const POST = createApiRoute(
  { route: "/api/ideas/brief" },
  withAuth(
    { mode: "optional" },
    withValidation(
      { body: BodySchema },
      async (_req, _ctx, api: ApiAuthContext, { body }) => {
        const decision = pickLimitDecision(api);
        if (decision.kind === "missing-id") {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Unable to verify request origin.",
          });
        }

        const headers: Record<string, string> = {};
        let remaining: number | null = null;

        if (decision.kind === "check") {
          const key = rateLimitKey(decision.operation, decision.identifier);
          const result = await checkRateLimit(key, RATE_LIMITS[decision.operation]);
          if (!result.success) {
            throw new ApiError({
              code: "RATE_LIMITED",
              status: 429,
              message:
                decision.reason === "signup_required"
                  ? "Sign up free to keep generating briefs."
                  : "You've used today's free briefs. Upgrade to PRO for unlimited.",
              details: {
                reason: decision.reason,
                resetAt: new Date(result.resetAt).toISOString(),
              },
            });
          }
          remaining = result.remaining;
          headers["X-RateLimit-Remaining"] = String(result.remaining);
          headers["X-RateLimit-Reset"] = new Date(result.resetAt).toISOString();
        }

        const { niche, optimizeFor, channelSize } = body!;

        // Real per-niche keyword pool from DataForSEO (24h cached).
        // Empty array signals the LLM to set anchorIndex: -1 — never fakes a match.
        const anchors = await getNicheKeywords(niche);

        const ideas = await generateBrief({
          niche,
          optimizeFor: optimizeFor as BriefOptimizeFor,
          channelSize: channelSize as BriefChannelSize,
          anchors,
        });

        const resolvedAnchors = ideas.map((idea) =>
          idea.anchorIndex >= 0 ? anchors[idea.anchorIndex] : null,
        );

        return jsonOk(
          {
            ideas,
            anchors: resolvedAnchors,
            meta: {
              tier: api.user ? (hasActiveSubscription(api.user.subscription) ? "PRO" : "FREE") : "guest",
              remaining,
            },
          },
          { requestId: api.requestId, headers },
        );
      },
    ),
  ),
);
