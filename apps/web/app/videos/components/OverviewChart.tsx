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

const METRICS = [
  { key: "views" as const, label: "Views", color: "var(--color-cool-sky)" },
  { key: "shares" as const, label: "Shares", color: "var(--color-cool-sky)" },
  { key: "watchTimeMinutes" as const, label: "Watch Time", color: "var(--color-cool-sky)" },
  { key: "netSubs" as const, label: "Subscribers", color: "var(--color-cool-sky)" },
] as const;

function prepareData(daily: OverviewDailyRow[]): ChartRow[] {
  return daily.map((row) => ({
    ...row,
    netSubs: row.subscribersGained - row.subscribersLost,
    label: formatDateShort(row.date),
  })) as unknown as ChartRow[];
}

/**
 * Extract the YYYY-MM-DD date from an ISO timestamp using the user's local
 * timezone. YouTube Analytics buckets days in Pacific Time; using local time
 * (typically a US timezone) aligns much better than UTC's split("T")[0] which
 * can land on the wrong calendar day for evening publishes.
 */
function toLocalDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  publishDates,
  videos,
  isLast,
  isFirst,
  hoveredMarker,
  onMarkerHover,
}: {
  data: ChartRow[];
  metric: (typeof METRICS)[number];
  publishDates: Set<string>;
  videos: VideoPublishMarker[];
  isLast: boolean;
  isFirst: boolean;
  hoveredMarker: string | null;
  onMarkerHover: (date: string | null) => void;
}) {
  return (
    <div className={s.chartRow}>
      <span className={s.chartLabel} style={{ color: "var(--color-imperial-blue)" }}>
        {metric.label}
      </span>
      <div className={s.chartArea} onMouseLeave={() => onMarkerHover(null)}>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart
            data={data}
            margin={{ top: isFirst ? 24 : 0, right: 8, left: 0, bottom: 0 }}
            syncId="overview"
            onMouseMove={(state) => {
              if (isFirst && state?.activeTooltipIndex != null) {
                const idx = Number(state.activeTooltipIndex);
                const d = data[idx]?.date;
                onMarkerHover(d && publishDates.has(d) ? d : null);
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
            {/* Icon markers on the first chart only; lines come from the overlay */}
            {isFirst && data.map((point) => {
              if (!publishDates.has(point.date)) {return null;}
              const iconDimmed = hoveredMarker != null && hoveredMarker !== point.date;
              const iconHovered = hoveredMarker === point.date;
              return (
                <ReferenceLine
                  key={`marker-${point.date}`}
                  x={point.label}
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
                          onMouseEnter={() => onMarkerHover(point.date)}
                          onMouseLeave={() => onMarkerHover(null)}
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

        {isFirst && hoveredMarker && (() => {
          const video = videos.find(
            (v) => (v.chartDate ?? toLocalDate(v.publishedAt)) === hoveredMarker,
          );
          if (!video) {return null;}
          const idx = data.findIndex((p) => p.date === hoveredMarker);
          const fraction = idx !== -1 && data.length > 1 ? idx / (data.length - 1) : 0.5;
          const left = `calc(${fraction * 100}% - ${fraction * 8}px)`;
          return (
            <>
              <div className={s.markerNotch} style={{ left }} />
              <div className={s.markerActiveIcon} style={{ left }} />
              <div className={s.markerTooltipFloat} style={{ left }}>
                <VideoMarkerTooltip video={video} />
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export function OverviewChart({ daily, videos }: OverviewChartProps) {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const data = useMemo(() => prepareData(daily), [daily]);

  const publishDates = useMemo(
    () => new Set(videos.map((v) => v.chartDate ?? toLocalDate(v.publishedAt))),
    [videos],
  );

  const handleMarkerHover = useCallback((date: string | null) => {
    setHoveredMarker(date);
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
            const dimmed = hoveredMarker != null && hoveredMarker !== date;
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
          publishDates={publishDates}
          videos={videos}
          isLast={i === METRICS.length - 1}
          isFirst={i === 0}
          hoveredMarker={hoveredMarker}
          onMarkerHover={handleMarkerHover}
        />
      ))}
    </div>
  );
}
