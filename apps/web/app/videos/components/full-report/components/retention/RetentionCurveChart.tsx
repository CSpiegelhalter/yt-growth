"use client";

import { type KeyboardEvent, type MouseEvent,useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  AnnotatedDropOff,
  RetentionCurveData,
  RetentionRebound,
} from "@/lib/features/full-report";

import s from "./retention-curve.module.css";

type RetentionCurveChartProps = {
  data: RetentionCurveData;
};

type HoverState =
  | { kind: "drop"; cx: number; cy: number; data: AnnotatedDropOff }
  | { kind: "rebound"; cx: number; cy: number; data: RetentionRebound };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildAltText(
  annotations: ReadonlyArray<{ timeSec: number; severityPct: number; why: string | null }>,
  rebounds: ReadonlyArray<{ timeSec: number; liftPct: number }>,
): string {
  const dropOffPart = annotations.length > 0
    ? annotations
        .map((a) => `drop at ${formatTime(a.timeSec)} (${a.severityPct}%)${a.why ? `: ${a.why}` : ""}`)
        .join("; ")
    : "";
  const reboundPart = rebounds.length > 0
    ? `Re-watch peaks: ${rebounds.map((r) => `${formatTime(r.timeSec)} (+${r.liftPct}%)`).join(", ")}.`
    : "";
  if (!dropOffPart && !reboundPart) {return "Retention curve over the duration of the video.";}
  return `Retention curve. ${dropOffPart}${dropOffPart && reboundPart ? ". " : ""}${reboundPart}`;
}

