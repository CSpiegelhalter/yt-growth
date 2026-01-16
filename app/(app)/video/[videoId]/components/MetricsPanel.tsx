"use client";

import type { ReactNode } from "react";
import styles from "./MetricsPanel.module.css";
import { formatCompactRounded as formatCompact } from "@/lib/format";

type Metric = {
  label: string;
  value: string | number;
  detail?: string;
  trend?: "up" | "down" | "neutral";
};

type MetricsPanelProps = {
  metrics: Metric[];
  title?: string;
};

/**
 * MetricsPanel - Clean metrics display
 * Shows all metrics directly without expand/collapse
 */
export function MetricsPanel({
  metrics,
  title = "Key metrics",
}: MetricsPanelProps) {
  // Determine columns based on typical desktop breakpoint (4 cols)
  // Row separators inserted after each complete row
  const cols = 4; // Desktop columns
  
  // Build items with row separators
  const itemsWithSeparators: ReactNode[] = [];
  metrics.forEach((metric, i) => {
    // Add row separator after each complete row (except first row)
    if (i > 0 && i % cols === 0) {
      itemsWithSeparators.push(
        <div key={`sep-${i}`} className={styles.rowSeparator} />
      );
    }
    
    itemsWithSeparators.push(
      <div key={i} className={styles.metric}>
        <div className={styles.metricValue}>
          {typeof metric.value === "number"
            ? formatCompact(metric.value)
            : metric.value}
          {metric.trend && metric.trend !== "neutral" && (
            <span className={`${styles.trend} ${styles[`trend-${metric.trend}`]}`}>
              {metric.trend === "up" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </span>
          )}
        </div>
        <div className={styles.metricLabel}>{metric.label}</div>
        {metric.detail && (
          <div className={styles.metricDetail}>{metric.detail}</div>
        )}
      </div>
    );
  });

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.metricsGrid}>
        {itemsWithSeparators}
      </div>
    </div>
  );
}

export default MetricsPanel;
