"use client";

import s from "../style.module.css";

type MetricRowProps = {
  label: string;
  value: string;
  sub?: string;
};

/**
 * MetricRow - Single row in the metrics table
 */
export function MetricRow({ label, value, sub }: MetricRowProps) {
  return (
    <div className={s.metricRow}>
      <span className={s.metricLabel}>{label}</span>
      <div className={s.metricValue}>
        <span>{value}</span>
        {sub && <span className={s.metricSub}>{sub}</span>}
      </div>
    </div>
  );
}

