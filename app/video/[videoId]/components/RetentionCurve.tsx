"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import s from "../style.module.css";

export type RetentionPoint = {
  elapsedRatio: number; // 0-1 (percentage through video)
  audienceWatchRatio: number; // 0-1 (percentage still watching)
};

type Props = {
  points: RetentionPoint[];
  durationSec: number;
  cliffTimeSec?: number | null;
};

/**
 * RetentionCurve - Interactive audience retention graph
 * Shows where viewers drop off throughout the video with hover interactions
 */
export function RetentionCurve({ points, durationSec, cliffTimeSec }: Props) {
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    time: string;
    retention: number;
    visible: boolean;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Chart dimensions
  const width = 500;
  const height = 240;
  const padding = { top: 24, right: 24, bottom: 44, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Process data
  const { areaD, smoothPath, avgRetention, cliffX, sortedPoints } =
    useMemo(() => {
      if (!points.length) {
        return {
          areaD: "",
          smoothPath: "",
          avgRetention: 0,
          cliffX: null,
          sortedPoints: [],
        };
      }

      // Sort by elapsed ratio
      const sorted = [...points].sort(
        (a, b) => a.elapsedRatio - b.elapsedRatio
      );

      // Scale functions
      const xScale = (ratio: number) => padding.left + ratio * chartWidth;
      const yScale = (ratio: number) => padding.top + (1 - ratio) * chartHeight;

      // Build smooth bezier curve path
      const curvePoints = sorted.map((p) => ({
        x: xScale(p.elapsedRatio),
        y: yScale(p.audienceWatchRatio),
      }));

      // Generate smooth curve using cardinal spline
      const smoothPath = generateSmoothPath(curvePoints);

      // Simple line path as fallback
      const linePoints = curvePoints.map((p) => `${p.x},${p.y}`);
      void linePoints;

      // Build filled area
      const areaD = `${smoothPath} L ${xScale(
        sorted[sorted.length - 1].elapsedRatio
      )},${yScale(0)} L ${xScale(0)},${yScale(0)} Z`;

      // Calculate average retention
      const avgRetention =
        sorted.reduce((sum, p) => sum + p.audienceWatchRatio, 0) /
        sorted.length;

      // Calculate cliff position
      let cliffX: number | null = null;
      if (cliffTimeSec && durationSec > 0) {
        const cliffRatio = cliffTimeSec / durationSec;
        cliffX = xScale(Math.min(cliffRatio, 1));
      }

      return {
        areaD,
        smoothPath,
        avgRetention,
        cliffX,
        sortedPoints: sorted,
      };
    }, [
      points,
      durationSec,
      cliffTimeSec,
      chartWidth,
      chartHeight,
      padding.left,
      padding.top,
    ]);

  // Handle mouse/touch interaction
  const handleInteraction = useCallback(
    (clientX: number) => {
      if (!svgRef.current || !sortedPoints.length) return;

      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((clientX - rect.left) / rect.width) * width;

      // Calculate ratio from x position
      const ratio = Math.max(
        0,
        Math.min(1, (svgX - padding.left) / chartWidth)
      );

      // Find closest data point
      let closestPoint = sortedPoints[0];
      let minDist = Infinity;
      for (const p of sortedPoints) {
        const dist = Math.abs(p.elapsedRatio - ratio);
        if (dist < minDist) {
          minDist = dist;
          closestPoint = p;
        }
      }

      // Interpolate for smoother tooltip
      const timeSec = ratio * durationSec;
      const x = padding.left + ratio * chartWidth;
      const y =
        padding.top + (1 - closestPoint.audienceWatchRatio) * chartHeight;

      setHoverData({
        x,
        y,
        time: formatTime(timeSec),
        retention: Math.round(closestPoint.audienceWatchRatio * 100),
        visible: true,
      });
    },
    [
      sortedPoints,
      durationSec,
      chartWidth,
      chartHeight,
      padding.left,
      padding.top,
      width,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleInteraction(e.clientX);
    },
    [handleInteraction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0]) {
        handleInteraction(e.touches[0].clientX);
      }
    },
    [handleInteraction]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverData(null);
  }, []);

  // Y-axis labels
  const yLabels = [100, 50, 0];

  // X-axis labels
  const xLabels = useMemo(() => {
    if (durationSec <= 0) return [];
    const labels: { ratio: number; label: string }[] = [];

    labels.push({ ratio: 0, label: "0:00" });
    if (durationSec > 60) {
      labels.push({ ratio: 0.5, label: formatTime(durationSec * 0.5) });
    }
    labels.push({ ratio: 1, label: formatTime(durationSec) });

    return labels;
  }, [durationSec]);

  if (!points.length) {
    return (
      <div className={s.retentionEmpty}>
        <div className={s.emptyIcon}>📊</div>
        <p>Retention data not available yet</p>
        <span className={s.emptyHint}>
          Data appears after your video gets more views
        </span>
      </div>
    );
  }

  // Retention quality indicator
  const retentionQuality =
    avgRetention >= 0.5 ? "excellent" : avgRetention >= 0.35 ? "good" : "low";

  return (
    <section className={s.retentionSection}>
      <div className={s.retentionHeader}>
        <div className={s.retentionTitleGroup}>
          <h2 className={s.retentionTitle}>Audience Retention</h2>
          <span className={s.retentionSubtitle}>
            How long viewers stay watching
          </span>
        </div>
        <div className={s.retentionStats}>
          <div className={`${s.retentionStat} ${s[retentionQuality]}`}>
            <span className={s.statValue}>
              {Math.round(avgRetention * 100)}%
            </span>
            <span className={s.statLabel}>avg. viewed</span>
          </div>
        </div>
      </div>

      <div
        ref={chartRef}
        className={s.retentionChart}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={handleMouseLeave}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className={s.retentionSvg}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          <defs>
            {/* Gradient fill - more vibrant */}
            <linearGradient
              id="retentionGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="var(--retention-color)"
                stopOpacity="0.35"
              />
              <stop
                offset="50%"
                stopColor="var(--retention-color)"
                stopOpacity="0.15"
              />
              <stop
                offset="100%"
                stopColor="var(--retention-color)"
                stopOpacity="0"
              />
            </linearGradient>

            {/* Line gradient for depth */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--retention-color)" />
              <stop offset="100%" stopColor="var(--retention-color-end)" />
            </linearGradient>

            {/* Glow effect */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Clip path for area */}
            <clipPath id="chartArea">
              <rect
                x={padding.left}
                y={padding.top}
                width={chartWidth}
                height={chartHeight}
              />
            </clipPath>
          </defs>

          {/* Background grid - subtle */}
          <g className={s.chartGrid}>
            {yLabels.map((val) => {
              const y = padding.top + (1 - val / 100) * chartHeight;
              return (
                <line
                  key={val}
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  className={s.gridLine}
                />
              );
            })}
          </g>

          {/* Y-axis labels */}
          {yLabels.map((val) => {
            const y = padding.top + (1 - val / 100) * chartHeight;
            return (
              <text
                key={val}
                x={padding.left - 12}
                y={y}
                className={s.axisLabel}
              >
                {val}%
              </text>
            );
          })}

          {/* X-axis labels */}
          {xLabels.map(({ ratio, label }) => {
            const x = padding.left + ratio * chartWidth;
            return (
              <text
                key={ratio}
                x={x}
                y={height - 12}
                className={s.axisLabelX}
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}

          {/* Filled area under curve */}
          <path
            d={areaD}
            fill="url(#retentionGradient)"
            clipPath="url(#chartArea)"
            className={s.retentionArea}
          />

          {/* Main curve line */}
          <path
            d={smoothPath}
            fill="none"
            stroke="url(#lineGradient)"
            className={s.retentionLine}
          />

          {/* Cliff marker */}
          {cliffX && (
            <g className={s.cliffMarker}>
              <line
                x1={cliffX}
                y1={padding.top}
                x2={cliffX}
                y2={padding.top + chartHeight}
                className={s.cliffLine}
              />
              <g
                className={s.cliffBadge}
                transform={`translate(${cliffX}, ${padding.top - 8})`}
              >
                <rect
                  x={-20}
                  y={-12}
                  width={40}
                  height={20}
                  rx={10}
                  className={s.cliffBadgeBg}
                />
                <text y={4} textAnchor="middle" className={s.cliffBadgeText}>
                  Drop
                </text>
              </g>
            </g>
          )}

          {/* Hover cursor line & dot */}
          {hoverData?.visible && (
            <g className={s.hoverGroup}>
              <line
                x1={hoverData.x}
                y1={padding.top}
                x2={hoverData.x}
                y2={padding.top + chartHeight}
                className={s.hoverLine}
              />
              <circle
                cx={hoverData.x}
                cy={hoverData.y}
                r={6}
                className={s.hoverDotOuter}
              />
              <circle
                cx={hoverData.x}
                cy={hoverData.y}
                r={4}
                className={s.hoverDotInner}
              />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hoverData?.visible && (
          <div
            className={s.retentionTooltip}
            style={{
              left: `${(hoverData.x / width) * 100}%`,
              top: `${(hoverData.y / height) * 100}%`,
            }}
          >
            <div className={s.tooltipTime}>{hoverData.time}</div>
            <div className={s.tooltipRetention}>
              <span className={s.tooltipValue}>{hoverData.retention}%</span>
              <span className={s.tooltipLabel}>watching</span>
            </div>
          </div>
        )}
      </div>

      {cliffTimeSec && (
        <div className={s.retentionInsight}>
          <span className={s.insightIcon}>⚠️</span>
          <span className={s.insightText}>
            Significant drop at <strong>{formatTime(cliffTimeSec)}</strong> —
            consider tightening your edit or adding a hook here
          </span>
        </div>
      )}
    </section>
  );
}

/**
 * Generate a smooth SVG path using cardinal spline interpolation
 */
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  const tension = 0.3;
  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