function openInNewTab(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

// Recharts passes cx/cy as numbers when the dot is rendered. We accept any
// shape and bail if coords are missing so TypeScript stays clean.
type MarkerShapeProps = {
  cx?: number;
  cy?: number;
  fill: string;
  url: string;
  ariaLabel: string;
  onHover: (cx: number, cy: number) => void;
  onLeave: () => void;
};

function MarkerShape({ cx, cy, fill, url, ariaLabel, onHover, onLeave }: MarkerShapeProps) {
  if (cx == null || cy == null) {return null;}

  const handleClick = (event: MouseEvent<SVGGElement>): void => {
    event.stopPropagation();
    openInNewTab(url);
  };

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openInNewTab(url);
    }
  };

  return (
    <g
      style={{ cursor: "pointer", outline: "none" }}
      onMouseEnter={() => onHover(cx, cy)}
      onMouseLeave={onLeave}
      onFocus={() => onHover(cx, cy)}
      onBlur={onLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {/* enlarged invisible hit target so the marker is easy to land on */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="var(--surface)" strokeWidth={2} />
    </g>
  );
}

function MarkerTooltip({ hovered }: { hovered: HoverState }) {
  if (hovered.kind === "drop") {
    const a = hovered.data;
    return (
      <div
        className={`${s.markerTooltip} ${s.markerTooltipDrop}`}
        style={{ left: hovered.cx, top: hovered.cy }}
        role="tooltip"
      >
        <div className={s.markerTooltipHead}>
          <span className={s.markerTooltipBadge}>−{a.severityPct}%</span>
          <span className={s.markerTooltipTime}>{formatTime(a.timeSec)}</span>
        </div>
        {a.why && <p className={s.markerTooltipBody}>{a.why}</p>}
        {a.action && <p className={s.markerTooltipAction}>{a.action}</p>}
        <p className={s.markerTooltipHint}>Click to open at this timestamp ↗</p>
      </div>
    );
  }
  const r = hovered.data;
  return (
    <div
      className={`${s.markerTooltip} ${s.markerTooltipRebound}`}
      style={{ left: hovered.cx, top: hovered.cy }}
      role="tooltip"
    >
      <div className={s.markerTooltipHead}>
        <span className={`${s.markerTooltipBadge} ${s.markerTooltipBadgeRebound}`}>+{r.liftPct}%</span>
        <span className={s.markerTooltipTime}>{formatTime(r.timeSec)}</span>
      </div>
      {r.label && <p className={s.markerTooltipBody}>{r.label}</p>}
      <p className={s.markerTooltipBodyMuted}>
        Re-watch peak — viewers came back to this moment. Strong clip candidate.
      </p>
      <p className={s.markerTooltipHint}>Click to open at this timestamp ↗</p>
    </div>
  );
}

export function RetentionCurveChart({ data }: RetentionCurveChartProps) {
  const samples = data.samples ?? [];
  const annotations = data.annotations ?? [];
  const rebounds = data.rebounds ?? [];
  const [hovered, setHovered] = useState<HoverState | null>(null);

  if (samples.length < 2) {
    return (
      <section className={s.section} aria-label="Retention curve">
        <header className={s.header}>
          <h3 className={s.title}>Why viewers leave</h3>
        </header>
        <div className={s.emptyBox}>
          <p className={s.emptyHeadline}>Retention curve isn&apos;t available yet</p>
          <p className={s.emptyBody}>
            YouTube needs about 50 unique viewers before it generates a retention curve.
            Once you cross that threshold, this section will fill in automatically — re-run the
            report when you&apos;re ready.
          </p>
        </div>
      </section>
    );
  }

  const chartData = samples.map((p) => ({
    time: p.timeSec,
    retention: Math.round(p.retention * 1000) / 10, // 0..100
  }));

  const reboundChartY = (timeSec: number): number => {
    const match = chartData.find((d) => d.time >= timeSec) ?? chartData.at(-1)!;
    return Math.min(100, match.retention + 2);
  };

  return (
    <section className={s.section} aria-label="Retention curve">
      <header className={s.header}>
        <h3 className={s.title}>Why viewers leave</h3>
        <Legend hasDropOffs={annotations.length > 0} hasRebounds={rebounds.length > 0} />
      </header>

      <div className={s.chartWrap} role="img" aria-label={buildAltText(annotations, rebounds)}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              type="number"
              domain={[0, data.videoDurationSec]}
              tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
              stroke="var(--border)"
            />
            <YAxis
              tickFormatter={(v: number) => `${v}%`}
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
              stroke="var(--border)"
              width={40}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-cool-sky)", strokeWidth: 1 }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(label) => {
                const n = typeof label === "number" ? label : Number(label);
                return Number.isFinite(n) ? formatTime(n) : "";
              }}
              formatter={(value) => {
                const n = typeof value === "number" ? value : Number(value);
                return [`${Number.isFinite(n) ? n : 0}%`, "Retention"];
              }}
            />
            <Line
              dataKey="retention"
              type="monotone"
              stroke="var(--color-cool-sky)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {annotations.map((a) => (
              <ReferenceDot
                key={`drop-${a.timeSec}-${a.severityPct}`}
                x={a.timeSec}
                y={Math.max(2, 100 - a.severityPct)}
                shape={(props: { cx?: number; cy?: number }) => (
                  <MarkerShape
                    cx={props.cx}
                    cy={props.cy}
                    fill="var(--color-hot-rose)"
                    url={a.url}
                    ariaLabel={`Drop at ${formatTime(a.timeSec)}, ${a.severityPct}% loss${a.why ? `: ${a.why}` : ""}. Click to open at this timestamp.`}
                    onHover={(cx, cy) => setHovered({ kind: "drop", cx, cy, data: a })}
                    onLeave={() => setHovered(null)}
                  />
                )}
              />
            ))}
            {rebounds.map((r) => (
              <ReferenceDot
                key={`rebound-${r.timeSec}-${r.liftPct}`}
                x={r.timeSec}
                y={reboundChartY(r.timeSec)}
                shape={(props: { cx?: number; cy?: number }) => (
                  <MarkerShape
                    cx={props.cx}
                    cy={props.cy}
                    fill="var(--color-leaf-green)"
                    url={r.url}
                    ariaLabel={`Re-watch peak at ${formatTime(r.timeSec)}, +${r.liftPct}%${r.label ? `: ${r.label}` : ""}. Click to open at this timestamp.`}
                    onHover={(cx, cy) => setHovered({ kind: "rebound", cx, cy, data: r })}
                    onLeave={() => setHovered(null)}
                  />
                )}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {hovered && <MarkerTooltip hovered={hovered} />}
      </div>

      {annotations.length > 0 && (
        <ol className={s.dropList}>
          {annotations.map((a, i) => (
            <li key={`${a.timeSec}-${i}`} className={s.dropItem}>
              <span className={s.dropMarker} aria-hidden="true">⚠</span>
              <span className={s.dropTime}>{formatTime(a.timeSec)}</span>
              <span className={s.dropSeverity}>−{a.severityPct}%</span>
              <span className={s.dropBody}>
                {a.why && <span className={s.dropWhy}>{a.why}</span>}
                {a.action && <span className={s.dropAction}>{a.action}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {annotations.length === 0 && samples.length > 1 && (
        <p className={s.hint}>
          Enable captions for plain-language drop-off explanations.
        </p>
      )}

      {rebounds.length > 0 && (
        <div className={s.clipsBlock}>
          <header className={s.clipsHead}>
            <h4 className={s.clipsTitle}>Clippable moments</h4>
            <p className={s.clipsSubtitle}>
              Retention rebounds — where viewers re-watched or late-joiners caught up. Strong candidates for shorts.
            </p>
          </header>
          <ul className={s.clipsList}>
            {rebounds.map((r) => (
              <li key={`clip-${r.timeSec}`} className={s.clipItem}>
                <span className={s.clipMarker} aria-hidden="true">▲</span>
                <span className={s.clipTime}>{formatTime(r.timeSec)}</span>
                <span className={s.clipLift}>+{r.liftPct}%</span>
                <span className={s.clipBody}>
                  {r.label && <span className={s.clipLabel}>{r.label}</span>}
                </span>
                <a
                  className={s.clipLink}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open the video at ${formatTime(r.timeSec)} in YouTube`}
                >
                  Watch
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H8M17 7v9" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Legend({ hasDropOffs, hasRebounds }: { hasDropOffs: boolean; hasRebounds: boolean }) {
  if (!hasDropOffs && !hasRebounds) {return null;}
  return (
    <ul className={s.legend} aria-label="Chart legend">
      {hasDropOffs && (
        <li className={s.legendItem}>
          <span className={`${s.legendDot} ${s.legendDotDrop}`} aria-hidden="true" />
          <span>Drop-off</span>
        </li>
      )}
      {hasRebounds && (
        <li className={s.legendItem}>
          <span className={`${s.legendDot} ${s.legendDotRebound}`} aria-hidden="true" />
          <span>Re-watch peak</span>
        </li>
      )}
    </ul>
  );
}
