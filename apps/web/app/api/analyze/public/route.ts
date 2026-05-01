/**
 * POST /api/analyze/public
 *
 * Public video analysis endpoint — no authentication required.
 * Accepts a YouTube video URL and returns a full analysis.
 *
 * Rate limits:
 *   - Per-IP: 3 analyses per day (anonymous)
 *   - Per-user: uses standard competitorDetail limit (authenticated)
 *   - Global: 500 anonymous analyses per day (denial-of-wallet protection)
 *
 * Auth: Optional (authenticated users get user-based rate limits)
 */
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { AnalyzeUrlSchema, analyzeVideo } from "@/lib/features/competitors";
import { checkRateLimit, RATE_LIMITS, rateLimitKey } from "@/lib/shared/rate-limit";
import { extractVideoId } from "@/lib/shared/youtube-url";
import { prisma } from "@/prisma";

export const POST = createApiRoute(
  { route: "/api/analyze/public" },
  withAuth(
    { mode: "optional" },
    withRateLimit(
      {
        operation: "publicAnalyze",
        // Authenticated users: rate limit by userId. Anonymous: by IP.
        identifier: (api) => api.userId ?? api.ip,
      },
      withValidation(
        { body: AnalyzeUrlSchema },
        async (_req, _ctx, api, { body }) => {
          const isAnonymous = !api.userId;

          // For anonymous requests, require a valid IP (security: prevents rate limit bypass)
          if (isAnonymous && !api.ip) {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: "Unable to verify request origin.",
            });
          }

          // Global daily cap for anonymous analyses (requires distributed rate limiter)
          if (isAnonymous) {
            const globalKey = rateLimitKey("anonymousGlobalDaily", "global");
            const globalResult = await checkRateLimit(
              globalKey,
              RATE_LIMITS.anonymousGlobalDaily,
            );
            if (!globalResult.success) {
              throw new ApiError({
                code: "RATE_LIMITED",
                status: 429,
                message: "Free analyses are temporarily at capacity. Sign up for unlimited access.",
              });
            }
          }

          const videoId = extractVideoId(body!.url);
          if (!videoId) {
            throw new ApiError({
              code: "VALIDATION_ERROR",
              status: 400,
              message: "Could not extract video ID from URL",
            });
          }

          // For authenticated users, get their channel for personalized analysis
          let userChannelId: string | undefined;
          if (api.userId) {
            const channel = await prisma.channel.findFirst({
              where: { userId: api.userId },
              select: { youtubeChannelId: true },
              orderBy: { id: "asc" },
            });
            userChannelId = channel?.youtubeChannelId;
          }

          const result = await analyzeVideo({
            userId: api.userId,
            channelId: userChannelId,
            videoId,
            includeMoreFromChannel: true,
            clientIp: api.ip,
          });

          // Include rate limit info from withRateLimit (no double-increment)
          const headers: Record<string, string> = {};
          if (isAnonymous && api.rateLimitResult) {
            headers["X-RateLimit-Remaining"] = String(api.rateLimitResult.remaining);
            headers["X-RateLimit-Reset"] = new Date(api.rateLimitResult.resetAt).toISOString();
          }

          return jsonOk(result, { requestId: api.requestId, headers });
        },
      ),
    ),
  ),
);
