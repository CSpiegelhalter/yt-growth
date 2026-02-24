import { getDateRange, toLocalDateStr } from "@/lib/shared/date-range";

import { ChannelAuditError } from "../errors";
import type {
  AuditTrends,
  ChannelOverviewResult,
  GetOverviewDeps,
  GetOverviewInput,
  OverviewDailyRow,
  TrendMetric,
} from "../types";

function trendsToMetrics(trends: AuditTrends): TrendMetric[] {
  const entries: { metric: string; label: string; trend: AuditTrends[keyof AuditTrends] }[] = [
    { metric: "views", label: "Views", trend: trends.views },
    { metric: "watchTime", label: "Watch Time", trend: trends.watchTime },
    { metric: "subscribers", label: "Subscribers", trend: trends.subscribers },
  ];

  return entries
    .filter((e) => e.trend.value != null)
    .map((e) => ({
      metric: e.metric,
      label: e.label,
      percentChange: Math.abs(e.trend.value!),
      direction: e.trend.direction,
    }));
}

/**
 * YouTube Analytics only returns rows for days with activity.
 * Fill gaps with zero-valued rows so the chart always spans the full range.
 */
function fillMissingDays(
  rows: OverviewDailyRow[],
  startDate: string,
  endDate: string,
): OverviewDailyRow[] {
  const existing = new Map(rows.map((r) => [r.date, r]));
  const result: OverviewDailyRow[] = [];

  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  while (current <= end) {
    const dateStr = toLocalDateStr(current);
    result.push(
      existing.get(dateStr) ?? {
        date: dateStr,
        views: 0,
        shares: 0,
        watchTimeMinutes: 0,
        subscribersGained: 0,
        subscribersLost: 0,
      },
    );
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export async function getChannelOverview(
  input: GetOverviewInput,
  deps: GetOverviewDeps,
): Promise<ChannelOverviewResult> {
  const { userId, channelId, range } = input;
  const { startDate, endDate } = getDateRange(range);

  const [daily, auditTrends] = await Promise.all([
    deps.fetchDailyAnalytics(userId, channelId, startDate, endDate),
    deps.fetchAuditTrends(userId, channelId, range),
  ]);

  if (!daily) {
    throw new ChannelAuditError(
      "EXTERNAL_FAILURE",
      "Failed to fetch channel daily analytics",
    );
  }

  const filledDaily = fillMissingDays(daily, startDate, endDate);
  const trends = auditTrends ? trendsToMetrics(auditTrends) : [];

  return { daily: filledDaily, trends, videos: [] };
}
