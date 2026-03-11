"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import type { LabelProps } from "recharts";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  OverviewDailyRow,
  VideoPublishMarker,
} from "@/lib/features/channel-audit";
import { formatCompact, formatDateShort } from "@/lib/shared/format";

import s from "./overview-chart.module.css";

type OverviewChartProps = {
  daily: OverviewDailyRow[];
  videos: VideoPublishMarker[];
};

type ChartRow = OverviewDailyRow & { label: string };

type MarkerCluster = {
  dates: string[];
  centerIdx: number;
  centerLabel: string;
};

const METRICS = [
  { key: "views" as const, label: "Views", color: "var(--color-cool-sky)" },
  { key: "shares" as const, label: "Shares", color: "var(--color-cool-sky)" },
  { key: "watchTimeMinutes" as const, label: "Watch Time", color: "var(--color-cool-sky)" },
  { key: "netSubs" as const, label: "Subscribers", color: "var(--color-cool-sky)" },
] as const;

/** Minimum gap (in data points) between markers before they cluster. */
const CLUSTER_GAP = 2;

function prepareData(daily: OverviewDailyRow[]): ChartRow[] {
  return daily.map((row) => ({
    ...row,
    netSubs: row.subscribersGained - row.subscribersLost,
    label: formatDateShort(row.date),
  })) as unknown as ChartRow[];
}

function toLocalDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildClusters(
  data: ChartRow[],
  publishDates: Set<string>,
): { clusters: MarkerCluster[]; dateToCenter: Map<string, string> } {
  const indices = data
    .map((p, i) => ({ date: p.date, label: p.label, idx: i }))
    .filter((p) => publishDates.has(p.date));

  if (indices.length === 0) {
    return { clusters: [], dateToCenter: new Map() };
  }

  const clusters: MarkerCluster[] = [];
  const dateToCenter = new Map<string, string>();

  function finalizeGroup(group: typeof indices) {
    const center = group[Math.floor(group.length / 2)];
    clusters.push({
      dates: group.map((m) => m.date),
      centerIdx: center.idx,
      centerLabel: center.label,
    });
    for (const m of group) {dateToCenter.set(m.date, center.date);}
  }

  let current = [indices[0]];
  for (let i = 1; i < indices.length; i++) {
    if (indices[i].idx - current.at(-1)!.idx <= CLUSTER_GAP) {
      current.push(indices[i]);
    } else {
      finalizeGroup(current);
      current = [indices[i]];
    }
  }
  finalizeGroup(current);

  return { clusters, dateToCenter };
}

function VideoMarkerTooltip({
  video,
}: {
  video: VideoPublishMarker;
}) {
  const [imgError, setImgError] = useState(false);

  if (!video.thumbnailUrl || imgError) {
    return (
      <div className={s.markerTooltip}>
        <span className={s.markerTooltipTitle}>{video.title}</span>
      </div>
    );
  }

  return (
    <div className={s.markerTooltip}>
      <Image
        src={video.thumbnailUrl}
        alt=""
        width={80}
        height={45}
        className={s.markerTooltipThumb}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        unoptimized
      />
      <span className={s.markerTooltipTitle}>{video.title}</span>
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  label,
  metricKey,
  metricLabel,
  metricColor,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  metricKey: string;
  metricLabel: string;
  metricColor: string;
}) {
  if (!active || !payload?.length) {return null;}

  const value = payload[0]?.value ?? 0;
  return (
    <div className={s.tooltip}>
      <span className={s.tooltipLabel}>{label}</span>
      <span className={s.tooltipValue} style={{ color: metricColor }}>
        {metricKey === "watchTimeMinutes"
          ? `${formatCompact(value)} min`
          : formatCompact(value)}{" "}
        {metricLabel}
      </span>
    </div>
  );
}

type AxisTickProps = {
  x: string | number;
  y: string | number;
  payload: { value: string };
  index: number;
};

function renderAxisTick(dataLen: number) {
  return function AxisTick(tickProps: AxisTickProps) {
    const { x, y, payload, index: idx } = tickProps;
    const step = Math.max(1, Math.floor(dataLen / 7));
    const isStart = idx === 0;
    const isEnd = idx === dataLen - 1;
    const atInterval = idx % step === 0;
    const tooCloseToEdge = idx < step || dataLen - 1 - idx < step;
    if (!isStart && !isEnd && (!atInterval || tooCloseToEdge)) {
      return <g />;
    }
    return (
      <text
        x={x}
        y={y}
        dy={12}
        textAnchor={isStart ? "start" : isEnd ? "end" : "middle"}
        fill="var(--text-secondary)"
        fontSize={11}
      >
        {payload.value}
      </text>
    );
  };
}

