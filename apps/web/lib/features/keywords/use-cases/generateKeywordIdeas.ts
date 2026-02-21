import "server-only";

import { logger } from "@/lib/shared/logger";
import {
  prepareDataForSeoRequest,
  mapDataForSEOError,
  DataForSEOError,
} from "@/lib/dataforseo";
import {
  getCachedVideoIdeas,
  setCachedVideoIdeas,
  generateVideoIdeasCacheKey,
} from "@/lib/dataforseo/cache";
import {
  generateVideoIdeasFromTopic,
  type AudienceLevel,
  type FormatPreference,
} from "@/lib/keywords/ideasService";
import { checkEntitlement, entitlementErrorResponse } from "@/lib/with-entitlements";
import { getCurrentUserWithSubscription } from "@/lib/server/auth";
import type { GenerateKeywordIdeasInput, GenerateKeywordIdeasResult } from "../types";
import { KeywordError } from "../errors";
import { toUsageInfo } from "../quota";

/**
 * Orchestrate video idea generation from a topic description.
 *
 * This use-case handles its own auth (auth-on-action pattern) and entitlement
 * checks because the ideas route operates differently from the other keyword
 * routes — it was not built on createApiRoute/withAuth.
 *
 * Returns discriminated union so the route can map to the correct response
 * shape without containing domain logic.
 */
export async function generateKeywordIdeas(
  input: GenerateKeywordIdeasInput,
): Promise<
  | GenerateKeywordIdeasResult
  | { type: "needs_auth" }
  | { type: "entitlement_error"; response: Response }
> {
  const { topicDescription, locationCode, audienceLevel, formatPreference } = input;

  // Validate location
  let locationInfo;
  try {
    ({ locationInfo } = prepareDataForSeoRequest({ location: locationCode }));
  } catch {
    throw new KeywordError("INVALID_INPUT", "Unsupported region");
  }

  // Auth check (auth-on-action)
  const user = await getCurrentUserWithSubscription();
  if (!user) {
    return { type: "needs_auth" };
  }

  // Cache check
  const cacheKey = generateVideoIdeasCacheKey({
    topicDescription,
    location: locationInfo.region,
    audienceLevel,
    formatPreference,
  });

  const cached = await getCachedVideoIdeas(cacheKey);
  if (cached) {
    logger.info("keywords.ideas.cache_hit", {
      userId: user.id,
      cacheKey: cacheKey.slice(0, 8),
    });

    return {
      type: "success",
      body: {
        ...cached.data,
        meta: { ...cached.data.meta, cached: true },
      },
    };
  }

  // Entitlement check
  const entitlement = await checkEntitlement({
    featureKey: "keyword_research",
    increment: true,
    amount: 1,
  });

  if (!entitlement.ok) {
    if (entitlement.error.type === "limit_reached") {
      return {
        type: "needs_upgrade",
        body: {
          needsUpgrade: true,
          ...entitlement.error.body,
        },
      };
    }
    return { type: "entitlement_error", response: entitlementErrorResponse(entitlement.error) };
  }

  logger.info("keywords.ideas.generation_start", {
    userId: user.id,
    topic: topicDescription.slice(0, 50),
    location: locationInfo.region,
    audienceLevel,
    formatPreference,
  });

  let result;
  try {
    result = await generateVideoIdeasFromTopic({
      topicDescription,
      locationCode: locationInfo.region,
      audienceLevel: audienceLevel as AudienceLevel,
      formatPreference: formatPreference as FormatPreference,
    });
  } catch (err) {
    if (err instanceof DataForSEOError) {
      logger.error("keywords.ideas.dataforseo_error", {
        userId: user.id,
        code: err.code,
        message: err.message,
      });
      throw mapDataForSEOError(err);
    }
    throw err;
  }

  await setCachedVideoIdeas(cacheKey, topicDescription, locationInfo.region, result);

  logger.info("keywords.ideas.generation_complete", {
    userId: user.id,
    ideasCount: result.ideas.length,
    keywordsCount: result.keywords.length,
  });

  const usage = entitlement.context.usage;
  return {
    type: "success",
    body: {
      ...result,
      usage: usage ? toUsageInfo(usage) : undefined,
    },
  };
}
