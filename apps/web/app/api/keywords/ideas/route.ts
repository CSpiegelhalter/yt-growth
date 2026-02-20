/**
 * POST /api/keywords/ideas
 *
 * Orchestrated endpoint for generating video ideas from a topic description.
 *
 * Flow:
 * 1. User provides topic description
 * 2. LLM #1 generates seed keywords
 * 3. DataForSEO K4K expands to candidates
 * 4. DataForSEO Search Volume enriches top candidates
 * 5. LLM #2 generates video ideas using enriched data
 *
 * Auth: Required (auth-on-action pattern)
 * - Returns needsAuth: true if not authenticated
 * - Returns needsUpgrade: true if over free limits
 *
 * Caching: 7-day TTL on full results
 * - Cache hits don't consume quota
 */

import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api/withValidation";
import { logger } from "@/lib/logger";
import { DataForSEOError } from "@/lib/dataforseo";
import {
  KeywordIdeasBodySchema,
  generateKeywordIdeas,
} from "@/lib/features/keywords";
import type { AudienceLevel, FormatPreference } from "@/lib/features/keywords";

function jsonOk(data: unknown) {
  return NextResponse.json(data, { status: 200 });
}

function jsonError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
) {
  return NextResponse.json({ error: code, message, ...details }, { status });
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const parsed = await parseBody(request, KeywordIdeasBodySchema);
    if (!parsed.ok) {
      if (parsed.type === "json") {
        return jsonError("INVALID_JSON", "Invalid request body", 400);
      }
      const firstError = parsed.zodError.errors[0];
      return jsonError("VALIDATION_ERROR", parsed.firstMessage, 400, {
        field: firstError?.path.join("."),
      });
    }

    const { topicDescription, locationCode, audienceLevel, formatPreference } =
      parsed.data;

    const result = await generateKeywordIdeas({
      topicDescription,
      locationCode,
      audienceLevel: audienceLevel as AudienceLevel,
      formatPreference: formatPreference as FormatPreference,
    });

    if (result.type === "needs_auth") {
      return jsonOk({ needsAuth: true });
    }

    if (result.type === "entitlement_error") {
      return result.response;
    }

    if (result.type === "needs_upgrade") {
      return jsonOk(result.body);
    }

    const elapsed = Date.now() - startTime;
    logger.info("keywords.ideas.elapsed", { elapsedMs: elapsed });

    return jsonOk(result.body);
  } catch (err) {
    logger.error("keywords.ideas.error", { error: String(err) });

    if (err instanceof DataForSEOError) {
      return jsonError(
        "PROVIDER_ERROR",
        err.code === "QUOTA_EXCEEDED"
          ? "Keyword research service temporarily unavailable"
          : err.message,
        503,
        { code: err.code },
      );
    }

    return jsonError("INTERNAL_ERROR", "Failed to generate video ideas", 500);
  }
}
