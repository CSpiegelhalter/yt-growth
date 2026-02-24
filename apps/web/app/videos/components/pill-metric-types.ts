export type PillMetric = {
  key: string;
  label: string;
  displayValue: string;
  direction: "up" | "down";
  /** Absolute magnitude for sorting — higher = more notable. */
  score: number;
  /** Short description of the problem (for needs-work items). */
  issue?: string;
  /** Actionable advice on how to fix it (for needs-work items). */
  fix?: string;
};
