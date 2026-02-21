import "server-only";

import { logger } from "@/lib/shared/logger";
import {
  getSearchVolumeTask,
  getKeywordsForKeywordsTask,
  getGoogleTrendsTask,
  parseGoogleTrendsResult,
  mapDataForSEOError,
  DataForSEOError,
  type KeywordOverviewResponse,
  type KeywordRelatedResponse,
} from "@/lib/dataforseo";
import {
  getPendingTask,
  completePendingTask,
} from "@/lib/dataforseo/cache";
import {
  mapToLegacyOverviewRow,
  mapToLegacyRelatedRow,
} from "@/lib/keywords/mappers";
import type { PollKeywordTaskInput, PollKeywordTaskResult } from "../types";
import { KeywordError } from "../errors";
import { mapTrendsBody } from "./trends-mapper";

/**
 * Poll for the result of a pending DataForSEO keyword task.
 *
 * Returns a discriminated union so the route can map to the correct
 * response shape without containing domain logic.
 */
export async function pollKeywordTask(
  input: PollKeywordTaskInput,
): Promise<PollKeywordTaskResult> {
  const { userId, taskId } = input;

  const pendingTask = await getPendingTask(taskId);
  if (!pendingTask) {
    throw new KeywordError("NOT_FOUND", "Task not found or already completed");
  }

  const { mode, phrase, location } = pendingTask;

  try {
    if (mode === "trends") {
      return await pollTrendsTask(userId, taskId, phrase, location);
    }

    if (mode === "overview" || mode === "search_volume") {
      return await pollOverviewTask(userId, taskId, location);
    }

    return await pollRelatedTask(userId, taskId, phrase, location);
  } catch (err) {
    if (err instanceof DataForSEOError) {
      logger.error("keywords.task_dataforseo_error", {
        userId,
        taskId,
        code: err.code,
        message: err.message,
      });
      throw mapDataForSEOError(err);
    }

    throw err;
  }
}

// ── Internal helpers ────────────────────────────────────────────

function checkTaskStatus(
  result: { status: string; error?: string },
  ctx: { userId: number; taskId: string; mode: string },
): PollKeywordTaskResult | null {
  if (result.status === "pending") {
    logger.info("keywords.task_still_pending", {
      userId: ctx.userId,
      taskId: ctx.taskId,
      mode: ctx.mode,
    });
    return {
      type: "pending",
      body: {
        pending: true,
        taskId: ctx.taskId,
        message: "Still processing...",
      },
    };
  }

  if (result.status === "error") {
    logger.error("keywords.task_error", {
      userId: ctx.userId,
      taskId: ctx.taskId,
      error: result.error,
    });
    throw new KeywordError("EXTERNAL_FAILURE", result.error || "Task failed");
  }

  return null;
}

async function pollTrendsTask(
  userId: number,
  taskId: string,
  phrase: string,
  location: string,
): Promise<PollKeywordTaskResult> {
  const result = await getGoogleTrendsTask(taskId);
  const ctx = { userId, taskId, mode: "trends" };
  const earlyReturn = checkTaskStatus(result, ctx);
  if (earlyReturn) return earlyReturn;

  if (!result.data) {
    return {
      type: "completed",
      body: {
        keyword: phrase,
        interestOverTime: [],
        risingQueries: [],
        topQueries: [],
        regionBreakdown: [],
        averageInterest: 0,
        meta: {
          source: "dataforseo",
          location,
          dateFrom: "",
          dateTo: "",
          fetchedAt: new Date().toISOString(),
          cached: false,
        },
      },
    };
  }

  const response = parseGoogleTrendsResult(result.data, phrase, location, taskId);
  await completePendingTask(taskId, response);

  logger.info("keywords.task_completed", {
    userId,
    taskId,
    mode: "trends",
    dataPoints: response.interestOverTime.length,
  });

  return {
    type: "completed",
    body: mapTrendsBody(response),
  };
}

async function pollOverviewTask(
  userId: number,
  taskId: string,
  location: string,
): Promise<PollKeywordTaskResult> {
  const result = await getSearchVolumeTask(taskId);
  const ctx = { userId, taskId, mode: "overview" };
  const earlyReturn = checkTaskStatus(result, ctx);
  if (earlyReturn) return earlyReturn;

  const response: KeywordOverviewResponse = {
    rows: result.data ?? [],
    meta: { location, fetchedAt: new Date().toISOString(), taskId },
  };

  await completePendingTask(taskId, response);
  const rows = response.rows.map(mapToLegacyOverviewRow);

  logger.info("keywords.task_completed", {
    userId,
    taskId,
    mode: "overview",
    rowCount: rows.length,
  });

  return {
    type: "completed",
    body: {
      overview: rows[0] || null,
      rows,
      meta: {
        source: "dataforseo",
        fetchedAt: response.meta.fetchedAt,
        cached: false,
        database: location,
        difficultyIsEstimate: true,
      },
    },
  };
}

async function pollRelatedTask(
  userId: number,
  taskId: string,
  phrase: string,
  location: string,
): Promise<PollKeywordTaskResult> {
  const result = await getKeywordsForKeywordsTask(taskId);
  const ctx = { userId, taskId, mode: "related" };
  const earlyReturn = checkTaskStatus(result, ctx);
  if (earlyReturn) return earlyReturn;

  const response: KeywordRelatedResponse = {
    rows: result.data ?? [],
    meta: { location, phrase, fetchedAt: new Date().toISOString(), taskId },
  };

  await completePendingTask(taskId, response);
  const rows = response.rows.map(mapToLegacyRelatedRow);

  logger.info("keywords.task_completed", {
    userId,
    taskId,
    mode: "related",
    rowCount: rows.length,
  });

  return {
    type: "completed",
    body: {
      rows,
      meta: {
        source: "dataforseo",
        fetchedAt: response.meta.fetchedAt,
        cached: false,
        database: location,
        phrase,
        difficultyIsEstimate: true,
      },
    },
  };
}
