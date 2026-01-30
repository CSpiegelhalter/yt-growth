/**
 * YouTube Analytics API Operations
 *
 * Functions for YouTube Analytics API v2 endpoints.
 */

import { YOUTUBE_ANALYTICS_API } from "./constants";
import { youtubeFetch } from "./transport";
import { yyyyMmDd } from "./utils";
import type { GoogleAccount, VideoMetricsData, RetentionPoint } from "./types";

/**
 * Fetch video metrics from YouTube Analytics API.
 */
export async function fetchVideoMetrics(
  ga: GoogleAccount,
  channelId: string,
  videoIds: string[],
  startDate: string,
  endDate: string,
): Promise<VideoMetricsData[]> {
  const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
  url.searchParams.set("ids", `channel==${channelId}`);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set(
    "metrics",
    "views,likes,comments,shares,subscribersGained,subscribersLost,estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
  );
  url.searchParams.set("dimensions", "video");
  url.searchParams.set("filters", `video==${videoIds.join(",")}`);
  url.searchParams.set("sort", "-views");

  const data = await youtubeFetch<{
    columnHeaders?: Array<{ name: string }>;
    rows?: Array<Array<string | number>>;
  }>(ga, url.toString());

  if (!data.rows) return [];

  const headers = (data.columnHeaders ?? []).map((h) => h.name);
  return data.rows.map((row) => {
    const obj: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return {
      videoId: String(obj.video),
      views: Number(obj.views ?? 0),
      likes: Number(obj.likes ?? 0),
      comments: Number(obj.comments ?? 0),
      shares: Number(obj.shares ?? 0),
      subscribersGained: Number(obj.subscribersGained ?? 0),
      subscribersLost: Number(obj.subscribersLost ?? 0),
      estimatedMinutesWatched: Number(obj.estimatedMinutesWatched ?? 0),
      averageViewDuration: Number(obj.averageViewDuration ?? 0),
      averageViewPercentage: Number(obj.averageViewPercentage ?? 0),
    };
  });
}

/**
 * Fetch retention curve (audience watch ratio) for a video.
 *
 * @param startDate - Optional start date. Defaults to 90 days ago.
 *                    Pass the video's publishedAt for precise range.
 */
export async function fetchRetentionCurve(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate?: Date | string,
): Promise<RetentionPoint[]> {
  // Default to 90 days ago if no start date provided
  const start = startDate
    ? typeof startDate === "string"
      ? startDate
      : yyyyMmDd(startDate)
    : yyyyMmDd(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

  const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
  url.searchParams.set("ids", `channel==${channelId}`);
  url.searchParams.set("startDate", start);
  url.searchParams.set("endDate", yyyyMmDd(new Date()));
  url.searchParams.set("metrics", "audienceWatchRatio");
  url.searchParams.set("dimensions", "elapsedVideoTimeRatio");
  url.searchParams.set("filters", `video==${videoId}`);
  url.searchParams.set("sort", "elapsedVideoTimeRatio");

  const data = await youtubeFetch<{
    columnHeaders?: Array<{ name: string }>;
    rows?: Array<[number, number]>;
  }>(ga, url.toString());

  if (!data.rows) return [];

  return data.rows.map(([elapsedRatio, audienceWatchRatio]) => ({
    elapsedRatio,
    audienceWatchRatio,
  }));
}
