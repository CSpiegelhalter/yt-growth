import "server-only";

import { logger } from "@/lib/logger";
import {
  fetchYouTubeSerp,
  prepareDataForSeoRequest,
  mapDataForSEOError,
  DataForSEOError,
  type YouTubeSerpResponse,
} from "@/lib/dataforseo";
import {
  getCachedResponse,
  setCachedResponse,
} from "@/lib/dataforseo/cache";
import type { GetYoutubeSerpInput, GetYoutubeSerpResult } from "../types";

export async function getYoutubeSerp(
  input: GetYoutubeSerpInput,
): Promise<GetYoutubeSerpResult> {
  const { userId, keyword, location, limit } = input;

  const { cleanPhrases, locationInfo } = prepareDataForSeoRequest({
    phrase: keyword,
    location,
  });
  const cleanKeyword = cleanPhrases[0]!;

  // Check cache (24 hour TTL for YouTube SERP)
  const cached = await getCachedResponse<YouTubeSerpResponse>(
    "youtube_serp",
    cleanKeyword,
    locationInfo.region,
  );

  if (cached) {
    logger.info("youtube_serp.cache_hit", {
      userId,
      keyword: cleanKeyword,
      location: locationInfo.region,
    });

    return {
      type: "success",
      body: { ...cached.data, cached: true },
    };
  }

  try {
    const response = await fetchYouTubeSerp({
      keyword: cleanKeyword,
      location: locationInfo.region,
      limit,
    });

    await setCachedResponse(
      "youtube_serp",
      cleanKeyword,
      locationInfo.region,
      response,
    );

    logger.info("youtube_serp.success", {
      userId,
      keyword: cleanKeyword,
      location: locationInfo.region,
      resultCount: response.results.length,
    });

    return {
      type: "success",
      body: { ...response, cached: false },
    };
  } catch (err) {
    if (err instanceof DataForSEOError) {
      logger.error("youtube_serp.dataforseo_error", {
        userId,
        code: err.code,
        message: err.message,
      });
      throw mapDataForSEOError(err);
    }

    throw err;
  }
}
