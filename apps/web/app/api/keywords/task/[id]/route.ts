/**
 * GET /api/keywords/task/:id
 *
 * Poll for keyword research task results.
 *
 * Used when the initial research request returns { pending: true, taskId }.
 * Client polls this endpoint every ~2 seconds until results are ready.
 *
 * Auth: Required (task must belong to authenticated user's session)
 */

import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { jsonOk, jsonError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import {
  getSearchVolumeTask,
  getKeywordsForKeywordsTask,
  getGoogleTrendsTask,
  parseGoogleTrendsResult,
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

// ============================================
// TASK STATUS HELPER
// ============================================

/**
 * Handle the pending/error branches that are identical across all task types.
 * Returns a Response for pending/error, or null when the task completed.
 */
function handlePendingOrError(
  result: { status: string; error?: string },
  ctx: { userId: number; taskId: string; mode: string; requestId: string },
): Response | null {
  if (result.status === "pending") {
    logger.info("keywords.task_still_pending", {
      userId: ctx.userId,
      taskId: ctx.taskId,
      mode: ctx.mode,
    });
    return jsonOk(
      { pending: true, taskId: ctx.taskId, message: "Still processing..." },
      { requestId: ctx.requestId },
    );
  }

  if (result.status === "error") {
    logger.error("keywords.task_error", {
      userId: ctx.userId,
      taskId: ctx.taskId,
      error: result.error,
    });
    return jsonError({
      status: 500,
      code: "INTEGRATION_ERROR",
      message: result.error || "Task failed",
      requestId: ctx.requestId,
    });
  }

  return null;
}

// ============================================
// ROUTE HANDLER
// ============================================

export const GET = createApiRoute(
  { route: "/api/keywords/task/:id" },
  withAuth({ mode: "required" }, async (req, _ctx, api: ApiAuthContext) => {
    const user = api.user!;

    // Extract taskId from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const taskId = pathParts[pathParts.length - 1];

    if (!taskId || taskId.length < 10) {
      return jsonError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid task ID",
        requestId: api.requestId,
      });
    }

    // Look up the pending task to determine mode and parameters
    const pendingTask = await getPendingTask(taskId);

    if (!pendingTask) {
      return jsonError({
        status: 404,
        code: "NOT_FOUND",
        message: "Task not found or already completed",
        requestId: api.requestId,
      });
    }

    const { mode, phrase, location } = pendingTask;
    const pollCtx = { userId: user.id, taskId, mode, requestId: api.requestId };

    try {
      if (mode === "trends") {
        const result = await getGoogleTrendsTask(taskId);
        const earlyReturn = handlePendingOrError(result, pollCtx);
        if (earlyReturn) return earlyReturn;

        if (!result.data) {
          return jsonOk(
            {
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
            { requestId: api.requestId }
          );
        }

        const response = parseGoogleTrendsResult(result.data, phrase, location, taskId);
        await completePendingTask(taskId, response);

        logger.info("keywords.task_completed", {
          userId: user.id, taskId, mode,
          dataPoints: response.interestOverTime.length,
        });

        return jsonOk(
          {
            keyword: response.keyword,
            interestOverTime: response.interestOverTime,
            risingQueries: response.risingQueries,
            topQueries: response.topQueries,
            regionBreakdown: response.regionBreakdown,
            averageInterest: response.averageInterest,
            meta: {
              source: "dataforseo",
              location: response.meta.location,
              dateFrom: response.meta.dateFrom,
              dateTo: response.meta.dateTo,
              fetchedAt: response.meta.fetchedAt,
              cached: false,
            },
          },
          { requestId: api.requestId }
        );
      } else if (mode === "overview" || mode === "search_volume") {
        const result = await getSearchVolumeTask(taskId);
        const earlyReturn = handlePendingOrError(result, pollCtx);
        if (earlyReturn) return earlyReturn;

        const response: KeywordOverviewResponse = {
          rows: result.data ?? [],
          meta: { location, fetchedAt: new Date().toISOString(), taskId },
        };

        await completePendingTask(taskId, response);
        const rows = response.rows.map(mapToLegacyOverviewRow);

        logger.info("keywords.task_completed", {
          userId: user.id, taskId, mode, rowCount: rows.length,
        });

        return jsonOk(
          {
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
          { requestId: api.requestId }
        );
      } else {
        const result = await getKeywordsForKeywordsTask(taskId);
        const earlyReturn = handlePendingOrError(result, pollCtx);
        if (earlyReturn) return earlyReturn;

        const response: KeywordRelatedResponse = {
          rows: result.data ?? [],
          meta: { location, phrase, fetchedAt: new Date().toISOString(), taskId },
        };

        await completePendingTask(taskId, response);
        const rows = response.rows.map(mapToLegacyRelatedRow);

        logger.info("keywords.task_completed", {
          userId: user.id, taskId, mode, rowCount: rows.length,
        });

        return jsonOk(
          {
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
          { requestId: api.requestId }
        );
      }
    } catch (err) {
      if (err instanceof DataForSEOError) {
        logger.error("keywords.task_dataforseo_error", {
          userId: user.id,
          taskId,
          code: err.code,
          message: err.message,
        });

        let status = 500;
        let code = "INTERNAL";

        switch (err.code) {
          case "RATE_LIMITED":
            status = 429;
            code = "RATE_LIMITED";
            break;
          case "TIMEOUT":
            status = 504;
            code = "TIMEOUT";
            break;
        }

        return jsonError({
          status,
          code: code as any,
          message: err.message,
          requestId: api.requestId,
        });
      }

      throw err;
    }
  })
);

export const runtime = "nodejs";
