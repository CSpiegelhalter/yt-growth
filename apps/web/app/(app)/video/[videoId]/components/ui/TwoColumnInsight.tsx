"use client";

import styles from "./ui.module.css";
import { BulletList } from "./BulletList";

type BulletItem = {
  text: string;
  detail?: string;
};

type TwoColumnInsightProps = {
  summary?: string;
  working: (string | BulletItem)[];
  improve: (string | BulletItem)[];
  workingTitle?: string;
  improveTitle?: string;
};

/**
 * TwoColumnInsight - Standard layout for analysis sections
 * Summary + two columns (What's working / What to improve)
 */
export function TwoColumnInsight({
  summary,
  working,
  improve,
  workingTitle = "What's working",
  improveTitle = "What to improve",
}: TwoColumnInsightProps) {
  return (
    <div className={styles.twoColumnInsight}>
      {summary && (
        <p className={styles.insightSummary}>{summary}</p>
      )}
      <div className={styles.twoColumnGrid}>
        <BulletList type="positive" items={working} title={workingTitle} />
        <BulletList type="negative" items={improve} title={improveTitle} />
      </div>
    </div>
  );
}