function SingleMetricChart({
  data,
  metric,
  clusters,
  dateToCenter,
  videos,
  isLast,
  isFirst,
  hoveredCluster,
  onClusterHover,
}: {
  data: ChartRow[];
  metric: (typeof METRICS)[number];
  clusters: MarkerCluster[];
  dateToCenter: Map<string, string>;
  videos: VideoPublishMarker[];
  isLast: boolean;
  isFirst: boolean;
  hoveredCluster: string | null;
  onClusterHover: (centerDate: string | null) => void;
}) {
  return (
    <div className={s.chartRow}>
      <span className={s.chartLabel} style={{ color: "var(--color-imperial-blue)" }}>
        {metric.label}
      </span>
      <div className={s.chartArea} onMouseLeave={() => onClusterHover(null)}>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart
            data={data}
            margin={{ top: isFirst ? 24 : 0, right: 8, left: 0, bottom: 0 }}
            syncId="overview"
            onMouseMove={(state) => {
              if (isFirst && state?.activeTooltipIndex != null) {
                const idx = Number(state.activeTooltipIndex);
                const d = data[idx]?.date;
                const center = d ? dateToCenter.get(d) : undefined;
                onClusterHover(center ?? null);
              }
            }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={isLast ? renderAxisTick(data.length) : false}
              height={isLast ? 20 : 0}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              content={
                <ChartTooltipContent
                  metricKey={metric.key}
                  metricLabel={metric.label}
                  metricColor={metric.color}
                />
              }
            />
            <Line
              type="monotone"
              dataKey={metric.key}
              stroke={metric.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {isFirst && clusters.map((cluster) => {
              const centerDate = data[cluster.centerIdx]?.date ?? cluster.dates[0];
              const iconDimmed = hoveredCluster != null && hoveredCluster !== centerDate;
              const iconHovered = hoveredCluster === centerDate;
              const count = cluster.dates.length;
              return (
                <ReferenceLine
                  key={`cluster-${centerDate}`}
                  x={cluster.centerLabel}
                  stroke="transparent"
                  strokeWidth={0}
                  label={{
                    value: "",
                    position: "top" as const,
                    content: (props: LabelProps) => {
                      const vx = (props.viewBox as { x?: number } | undefined)?.x ?? 0;
                      return (
                        <g
                          transform={`translate(${vx}, 0)`}
                          onMouseEnter={() => onClusterHover(centerDate)}
                          onMouseLeave={() => onClusterHover(null)}
                          style={{ cursor: "pointer" }}
                        >
                          <defs>
                            <filter id="icon-imperial">
                              <feColorMatrix
                                type="matrix"
                                values="0 0 0 0 0.133 0 0 0 0 0.165 0 0 0 0 0.408 0 0 0 1 0"
                              />
                            </filter>
                          </defs>
                          <g style={{
                            transformOrigin: "0px 12px",
                            transform: iconHovered ? "scale(1.3)" : "scale(1)",
                            transition: "transform 0.15s ease",
                          }}>
                            <rect x={-14} y={-2} width={28} height={28} fill="transparent" />
                            <image
                              href="/sidebar/videos.svg"
                              x={-12}
                              y={0}
                              width={24}
                              height={24}
                              filter={iconDimmed ? "url(#icon-imperial)" : undefined}
                            />
                            {count > 1 && (
                              <>
                                <circle
                                  cx={10}
                                  cy={2}
                                  r={7}
                                  fill="var(--color-hot-rose)"
                                />
                                <text
                                  x={10}
                                  y={2}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill="white"
                                  fontSize={9}
                                  fontWeight="bold"
                                  style={{ pointerEvents: "none" }}
                                >
                                  {count}
                                </text>
                              </>
                            )}
                          </g>
                        </g>
                      );
                    },
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {isFirst && hoveredCluster && (() => {
          const cluster = clusters.find(
            (c) => (data[c.centerIdx]?.date ?? c.dates[0]) === hoveredCluster,
          );
          if (!cluster) {return null;}
          const clusterVideos = cluster.dates
            .map((date) => videos.find(
              (v) => (v.chartDate ?? toLocalDate(v.publishedAt)) === date,
            ))
            .filter(Boolean) as VideoPublishMarker[];
          if (clusterVideos.length === 0) {return null;}
          const fraction = cluster.centerIdx / Math.max(1, data.length - 1);
          const left = `calc(${fraction * 100}% - ${fraction * 8}px)`;
          return (
            <>
              <div className={s.markerActiveIcon} style={{ left }} />
              <div className={s.markerTooltipFloat} style={{ left }}>
                {clusterVideos.map((video) => (
                  <VideoMarkerTooltip key={video.videoId} video={video} />
                ))}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export function OverviewChart({ daily, videos }: OverviewChartProps) {
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const data = useMemo(() => prepareData(daily), [daily]);

  const publishDates = useMemo(
    () => new Set(videos.map((v) => v.chartDate ?? toLocalDate(v.publishedAt))),
    [videos],
  );

  const { clusters, dateToCenter } = useMemo(
    () => buildClusters(data, publishDates),
    [data, publishDates],
  );

  const handleClusterHover = useCallback((centerDate: string | null) => {
    setHoveredCluster(centerDate);
  }, []);

  const markerPositions = useMemo(() => {
    if (data.length < 2) {return [];}
    return data
      .map((point, i) => ({
        date: point.date,
        pct: (i / (data.length - 1)) * 100,
      }))
      .filter((p) => publishDates.has(p.date));
  }, [data, publishDates]);

  if (data.length === 0) {
    return (
      <div className={s.emptyChart}>
        <p>No analytics data available for this period.</p>
      </div>
    );
  }

  return (
    <div className={s.chartStack}>
      {markerPositions.length > 0 && (
        <div className={s.markerLinesOverlay} aria-hidden="true">
          {markerPositions.map(({ date, pct }) => {
            const center = dateToCenter.get(date);
            const dimmed = hoveredCluster != null && center !== hoveredCluster;
            return (
              <div
                key={`line-${date}`}
                className={s.fullHeightMarkerLine}
                style={{
                  left: `${pct}%`,
                  borderColor: dimmed ? "var(--color-imperial-blue)" : undefined,
                }}
              />
            );
          })}
        </div>
      )}

      {METRICS.map((metric, i) => (
        <SingleMetricChart
          key={metric.key}
          data={data}
          metric={metric}
          clusters={clusters}
          dateToCenter={dateToCenter}
          videos={videos}
          isLast={i === METRICS.length - 1}
          isFirst={i === 0}
          hoveredCluster={hoveredCluster}
          onClusterHover={handleClusterHover}
        />
      ))}
    </div>
  );
}
