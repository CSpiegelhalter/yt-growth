import "server-only";

import {
  DataForSEOError,
  mapDataForSEOError,
  prepareDataForSeoRequest,
} from "@/lib/dataforseo";
import {
  generateVideoIdeasCacheKey,
  getCachedVideoIdeas,
  setCachedVideoIdeas,
} from "@/lib/dataforseo/cache";
import {
  type AudienceLevel,
  type FormatPreference,
  generateVideoIdeasFromTopic,
} from "@/lib/keywords/ideasService";
import { logger } from "@/lib/shared/logger";
import { checkEntitlement, entitlementErrorResponse } from "@/lib/with-entitlements";

import { KeywordError } from "../errors";
import { toUsageInfo } from "../quota";
import type { GenerateKeywordIdeasInput, GenerateKeywordIdeasResult } from "../types";

type GenerateKeywordIdeasDeps = {
  getUser: () => Promise<{ id: number } | null>;
};

/**
 * Orchestrate video idea generation from a topic description.
 *
 * Auth is checked via the injected `deps.getUser` callback (auth-on-action
 * pattern). The route handler wires the concrete auth implementation.
 *
 * Returns discriminated union so the route can map to the correct response
 * shape without containing domain logic.
 */
export async function generateKeywordIdeas(
  input: GenerateKeywordIdeasInput,
  deps: GenerateKeywordIdeasDeps,
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
  const user = await deps.getUser();
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
  } catch (error) {
    if (error instanceof DataForSEOError) {
      logger.error("keywords.ideas.dataforseo_error", {
        userId: user.id,
        code: error.code,
        message: error.message,
      });
      throw mapDataForSEOError(error);
    }
    throw error;
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
