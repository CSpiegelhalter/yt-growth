/**
 * /llms.txt endpoint
 *
 * Serves an LLM-friendly manifest describing ChannelBoost's content structure,
 * key pages, and structured data conventions.
 *
 * @see https://llmstxt.org/ for the llms.txt specification
 * @see lib/llms.ts for the content source of truth
 */

import { NextResponse } from "next/server";
import { CANONICAL_ORIGIN, buildLlmsTxt } from "@/lib/shared/llms";

/**
 * Force static generation for optimal caching.
 * Content changes require redeployment, which is fine since
 * the llms.txt content is tied to code changes anyway.
 */
export const dynamic = "force-static";

/**
 * GET /llms.txt
 *
 * Returns the llms.txt manifest as text/markdown.
 * Uses canonical origin for all URLs to match sitemap/robots.
 */
export function GET(): NextResponse {
  const body = buildLlmsTxt({ origin: CANONICAL_ORIGIN });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Cache for 1 hour on browser, 1 day on CDN, stale-while-revalidate for 7 days
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      // Allow CORS for LLM tooling
      "Access-Control-Allow-Origin": "*",
    },
  });
}
