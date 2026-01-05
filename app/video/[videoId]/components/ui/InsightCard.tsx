"use client";

import { ReactNode } from "react";
import styles from "./ui.module.css";

type StatusType = "strong" | "mixed" | "needs-work" | "neutral";

type InsightCardProps = {
  title: string;
  subtitle?: string;
  status?: StatusType;
  children: ReactNode;
  className?: string;
};

const statusLabels: Record<StatusType, string> = {
  strong: "Strong",
  mixed: "Mixed",
  "needs-work": "Needs work",
  neutral: "",
};

/**
 * InsightCard - Clean card wrapper for analysis sections
 * No numeric ratings, just status chips where appropriate
 */
export function InsightCard({
  title,
  subtitle,
  status,
  children,
  className = "",
}: InsightCardProps) {
  return (
    <div className={`${styles.insightCard} ${className}`}>
      <div className={styles.insightCardHeader}>
        <div className={styles.insightCardTitles}>
          <h3 className={styles.insightCardTitle}>{title}</h3>
          {subtitle && (
            <p className={styles.insightCardSubtitle}>{subtitle}</p>
          )}
        </div>
        {status && status !== "neutral" && (
          <span className={`${styles.statusChip} ${styles[`status-${status}`]}`}>
            {statusLabels[status]}
          </span>
        )}
      </div>
      <div className={styles.insightCardBody}>{children}</div>
    </div>
  );
}

export default InsightCard;
